// pages/project.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getProjectById,
  listChatWindows,
  listLinks,
  createRespondentLink,
  createClientLink,
  deleteLink,
  buildJoinUrl,
} from "../lib/chatApi";

export default function ProjectPage() {
  const router = useRouter();
  const projectId = router.query?.id;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [chats, setChats] = useState([]);
  const [linksByChat, setLinksByChat] = useState({}); // { [chatId]: Link[] }
  const [newNameByChat, setNewNameByChat] = useState({}); // pro respondent link jméno

  // načti projekt + chaty
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        setLoading(true);
        const p = await getProjectById(projectId);
        const c = await listChatWindows(projectId);
        setProject(p);
        setChats(c);

        // načti linky pro všechny chaty
        const entries = await Promise.all(
          c.map(async (chat) => {
            const links = await listLinks(chat.id);
            return [chat.id, links];
          })
        );
        const map = Object.fromEntries(entries);
        setLinksByChat(map);
      } catch (e) {
        console.error(e);
        alert("Nepovedlo se načíst data projektu.");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  async function refreshChatLinks(chatId) {
    const links = await listLinks(chatId);
    setLinksByChat((prev) => ({ ...prev, [chatId]: links }));
  }

  // vytvořit respondent link (s volitelným interním jménem)
  async function onCreateRespondent(chatId) {
    try {
      const internal = (newNameByChat[chatId] || "").trim();
      await createRespondentLink(chatId, internal);
      setNewNameByChat((prev) => ({ ...prev, [chatId]: "" }));
      await refreshChatLinks(chatId);
    } catch (e) {
      console.error(e);
      alert("Nepovedlo se vytvořit respondent link.");
    }
  }

  // vytvořit klient link (multi)
  async function onCreateClient(chatId) {
    try {
      await createClientLink(chatId, "Klient (multi)");
      await refreshChatLinks(chatId);
    } catch (e) {
      console.error(e);
      alert("Nepovedlo se vytvořit klient link.");
    }
  }

  async function onDeleteLink(chatId, linkId) {
    if (!confirm("Opravdu smazat odkaz?")) return;
    try {
      await deleteLink(linkId);
      await refreshChatLinks(chatId);
    } catch (e) {
      console.error(e);
      alert("Smazání odkazu se nepodařilo.");
    }
  }

  if (loading) {
    return (
      <Layout>
        <p>Načítám…</p>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <p>Projekt nenalezen.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        Projekt: {project.name || project.title || project.id}
      </h1>

      {chats.length === 0 ? (
        <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <p>Tento projekt zatím nemá žádné chaty (podokna).</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {chats.map((chat) => (
            <div key={chat.id} style={{ border: "1px solid #e6e6e6", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{chat.name || `Chat #${chat.id}`}</div>
                  {chat.session_date ? (
                    <div style={{ fontSize: 12, color: "#666" }}>
                      Datum: {new Date(chat.session_date).toLocaleString()}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* ODKAZY */}
              <div style={{ marginTop: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Odkazy</h3>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                  <input
                    placeholder="Jméno respondenta (volitelné)"
                    value={newNameByChat[chat.id] || ""}
                    onChange={(e) =>
                      setNewNameByChat((prev) => ({ ...prev, [chat.id]: e.target.value }))
                    }
                    style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, minWidth: 220 }}
                  />
                  <button
                    onClick={() => onCreateRespondent(chat.id)}
                    style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6f6ff" }}
                  >
                    Vytvořit link pro respondenta
                  </button>
                  <button
                    onClick={() => onCreateClient(chat.id)}
                    style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6ffe6" }}
                  >
                    Vytvořit link pro klienta (multi)
                  </button>
                </div>

                {/* Seznam linků */}
                <div style={{ display: "grid", gap: 8 }}>
                  {(linksByChat[chat.id] || []).length === 0 ? (
                    <div style={{ fontSize: 14, color: "#666" }}>Zatím žádné odkazy.</div>
                  ) : (
                    (linksByChat[chat.id] || []).map((l) => {
                      const href = l.url || buildJoinUrl(l.role === "client" ? "client" : "respondent", l.chat_id, l.token);
                      return (
                        <div key={l.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {l.role === "client" ? "Klient" : "Respondent"}
                              {l.internal_name ? `: ${l.internal_name}` : ""}
                            </div>
                            <div style={{ fontSize: 12, color: "#666", wordBreak: "break-all" }}>
                              <a href={href} target="_blank" rel="noreferrer">{href}</a>
                            </div>
                            {l.nickname ? (
                              <div style={{ fontSize: 12, color: "#333" }}>Přezdívka po vstupu: {l.nickname}</div>
                            ) : null}
                          </div>
                          <div>
                            <button
                              onClick={() => onDeleteLink(chat.id, l.id)}
                              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", background: "#fff0f0" }}
                            >
                              Smazat
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
