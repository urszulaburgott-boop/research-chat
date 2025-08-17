// pages/chat-pod.js
import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import {
  getChatWindowById,
  listLinks,
  listParticipants,
  listMessages,
  subscribeMessages,
  sendMessage,
  getNote,
  saveNote,
  createRespondentLink,
  createClientLink,
  deleteLink,
} from "../lib/chatApi";
import { useRouter } from "next/router";

export default function ChatPod() {
  const router = useRouter();
  const chatId = router.query.id || router.query.chat || null;

  // UI stav
  const [chat, setChat] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [links, setLinks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [dmTarget, setDmTarget] = useState(null); // zvolený příjemce DM
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const listEndRef = useRef(null);

  // načtení podokna + dat
  useEffect(() => {
    if (!chatId) return;

    (async () => {
      try {
        const [c, ls, ps, ms, n] = await Promise.all([
          getChatWindowById(chatId),
          listLinks(chatId),
          listParticipants(chatId),
          listMessages(chatId),
          getNote(chatId),
        ]);
        setChat(c);
        setLinks(ls);
        setParticipants(ps);
        setMessages(ms);
        setNote(n?.content || "");
      } catch (e) {
        console.error(e);
        alert("Chyba při načítání podokna.");
      }
    })();

    // realtime zprávy
    const unsubscribe = subscribeMessages(chatId, (m) => {
      setMessages((prev) => [...prev, m]);
      scrollToEnd();
    });
    return unsubscribe;
  }, [chatId]);

  function scrollToEnd() {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  useEffect(() => {
    scrollToEnd();
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
      await sendMessage(chatId, content, null, dmTarget?.id || null);
      setText("");
    } catch (e) {
      console.error(e);
      alert("Zprávu se nepodařilo odeslat.");
    }
  }

  async function handleSaveNote() {
    try {
      setSavingNote(true);
      await saveNote(chatId, note);
    } catch (e) {
      console.error(e);
      alert("Poznámku se nepodařilo uložit.");
    } finally {
      setSavingNote(false);
    }
  }

  // Správa linků v podokně (rychlé ovládací prvky nahoře)
  async function addRespondentLink() {
    try {
      const row = await createRespondentLink(chatId, "");
      setLinks((prev) => [...prev, row]);
      setParticipants((prev) => [...prev, { id: row.id, role: row.role, internal_name: row.internal_name, nickname: row.nickname }]);
    } catch (e) {
      console.error(e);
      alert("Link respondenta se nepodařilo vytvořit.");
    }
  }
  async function addClientLink() {
    try {
      const row = await createClientLink(chatId, "Klient (multi)");
      setLinks((prev) => [...prev, row]);
      setParticipants((prev) => [...prev, { id: row.id, role: row.role, internal_name: row.internal_name, nickname: row.nickname }]);
    } catch (e) {
      console.error(e);
      alert("Link klienta se nepodařilo vytvořit.");
    }
  }
  async function removeLink(id) {
    if (!confirm("Opravdu smazat link?")) return;
    try {
      await deleteLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      if (dmTarget?.id === id) setDmTarget(null);
    } catch (e) {
      console.error(e);
      alert("Link se nepodařilo smazat.");
    }
  }

  return (
    <Layout>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
        Podokno chatu {chat ? `— ${chat.title || chat.id}` : ""}
      </h2>

      {/* horní lišta pro správu linků */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={addRespondentLink} style={btn()}>
          + Link pro respondenta
        </button>
        <button onClick={addClientLink} style={btn()}>
          + Link pro klienta
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 300px", gap: 12, alignItems: "stretch" }}>
        {/* LEVÝ SLOUPEC — účastníci a DM výběr */}
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

          <div style={{ marginTop: 16, fontSize: 12, color: "#666" }}>
            Tip: kliknutím vybereš příjemce; znovu „Všichni“ vrátí veřejné zprávy.
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

        {/* PRAVÝ SLOUPEC — poznámky moderátora */}
        <div style={panel()}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Poznámky moderátora</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={12}
            placeholder="Sem si piš poznámky…"
            style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: 8 }}
          />
          <button onClick={handleSaveNote} style={{ ...btn(), marginTop: 8 }}>
            {savingNote ? "Ukládám…" : "Uložit poznámku"}
          </button>
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            Poznámky jsou jen pro moderátora (neposílají se do chatu).
          </div>
        </div>
      </div>

      {/* dole – seznam linků (pro přehled) */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Linky pro připojení</div>
        {links.length === 0 ? (
          <div style={{ color: "#888" }}>Zatím žádné linky…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            {links.map((l) => (
              <div key={l.id} style={{ display: "contents" }}>
                <div style={{ padding: 8, border: "1px solid #eee", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>{l.role}</div>
                  <div style={{ wordBreak: "break-all" }}>
                    <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
                  </div>
                  {(l.internal_name || l.nickname) && (
                    <div style={{ fontSize: 12, color: "#333", marginTop: 4 }}>
                      {l.nickname || l.internal_name}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => removeLink(l.id)} style={btnDanger()}>
                    Smazat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

/** ===== styly ===== */
function panel(extra = {}) {
  return {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
    ...extra,
  };
}
function btn() {
  return {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#e6e6ff",
    cursor: "pointer",
  };
}
function btnDanger() {
  return {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #e0b4b4",
    background: "#ffe6e6",
    cursor: "pointer",
  };
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
