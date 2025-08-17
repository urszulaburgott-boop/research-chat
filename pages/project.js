// pages/project.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import supabase from "../lib/supabaseClient"; // musí existovat lib/supabaseClient.js

export default function ProjectPage() {
  const router = useRouter();
  const { id: projectId } = router.query;

  const [project, setProject] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Načtení projektu + podoken
  useEffect(() => {
    if (!projectId) return;

    async function loadAll() {
      try {
        setLoading(true);
        setError("");

        // projekt
        const { data: proj, error: eProj } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .is("deleted_at", null)
          .single();
        if (eProj) throw eProj;
        setProject(proj);

        // podokna
        const { data: cw, error: eCw } = await supabase
          .from("chat_windows")
          .select("*")
          .eq("project_id", projectId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });
        if (eCw) throw eCw;

        setChats(cw || []);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [projectId]);

  async function createChatWindow() {
    try {
      setCreating(true);
      setError("");

      const title = `Podokno ${chats.length + 1}`;
      const { data, error: e } = await supabase
        .from("chat_windows")
        .insert([
          {
            project_id: projectId,
            title,
            // volitelné sloupce – pokud je v DB nemáš, klidně smaž:
            links_disabled: false,
            chat_date: null,
          },
        ])
        .select()
        .single();

      if (e) throw e;

      // Přidej do seznamu a rovnou můžeš otevřít detail
      setChats((prev) => [...prev, data]);
      // router.push(`/chat-pod?id=${data.id}`); // pokud chceš po vytvoření hned otevřít
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setCreating(false);
    }
  }

  function openChat(c) {
    router.push(`/chat-pod?id=${c.id}`);
  }

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          Projekt: {project ? project.name || project.id : projectId || "—"}
        </h1>
        <button
          onClick={createChatWindow}
          disabled={creating || !projectId}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: creating ? "#f2f2f2" : "#e6ffe6",
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "Vytvářím…" : "Přidat podokno"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "#b00020" }}>
          Chyba: {error}
        </div>
      )}

      {loading ? (
        <p style={{ marginTop: 16 }}>Načítám…</p>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {chats.length === 0 ? (
            <p>Žádná podokna zatím nejsou. Klikni na „Přidat podokno“.</p>
          ) : (
            chats.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{c.title || c.id}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{c.id}</div>
                </div>
                <button
                  onClick={() => openChat(c)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    background: "#eef",
                  }}
                >
                  Otevřít
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
}
