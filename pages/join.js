// pages/join.js
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getLinkByToken, setNicknameOnLink } from "../lib/chatApi";

export default function JoinPage() {
  const [type, setType] = useState("respondent"); // respondent | client
  const [chatId, setChatId] = useState("");
  const [token, setToken] = useState("");
  const [link, setLink] = useState(null);
  const [nick, setNick] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    setType((url.searchParams.get("type") || "respondent").toString());
    const c = (url.searchParams.get("chat") || "").toString();
    const t = (url.searchParams.get("l") || "").toString();
    setChatId(c);
    setToken(t);
  }, []);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const l = await getLinkByToken(token);
        setLink(l);
      } catch (e) {
        console.error(e);
        setLink({ error: true });
      }
    }
    load();
  }, [token]);

  async function onEnter() {
    if (!link || link.error) {
      alert("Odkaz nenalezen.");
      return;
    }
    if (type === "respondent") {
      if (!nick.trim()) {
        alert("Zadej přezdívku.");
        return;
      }
      try {
        await setNicknameOnLink(link.id, nick.trim());
      } catch (e) {
        alert("Chyba uložení přezdívky: " + e.message);
        return;
      }
      window.location.href = `/chat?chat=${encodeURIComponent(chatId)}&role=respondent&link=${encodeURIComponent(
        link.id
      )}&nick=${encodeURIComponent(nick.trim())}`;
    } else {
      // client
      window.location.href = `/chat?chat=${encodeURIComponent(chatId)}&role=client&link=${encodeURIComponent(link.id)}`;
    }
  }

  return (
    <Layout>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Vstupní brána</h1>
      {!token && <p>Chybí token v URL. Použij odkaz z pozvánky.</p>}

      {link && !link.error && (
        <>
          <div style={{ margin: "12px 0", padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
            <div><b>Role:</b> {type === "client" ? "Klient" : "Respondent"}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>chat: {chatId}</div>
          </div>

          {type === "respondent" && (
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <label>Vaše přezdívka (zobrazí se v chatu):</label>
              <input
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder="např. Petr"
                style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
              />
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <button onClick={onEnter} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#eef" }}>
              Vstoupit do chatu
            </button>
          </div>
        </>
      )}

      {link && link.error && <p>Odkaz nenalezen nebo je neplatný.</p>}
    </Layout>
  );
}
