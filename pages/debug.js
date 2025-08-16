import Layout from "../components/Layout";
import { supabase } from "./supabase";

export default function DebugPage(props) {
  return (
    <Layout>
      <h2>Debug Supabase</h2>
      <pre style={{ whiteSpace: "pre-wrap", background:"#f7f7f7", padding:12, borderRadius:8 }}>
{JSON.stringify(props, null, 2)}
      </pre>
      <p>Pokud <code>envOk</code> není <code>true</code>, zkontrolujte Vercel Environment Variables.</p>
    </Layout>
  );
}

export async function getServerSideProps() {
  const haveUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const haveKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let listOk = null;
  let listError = null;
  if (haveUrl && haveKey) {
    try {
      const { data, error } = await supabase.from("projects").select("*").limit(3);
      if (error) throw error;
      listOk = data || [];
    } catch (e) {
      listError = e.message;
    }
  }
  return {
    props: {
      envOk: haveUrl && haveKey,
      haveUrl, haveKey,
      listOk, listError
    }
  };
}
