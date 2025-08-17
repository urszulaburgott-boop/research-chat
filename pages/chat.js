// pages/chat.js
import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import { listMessages, sendMessage, subscribeMessages, listLinks } from "../lib/chatApi";

export default function ChatPage() {
  const [chatId, setChatId] = useState("");
  const [role, setRole] = useState("moderator"); // moderator | client | respondent
  const [linkId, setLinkId] = useState(null);    // id linku účastníka (pokud je)
  const [nick, setNick] = useState("");

  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");

  const [participants, setParticipants] = useState([]);
  const [recipient, setRecipient] = useState(null); // id linku pro DM (jen moderátor)

  const listRef = useRef(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    setChatId((url.searchParams.get("chat") || "").toString());
    setRole((url.searchParams.get("role") || "moderator").toString());
    const lid = url.searchParams.get("link");
    const nn = url.searchParams.get("nick");
    if (lid) setLinkId(lid.toString());
    if (nn) setNick(nn.toString());
  }, []);

  useEffect(() => {
    if (!chatId) return;
    loadAll(chatId);
    const off = subscribeMessages(chatId, (m) => {
      setMsgs((prev) => [...prev, m]);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 0);
    });
    return () => off && off();
  }, [chatId]);

  async function loadAll(id) {
    const [m, ls] = await Promise.all([listMessages(id), listLinks(id)]);
    setMsgs(m);
    setParticipants(ls);
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 0);
  }

  const canDM = role === "moderator"; // jen moderátor má DM
  const myName = useMemo(() => {
    if (role === "respondent") return nick || "Respondent";
    if (role === "client") return "Klient";
    return "Moderátor";
  }, [role, nick]);

  async function onSend() {
    const content = text.trim();
    if (!content) return;
    await sendMessage({
      chatId,
      senderRole: role,
      senderName: myName,
      content,
      recipientLinkId: canDM ? recipient || null : null,
    });
    setText("");
  }

  return (
    <Layout>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Chat</h1>
      <div style={{ marginBottom: 8, opacity: 0.7, fontSize: 12 }}>
        chat: {chatId} • role: {role}{nick ? ` • přezdívka: ${nick}` : ""}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: canDM ? "240px 1fr" : "1fr", gap: 12 }}>
        {canDM && (
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Účastníci</div>
            <div style={{ display: "grid", gap: 6 }}>
              {participants.map((p) => (
                <label key={p.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="radio"
                    name="recipient"
                    value={p.id}
                    checked={recipient === p.id}
                    onChange={() => setRecipient(p.id)}
                  />
                  <span>
                    {p.role === "client" ? "Klient" : "Respondent"} —{" "}
                    {p.nickname || p.internal_name || p.id.slice(0, 6)}
                  </span>
                </label>
              ))}
              <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <input
                  type="radio"
                  name="recipient"
                  value=""
                  checked={!recipient}
                  onChange={() => setRecipient(null)}
                />
                <span>Všem (veřejná zpráva)</span>
              </label>
            </div>
          </div>
        )}

        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, display: "grid", gridTemplateRows: "1fr auto", minHeight: 420 }}>
          <div ref={listRef} style={{ overflowY: "auto", paddingRight: 6 }}>
            {msgs.map((m) => (
              <div key={m.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {m.sender_role} {m.sender_name ? `• ${m.sender_name}` : ""}{" "}
                  {m.recipient_link_id ? "(DM)" : ""}
                </div>
                <div>{m.content}</div>
              </div>
            ))}
            {msgs.length === 0 && <div>Žádné zprávy.</div>}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Napište zprávu…"
              onKeyDown={(e) => e.key === "Enter" ? onSend() : null}
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, flex: 1 }}
            />
            <button onClick={onSend} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}>
              Odeslat
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
