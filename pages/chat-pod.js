import * as React from "react";
import Layout from "../components/Layout";

export default function ChatPodPage() {
  // Všechno, co používá React hooky, musí být uvnitř komponenty (tady)
  // Nevoláme žádné hooky mimo tuto funkci.

  return (
    <Layout>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
        Podokno chatu
      </h2>
      <p>Stránka se načetla. Funkce postupně přidáme zpátky.</p>
    </Layout>
  );
}
