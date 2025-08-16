import { supabase } from "../lib/supabase";
import * as React from "react";
export default function Debug() {
  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>Debug</h1>
      <Info />
    </div>
  );
}

function Info() {
  const [state, setState] = React.useState({ ok: null, msg: "Checking..." });

  React.useEffect(() => {
    async function run() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const hasUrl = !!url;
        // zkusíme rychlý dotaz (nevadí když je tabulka prázdná)
        const { error } = await supabase.from("projects").select("id").limit(1);
        if (error) throw error;
        setState({ ok: true, msg: `OK (env URL: ${hasUrl ? "present" : "missing"})` });
      } catch (e) {
        setState({ ok: false, msg: e.message || String(e) });
      }
    }
    run();
  }, []);

  return (
    <pre
      style={{
        background: "#f6f8fa",
        padding: 12,
        borderRadius: 8,
        border: "1px solid #eee",
        marginTop: 12,
      }}
    >
      {state.ok === null ? "Running..." : state.ok ? "✅ " : "❌ "} {state.msg}
    </pre>
  );
}
