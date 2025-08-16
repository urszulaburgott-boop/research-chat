import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, 'Source Sans Pro', Arial, sans-serif", color:"#000", background:"#fff" }}>
      <header style={{ padding: "8px 16px", borderBottom: "1px solid #ddd", display:"flex", gap:8, flexWrap:"wrap" }}>
        <Link href="/" style={{ textDecoration: "underline" }}>Domů</Link>
        <Link href="/dashboard" style={{ textDecoration: "underline" }}>Dashboard</Link>
        <Link href="/project" style={{ textDecoration: "underline" }}>Projekt</Link>
        <Link href="/chat" style={{ textDecoration: "underline" }}>Chat</Link>
        <Link href="/join?type=respondent" style={{ textDecoration: "underline" }}>Brána respondenta</Link>
        <Link href="/join?type=client" style={{ textDecoration: "underline" }}>Brána klienta</Link>
      </header>
      <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
