import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getLinkByToken, getChatWindowById, getProjectById,
  setNicknameOnLink, createConsent
} from "../lib/chatApi";

export default function Join() {
  const router = useRouter();
  const type = (router.query.type || "respondent").toString();
  const chatId = (router.query.chat || "").toString();
  const token = (router.query.l || "").toString();

  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState(null);
  const [project, setProject] = useState(null);
  const [nickname, setNickname] = useState("");
  const [agreeDpa, setAgreeDpa] = useState(false);
  const [agreeStudy, setAgreeStudy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token || !chatId) { setLoading(false); return; }
      try {
        const linkRow = await getLinkByToken(token);
        setLink(linkRow);
        // najdeme projekt přes chat okno
        const chat = await getChatWindowById(chatId);
        // chat má project_id → tím získáme nastavení
        const proj = await getProjectById(chat.project_id);
        setProject(proj);
      } catch (e) {
        console.error(e);
        alert("Odkaz je neplatný nebo vypršel.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, chatId]);

  async function handleEnter() {
    try {
      // pokud respondent a projekt chce souhlasy → zkontrolujeme
      if (type === "respondent") {
        if ((project?.showDPA && !agreeDpa) || (project?.showConsent && !agreeStudy)) {
          alert("Prosím potvrďte požadované souhlasy.");
          return;
        }
        if (!nickname.trim()) {
          alert("Zadejte prosím přezdívku.");
          return;
        }
        // uložit přezdívku k linku
        await setNicknameOnLink(link.id, nickname.trim());
        // uložit záznam o souhlasech (i pokud jsou oba vypnuté, nevadí)
        await createConsent(link.id, nickname.trim(), !!agreeDpa, !!agreeStudy);
      }

      // Zatím jen potvrzení. Později přesměrujeme do /room.
      setSaved(true);
      alert("Vstup potvrzen. (MVP bez živého chatu)");
      // router.push(`/room?chat=${encodeURIComponent(chatId)}&type=${encodeURIComponent(type)}&l=${encodeURIComponent(token)}`);
    } catch (e) {
      alert("Chyba při vstupu: " + e.message);
    }
  }

  return (
    <Layout>
      {loading ? (
        <p>Načítám…</p>
      ) : !link ? (
        <p>Odkaz nenalezen.</p>
      ) : (
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>
            {type === "client" ? "Brána klienta" : "Brána respondenta"}
          </h2>

          {type === "respondent" ? (
            <div style={{ marginTop: 12 }}>
              {(project?.showDPA || project?.showConsent) && (
                <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Souhlasy</div>
                  {project?.showDPA && (
                    <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <input type="checkbox" checked={agreeDpa} onChange={(e)=>setAgreeDpa(e.target.checked)} />
                      {project?.dpaText || "Souhlas s DPA"}
                    </label>
                  )}
                  {project?.showConsent && (
                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="checkbox" checked={agreeStudy} onChange={(e)=>setAgreeStudy(e.target.checked)} />
                      {project?.consentText || "Souhlas s účastí na výzkumu"}
                    </label>
                  )}
                </div>
              )}

              <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  Uveďte Vaše křestní jméno nebo přezdívku, která se bude zobrazovat v konverzaci:
                </div>
                <input
                  placeholder="Zadejte přezdívku"
                  value={nickname}
                  onChange={(e)=>setNickname(e.target.value)}
                  style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
                />
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={handleEnter}
                    disabled={saved}
                    style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6e6ff" }}
                  >
                    Vstoupit do konverzace
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <p>Stisknutím tlačítka vstupte do chatu.</p>
              <button
                onClick={handleEnter}
                disabled={saved}
                style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6e6ff" }}
              >
                Vstoupit do chatu
              </button>
            </div>
          )}

          {/* Kontrolní náhled pro Moderátora v projektu měl „Vstoupit“ neaktivní – tohle je ostrá brána podle tokenu */}
        </>
      )}
    </Layout>
  );
}
