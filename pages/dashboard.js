import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { listProjects, createProject, renameProject, softDeleteProject } from "../lib/projectsApi";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listProjects();
      setProjects(rows);
    } catch (e) {
      alert("Chyba při načítání projektů: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function addProject() {
    try {
      const p = await createProject(newName || "Nový projekt");
      setNewName("");
      setProjects((prev) => [...prev, p]);
    } catch (e) {
      alert("Chyba při vytváření projektu: " + e.message);
    }
  }

  async function saveRename() {
    try {
      const p = await renameProject(editingId, editingName || "Bez názvu");
      setProjects((prev) => prev.map(x => x.id === p.id ? p : x));
      setEditingId(null);
      setEditingName("");
    } catch (e) {
      alert("Chyba při přejmenování: " + e.message);
    }
  }

  async function removeProject(id) {
    if (!confirm("Opravdu chcete smazat projekt?")) return;
    try {
      await softDeleteProject(id);
      setProjects((prev) => prev.filter(x => x.id !== id));
    } catch (e) {
      alert("Chyba při mazání: " + e.message);
    }
  }

  return (
    <Layout>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Dashboard moderátora</h2>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Název nového projektu"
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <button
          onClick={addProject}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6e6ff" }}
        >
          + Nový projekt
        </button>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>Načítám…</p>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {projects.length === 0 && <div>Žádné projekty zatím nevytvořeny.</div>}
          {projects.map((p) => (
            <div key={p.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
              {editingId === p.id ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
                  />
                  <button onClick={saveRename} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}>
                    Uložit
                  </button>
                  <button onClick={() => { setEditingId(null); setEditingName(""); }} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}>
                    Zrušit
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#333" }}>ID: {p.id}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditingId(p.id); setEditingName(p.name); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}>
                      Přejmenovat
                    </button>
                    <button onClick={() => removeProject(p.id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", background: "#ffe5d6" }}>
                      Smazat
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
