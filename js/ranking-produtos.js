/* ============================================================
   AGENDA V3 — Ranking de produtos
   Lista com nome e quantidade vendida por produto, somando as
   quantidades de todas as vendas no período (não conta ocorrência
   de venda, conta unidade vendida). Mesmo padrão visual de
   js/ranking-servicos.js.
   ============================================================ */

function calcularRankingProdutos(periodo) {
  const produtosAtivos = obterProdutos().filter((p) => p.ativo);
  const contagem = {};
  obterVendas().forEach((venda) => {
    if (!dataNoPeriodo(venda.criadaEm.slice(0, 10), periodo)) return;
    (venda.itens || []).forEach((item) => {
      contagem[item.produtoId] = (contagem[item.produtoId] || 0) + item.quantidade;
    });
  });
  return produtosAtivos
    .map((produto) => ({ produto, quantidade: contagem[produto.id] || 0 }))
    .filter((item) => item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade);
}

function montarLinhaRankingProduto(item, posicao, indice) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <span class="ranking-posicao ${classePosicaoRanking(posicao)}">${posicao}</span>
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <span class="text-primary-accent" style="font-weight:700;"></span>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.produto.nome);
  linha.querySelector(".list-item__title").textContent = item.produto.nome;
  linha.querySelector(".text-primary-accent").textContent = `${item.quantidade} unidade${item.quantidade === 1 ? "" : "s"} vendida${item.quantidade === 1 ? "" : "s"}`;
  return linha;
}

function renderizarRankingProdutosCompleto(periodo) {
  const ranking = calcularRankingProdutos(periodo);
  const tabela = qs("#js-ranking-produtos-tabela");
  const vazio = qs("#js-ranking-produtos-vazio");
  tabela.innerHTML = "";

  if (ranking.length === 0) {
    tabela.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    return;
  }
  tabela.classList.remove("is-hidden");
  vazio.classList.add("is-hidden");

  ranking.forEach((item, i) => tabela.appendChild(montarLinhaRankingProduto(item, i + 1, i)));
}

if (qs("#js-ranking-produtos-tabela")) {
  document.addEventListener("DOMContentLoaded", () => {
    let periodoAtual = { tipo: "ano", ano: new Date().getFullYear() };

    function atualizarRankingProdutosPeriodo() {
      qs("#js-ano-label").textContent = rotuloPeriodo(periodoAtual);
      qs("#js-ano-anterior").classList.toggle("is-hidden", periodoAtual.tipo === "personalizado");
      qs("#js-ano-proximo").classList.toggle("is-hidden", periodoAtual.tipo === "personalizado");
      renderizarRankingProdutosCompleto(periodoAtual);
    }

    atualizarRankingProdutosPeriodo();

    qs("#js-ano-anterior").addEventListener("click", () => { periodoAtual = periodoAnterior(periodoAtual); atualizarRankingProdutosPeriodo(); });
    qs("#js-ano-proximo").addEventListener("click", () => { periodoAtual = periodoProximo(periodoAtual); atualizarRankingProdutosPeriodo(); });

    configurarFiltroPeriodo(() => periodoAtual, (novoPeriodo) => {
      periodoAtual = novoPeriodo;
      atualizarRankingProdutosPeriodo();
    });
  });
}
