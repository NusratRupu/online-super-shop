import { useEffect, useRef, useState } from "react";
import api from "./api/client";
import { getImageUrl } from "./utils/imageUrl";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("nityomart_user") || "null");
  } catch {
    return null;
  }
}

const botAnswers = {
  order: "Go to Track Order or My Account → My Orders. Logged-in customers can see live order progress automatically.",
  vendor: "Vendors and resale products require admin approval before appearing in the public shop.",
  delivery: "Delivery flow: admin confirms order → deliveryman takes it → customer confirms received → admin approves payout.",
};

export default function SupportWidget() {
  const user = getCurrentUser();
  const isAdmin = window.location.pathname.startsWith("/admin");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("bot");
  const [messages, setMessages] = useState([]);
  const [botText, setBotText] = useState("Hi! I can help with common questions.");
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [notice, setNotice] = useState("");
  const bottomRef = useRef(null);

  async function loadMessages() {
    if (!user || isAdmin) return;

    try {
      const res = await api.get("/support/messages");
      setMessages(res.data.messages || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setNotice("Please login again to use live chat.");
    }
  }

  useEffect(() => {
    function openSupport() {
      setOpen(true);
    }

    window.addEventListener("open-support-chat", openSupport);

    if (window.location.hash === "#support") {
      setOpen(true);
    }

    return () => window.removeEventListener("open-support-chat", openSupport);
  }, []);

  useEffect(() => {
    if (!open || mode !== "live" || !user || isAdmin) return;

    loadMessages();
    const timer = setInterval(loadMessages, 3500);
    return () => clearInterval(timer);
  }, [open, mode, user?.id]);

  if (isAdmin) return null;

  async function sendMessage(event) {
    event.preventDefault();
    setNotice("");

    if (!user) {
      setNotice("Please login first to use live chat.");
      return;
    }

    try {
      const data = new FormData();
      data.append("message", text);
      if (image) data.append("image", image);

      await api.post("/support/messages", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setText("");
      setImage(null);
      await loadMessages();
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to send message.");
    }
  }

  return (
    <>
      <button className="support-float-btn" onClick={() => setOpen((value) => !value)} title="Help & Support">
        <svg className="support-icon-main support-headset-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 13a8 8 0 0 1 16 0" />
          <path d="M4 13v4a2 2 0 0 0 2 2h2v-6H6a2 2 0 0 0-2 2" />
          <path d="M20 13v4a2 2 0 0 1-2 2h-2v-6h2a2 2 0 0 1 2 2" />
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
          <path d="M9 15c1.4 1 4.6 1 6 0" />
          <path d="M12 3v2" />
        </svg>
      </button>

      {open && (
        <div className="support-chat-box messenger-chat-box">
          <div className="support-chat-header">
            <div>
              <strong>NityoMart Support</strong>
              <small>Chat Bot + Live Helpdesk</small>
            </div>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>

          <div className="support-mode-tabs">
            <button className={mode === "bot" ? "active" : ""} onClick={() => setMode("bot")}>Chat Bot</button>
            <button className={mode === "live" ? "active" : ""} onClick={() => setMode("live")}>Live Chat</button>
          </div>

          {notice && <div className="support-message">{notice}</div>}

          {mode === "bot" && (
            <div className="support-bot-panel">
              <div className="support-bubble admin">
                {botText}
              </div>

              <button onClick={() => setBotText(botAnswers.order)}>How do I track my order?</button>
              <button onClick={() => setBotText(botAnswers.vendor)}>How does vendor approval work?</button>
              <button onClick={() => setBotText(botAnswers.delivery)}>Delivery status problem</button>
              <button onClick={() => setMode("live")}>Contact admin</button>
            </div>
          )}

          {mode === "live" && (
            <>
              {!user ? (
                <div className="support-login-required">
                  <strong>Login required</strong>
                  <p>Please login as customer, vendor, or deliveryman to chat with admin.</p>
                  <a href="/login">Customer Login</a>
                  <a href="/vendor-login">Vendor Login</a>
                  <a href="/deliveryman-login">Deliveryman Login</a>
                </div>
              ) : (
                <>
                  <div className="support-thread messenger-thread">
                    {messages.map((item) => {
                      const own = item.sender_id === user.id && item.sender_role === user.role;
                      return (
                        <div className={`support-bubble ${own ? "own" : "admin"}`} key={item.id}>
                          <small>{own ? "You" : item.sender_name}</small>
                          {item.message && <p>{item.message}</p>}
                          {item.image_url && <img src={getImageUrl(item.image_url)} alt="chat attachment" />}
                        </div>
                      );
                    })}
                    {messages.length === 0 && <div className="support-bubble admin">Start a live chat with admin.</div>}
                    <div ref={bottomRef} />
                  </div>

                  <form className="messenger-send-row" onSubmit={sendMessage}>
                    <label className="chat-image-btn">
                      📎
                      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                    </label>
                    <input placeholder={image ? image.name : "Type your message..."} value={text} onChange={(e) => setText(e.target.value)} />
                    <button type="submit">Send</button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
