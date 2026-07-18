/* ============================================================
   AGENDA V3 — Tela Produtos (produtos.html)
   Catálogo/estoque: CRUD ligado a agendaV3:produtos. Exclusão de
   produto é lógica (ativo:false) — mesmo padrão de servicos.js.
   ============================================================ */

const ESTOQUE_BAIXO_LIMITE = 3;

let produtoEditandoId = null;

function montarLinhaProduto(produto, indice) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.style.cursor = "pointer";
  const estoqueBaixo = produto.estoque <= ESTOQUE_BAIXO_LIMITE;
  linha.innerHTML = `
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle" style="${estoqueBaixo ? "color:var(--danger);font-weight:600;" : ""}"></p>
    </div>
    <div class="list-item__trailing"><p style="font-weight:700;"></p></div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(produto.nome);
  linha.querySelector(".list-item__title").textContent = produto.nome;
  linha.querySelector(".list-item__subtitle").textContent = `Estoque: ${produto.estoque}${estoqueBaixo ? " (baixo)" : ""}`;
  linha.querySelector(".list-item__trailing p").textContent = formatarMoeda(produto.precoVenda);
  linha.addEventListener("click", () => abrirEdicaoProduto(produto.id));
  return linha;
}

function renderizarProdutos() {
  const produtosAtivos = obterProdutos().filter((p) => p.ativo);
  const container = qs("#js-lista-produtos");
  const vazio = qs("#js-produtos-vazio");
  container.innerHTML = "";

  if (produtosAtivos.length === 0) {
    container.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
  } else {
    container.classList.remove("is-hidden");
    vazio.classList.add("is-hidden");
    produtosAtivos.forEach((produto, i) => container.appendChild(montarLinhaProduto(produto, i)));
  }

  calcularInsightEstoque();
}

function calcularInsightEstoque() {
  const produtosAtivos = obterProdutos().filter((p) => p.ativo);
  let totalCusto = 0;
  let totalVenda = 0;
  produtosAtivos.forEach((produto) => {
    if (produto.precoCusto != null) totalCusto += produto.estoque * produto.precoCusto;
    totalVenda += produto.estoque * produto.precoVenda;
  });
  qs("#js-produtos-insight-custo").textContent = formatarMoeda(totalCusto);
  qs("#js-produtos-insight-venda").textContent = formatarMoeda(totalVenda);
  qs("#js-produtos-insight-lucro").textContent = formatarMoeda(totalVenda - totalCusto);
}

function abrirNovoProduto() {
  qs("#js-novo-produto-nome").value = "";
  qs("#js-novo-produto-preco-venda").value = "";
  qs("#js-novo-produto-preco-custo").value = "";
  qs("#js-novo-produto-estoque").value = "";
  qsa("#js-novo-produto-parado .chip").forEach((chip) => chip.classList.toggle("chip--ativo", chip.dataset.dias === ""));
  abrirModal("modal-novo-produto");
}

function abrirEdicaoProduto(id) {
  const produto = obterProdutos().find((p) => p.id === id);
  if (!produto) return;
  produtoEditandoId = id;
  qs("#js-editar-produto-nome").value = produto.nome;
  qs("#js-editar-produto-preco-venda").value = formatarMoeda(produto.precoVenda);
  qs("#js-editar-produto-preco-custo").value = produto.precoCusto != null ? formatarMoeda(produto.precoCusto) : "";
  qs("#js-editar-produto-estoque").value = produto.estoque;
  const diasAtual = produto.diasParaAvisarParado != null ? String(produto.diasParaAvisarParado) : "";
  qsa("#js-editar-produto-parado .chip").forEach((chip) => chip.classList.toggle("chip--ativo", chip.dataset.dias === diasAtual));
  abrirModal("modal-editar-produto");
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarProdutos();

  aplicarMascaraMoeda(qs("#js-novo-produto-preco-venda"));
  aplicarMascaraMoeda(qs("#js-novo-produto-preco-custo"));
  aplicarMascaraMoeda(qs("#js-editar-produto-preco-venda"));
  aplicarMascaraMoeda(qs("#js-editar-produto-preco-custo"));

  qs("#js-btn-novo-produto").addEventListener("click", abrirNovoProduto);

  qs("#js-novo-produto-salvar").addEventListener("click", () => {
    const nome = qs("#js-novo-produto-nome").value.trim();
    const precoVenda = extrairValor(qs("#js-novo-produto-preco-venda").value);
    const estoque = parseInt(qs("#js-novo-produto-estoque").value, 10);
    if (!nome || precoVenda == null || isNaN(estoque)) return;
    const hoje = hojeIso();
    const chipParado = qs("#js-novo-produto-parado .chip--ativo");
    const diasParaAvisarParado = chipParado && chipParado.dataset.dias ? parseInt(chipParado.dataset.dias, 10) : null;
    const lista = obterProdutos();
    lista.push({
      id: gerarId("prod"),
      nome,
      precoVenda,
      precoCusto: extrairValor(qs("#js-novo-produto-preco-custo").value),
      estoque,
      diasParaAvisarParado,
      ativo: true,
      criadoEm: hoje,
      atualizadoEm: hoje,
    });
    salvarProdutos(lista);
    fecharModal("modal-novo-produto");
    mostrarSucesso();
    renderizarProdutos();
  });

  qs("#js-editar-produto-salvar").addEventListener("click", () => {
    const nome = qs("#js-editar-produto-nome").value.trim();
    const precoVenda = extrairValor(qs("#js-editar-produto-preco-venda").value);
    const estoque = parseInt(qs("#js-editar-produto-estoque").value, 10);
    if (!nome || precoVenda == null || isNaN(estoque) || !produtoEditandoId) return;
    const lista = obterProdutos();
    const produto = lista.find((p) => p.id === produtoEditandoId);
    if (!produto) return;
    produto.nome = nome;
    produto.precoVenda = precoVenda;
    produto.precoCusto = extrairValor(qs("#js-editar-produto-preco-custo").value);
    produto.estoque = estoque;
    const chipParado = qs("#js-editar-produto-parado .chip--ativo");
    produto.diasParaAvisarParado = chipParado && chipParado.dataset.dias ? parseInt(chipParado.dataset.dias, 10) : null;
    produto.atualizadoEm = hojeIso();
    salvarProdutos(lista);
    fecharModal("modal-editar-produto");
    mostrarSucesso();
    renderizarProdutos();
  });

  qs("#js-confirmar-exclusao-produto").addEventListener("click", () => {
    if (!produtoEditandoId) return;
    const lista = obterProdutos();
    const produto = lista.find((p) => p.id === produtoEditandoId);
    if (produto) {
      produto.ativo = false;
      salvarProdutos(lista);
    }
    produtoEditandoId = null;
    fecharModal("modal-confirmar-exclusao-produto");
    renderizarProdutos();
  });
});
