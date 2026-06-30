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

function extrairAniversario(texto) {
  const partes = (texto || "").split("/");
  if (partes.length < 2) return { dia: null, mes: null };
  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10);
  return { dia: isNaN(dia) ? null : dia, mes: isNaN(mes) ? null : mes };
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

function mostrarSucesso() {
  const overlay = document.createElement("div");
  overlay.className = "sucesso-overlay";
  overlay.innerHTML = `
    <div class="sucesso-overlay__circulo">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 900);
}

function classePosicaoRanking(posicao) {
  if (posicao === 1) return "ranking-posicao--ouro";
  if (posicao === 2) return "ranking-posicao--prata";
  if (posicao === 3) return "ranking-posicao--bronze";
  return "";
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

const MESES_NOME_UTILS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function formatarDesdeCadastro(isoDate) {
  if (!isoDate) return "data de cadastro não disponível";
  const [ano, mes] = isoDate.split("-");
  return `desde ${MESES_NOME_UTILS[parseInt(mes, 10) - 1]} ${ano}`;
}

function montarLinhaCliente(cliente, indice, modoSubtitulo = "padrao") {
  const stats = estatisticasCliente(cliente.id);
  const linha = document.createElement("a");
  linha.href = `cliente-detalhe.html?id=${cliente.id}`;
  linha.className = "list-item";
  linha.style.textDecoration = "none";
  linha.style.color = "inherit";
  linha.innerHTML = `
    <div class="avatar-wrap">
      <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    </div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle"></p>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(cliente.nome);
  linha.querySelector(".list-item__title").textContent = cliente.nome;

  if (modoSubtitulo === "cadastro") {
    linha.querySelector(".list-item__subtitle").textContent = formatarDesdeCadastro(cliente.criadoEm);
    return linha;
  }

  const visitasTexto = `${stats.visitas} visita${stats.visitas === 1 ? "" : "s"}`;
  linha.querySelector(".list-item__subtitle").textContent =
    stats.ultimaVisitaDias === null
      ? "ainda sem atendimentos"
      : stats.ultimaVisitaDias === 0
      ? `última visita hoje · ${visitasTexto}`
      : `última visita há ${stats.ultimaVisitaDias} dia${stats.ultimaVisitaDias === 1 ? "" : "s"} · ${visitasTexto}`;
  return linha;
}
