// pages/chat-pod.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import {
  getChatWindowById,
  listRespondents,
  listMessages,
  sendMessage,
  subscribeMessages,
  getNote,
  saveNote
} from "../lib/chatApi";

export default function ChatPod() {
  const router = useRouter();
  const chatId = useMemo(() => (router.query.id || router.query.chat || "").toString(), [router.query]);
  const [loading, setLoading] = useState(true);

  // data
  const [chatInfo, setChatInfo] = useState(null);
  const [respondents, setRespondents] = useState([]);
  const [messages, setMessages] = useState([]);

  // editor zprávy
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  // DM cíl (vybraný respondent vlevo)
  const [dmTarget, setDmTarget] = useState(null); // { id, internal_name, nickname } nebo null

  // poznámky vpravo
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // “role” moderátora (teď napevno; respondent/client UI doděláme později)
  const senderRole = "moderator";
  const senderName = "Moderátor";

  useEffect(() => {
    if (!chatId) return;
    let unsub = () => {};
    (async () => {
      setLoading(true);
      const [ci, rs, ms, note] = await Promise.all([
        getChatWindowById(chatId),
        listRespondents(chatId),
        listMessages(chatId),
        getNote(chatId),
      ]);
      setChatInfo(ci);
      setRespondents(rs);
      setMessages(ms);
      setNotes(note?.content || "");
      // realtime
      unsub = subscribeMessages(chatId, (newMsg) => {
        setMessages((prev) => [...prev, newMsg]);
      });
      setLoading(false);
      // autofocus
      setTimeout(() => inputRef.current?.focus(), 0);
    })();
    return () => unsub();
  }, [chatId]);

  async function handleSend() {
    const body = text.trim();
    if (!body) return;
    await sendMessage({
      chatId,
      senderRole,
      senderName,
      content: body,
      recipientLinkId: dmTarget ? dmTarget.id : null,
    });
    setText("");
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      await saveNote(chatId, notes);
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <Layout>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
        Chat · {chatInfo?.name || chatId}
      </h2>

      {loading ? (
        <p>Načítám…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 300px", gap: 12, minHeight: "70vh" }}>
          {/* Levý sloupec – Respondenti */}
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Respondenti</div>
            <div>
              {respondents.length === 0 && <div style={{ color: "#666" }}>Zatím žádní.</div>}
              {respondents.map((r) => {
                const label = r.nickname?.trim() || r.internal_name || r.id.slice(0, 6);
                const selected = dmTarget?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setDmTarget(selected ? null : r)}
                    style={{
                      padding: "6px 8px",
                      borderRadius: 6,
                      marginBottom: 6,
                      cursor: "pointer",
                      background: selected ? "#eef" : "#fafafa",
                      border: selected ? "1px solid #99f" : "1px solid #eee",
                    }}
                    title="Klikni pro soukromou zprávu (DM)"
                  >
                    {label}
                    {selected && <span style={{ marginLeft: 6, fontSize: 12, color: "#335" }}>(DM)</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prostředek – Chat */}
          <div style={{ display: "flex", flexDirection: "column", border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 2px", marginBottom: 10 }}>
              {messages.length === 0 && (
                <div style={{ color: "#666" }}>Zatím žádné zprávy.</div>
              )}
              {messages.map((m) => {
                const isDM = !!m.recipient_link_id;
                return (
                  <div key={m.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "#555" }}>
                      <b>{m.sender_name || m.sender_role}</b>
                      {isDM && <span style={{ marginLeft: 6, color: "#a33" }}>(DM)</span>}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                  </div>
                );
              })}
            </div>

            {/* Vstup – Enter odesílá, Shift+Enter nový řádek */}
            <div>
              {dmTarget ? (
                <div style={{ marginBottom: 6, fontSize: 12, color: "#335" }}>
                  Posíláš <b>DM</b> pro: <b>{dmTarget.nickname?.trim() || dmTarget.internal_name || dmTarget.id.slice(0,6)}</b>{" "}
                  <button onClick={() => setDmTarget(null)} style={{ marginLeft: 8, fontSize: 12 }}>Zrušit DM</button>
                </div>
              ) : (
                <div style={{ marginBottom: 6, fontSize: 12, color: "#555" }}>Posíláš do <b>veřejného</b> chatu.</div>
              )}
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Napiš zprávu… (Enter = odeslat, Shift+Enter = nový řádek)"
                rows={3}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", resize: "vertical" }}
              />
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button onClick={handleSend} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6e6ff" }}>
                  Odeslat
                </button>
                {dmTarget && (
                  <button onClick={() => setDmTarget(null)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}>
                    Posílat veřejně
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pravý sloupec – Poznámky moderátora */}
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Poznámky moderátora</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sem si piš poznámky…"
              rows={16}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", resize: "vertical" }}
            />
            <div style={{ marginTop: 8 }}>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: savingNotes ? "#ddd" : "#e6ffe6" }}
              >
                {savingNotes ? "Ukládám…" : "Uložit poznámky"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
