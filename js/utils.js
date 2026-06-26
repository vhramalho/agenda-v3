/* ============================================================
   AGENDA V3 — Utilitários gerais
   ============================================================ */

function qs(seletor, escopo) {
  return (escopo || document).querySelector(seletor);
}

function qsa(seletor, escopo) {
  return Array.from((escopo || document).querySelectorAll(seletor));
}

/**
 * Busca um componente HTML (components/*.html) e injeta dentro do
 * elemento alvo. Requer servidor local (file:// puro bloqueia fetch
 * por CORS) — use "Abrir com Live Server" ou rode `npx serve`.
 */
async function loadComponent(seletorAlvo, caminho) {
  const alvo = qs(seletorAlvo);
  if (!alvo) return null;
  const resposta = await fetch(caminho);
  const html = await resposta.text();
  alvo.innerHTML = html;
  return alvo;
}

function formatarMoeda(valor) {
  return (valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataCurta(isoDate) {
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}

function gerarGradeHorarios(horaInicio, horaFim, intervaloGrade) {
  const grade = [];
  let [h, m] = horaInicio.split(":").map(Number);
  const [hf, mf] = horaFim.split(":").map(Number);
  while (h < hf || (h === hf && m <= mf)) {
    grade.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += intervaloGrade;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
  }
  return grade;
}

function somarMinutos(hora, minutos) {
  let [h, m] = hora.split(":").map(Number);
  m += minutos;
  h += Math.floor(m / 60);
  m = ((m % 60) + 60) % 60;
  h = h % 24;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hojeIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function extrairValor(texto) {
  const limpo = (texto || "").replace(/[^\d,.-]/g, "").replace(",", ".");
  const numero = parseFloat(limpo);
  return isNaN(numero) ? null : numero;
}

function estatisticasCliente(clienteId) {
  const realizados = obterAgendamentos().filter(
    (a) => a.clienteId === clienteId && a.status && a.status.startsWith("realizado_")
  );
  const visitas = realizados.length;
  const totalGasto = realizados.reduce((soma, a) => soma + (a.valorTotal || 0), 0);
  let ultimaVisitaDias = null;
  if (visitas > 0) {
    const maisRecente = realizados.reduce((max, a) => (a.data > max ? a.data : max), realizados[0].data);
    const diffMs = new Date() - new Date(`${maisRecente}T00:00:00`);
    ultimaVisitaDias = Math.max(0, Math.floor(diffMs / 86400000));
  }
  return { visitas, totalGasto, ultimaVisitaDias };
}

function classeAvatarPorIndice(indice) {
  const classes = ["", "list-item__avatar--c2", "list-item__avatar--c3", "list-item__avatar--c4", "list-item__avatar--c5"];
  return classes[indice % classes.length];
}

function iniciaisCliente(nome) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0] ? partes[0][0] : "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}
