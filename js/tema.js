/* ============================================================
   AGENDA V3 — Tema e cor principal
   Lê/grava em agendaV3:config através de js/storage.js (que
   precisa ser incluído ANTES deste arquivo). "lerConfig" é só
   um nome de apoio — chama obterConfig() de storage.js por
   baixo, pra nenhuma outra tela depender de dois jeitos
   diferentes de acessar a mesma chave.
   ============================================================ */

function lerConfig() {
  return obterConfig();
}

function aplicarTema() {
  const config = lerConfig();
  const tema = config.tema || "escuro";
  const corPrincipal = config.corPrincipal || "roxo";
  document.documentElement.dataset.theme = tema === "claro" ? "light" : "dark";
  document.documentElement.dataset.accent = corPrincipal;
}

function definirTema(tema) {
  const config = lerConfig();
  config.tema = tema;
  salvarConfig(config);
  aplicarTema();
}

function definirCorPrincipal(cor) {
  const config = lerConfig();
  config.corPrincipal = cor;
  salvarConfig(config);
  aplicarTema();
}

const CORES_PRINCIPAIS = [
  { id: "roxo", nome: "Roxo", hex: "#7C3AED" },
  { id: "azul", nome: "Azul", hex: "#2563EB" },
  { id: "ciano", nome: "Ciano", hex: "#0891B2" },
  { id: "verde", nome: "Verde", hex: "#15803D" },
  { id: "rosa", nome: "Rosa", hex: "#DB2777" },
  { id: "vermelho", nome: "Vermelho", hex: "#B91C1C" },
  { id: "dourado", nome: "Dourado", hex: "#B45309" },
  { id: "cinza", nome: "Cinza", hex: "#71717A" },
];

function nomeDoTema(tema) {
  return tema === "claro" ? "Claro" : "Escuro";
}

function nomeDaCor(corId) {
  const cor = CORES_PRINCIPAIS.find((c) => c.id === corId);
  return cor ? cor.nome : "Roxo";
}

aplicarTema();
