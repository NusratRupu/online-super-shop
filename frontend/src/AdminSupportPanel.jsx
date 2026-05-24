import { useEffect, useRef, useState } from "react";
import api from "./api/client";
import { getImageUrl } from "./utils/imageUrl";

export default function AdminSupportPanel() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [notice, setNotice] = useState("");
  const bottomRef = useRef(null);

  async function loadConversations() {
    const res = await api.get("/support/admin/conversations");
    setConversations(res.data.conversations || []);

    if (!active && res.data.conversations?.length) {
      setActive(res.data.conversations[0]);
    }
  }

  async function loadMessages(conversationId = active?.id) {
    if (!conversationId) return;

    const res = await api.get(`/support/admin/conversations/${conversationId}/messages`);
    setMessages(res.data.messages || []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  useEffect(() => {
    loadConversations().catch(() => setNotice("Failed to load conversations."));
  }, []);

  useEffect(() => {
    if (!active?.id) return;
    loadMessages(active.id).catch(() => setNotice("Failed to load messages."));
    const timer = setInterval(() => loadMessages(active.id), 3500);
    return () => clearInterval(timer);
  }, [active?.id]);

  async function sendReply(event) {
    event.preventDefault();

    try {
      const data = new FormData();
      data.append("message", text);
      if (image) data.append("image", image);

      await api.post(`/support/admin/conversations/${active.id}/messages`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setText("");
      setImage(null);
      await loadMessages(active.id);
      await loadConversations();
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to send reply.");
    }
  }

  async function resolveConversation() {
    try {
      await api.patch(`/support/admin/conversations/${active.id}/status`, { status: "resolved" });
      await loadConversations();
      setNotice("Conversation resolved.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to resolve conversation.");
    }
  }

  return (
    <section className="admin-card">
      <h2>Support / Helpdesk</h2>
      <p>Messenger-style admin support for customers, vendors, and deliverymen.</p>

      {notice && <div className="admin-message">{notice}</div>}

      <div className="admin-messenger-layout">
        <aside className="admin-chat-list">
          {conversations.map((item) => (
            <button
              key={item.id}
              className={active?.id === item.id ? "active" : ""}
              onClick={() => setActive(item)}
            >
              <strong>{item.user_name}</strong>
              <small>{item.user_role} • {item.status}</small>
              <span>{item.last_message || "Image / new chat"}</span>
            </button>
          ))}
          {conversations.length === 0 && <p>No support conversations yet.</p>}
        </aside>

        <div className="admin-chat-window">
          {active ? (
            <>
              <div className="admin-chat-window-head">
                <div>
                  <strong>{active.user_name}</strong>
                  <small>{active.user_email} • {active.user_phone || "No phone"}</small>
                </div>
                <button onClick={resolveConversation}>Resolve</button>
              </div>

              <div className="support-thread messenger-thread admin-thread">
                {messages.map((item) => (
                  <div className={`support-bubble ${item.sender_role === "admin" ? "own" : "admin"}`} key={item.id}>
                    <small>{item.sender_name}</small>
                    {item.message && <p>{item.message}</p>}
                    {item.image_url && <img src={getImageUrl(item.image_url)} alt="chat attachment" />}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form className="messenger-send-row" onSubmit={sendReply}>
                <label className="chat-image-btn">
                  📎
                  <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                </label>
                <input placeholder={image ? image.name : "Reply as admin..."} value={text} onChange={(e) => setText(e.target.value)} />
                <button type="submit">Send</button>
              </form>
            </>
          ) : (
            <p>Select a conversation.</p>
          )}
        </div>
      </div>
    </section>
  );
}
