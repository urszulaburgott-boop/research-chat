// pages/chat-pod.js
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getChatWindowById,
  listLinks,
  createRespondentLink,
  createClientLink,
  deleteLink,
  setChatDate,
  setLinksDisabled,
} from "../lib/chatApi";
import Link from "next/link";

export default function ChatPodPage() {
  const [chatId, setChatId] = useState("");
  const [chat, setChat] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [respName, setRespName] = useState("");
  const [clientLabel, setClientLabel] = useState("Klient (multi)");
  const [meetingIso, setMeetingIso] = useState("");
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const c = url.searchParams.get("chat");
    if (c) {
      setChatId(c);
      loadAll(c);
    }
  }, []);

  async function loadAll(id) {
    try {
      setLoading(true);
      const cw = await getChatWindowById(id);
      const ls = await listLinks(id);
      setChat(cw);
      setLinks(ls);
      setDisabled(!!cw.links_disabled);
      setMeetingIso(cw.meeting_at ? cw.meeting_at.slice(0, 16) : "");
    } catch (e) {
      alert("Chyba načtení podokna: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onCreateResp() {
    if (!respName) return;
    try {
      await createRespondentLink(chatId, respName);
      setRespName("");
      await loadAll(chatId);
    } catch (e) {
      alert("Chyba vytvoření linku: " + e.message);
    }
  }

  async function onCreateClient() {
    try {
      await createClientLink(chatId, clientLabel || "Klient (multi)");
      await loadAll(chatId);
    } catch (e) {
      alert("Chyba vytvoření klientského linku: " + e.message);
    }
  }

  async function onDelete(linkId) {
    if (!confirm("Smazat link?")) return;
    try {
      await deleteLink(linkId);
      await loadAll(chatId);
    } catch (e) {
      alert("Chyba mazání: " + e.message);
    }
  }

  async function onSaveMeeting() {
    try {
      await setChatDate(chatId, meetingIso ? new Date(meetingIso).toISOString() : null);
      await loadAll(chatId);
    } catch (e) {
      alert("Chyba uložení času: " + e.message);
    }
  }

  async function onToggleDisabled() {
    try {
      await setLinksDisabled(chatId, !disabled);
      await loadAll(chatId);
    } catch (e) {
      alert("Chyba přepnutí: " + e.message);
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
    alert("Zkopírováno.");
  }

  return (
    <Layout>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Podokno – správa linků</h1>
      {!chat && <p>Zadej /chat-pod?chat=&lt;uuid&gt; v URL.</p>}

      {chat && (
        <>
          <div style={{ margin: "12px 0", padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
            <div><b>Název:</b> {chat.title || "(bez názvu)"} &nbsp; <span style={{ opacity: 0.6 }}>id: {chat.id}</span></div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label>Datum/čas (volitelné):</label>
              <input
                type="datetime-local"
                value={meetingIso}
                onChange={(e) => setMeetingIso(e.target.value)}
                style={{ padding: 6, border: "1px solid #ccc", borderRadius: 6 }}
              />
              <button onClick={onSaveMeeting} style={{ padding: "6px 10px" }}>Uložit</button>

              <label style={{ marginLeft: 12 }}>
                <input type="checkbox" checked={disabled} onChange={onToggleDisabled} /> Linky zakázány
              </label>

              <Link href={`/chat?chat=${chat.id}&role=moderator`} style={{ marginLeft: "auto", textDecoration: "underline" }}>
                Otevřít chat (moderátor)
              </Link>
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 16 }}>Vytvořit link</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <input
              value={respName}
              onChange={(e) => setRespName(e.target.value)}
              placeholder="Interní jméno respondenta (např. R1 – Petr)"
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, minWidth: 260 }}
            />
            <button onClick={onCreateResp} style={{ padding: "8px 12px" }}>+ Respondent</button>

            <input
              value={clientLabel}
              onChange={(e) => setClientLabel(e.target.value)}
              placeholder="Štítek klientského linku"
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, minWidth: 220 }}
            />
            <button onClick={onCreateClient} style={{ padding: "8px 12px" }}>+ Klient (multi)</button>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Linky</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {links.map((l) => (
              <div key={l.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <b>{l.role === "client" ? "Klient" : "Respondent"}:</b>
                  <span>{l.internal_name || "(bez interního jména)"}{l.nickname ? ` • přezdívka: ${l.nickname}` : ""}</span>
                  <button onClick={() => copy(l.url)} style={{ marginLeft: "auto", padding: "4px 8px" }}>
                    Kopírovat odkaz
                  </button>
                  <button onClick={() => onDelete(l.id)} style={{ padding: "4px 8px" }}>
                    Smazat
                  </button>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, wordBreak: "break-all", opacity: 0.8 }}>{l.url}</div>
              </div>
            ))}
            {links.length === 0 && <div>Žádné linky.</div>}
          </div>
        </>
      )}
    </Layout>
  );
}
