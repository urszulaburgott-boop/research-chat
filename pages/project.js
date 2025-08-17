// pages/project.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import supabase from "../lib/supabaseClient";

export default function ProjectPage() {
  const router = useRouter();
  const { isReady, query } = router;
  const projectId = query?.id;

  const [project, setProject] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function loadAll(pid) {
    setError("");
    setLoading(true);
    try {
      const { data: proj, error: eProj } = await supabase
        .from("projects")
        .select("*")
        .eq("id", pid)
        .is("deleted_at", null)
        .single();
      if (eProj) throw eProj;
      setProject(proj);

      const { data: cw, error: eCw } = await supabase
        .from("chat_windows")
        .select("*")
        .eq("project_id", pid)
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

  useEffect(() => {
    if (!isReady || !projectId) return;
    loadAll(projectId);
  }, [isReady, projectId]);

  async function createChatWindow() {
    if (!projectId) return;
    setCreating(true);
    setError("");
    try {
      const title = `Podokno ${chats.length + 1}`;
      const { data, error: e } = await supabase
        .from("chat_windows")
        .insert([{ project_id: projectId, title }]) // jen tyto sloupce
        .select()
        .single();
      if (e) throw e;

      setChats((prev) => [...prev, data]);
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
