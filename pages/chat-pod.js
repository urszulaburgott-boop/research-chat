// pages/chat-pod.js
import { useEffect, useState } from 'react';
import { getChatWindowById, listLinks, createRespondentLink, createClientLink, deleteLink, setLinksDisabled } from '../lib/chatApi';

export default function ChatPod() {
  const [chatId, setChatId] = useState(null);
  const [chat, setChat] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newRespName, setNewRespName] = useState('');
  const [disableLinks, setDisableLinks] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('chat');
    if (c) setChatId(c);
  }, []);

  async function refresh() {
    if (!chatId) return;
    setLoading(true);
    try {
      const w = await getChatWindowById(chatId);
      setChat(w);
      setDisableLinks(!!w?.links_disabled);
      const ls = await listLinks(chatId);
      setLinks(ls);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [chatId]);

  async function onCreateRespondent() {
    await createRespondentLink(chatId, newRespName.trim());
    setNewRespName('');
    await refresh();
  }
  async function onCreateClient() {
    await createClientLink(chatId, 'Klient (multi)');
    await refresh();
  }
  async function onDelete(id) {
    await deleteLink(id);
    await refresh();
  }
  async function onToggleLinksDisabled() {
    const next = !disableLinks;
    setDisableLinks(next);
    await setLinksDisabled(chatId, next);
    await refresh();
  }

  function copy(text) {
    navigator.clipboard?.writeText(text);
    alert('Zkopírováno do schránky.');
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Podokno chatu</h1>
      <div style={{ marginBottom: 12, padding: 12, border: '1px solid #e5e5ef', borderRadius: 8, background: '#fff' }}>
        <div>chat_id: <code>{chatId}</code></div>
        <div style={{ marginTop: 6 }}>
          <a href={`/chat?chat=${encodeURIComponent(chatId)}&as=moderator`} style={{ marginRight: 8 }}>Otevřít chat jako moderátor</a>
          <button onClick={onToggleLinksDisabled} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', background: disableLinks ? '#ffecec' : '#ecffec' }}>
            {disableLinks ? 'Linky jsou vypnuté' : 'Linky jsou zapnuté'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ padding: 12, border: '1px solid #e5e5ef', borderRadius: 8, background: '#fff' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Vytvořit link</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              placeholder="Jméno respondenta (nepovinné)"
              value={newRespName}
              onChange={(e) => setNewRespName(e.target.value)}
              style={{ padding: 6, border: '1px solid #ccc', borderRadius: 6 }}
            />
            <button onClick={onCreateRespondent} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#e6e6ff' }}>
              Vytvořit respondent link
            </button>
            <button onClick={onCreateClient} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#fbe6ff' }}>
              Vytvořit klient link (multi)
            </button>
          </div>
        </div>

        <div style={{ padding: 12, border: '1px solid #e5e5ef', borderRadius: 8, background: '#fff' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Linky</div>
          {loading && <div>Načítám…</div>}
          {!loading && links.length === 0 && <div style={{ color: '#666' }}>Zatím žádné linky.</div>}
          {!loading && links.map((l) => (
            <div key={l.id} style={{ padding: 10, border: '1px solid #eee', borderRadius: 8, marginBottom: 8 }}>
              <div><b>{l.role}</b> — interní jméno: {l.internal_name || <i>(—)</i>} {l.nickname ? <>| přezdívka: <b>{l.nickname}</b></> : null}</div>
              <div style={{ fontSize: 12, color: '#555' }}>token: {l.token}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a href={l.url} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', textDecoration: 'none' }}>
                  Otevřít bránu
                </a>
                <button onClick={() => copy(l.url)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }}>
                  Kopírovat
                </button>
                <button onClick={() => onDelete(l.id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccaaaa', background: '#ffecec' }}>
                  Smazat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
