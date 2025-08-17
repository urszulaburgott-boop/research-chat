import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import { useRouter } from "next/router";
import { listParticipants, listMessagesForViewer, sendMessage } from "../lib/chatApi";

// Pomůcka: uloží a čte drobná data z localStorage pro konkrétní chat
function useLocalNote(chatId, key, initial = "") {
  const storageKey = chatId ? `chat:${chatId}:${key}` : null;
  const [val, setVal] = useState(initial);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const v = localStorage.getItem(storageKey);
      if (v !== null) setVal(v);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, val || "");
    } catch {}
  }, [storageKey, val]);

  return [val, setVal];
}

export default function ChatPod() {
  const router = useRouter();
  const chatId = router.query.id || router.query.chat || ""; // snažíme se vytáhnout chat_id z URL
  // role a link aktuálního uživatele – u moderátora je role "client"
  const myRole = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("my_role") : null), []);
  const myLinkId = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("my_link_id") : null), []);

  const isModerator = myRole === "client";

  // UI stav
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [dmTarget, setDmTarget] = useState(null); // {id, label} nebo null
  const inputRef = useRef(null);

  // pravý sloupek – poznámky moderátora (jen localStorage)
  const [modNotes, setModNotes] = useLocalNote(chatId, "mod_notes", "");

  // Načtení účastníků + zpráv
  async function refreshAll() {
    if (!chatId) return;
    const [pp, mm] = await Promise.all([
      listParticipants(chatId),
      listMessagesForViewer(chatId, isModerator ? null : myLinkId),
    ]);
    setParticipants(pp);
    setMessages(mm);
  }

  useEffect(() => {
    refreshAll();
    // jednoduché “polling” každé 3 vteřiny
    const t = setInterval(refreshAll, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, isModerator, myLinkId]);

  // Odeslání zprávy (Enter)
  async function doSend() {
    const text = input.trim();
    if (!text || !chatId) return;
    await sendMessage(chatId, text, myLinkId || null, dmTarget?.id || null);
    setInput("");
    setDmTarget(null); // po odeslání DM okno zavřeme
    refreshAll();
    inputRef.current?.focus();
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  }

  // Label respondenta
  function labelOf(p) {
    return p.nickname?.trim() || p.internal_name?.trim() || p.id.slice(0, 6);
  }

  // UI
  return (
    <Layout>
      <div style={{ display: "grid", gridTemplateColumns: isModerator ? "260px 1fr 280px" : "1fr", gap: 16 }}>
        {/* Levý sloupec – jen pro moderátora */}
        {isModerator && (
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, height: "calc(100vh - 160px)", overflow: "auto" }}>
            <h3 style={{ marginTop: 0 }}>Respondenti</h3>
            {participants.filter(p => p.role === "respondent").map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed #eee" }}>
                <div>{labelOf(p)}</div>
                <button onClick={() => setDmTarget({ id: p.id, label: labelOf(p) })} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ccc" }}>
                  Napsat DM
                </button>
              </div>
            ))}

            {dmTarget && (
              <div style={{ marginTop: 12, padding: 10, border: "1px solid #ddd", borderRadius: 8, background: "#fafafa" }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Soukromá zpráva pro: {dmTarget.label}</div>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  ref={inputRef}
                  rows={3}
                  placeholder="Napište zprávu (Enter = odeslat, Shift+Enter = nový řádek)"
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button onClick={doSend} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", background: "#e6ffe6" }}>
                    Odeslat DM
                  </button>
                  <button onClick={() => { setDmTarget(null); setInput(""); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}>
                    Zrušit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Střed – chat */}
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, height: "calc(100vh - 160px)", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflow: "auto", paddingRight: 6 }}>
            {messages.map((m) => {
              const isDm = !!m.recipient_link_id;
              return (
                <div key={m.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {isDm ? "DM" : "Veřejná"} zpráva
                  </div>
                  <div>{m.text}</div>
                  <div style={{ height: 1, background: "#eee", marginTop: 8 }} />
                </div>
              );
            })}
          </div>

          {/* Composer – společný (když není aktivní DM, posílá veřejně) */}
          {!dmTarget && (
            <div style={{ marginTop: 8 }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                ref={inputRef}
                rows={3}
                placeholder="Napište zprávu (Enter = odeslat, Shift+Enter = nový řádek)"
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button onClick={doSend} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", background: "#e6f0ff" }}>
                  Odeslat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pravý sloupec – poznámky moderátora */}
        {isModerator && (
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, height: "calc(100vh - 160px)", overflow: "auto" }}>
            <h3 style={{ marginTop: 0 }}>Poznámky (jen moderátor)</h3>
            <textarea
              value={modNotes}
              onChange={e => setModNotes(e.target.value)}
              placeholder="Sem si piš poznámky během rozhovoru. Ukládá se do prohlížeče."
              rows={18}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
