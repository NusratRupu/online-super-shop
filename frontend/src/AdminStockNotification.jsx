import { useMemo, useState } from "react";

function getReadAlerts() {
  try {
    return JSON.parse(localStorage.getItem("nityomart_read_stock_alerts") || "[]");
  } catch {
    return [];
  }
}

function saveReadAlerts(alerts) {
  localStorage.setItem("nityomart_read_stock_alerts", JSON.stringify(alerts));
}

export default function AdminStockNotification({ products, onOpenStock }) {
  const [hoverOpen, setHoverOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [readAlerts, setReadAlerts] = useState(getReadAlerts());

  const alertProducts = useMemo(() => {
    return (products || [])
      .filter((product) => Number(product.stock) <= 3)
      .sort((a, b) => Number(a.stock) - Number(b.stock));
  }, [products]);

  const unreadAlerts = alertProducts.filter((product) => {
    const key = `${product.id}:${product.stock}`;
    return !readAlerts.includes(key);
  });

  const isOpen = hoverOpen || pinnedOpen;

  function openStock(productId) {
    if (productId) {
      sessionStorage.setItem("nityomart_focus_stock_product", String(productId));
    }

    onOpenStock();
    setHoverOpen(false);
    setPinnedOpen(false);

    if (productId) {
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        const row = document.getElementById(`stock-product-${productId}`);

        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          row.classList.add("stock-row-focus");

          const input = row.querySelector("input");
          if (input) input.focus();

          setTimeout(() => row.classList.remove("stock-row-focus"), 2500);
          clearInterval(timer);
        }

        if (tries > 25) {
          clearInterval(timer);
        }
      }, 120);
    }
  }

  function closePanel() {
    setHoverOpen(false);
    setPinnedOpen(false);
  }

  function markOneRead(product) {
    const key = `${product.id}:${product.stock}`;
    const next = Array.from(new Set([...readAlerts, key]));
    setReadAlerts(next);
    saveReadAlerts(next);
  }

  function markAllRead() {
    const keys = alertProducts.map((product) => `${product.id}:${product.stock}`);
    const next = Array.from(new Set([...readAlerts, ...keys]));
    setReadAlerts(next);
    saveReadAlerts(next);
  }

  return (
    <div
      className="admin-stock-notification"
      onMouseEnter={() => {
        if (!pinnedOpen) setHoverOpen(true);
      }}
      onMouseLeave={() => {
        if (!pinnedOpen) setHoverOpen(false);
      }}
    >
      <button
        type="button"
        className="stock-bell-btn drawn-bell-btn"
        onClick={() => {
          setPinnedOpen((current) => !current);
          setHoverOpen(false);
        }}
      >
        <svg className="bell-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadAlerts.length > 0 && <span className="stock-bell-badge">{unreadAlerts.length}</span>}
      </button>

      {isOpen && (
        <div className="stock-notification-panel">
          <div className="stock-notification-header">
            <strong>Stock Alerts</strong>
            <button type="button" className="stock-close-text" onClick={closePanel}>
              Close
            </button>
          </div>

          <div className="stock-notification-actions">
            <button type="button" onClick={markAllRead}>Read All</button>
            <button type="button" onClick={() => openStock()}>Go to Stock</button>
          </div>

          {alertProducts.length === 0 ? (
            <p className="stock-notification-empty">No low-stock or out-of-stock products.</p>
          ) : (
            <div className="stock-notification-list">
              {alertProducts.map((product) => (
                <div className="stock-alert-item" key={product.id}>
                  <button type="button" className="stock-alert-main" onClick={() => openStock(product.id)}>
                    <strong>{product.name}</strong>
                    <span>{product.category_name || "Uncategorized"}</span>
                    <em>
                      {Number(product.stock) <= 0
                        ? "Out of Stock"
                        : `Low Stock: ${product.stock} ${product.unit}`}
                    </em>
                  </button>
                  <button type="button" className="stock-alert-clear" onClick={() => markOneRead(product)}>
                    Clear
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

