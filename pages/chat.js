import Layout from "../components/Layout";

export default function Chat() {
  return (
    <Layout>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Chat – náhled (MVP kostra)</h2>
      <p>Sem později přesuneme plnohodnotný chat z prototypu (UI + logika).</p>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div><strong>Feed:</strong></div>
        <ul>
          <li>10:32 Respondent 1: Dobrý den 🙂</li>
          <li>10:33 Moderátor: Vítejte, děkuji za připojení.</li>
        </ul>
      </div>

      <div style={{ marginTop: 12 }}>
        <input placeholder="Napište zprávu…" style={{ padding: 8, width: "60%", border: "1px solid #ccc", borderRadius: 6 }} />
        <button style={{ marginLeft: 8, padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#e6e6ff" }}>
          Odeslat
        </button>
      </div>
    </Layout>
  );
}
