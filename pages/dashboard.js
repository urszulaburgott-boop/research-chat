import Layout from "../components/Layout";

export default function Dashboard() {
  return (
    <Layout>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Dashboard moderátora (MVP kostra)</h2>
      <p>Sem později přidáme seznam projektů, tlačítko „+ Nový projekt“, počty chatů atd.</p>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <strong>Projekt TEST1</strong>
        <div style={{ fontSize: 14, color: "#333" }}>Počet chatů: 0 • Současně běžící: 0/3</div>
      </div>
    </Layout>
  );
}
