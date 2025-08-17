// pages/project.js
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getProjectIdFromAnywhere,
  setProjectIdLocal,
  getProjectById,
  listChatWindows,
  createChatWindow,
  renameChatWindow,
} from "../lib/chatApi";
import Link from "next/link";

export default function ProjectPage() {
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState(null);
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    const id = getProjectIdFromAnywhere();
    if (id) {
      setProjectId(id);
      loadAll(id);
    }
  }, []);

  async function loadAll(id) {
    try {
      setLoading(true);
      const p = await getProjectById(id);
      const w = await listChatWindows(id);
      setProject(p);
      setPods(w);
    } catch (e) {
      console.error(e);
      setProject(null);
      setPods([]);
    } finally {
      setLoading(false);
    }
  }

  async function onSaveProjectId() {
    if (!projectId) return;
    setProjectIdLocal(projectId);
    await loadAll(projectId);
  }

  async function onAddPod() {
    if (!projectId) {
      alert("Zadej Project ID a ulož ho.");
      return;
    }
    try {
      setLoading(true);
      const pod = await createChatWindow(projectId, newTitle || "Podokno");
      setNewTitle("");
      await loadAll(projectId);
    } catch (e) {
      alert("Chyba při vytváření podokna: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onRename(id) {
    const name = prompt("Nový název podokna:");
    if (!name) return;
    try {
      await renameChatWindow(id, name);
      await loadAll(projectId);
    } catch (e) {
      alert("Chyba přejmenování: " + e.message);
    }
  }

  return (
    <Layout>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Projekt</h1>

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <label>Project ID (UUID z tabulky <em>projects</em>)</label>
        <input
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <div>
          <button onClick={onSaveProjectId} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}>
            Uložit Project ID
          </button>
        </div>
      </div>

      {loading && <p>Načítám…</p>}
      {project && (
        <div style={{ marginBottom: 16, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <div><b>Název projektu:</b> {project.name || "(bez názvu)"}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>id: {project.id}</div>
        </div>
      )}

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>Podokna</h2>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0 16px" }}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Název podokna (volitelné)"
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, flex: 1 }}
        />
        <button onClick={onAddPod} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}>
          Přidat podokno
        </button>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {pods.map((p) => (
          <div key={p.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <b>{p.title || "(bez názvu)"}</b>
              <span style={{ fontSize: 12, opacity: 0.7 }}>id: {p.id}</span>
              <button onClick={() => onRename(p.id)} style={{ marginLeft: "auto", padding: "4px 8px" }}>
                Přejmenovat
              </button>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={`/chat-pod?chat=${p.id}`} style={{ textDecoration: "underline" }}>
                Správa podokna (linky)
              </Link>
              <Link href={`/chat?chat=${p.id}&role=moderator`} style={{ textDecoration: "underline" }}>
                Otevřít chat jako moderátor
              </Link>
            </div>
          </div>
        ))}
        {pods.length === 0 && !loading && <div>Žádná podokna zatím nejsou.</div>}
      </div>
    </Layout>
  );
}
