// pages/chat-pod.js
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import supabase from "../lib/supabaseClient";

function makeBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  // fallback pro build
  return "https://research-chat-mu.vercel.app";
}
function rndToken() {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}
function buildJoinUrl(type, chatId, token) {
  const base = makeBaseUrl();
  const u = new URL(`${base}/join`);
  u.searchParams.set("type", type);
  u.searchParams.set("chat", chatId);
  u.searchParams.set("l", token);
  return u.toString();
}

export default function ChatPodManager() {
  const router = useRouter();
  const { id: chatId } = router.query;

  const [chat, setChat] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const nextRespLabel = useMemo(() => {
    const count = links.filter((l) => l.role === "respondent").length;
    return `Respondent ${count + 1}`;
  }, [links]);

  useEffect(() => {
    if (!chatId) return;
    (async () => {
      try {
        setLoading(true);
        setError("");

        // načti podokno
        const { data: cw, error: eCw } = await supabase
          .from("chat_windows")
          .select("*")
          .eq("id", chatId)
          .is("deleted_at", null)
          .single();
        if (eCw) throw eCw;
        setChat(cw);

        // načti linky
        const { data: lk, error: eLk } = await supabase
          .from("chat_links")
          .select("*")
          .eq("chat_id", chatId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });
        if (eLk) throw eLk;
        setLinks(lk || []);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [chatId]);

  async function createLink(role, label, multi) {
    try {
      setBusy(true);
      setError("");

      const token = rndToken();
      const url = buildJoinUrl(role, chatId, token);

      const { data, error: e } = await supabase
        .from("chat_links")
        .insert([
          {
            chat_id: chatId,
            role,
            internal_name: label,
            url,
            token,
            nickname: "",
            multi: !!multi,
          },
        ])
        .select()
        .single();
      if (e) throw e;

      setLinks((prev) => [...prev, data]);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  function copy(text) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert("Zkopírováno.");
    }
  }

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
          Podokno: {chat ? chat.title || chat.id : chatId || "—"}
        </h1>
        <button
          onClick={() => createLink("respondent", nextRespLabel, false)}
          disabled={busy || !chatId}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: busy ? "#f2f2f2" : "#e6ffe6",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Pracuji…" : "Vytvořit odkaz pro respondenta"}
        </button>
        <button
          onClick={() => createLink("client", "Klient (multi)", true)}
          disabled={busy || !chatId}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: busy ? "#f2f2f2" : "#e6f0ff",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Pracuji…" : "Vytvořit odkaz pro klienta"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "#b00020" }}>Chyba: {error}</div>
      )}

      {loading ? (
        <p style={{ marginTop: 16 }}>Načítám…</p>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {links.length === 0 ? (
            <p>Zatím tu nejsou žádné odkazy. Vytvoř si je tlačítky nahoře.</p>
          ) : (
            links.map((l) => (
              <div
                key={l.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 12,
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 6px",
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      background: l.role === "client" ? "#eef5ff" : "#eeffee",
                    }}
                  >
                    {l.role}
                  </span>
                  <strong>{l.internal_name || "—"}</strong>
                  {l.multi ? (
                    <span style={{ fontSize: 12, color: "#666" }}>
                      (multi)
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>ID: {l.id}</div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    value={l.url || ""}
                    readOnly
                    style={{
                      flex: 1,
                      minWidth: 280,
                      padding: 6,
                      border: "1px solid #ccc",
                      borderRadius: 6,
                    }}
                  />
                  <button
                    onClick={() => copy(l.url)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      background: "#fff",
                    }}
                  >
                    Kopírovat
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
}
