import { useRouter } from "next/router";
import Layout from "../components/Layout";

export default function Join() {
  const router = useRouter();
  const type = (router.query.type || "respondent").toString();

  return (
    <Layout>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>
        {type === "client" ? "Brána klienta" : "Brána respondenta"}
      </h2>

      {type === "respondent" ? (
        <div style={{ marginTop: 12 }}>
          <p>
            Uveďte Vaše křestní jméno nebo přezdívku, která se bude
            zobrazovat v konverzaci:
          </p>
          <input
            placeholder="Zadejte přezdívku"
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
          <div style={{ marginTop: 12 }}>
            <button
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
                background: "#e6e6ff",
              }}
            >
              Vstoupit do konverzace
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <p>Stisknutím tlačítka vstupte do chatu.</p>
          <button
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#e6e6ff",
            }}
          >
            Vstoupit do chatu
          </button>
        </div>
      )}
    </Layout>
  );
}
