// components/Layout.js
import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <Link href="/">Domů</Link>
        <Link href="/project">Projekt</Link>
        <div style={{ marginLeft: "auto", opacity: 0.6, fontSize: 12 }}>Research Chat (MVP)</div>
      </header>
      {children}
    </div>
  );
}
