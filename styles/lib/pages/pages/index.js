import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [envOk, setEnvOk] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    setUrl(u);
    setEnvOk(Boolean(u && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Online chat – start (MVP)
      </h1>
      <p>✅ Nasazeno na Vercelu (free). </p>
      <p>{envOk ? "✅ Supabase klíče nalezeny." : "❌ Supabase klíče chybí."}</p>
      <p style={{ marginTop: 8 }}>
        SUPABASE_URL: <code>{url || "(nenastaveno)"}</code>
      </p>

      <hr style={{ margin: "16px 0" }} />

      <p>
        Další krok: přidáme dashboard projektů, podokna a chat. Až potvrdíte, že
        tahle stránka běží, začneme to napojovat.
      </p>
    </main>
  );
}
