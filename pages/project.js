// pages/project.js
import { useEffect, useState } from 'react';
import { listChatWindows, createChatWindow, renameChatWindow } from '../lib/chatApi';

export default function Project() {
  // PRO JEDNODUCHOST: ID projektu si tu „natvrdo“ držíme v localStorage.
  // Pokud ho nemáš, dej si do URL ?project=<uuid> jednou a my si ho uložíme.
  const [projectId, setProjectId] = useState(null);
  const [chatWindows, setChatWindows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameMap, setRenameMap] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('project');
    const saved = window.localStorage.getItem('project_id');
    if (q) {
      window.localStorage.setItem('project_id', q);
      setProjectId(q);
    } else if (saved) {
      setProjectId(saved);
    }
  }, []);

  async function refresh() {
    if (!projectId) return;
    setLoading(true);
    try {
      const rows = await listChatWindows(projectId);
      setChatWindows(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [projectId]);

  async function onCreate() {
    if (!projectId) { alert('Chybí project_id (předej jednou ?project=<uuid> v URL).'); return; }
    await createChatWindow(projectId);
    await refresh();
  }

  async function onRename(id) {
    const val = renameMap[id];
    if (!val) return;
    await renameChatWindow(id, val);
    setRenameMap(m => ({ ...m, [id]: '' }));
    await refresh();
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Projekt</h1>
      <div style={{ marginBottom: 16, padding: 12, border: '1px solid #e5e5ef', borderRadius: 8, background: '#fff' }}>
        <div>Project ID: <code>{projectId || '(není nastaveno)'}</code></div>
        <div style={{ marginTop: 8 }}>
          <button onClick={onCreate} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#e6e6ff' }}>
            Přidat podokno
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {loading && <div>Načítám…</div>}
        {!loading && chatWindows.map(w => (
          <div key={w.id} style={{ padding: 12, border: '1px solid #e5e5ef', borderRadius: 8, background: '#fff' }}>
            <div style={{ fontWeight: 600 }}>{w.title || '(bez názvu)'}</div>
            <div style={{ fontSize: 12, color: '#555' }}>chat_id: {w.id}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href={`/chat-pod?chat=${encodeURIComponent(w.id)}`} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#f3f3ff', textDecoration: 'none' }}>
                Otevřít podokno
              </a>
              <a href={`/chat?chat=${encodeURIComponent(w.id)}&as=moderator`} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#f3fff3', textDecoration: 'none' }}>
                Otevřít chat jako moderátor
              </a>
            </div>
            <div style={{ marginTop: 8 }}>
              <input
                placeholder="přejmenovat…"
                value={renameMap[w.id] || ''}
                onChange={(e) => setRenameMap(m => ({ ...m, [w.id]: e.target.value }))}
                style={{ padding: 6, border: '1px solid #ccc', borderRadius: 6 }}
              />
              <button onClick={() => onRename(w.id)} style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }}>
                Uložit název
              </button>
            </div>
          </div>
        ))}
        {!loading && chatWindows.length === 0 && (
          <div style={{ color: '#666' }}>Zatím žádná podokna.</div>
        )}
      </div>
    </div>
  );
}
