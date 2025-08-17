// pages/chat-pod.js
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useRouter } from "next/router";
import {
  getChatWindowById,
  listLinks,
  createRespondentLink,
  createClientLink,
  deleteLink,
} from "../lib/chatApi";

export default function ChatPod() {
  const router = useRouter();
  const chatId = router.query.id || router.query.chat || null;

  const [chat, setChat] = useState(null);
  const [links, setLinks] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!chatId) return;
    (async () => {
      try {
        const c = await getChatWindowById(chatId);
        const ls = await listLinks(chatId);
        setChat(c);
        setLinks(ls);
      } catch (e) {
        console.error(e);
        alert("Chyba při načítání podokna.");
      }
    })();
  }, [chatId]);

  async function addRespondent() {
    try {
      setCreating(true);
      const row = await createRespondentLink(chatId, "");
      setLinks((prev) => [...prev, row]);
    } catch (e) {
      console.error(e);
      alert("Link respondenta se nepodařilo vytvořit.");
    } finally {
      setCreating(false);
    }
  }

  async function addClient() {
    try {
      setCreating(true);
      const row = await createClientLink(chatId, "Klient (multi)");
      setLinks((prev) => [...prev, row]);
    } catch (e) {
      console.error(e);
      alert("Link klienta se nepodařilo vytvořit.");
    } finally {
      setCreating(false);
    }
  }

  async function removeLink(id) {
    if (!confirm("Opravdu smazat link?")) return;
    try {
      await deleteLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
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

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => router.push(`/chat?chat=${encodeURIComponent(chatId)}`)}
          style={btnPrimary()}
        >
          🔵 Otevřít chat
        </button>
        <button onClick={addRespondent} disabled={creating} style={btn()}>
          + Link pro respondenta
        </button>
        <button onClick={addClient} disabled={creating} style={btn()}>
          + Link pro klienta
        </button>
      </div>

      <div style={panel()}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Linky pro připojení</div>
        {links.length === 0 ? (
          <div style={{ color: "#888" }}>Zatím žádné linky…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 1fr auto", gap: 8 }}>
            <div style={hdr()}>Role</div>
            <div style={hdr()}>Interní jméno</div>
            <div style={hdr()}>Přezdívka (z brány)</div>
            <div style={hdr()}>URL</div>
            <div style={hdr()}></div>
            {links.map((l) => (
              <FragmentRow key={l.id} link={l} onDelete={() => removeLink(l.id)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function FragmentRow({ link, onDelete }) {
  return (
    <>
      <div style={cell()}>{link.role}</div>
      <div style={cell()}>{link.internal_name || <span style={{color:"#aaa"}}>—</span>}</div>
      <div style={cell()}>{link.nickname || <span style={{color:"#aaa"}}>—</span>}</div>
      <div style={{ ...cell(), wordBreak: "break-all" }}>
        <a href={link.url} target="_blank" rel="noreferrer">
          {link.url}
        </a>
      </div>
      <div style={{ ...cell(), textAlign: "right" }}>
        <button onClick={onDelete} style={btnDanger()}>Smazat</button>
      </div>
    </>
  );
}

/** ===== styly ===== */
function panel(extra = {}) {
  return { border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff", ...extra };
}
function btn() {
  return { padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", background: "#e6e6ff", cursor: "pointer" };
}
function btnPrimary() {
  return { padding: "8px 12px", borderRadius: 8, border: "1px solid #7c7cff", background: "#dedeff", cursor: "pointer", fontWeight: 600 };
}
function btnDanger() {
  return { padding: "8px 12px", borderRadius: 8, border: "1px solid #e0b4b4", background: "#ffe6e6", cursor: "pointer" };
}
function hdr() { return { fontWeight: 700, color: "#444" }; }
function cell() { return { padding: "6px 4px", borderBottom: "1px solid #f2f2f2" }; }
