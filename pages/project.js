import Layout from "../components/Layout";

export default function Project() {
  return (
    <Layout>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Projekt – nastavení (MVP kostra)</h2>
      <ul style={{ marginTop: 12 }}>
        <li>✅ Checkboxy: Zobrazovat DPA / Zobrazovat Souhlas s účastí</li>
        <li>✅ Editace textů DPA / Souhlasu</li>
        <li>✅ Přepínače: Emoji / GIFy / Přílohy / Ukládání metadat</li>
        <li>✅ Podokna chatů – seznam a tlačítko „Přidat podokno“</li>
      </ul>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div><strong>Podokna chatu v projektu</strong></div>
        <div style={{ fontSize: 14, color: "#333" }}>Zatím žádná – přidáme po napojení na databázi.</div>
      </div>
    </Layout>
  );
}
