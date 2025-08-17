// pages/join.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import supabase from "../lib/supabaseClient";

export default function JoinGate() {
  const router = useRouter();
  const { isReady, query } = router;
  const type = (query?.type || "").toString();
  const chatId = (query?.chat || "").toString();
  const token = (query?.l || "").toString();

  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReady) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (!token) throw new Error("Token nenalezen v URL (parametr l).");
        const { data, error: e } = await supabase
          .from("chat_links")
          .select("*")
          .eq("token", token)
          .is("deleted_at", null)
          .single();
        if (e) throw e;
        setLink(data);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [isReady, token]);

  return (
    <Layout>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Vstupní brána</h1>
      {loading ? (
        <p>Načítám…</p>
      ) : error ? (
        <p style={{ color: "#b00020" }}>Odkaz nenalezen. ({error})</p>
      ) : !link ? (
        <p>Odkaz nenalezen.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div>Role: <strong>{link.role}</strong>{link.multi ? " (multi)" : ""}</div>
            <div>Podokno: <code>{link.chat_id}</code></div>
          </div>
          <p>Tady bude další logika (přezdívka, souhlasy, vstup do chatu). Prozatím jen ověřujeme, že odkaz existuje.</p>
        </div>
      )}
    </Layout>
  );
}
