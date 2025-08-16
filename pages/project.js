import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { listProjects } from "../lib/projectsApi";
import { listChatWindows, createChatWindow, renameChatWindow } from "../lib/chatApi";

export default function Project() {
  const router = useRouter();
  const projectId = (router.query.id || "").toString();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [pods, setPods] = useState([]);
  const [newPodName, setNewPodName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  async function load() {
    if (!projectId) return;
    setLoading(true);
    try {
      const projs = await listProjects();
      const p = projs.find(x => x.id === projectId) || null;
      setProject(p);
      const arr = await listChatWindows(projectId);
      setPods(arr);
    } catch (e) {
      alert("Chyba při načítání projektu: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [projectId]);

  async function addPod() {
    try {
      const pod = await createChatWindow(projectId, newPodName || "Nové podokno");
      setPods(prev => [...prev, pod]);
      setNewPodName("");
    } catch (e) {
      alert("Chyba při vytváření podokna: " + e.message);
    }
  }

  async function saveRename() {
    try {
      const updated = await renameChatWindow(editId, editName || "Bez názvu");
      setPods(prev => prev.map(x => x.id === updated.id ? updated : x));
      setEditId(null); setEditName("");
    } catch (e) {
      alert("Chyba při přejmenování podokna: " + e.message);
    }
  }

  return (
    <Layout>
      {!projectId ? (
        <p>Chybí parametr <code>?id=...</code> v URL.</p>
      ) : loading ? (
        <p>Načítám…</p>
      ) : !project ? (
        <p>Projekt nenalezen.</p>
      ) : (
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Projekt: {project.name}</h2>

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <input
              value={newPodName}
              onChange={(e) => setNewPodName(e.target.value)}
              placeholder="Název nového podokna"
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
            />
            <button
              onClick={addPod}
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6e6ff" }}
            >
              + Přidat podokno
            </button>
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {pods.length === 0 && <div>Zatím žádná podokna.</div>}
            {pods.map(p => (
              <div key={p.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
                {editId === p.id ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
                    />
                    <button onClick={saveRename} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}>
                      Uložit
                    </button>
                    <button onClick={() => { setEditId(null); setEditName(""); }} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}>
                      Zrušit
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#333" }}>
                      Termín: {p.date_str || "(nenastaveno)"}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a href={`/chat-pod?id=${encodeURIComponent(p.id)}`} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", textDecoration: "none" }}>
                        Otevřít podokno
                      </a>
                      <button onClick={() => { setEditId(p.id); setEditName(p.name); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}>
                        Přejmenovat
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <a href="/dashboard" style={{ textDecoration: "underline" }}>← Zpět na Dashboard</a>
          </div>
        </>
      )}
    </Layout>
  );
}
