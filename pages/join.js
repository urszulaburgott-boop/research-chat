// pages/join.js
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useRouter } from "next/router";
import { getLinkByToken, setNicknameOnLink, createConsent } from "../lib/chatApi";

export default function JoinGate() {
  const router = useRouter();
  const { type, chat, l } = router.query;

  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState(null);
  const [nickname, setNickname] = useState("");
  const [agreeDpa, setAgreeDpa] = useState(false);
  const [agreeStudy, setAgreeStudy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!l) return;
    (async () => {
      try {
        const row = await getLinkByToken(l);
        if (!row || row.chat_id !== chat) {
          setError("Odkaz nenalezen.");
        } else if (type && row.role !== type) {
          setError("Odkaz není pro tento typ uživatele.");
        } else {
          setLink(row);
        }
      } catch (e) {
        console.error(e);
        setError("Odkaz nenalezen.");
      } finally {
        setLoading(false);
      }
    })();
  }, [l, chat, type]);

  async function handleEnter() {
    if (!link) return;
    if (link.role === "respondent" && !nickname.trim()) {
      alert("Vyplň přezdívku.");
      return;
    }
    try {
      if (link.role === "respondent") {
        // Ulož přezdívku na link
        await setNicknameOnLink(link.id, nickname.trim());
        // Ulož souhlas
        await createConsent(link.id, nickname.trim(), agreeDpa, agreeStudy);
      }
      router.replace(`/chat?chat=${encodeURIComponent(link.chat_id)}&link=${encodeURIComponent(link.id)}`);
    } catch (e) {
      console.error(e);
      alert("Nepodařilo se projít bránou.");
    }
  }

  return (
    <Layout>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
        {type === "client" ? "Brána klienta" : "Brána respondenta"}
      </h2>

      {loading ? (
        <div>Načítám…</div>
      ) : error ? (
        <div style={{ color: "crimson" }}>{error}</div>
      ) : (
        <>
          {link.role === "respondent" ? (
            <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
              <label>
                <div style={{ marginBottom: 6 }}>Přezdívka, která se bude zobrazovat v chatu:</div>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Zadejte přezdívku"
                  style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, width: "100%" }}
                />
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={agreeDpa} onChange={(e) => setAgreeDpa(e.target.checked)} />
                <span>Souhlasím se zpracováním osobních údajů</span>
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={agreeStudy} onChange={(e) => setAgreeStudy(e.target.checked)} />
                <span>Souhlasím s účastí ve studii</span>
              </label>
              <button onClick={handleEnter} style={btnPrimary()}>
                Vstoupit do chatu
              </button>
            </div>
          ) : (
            <div>
              <p>Jste připraveni vstoupit do chatu jako klient.</p>
              <button onClick={handleEnter} style={btnPrimary()}>Vstoupit do chatu</button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

function btnPrimary() {
  return { padding: "8px 12px", borderRadius: 8, border: "1px solid #7c7cff", background: "#dedeff", cursor: "pointer", fontWeight: 600 };
}
