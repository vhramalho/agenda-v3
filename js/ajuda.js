/* ============================================================
   AGENDA V3 — Sistema de ajuda contextual (tour + dicas avulsas)
   Motor genérico chamado por qualquer tela informando só o seu
   identificador — nenhuma tela tem lógica própria de ajuda.

   Mecânica ("spotlight"): um fundo escuro (.tour-fundo) cobre a
   tela inteira, real element (.tour-alvo) some por cima dele com
   z-index maior — sempre nítido, mesmo dentro de listas com scroll
   (nada de box-shadow tentando "vazar" pra fora de um container com
   overflow, que fica cortado nas bordas dele). Uma legenda curta
   (nunca um parágrafo) aparece perto do elemento. Toque em qualquer
   lugar avança/encerra — sem botão "Pular" (o tour é curto o
   bastante pra não precisar de uma saída explícita).

   iniciarTour(tela)   — roda só 1x, na primeira visita (auto).
   reiniciarTour(tela) — repete o tour sob demanda (botão "?").
   mostrarDicaSpotlight(tela, chave, elementoAncora) — dica avulsa
   independente do tour, disparada por uma ação real (ex.: criar o
   2º agendamento), mesma mecânica, some sozinha 1x por chave.
   ============================================================ */

let ajudaTelaAtual = null;
let ajudaPassoAtual = -1;
let ajudaElementoAceso = null;
let ajudaAoClicar = null;

function ajudaCliqueGlobal(evento) {
  evento.preventDefault();
  evento.stopPropagation();
  if (ajudaAoClicar) ajudaAoClicar();
}

function ajudaEscutarClique(fn) {
  ajudaAoClicar = fn;
  // Sem atraso: adicionar o listener aqui é sempre síncrono dentro do
  // próprio clique que abriu este passo (ou fora de qualquer clique, no
  // caso do iniciarTour via DOMContentLoaded) — a fase de captura em
  // #document já passou pra esse evento específico, então o listener novo
  // só vale a partir do PRÓXIMO clique, nunca se auto-dispara.
  document.addEventListener("click", ajudaCliqueGlobal, true);
}

function ajudaLimpar() {
  if (ajudaElementoAceso) ajudaElementoAceso.classList.remove("tour-alvo");
  ajudaElementoAceso = null;
  ajudaAoClicar = null;
  qsa(".tour-fundo, .tour-legenda, .tour-pontos, .tour-dedo, .tour-seta").forEach((el) => el.remove());
  document.removeEventListener("click", ajudaCliqueGlobal, true);
}

function ajudaMostrarFundo() {
  const fundo = document.createElement("div");
  fundo.className = "tour-fundo";
  document.body.appendChild(fundo);
}

function ajudaPosicionarLegenda(legendaEl, alvoEl) {
  const rect = alvoEl.getBoundingClientRect();
  const largura = legendaEl.offsetWidth;
  let esquerda = rect.left + rect.width / 2 - largura / 2;
  esquerda = Math.max(12, Math.min(esquerda, window.innerWidth - largura - 12));
  const espacoAbaixo = window.innerHeight - rect.bottom;
  legendaEl.style.top = espacoAbaixo > 120 || rect.top < 120
    ? `${rect.bottom + 12}px`
    : `${rect.top - legendaEl.offsetHeight - 12}px`;
  legendaEl.style.left = `${esquerda}px`;
}

function ajudaMostrarPontos(total, indice) {
  const pontos = document.createElement("div");
  pontos.className = "tour-pontos";
  for (let i = 0; i < total; i++) {
    const p = document.createElement("span");
    p.className = "tour-ponto" + (i === indice ? " is-ativo" : "");
    pontos.appendChild(p);
  }
  document.body.appendChild(pontos);
}

function ajudaCriarGesto(alvoEl) {
  const dedo = document.createElement("div");
  dedo.className = "tour-dedo";
  dedo.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 12.5V5.5a1.4 1.4 0 0 1 2.8 0v6"/>
    <path d="M11.8 11.3V4a1.4 1.4 0 0 1 2.8 0v7.3"/>
    <path d="M14.6 11.3V6a1.4 1.4 0 0 1 2.8 0v7.7"/>
    <path d="M9 12.5c0-1.1-.9-2-2-2s-2 .9-2 2c0 3.6 1.2 8.8 6.2 8.8H13c3.2 0 5.4-2.4 5.4-5.8v-2.2"/>
  </svg>`;
  const setaEsq = document.createElement("div");
  setaEsq.className = "tour-seta tour-seta--esq";
  setaEsq.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';
  const setaDir = document.createElement("div");
  setaDir.className = "tour-seta tour-seta--dir";
  setaDir.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>';
  alvoEl.appendChild(dedo);
  alvoEl.appendChild(setaEsq);
  alvoEl.appendChild(setaDir);
}

function ajudaTocarPasso(tela, indice) {
  const passos = AJUDA_DADOS[tela].tour;
  ajudaLimpar();
  if (indice >= passos.length) { ajudaEncerrarTour(tela); return; }
  ajudaTelaAtual = tela;
  ajudaPassoAtual = indice;
  const passo = passos[indice];

  ajudaMostrarFundo();

  const legenda = document.createElement("div");
  legenda.className = "tour-legenda";

  if (passo.tipo === "centro") {
    legenda.classList.add("tour-legenda--centro");
    legenda.innerHTML = `<span class="tour-legenda__titulo">${passo.titulo}</span>${passo.legenda}`;
    document.body.appendChild(legenda);
  } else {
    const alvoEl = passo.alvo();
    if (!alvoEl) { ajudaTocarPasso(tela, indice + 1); return; }
    alvoEl.classList.add("tour-alvo");
    ajudaElementoAceso = alvoEl;
    legenda.textContent = passo.legenda;
    document.body.appendChild(legenda);
    ajudaPosicionarLegenda(legenda, alvoEl);
    if (passo.tipo === "gesto") ajudaCriarGesto(alvoEl);
  }

  ajudaMostrarPontos(passos.length, indice);
  ajudaEscutarClique(() => ajudaTocarPasso(tela, indice + 1));
}

function ajudaEncerrarTour(tela) {
  ajudaLimpar();
  ajudaTelaAtual = null;
  ajudaPassoAtual = -1;
  const estado = obterAjuda();
  estado[tela].introVista = true;
  salvarAjuda(estado);
}

function iniciarTour(tela) {
  const dados = AJUDA_DADOS[tela];
  if (!dados || !dados.tour.length) return;
  if (obterAjuda()[tela].introVista) return;
  ajudaTocarPasso(tela, 0);
}

function reiniciarTour(tela) {
  const dados = AJUDA_DADOS[tela];
  if (!dados || !dados.tour.length) return;
  ajudaTocarPasso(tela, 0);
}

function mostrarDicaSpotlight(tela, chave, elementoAncora) {
  const dados = AJUDA_DADOS[tela];
  const dica = dados && dados.dicas && dados.dicas[chave];
  if (!dica || !elementoAncora) return;
  const estado = obterAjuda();
  if (estado[tela].dicasVistas.includes(chave)) return;

  ajudaLimpar();
  ajudaMostrarFundo();
  elementoAncora.classList.add("tour-alvo");
  ajudaElementoAceso = elementoAncora;

  const legenda = document.createElement("div");
  legenda.className = "tour-legenda";
  legenda.textContent = dica.legenda;
  document.body.appendChild(legenda);
  ajudaPosicionarLegenda(legenda, elementoAncora);

  ajudaEscutarClique(ajudaLimpar);

  estado[tela].dicasVistas.push(chave);
  salvarAjuda(estado);
}
