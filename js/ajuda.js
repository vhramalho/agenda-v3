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
  dedo.innerHTML = `<svg viewBox="0 0 297 297" fill="currentColor">
    <path d="M250.685,297c5.345-17.25,22.776-77.344,22.776-99.488v-76.899c0-10.362-8.324-18.793-18.555-18.793
      c-10.228,0-18.552,8.431-18.552,18.793v32.79c0,1.927-1.566,3.493-3.492,3.493c-1.927,0-3.492-1.566-3.492-3.493v-51.243
      c0-10.359-8.326-18.789-18.558-18.789c-10.23,0-18.553,8.43-18.553,18.789v36.533c0,1.927-1.567,3.492-3.492,3.492
      c-1.926,0-3.491-1.566-3.491-3.492V87.455c0-10.358-8.324-18.784-18.555-18.784c-10.229,0-18.552,8.426-18.552,18.784v36.542
      c0,1.924-1.568,3.492-3.493,3.492c-1.927,0-3.492-1.568-3.492-3.492V18.788C141.185,8.427,132.859,0,122.627,0
      c-10.231,0-18.556,8.427-18.556,18.788V181.7c0,1.449-0.909,2.762-2.266,3.271c-1.345,0.504-2.918,0.103-3.855-0.974l-43.461-49.715
      l-0.51-0.529c-3.483-3.296-8.053-5.124-12.863-5.151h-0.124c-5.003,0.058-9.629,1.962-13.025,5.366
      c-4.28,4.283-7.634,12.468,0.719,27.156c12.684,22.277,26.547,43.406,38.829,62.122c9.131,13.92,17.757,27.066,24.188,38.154
      c4.111,7.096,12.687,25.727,17.429,35.599H250.685z"/>
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
    legenda.innerHTML = passo.titulo
      ? `<span class="tour-legenda__titulo">${passo.titulo}</span>${passo.legenda}`
      : passo.legenda;
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
