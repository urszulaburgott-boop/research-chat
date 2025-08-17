// pages/chat.js
import { useEffect, useRef, useState } from 'react';
import { listMessages, sendMessage, subscribeMessages, listLinks } from '../lib/chatApi';

export default function Chat() {
  const [chatId, setChatId] = useState(null);
  const [role, setRole] = useState('guest'); // 'moderator' | 'respondent' | 'client'
  const [name, setName] = useState('');      // z brány nebo "Moderátor"
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [participants, setParticipants] = useState([]);
  const [recipientLinkId, setRecipientLinkId] = useState(''); // jen pro moderátora (DM)
  const unsubRef = useRef(null);

  useEffect(() => {
    const ps = new URLSearchParams(window.location.search);
    const c = ps.get('chat');
    setChatId(c || null);

    // Kdo jsem:
    const as = ps.get('as'); // pokud je ?as=moderator → moderátor
    if (as === 'moderator') {
      setRole('moderator');
      setName('Moderátor');
      sessionStorage.setItem('rc_chat_role', 'moderator');
      sessionStorage.setItem('rc_chat_name', 'Moderátor');
      sessionStorage.removeItem('rc_link_id'); // moderátor nemá link
    } else {
      const r = sessionStorage.getItem('rc_chat_role');
      const n = sessionStorage.getItem('rc_chat_name');
      setRole(r || 'guest');
      setName(n || '');
    }
  }, []);

  async function refreshAll() {
    if (!chatId) return;
    const ms = await listMessages(chatId);
    setMessages(ms);
    if (role === 'moderator') {
      const ls = await listLinks(chatId);
      setParticipants(ls);
    } else {
      setParticipants([]); // skryto pro respondent/klient
    }
  }

  useEffect(() => {
    refreshAll();
    if (!chatId) return;
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    const unsub = subscribeMessages(chatId, (m) => {
      setMessages(prev => [...prev, m]);
    });
    unsubRef.current = unsub;
    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  async function onSend() {
    if (!text.trim()) return;
    const payload = {
      chatId,
      senderRole: role,
      senderName: name || (role === 'moderator' ? 'Moderátor' : ''),
      content: text.trim(),
      recipientLinkId: role === 'moderator' && recipientLinkId ? recipientLinkId : null,
    };
    await sendMessage(payload);
    setText('');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: role === 'moderator' ? '240px 1fr' : '1fr', gap: 12 }}>
      {role === 'moderator' && (
        <div style={{ padding: 12, border: '1px solid #e5e5ef', borderRadius: 8, background: '#fff' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Účastníci</div>
          {participants.length === 0 ? (
            <div style={{ color: '#666' }}>Zatím nikdo</div>
          ) : participants.map(p => (
            <div key={p.id} style={{ padding: '6px 8px', border: '1px solid #eee', borderRadius: 6, marginBottom: 6 }}>
              <div style={{ fontWeight: 600 }}>{p.internal_name || '(respondent)'} {p.nickname ? `• ${p.nickname}` : ''}</div>
              <div style={{ fontSize: 12, color: '#555' }}>{p.role}</div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #eee', marginTop: 8, paddingTop: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Soukromá zpráva (DM):</div>
            <select value={recipientLinkId} onChange={(e) => setRecipientLinkId(e.target.value)} style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 6 }}>
              <option value="">— veřejná zpráva —</option>
              {participants.filter(p => p.role === 'respondent').map(p => (
                <option key={p.id} value={p.id}>{(p.nickname || p.internal_name || 'Respondent')}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div style={{ padding: 12, border: '1px solid #e5e5ef', borderRadius: 8, background: '#fff' }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <div><b>Chat</b> • {role}{name ? ` (${name})` : ''}</div>
          <div style={{ fontSize: 12, color: '#555' }}>chat_id: {chatId}</div>
        </div>

        <div style={{ height: 380, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8, background: '#fafafe' }}>
          {messages.length === 0 ? (
            <div style={{ color: '#666' }}>Zatím žádné zprávy.</div>
          ) : messages.map(m => (
            <div key={m.id} style={{ marginBottom: 8, padding: 8, background: '#fff', border: '1px solid #eee', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#777' }}>
                <b>{m.sender_role}</b> {m.sender_name ? `• ${m.sender_name}` : ''} {m.recipient_link_id ? '• (DM)' : ''}
              </div>
              <div>{m.content}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{new Date(m.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Napiš zprávu…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
          />
          <button onClick={onSend} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#e6e6ff' }}>
            Odeslat
          </button>
        </div>
      </div>
    </div>
  );
}
