// pages/chat.js
import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import { useRouter } from "next/router";
import {
  getChatWindowById,
  listParticipants,
  listMessages,
  subscribeMessages,
  sendMessage,
} from "../lib/chatApi";

export default function Chat() {
  const router = useRouter();
  const chatId = router.query.chat || router.query.id || null;
  const myLinkId = router.query.link ? String(router.query.link) : null; // kdo jsem (volitelné)

  const [chat, setChat] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [dmTarget, setDmTarget] = useState(null);
  const [text, setText] = useState("");
  const listEndRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;
    (async () => {
      try {
        const [c, ps, ms] = await Promise.all([
          getChatWindowById(chatId),
          listParticipants(chatId),
          listMessages(chatId),
        ]);
        setChat(c);
        setParticipants(ps);
        setMessages(ms);
      } catch (e) {
        console.error(e);
        alert("Chyba při načítání chatu.");
      }
    })();

    const unsub = subscribeMessages(chatId, (m) => {
      setMessages((prev) => [...prev, m]);
      if (listEndRef.current) listEndRef.current.scrollIntoView({ behavior: "smooth" });
    });
    return unsub;
  }, [chatId]);

  useEffect(() => {
    if (listEndRef.current) listEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const dmLabel = useMemo(() => {
    if (!dmTarget) return "Všichni";
    const name = dmTarget.nickname || dmTarget.internal_name || `ID ${dmTarget.id}`;
    return `DM: ${name}`;
  }, [dmTarget]);

  async function handleSend() {
    const content = text.trim();
    if (!content) return;
    try {
      await sendMessage(chatId, content, myLinkId, dmTarget?.id || null);
      setText("");
    } catch (e) {
      console.error(e);
      alert("Zprávu se nepodařilo odeslat.");
    }
  }

  return (
    <Layout>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
        Chat {chat ? `— ${chat.title || chat.id}` : ""}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 12, alignItems: "stretch" }}>
        {/* LEVÝ SLOUPEC — výběr DM */}
        <div style={panel()}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Účastníci</div>
          <button onClick={() => setDmTarget(null)} style={dmButton(!dmTarget)}>
            Všichni (veřejná zpráva)
          </button>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {participants.map((p) => {
              const label = p.nickname || p.internal_name || `${p.role} #${p.id}`;
              const active = dmTarget?.id === p.id;
              return (
                <button key={p.id} onClick={() => setDmTarget(p)} style={dmButton(active)}>
                  {label} {p.role === "client" ? "👤" : "🧑"}
                </button>
              );
            })}
          </div>
        </div>

        {/* STŘED — chat */}
        <div style={panel({ display: "flex", flexDirection: "column" })}>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>
            Zprávy ({dmLabel})
          </div>

          <div style={{ flex: 1, overflowY: "auto", border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
            {messages.length === 0 ? (
              <div style={{ color: "#888" }}>Zatím žádné zprávy…</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {m.recipient_link_id ? "DM" : "Veřejná"} • {new Date(m.created_at).toLocaleTimeString()}
                  </div>
                  <div>{m.text}</div>
                </div>
              ))
            )}
            <div ref={listEndRef} />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Napiš zprávu (${dmTarget ? "DM" : "veřejná"})…`}
              rows={3}
              style={{ flex: 1, border: "1px solid #ddd", borderRadius: 8, padding: 8 }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button onClick={handleSend} style={btn()}>
              Odeslat
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            Enter = odeslat, Shift+Enter = nový řádek
          </div>
        </div>
      </div>
    </Layout>
  );
}

/** ===== styly ===== */
function panel(extra = {}) {
  return { border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff", ...extra };
}
function btn() {
  return { padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", background: "#e6e6ff", cursor: "pointer" };
}
function dmButton(active) {
  return {
    textAlign: "left",
    padding: "6px 8px",
    borderRadius: 8,
    border: active ? "2px solid #7c7cff" : "1px solid #ddd",
    background: active ? "#f2f2ff" : "#fff",
    cursor: "pointer",
  };
}
