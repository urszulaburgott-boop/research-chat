import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  setChatDate, listLinks, createRespondentLink, createClientLink,
  deleteLink, bulkCreateRespondents, setLinksDisabled
} from "../lib/chatApi";
import { downloadFile, copyText } from "../lib/clientUtils";
import { listChatWindows } from "../lib/chatApi";

export default function ChatPodPage() {
  const router = useRouter();
  const chatId = (router.query.id || "").toString();

  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState(null);
  const [links, setLinks] = useState([]);
  const [dateStr, setDateStr] = useState("");
  const [respName, setRespName] = useState("");
  const [clientLabel, setClientLabel] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [confirmOff, setConfirmOff] = useState(false);

  async function load() {
    if (!chatId) return;
    setLoading(true);
    try {
      const pods = await listChatWindows("dummy-project-id-not-used-here"); // placeholder, načteme všechna a vybereme jeden
      const found = pods.find(p => p.id === chatId) || null;
      setChatInfo(found);
      setDateStr(found?.date_str || "");
      const l = await listLinks(chatId);
      setLinks(l);
    } catch (e) {
      // fallback: zkusíme přímo jedno podokno (rychlá varianta – některé instalace neumožní list bez project_id)
      // V MVP klidně ignoruj, důležité je načíst linky
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [chatId]);

  async function saveDate() {
    try {
      const updated = await setChatDate(chatId, dateStr.trim());
      setChatInfo(updated);
      alert("Termín uložen.");
    } catch (e) {
      alert("Chyba při ukládání termínu: " + e.message);
    }
  }

import { createRespondentLink, createClientLink } from "../lib/chatApi";

// ... v komponentě máš k dispozici project.id a chat.id
async function onCreateRespondent() {
  if (!newRespName.trim()) return;
  try {
    const row = await createRespondentLink(project.id, chat.id, newRespName.trim());
    // přidej řádek do lokálního stavu (a/nebo znovu načti)
    setRespLinks(prev => [...prev, row]);
    setNewRespName("");
  } catch (e) {
    console.error(e);
    alert("Nepodařilo se vytvořit odkaz: " + e.message);
  }
}

async function onCreateClient() {
  try {
    const row = await createClientLink(project.id, chat.id, newClientLabel.trim());
    setClientLinks(prev => [...prev, row]);
    setNewClientLabel("");
  } catch (e) {
    console.error(e);
    alert("Nepodařilo se vytvořit klientský odkaz: " + e.message);
  }
}
  async function bulkCreate() {
    try {
      const rows = await bulkCreateRespondents(chatId, bulkText);
      setLinks(prev => [...prev, ...rows]);
      setBulkText("");
      alert(`Vytvořeno: ${rows.length} odkazů.`);
    } catch (e) {
      alert("Chyba při hromadném vytváření: " + e.message);
    }
  }

  async function removeLink(id) {
    if (!confirm("Opravdu chcete smazat tento link?")) return;
    try {
      await deleteLink(id);
      setLinks(prev => prev.filter(x => x.id !== id));
    } catch (e) {
      alert("Chyba při mazání: " + e.message);
    }
  }

  function downloadLinksCsv() {
    const rows = links
      .filter(l => l.role === "respondent")
      .map(l => `${l.internal_name},${l.url}`);
    const csv = `Jméno,Odkaz\n${rows.join("\n")}`;
    downloadFile("odkazy_respondenti.csv", csv, "text/csv;charset=utf-8");
  }

  async function turnOffLinks() {
    try {
      const updated = await setLinksDisabled(chatId, true);
      setChatInfo(updated);
      setConfirmOff(false);
    } catch (e) {
      alert("Chyba při vypínání linků: " + e.message);
    }
  }
  async function turnOnLinks() {
    try {
      const updated = await setLinksDisabled(chatId, false);
      setChatInfo(updated);
    } catch (e) {
      alert("Chyba při zapínání linků: " + e.message);
    }
  }

  return (
    <Layout>
      {!chatId ? (
        <p>Chybí parametr <code>?id=...</code> v URL.</p>
      ) : loading ? (
        <p>Načítám…</p>
      ) : !chatInfo ? (
        <p>Podokno nenalezeno (zatím načítáme linky, což stačí pro tento krok).</p>
      ) : (
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Podokno chatu: {chatInfo.name}</h2>

          {/* Termín chatu */}
          <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Termín chatu</div>
            <input
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              placeholder="např. 18.08.2025, 17:00"
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, width: 280 }}
            />
            <button onClick={saveDate} style={{ marginLeft: 8, padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6e6ff" }}>
              Uložit termín
            </button>
          </div>

          {/* Odkazy pro Respondenty */}
          <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Odkazy pro Respondenty</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <input
                value={respName}
                onChange={(e) => setRespName(e.target.value)}
                placeholder="Jméno respondenta (interní evidence)"
                style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, minWidth: 280 }}
                onKeyDown={(e) => { if (e.key === "Enter") addResp(); }}
              />
              <button onClick={addResp} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6e6ff" }}>
                Vytvořit odkaz
              </button>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>Hromadné vytvoření linků (jedno jméno na řádek)</div>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"Jan Novák\nPetra Svobodová\n…"}
              rows={5}
              style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6, marginTop: 4 }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button onClick={bulkCreate} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}>
                Hromadné vytvoření odkazů
              </button>
              <button onClick={downloadLinksCsv} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}>
                Hromadné stažení linků (CSV)
              </button>
              <button onClick={() => setBulkText("")} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}>
                Vyčistit
              </button>
            </div>

            {/* Seznam respondent odkazů */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr", gap: 8, fontWeight: 600, borderBottom: "1px solid #ddd", paddingBottom: 4, fontSize: 12 }}>
                <div>Interní jméno</div>
                <div>Odkaz</div>
                <div>Akce</div>
              </div>
              {links.filter(l => l.role === "respondent").map(l => (
                <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr", gap: 8, alignItems: "center", borderBottom: "1px solid #eee", padding: "6px 0", fontSize: 14 }}>
                  <div>{l.internal_name}</div>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => copyText(l.url)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}>Kopírovat</button>
                    <button onClick={() => removeLink(l.id)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", background: "#ffe5d6" }}>Smazat link</button>
                  </div>
                </div>
              ))}
              {links.filter(l => l.role === "respondent").length === 0 && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Zatím žádné odkazy.</div>
              )}
            </div>
          </div>

          {/* Odkazy pro Klienty */}
          <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Odkazy pro Klienty (multi-use)</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <input
                value={clientLabel}
                onChange={(e) => setClientLabel(e.target.value)}
                placeholder="Označení klienta (volitelné)"
                style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, minWidth: 280 }}
                onKeyDown={(e) => { if (e.key === "Enter") addClient(); }}
              />
              <button onClick={addClient} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6e6ff" }}>
                Vytvořit odkaz
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2.2fr 1fr", gap: 8, fontWeight: 600, borderBottom: "1px solid #ddd", paddingBottom: 4, fontSize: 12 }}>
              <div>Označení</div>
              <div>Odkaz</div>
              <div>Akce</div>
            </div>
            {links.filter(l => l.role === "client").map(l => (
              <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 2.2fr 1fr", gap: 8, alignItems: "center", borderBottom: "1px solid #eee", padding: "6px 0", fontSize: 14 }}>
                <div>{l.internal_name} <span style={{ fontSize: 10, marginLeft: 6 }}>(multi)</span></div>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => copyText(l.url)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}>Kopírovat</button>
                  <button onClick={() => removeLink(l.id)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", background: "#ffe5d6" }}>Smazat link</button>
                </div>
              </div>
            ))}
            {links.filter(l => l.role === "client").length === 0 && (
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Zatím žádné odkazy.</div>
            )}
          </div>

          {/* Bezpečnost odkazů – jen pro toto podokno */}
          <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Bezpečnost odkazů – toto podokno</div>
            {!chatInfo.links_disabled ? (
              <>
                <button onClick={() => setConfirmOff(true)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#ffe5d6" }}>
                  Vypnout všechny linky
                </button>
                {confirmOff && (
                  <div style={{ marginTop: 8, padding: 8, border: "1px solid #ccc", borderRadius: 6 }}>
                    <div>Opravdu chcete vypnout všechny linky?</div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <button onClick={turnOffLinks} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, background: "#ffe5d6" }}>Ano</button>
                      <button onClick={() => setConfirmOff(false)} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>Ne</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button disabled style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#ddd" }}>
                  Linky vypnuty
                </button>
                <button onClick={turnOnLinks} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6e6ff" }}>
                  Znovu zapnout linky
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <a href={`/project?id=${encodeURIComponent(chatInfo.project_id)}`} style={{ textDecoration: "underline" }}>← Zpět na projekt</a>
          </div>
        </>
      )}
    </Layout>
  );
}
// ukáže poslední chybu z API (jen dočasně)
const [lastErr, setLastErr] = useState(null);

// v catch blocích navíc:
setLastErr(e);

// a někde pod formulář:
{lastErr && <div style={{color: "red", fontSize: 12}}>API chyba: {String(lastErr.message || lastErr)}</div>}
