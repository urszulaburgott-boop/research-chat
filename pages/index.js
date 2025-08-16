import Link from "next/link";
import Layout from "../components/Layout";

export default function Home() {
  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Aplikace běží 🎉</h1>
      <p>Teď přidáme jednoduchou kostru obrazovek.</p>

      <ul style={{ marginTop: 16, lineHeight: 1.8 }}>
        <li><Link href="/dashboard">→ Dashboard moderátora</Link></li>
        <li><Link href="/project">→ Náhled projektu</Link></li>
        <li><Link href="/chat">→ Náhled chatu</Link></li>
        <li><Link href="/join?type=respondent">→ Brána respondenta</Link></li>
        <li><Link href="/join?type=client">→ Brána klienta</Link></li>
      </ul>
    </Layout>
  );
}
