/* ============================================================
   AGENDA V3 — Tela Mais
   Cartão do topo (nome + plano) usa dados reais de agendaV3:config
   (nomeProfissional já vem do Onboarding) -- iniciais no mesmo padrão
   de js/perfil.js (iniciaisCliente).
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const config = obterConfig();
  const nome = config.nomeProfissional || "";
  qs("#js-mais-avatar").textContent = nome ? iniciaisCliente(nome) : "?";
  qs("#js-mais-nome").textContent = nome || "Nome não cadastrado";
  qs("#js-mais-plano").textContent = config.assinaturaStatus === "gratuito" ? "Plano Gratuito" : "Plano Pro";
});
