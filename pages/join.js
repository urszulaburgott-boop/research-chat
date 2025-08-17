// pages/join.js
import { useEffect, useState } from 'react';
import { getLinkByToken, setNicknameOnLink, createConsent } from '../lib/chatApi';

export default function Join() {
  const [type, setType] = useState('respondent'); // z URL
  const [chatId, setChatId] = useState(null);
  const [token, setToken] = useState(null);
  const [link, setLink] = useState(null);
  const [nickname, setNickname] = useState('');
  const [agreeDpa, setAgreeDpa] = useState(false);
  const [agreeStudy, setAgreeStudy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get('type') || 'respondent';
    const c = p.get('chat');
    const l = p.get('l');
    setType(t);
    setChatId(c);
    setToken(l);
  }, []);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const lk = await getLinkByToken(token);
        if (!lk) { setError('Odkaz nenalezen.'); return; }
        if (lk.chat_id !== chatId) {
          // volitelně můžeme jen přepsat chatId
          setError('Odkaz nepatří k tomuto chatu.');
          return;
        }
        if (lk.role !== type) {
          setError('Odkaz není pro tento typ uživatele.');
          return;
        }
        setLink(lk);
      } catch (e) {
        setError('Odkaz nenalezen.');
      }
    }
    load();
  }, [token, chatId, type]);

  async function onEnter() {
    if (!link) return;
    if (!nickname.trim()) { alert('Zadej přezdívku.'); return; }
    if (!agreeDpa || !agreeStudy) { alert('Musíš odsouhlasit oba body.'); return; }
    await setNicknameOnLink(link.id, nickname.trim());
    await createConsent(link.id, nickname.trim(), true, true);
    // uložím si do session info pro chat
    sessionStorage.setItem('rc_chat_role', link.role);
    sessionStorage.setItem('rc_chat_name', nickname.trim());
    sessionStorage.setItem('rc_link_id', link.id);
    window.location.href = `/chat?chat=${encodeURIComponent(link.chat_id)}`;
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Vstupní brána</h1>
      {error ? (
        <div style={{ padding: 12, border: '1px solid #f0caca', background: '#ffecec', borderRadius: 8 }}>{error}</div>
      ) : !link ? (
        <div>Načítám…</div>
      ) : (
        <div style={{ padding: 12, border: '1px solid #e5e5ef', borderRadius: 8, background: '#fff', maxWidth: 520 }}>
          <div style={{ marginBottom: 10 }}>
            <div><b>Typ:</b> {link.role}</div>
            <div style={{ fontSize: 12, color: '#555' }}>chat_id: {link.chat_id}</div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div>Zadej přezdívku, která se bude zobrazovat v chatu:</div>
            <input
              placeholder="např. JanaK"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{ marginTop: 6, padding: 8, border: '1px solid #ccc', borderRadius: 6, width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label><input type="checkbox" checked={agreeDpa} onChange={(e) => setAgreeDpa(e.target.checked)} /> Souhlasím se zpracováním údajů</label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label><input type="checkbox" checked={agreeStudy} onChange={(e) => setAgreeStudy(e.target.checked)} /> Souhlasím s účastí ve studii</label>
          </div>
          <button onClick={onEnter} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#e6ffe6' }}>
            Vstoupit do chatu
          </button>
        </div>
      )}
    </div>
  );
}
