/* ============================================================
   AGENDA V3 — Tela Vendas (aba Produtos: CRUD, ligado de verdade
   a agendaV3:produtos; aba Vendas: venda avulsa + histórico,
   reaproveitando prepararNovaVenda/prepararEditarVenda de
   js/vendas.js). Exclusão de produto é lógica (ativo:false) —
   mesmo padrão de servicos.js.
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

/* ---------- Aba Vendas: venda avulsa + histórico ---------- */

function montarLinhaVenda(venda, produtos, indice) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.style.cursor = "pointer";
  const avulsa = !venda.clienteId;
  const pago = venda.status === "paga";
  const nomesItens = (venda.itens || [])
    .map((item) => (produtos.find((p) => p.id === item.produtoId) || {}).nome || item.nomeProduto)
    .filter(Boolean)
    .join(", ");
  linha.innerHTML = `
    <div class="list-item__avatar ${avulsa ? "" : classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle"></p>
    </div>
    <div class="list-item__trailing">
      <p style="font-weight:700;"></p>
      <span class="badge ${pago ? "badge--sucesso" : "badge--alerta"}">${pago ? "Pago" : "Pendente"}</span>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  const avatar = linha.querySelector(".list-item__avatar");
  if (avulsa) {
    avatar.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>`;
  } else {
    avatar.textContent = iniciaisCliente(venda.nomeCliente);
  }
  linha.querySelector(".list-item__title").textContent = avulsa ? "Venda avulsa" : venda.nomeCliente;
  linha.querySelector(".list-item__subtitle").textContent = `${nomesItens || "—"} · ${formatarDataCurta(venda.criadaEm.slice(0, 10))}`;
  linha.querySelector(".list-item__trailing p").textContent = formatarMoeda(venda.valorTotal || 0);
  linha.addEventListener("click", () => abrirEdicaoVenda(venda));
  return linha;
}

const LIMITE_HISTORICO_VENDAS = 10;
let historicoVendasExpandido = false;

function renderizarHistoricoVendas() {
  const vendas = obterVendas().slice().sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
  const produtos = obterProdutos();
  const container = qs("#js-lista-historico-vendas");
  const vazio = qs("#js-historico-vendas-vazio");
  const toggle = qs("#js-historico-vendas-toggle");
  container.innerHTML = "";

  if (vendas.length === 0) {
    container.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    toggle.classList.add("is-hidden");
    return;
  }

  container.classList.remove("is-hidden");
  vazio.classList.add("is-hidden");
  const visiveis = historicoVendasExpandido ? vendas : vendas.slice(0, LIMITE_HISTORICO_VENDAS);
  visiveis.forEach((venda, i) => container.appendChild(montarLinhaVenda(venda, produtos, i)));

  if (vendas.length > LIMITE_HISTORICO_VENDAS) {
    toggle.classList.remove("is-hidden");
    toggle.textContent = historicoVendasExpandido ? "Ver menos" : "Ver todas";
  } else {
    toggle.classList.add("is-hidden");
  }
}

/* Editar uma venda muda produto.estoque por delta (js/vendas.js) — por isso
   sempre re-renderiza o histórico E a lista/insight de produtos junto. */
function abrirEdicaoVenda(venda) {
  prepararEditarVenda(
    venda,
    () => {
      fecharModal("modal-nova-venda");
      renderizarHistoricoVendas();
      renderizarProdutos();
    },
    null,
    () => {
      removerVendaAnexada(venda.id);
      fecharModal("modal-nova-venda");
      renderizarHistoricoVendas();
      renderizarProdutos();
    }
  );
  abrirModal("modal-nova-venda");
}

function abrirNovaVendaAvulsa() {
  prepararNovaVenda({ clienteId: null, nomeCliente: null, agendamentoId: null }, () => {
    fecharModal("modal-nova-venda");
    renderizarHistoricoVendas();
    renderizarProdutos();
  });
  abrirModal("modal-nova-venda");
}

/* Botão "+" do header é contextual à aba ativa — mesma ação, sem duplicar
   lógica: nova venda avulsa na aba Vendas, novo produto na aba Produtos. */
function atualizarBotaoAcaoHeader(abaVendas) {
  const btn = qs("#js-btn-vendas-acao");
  btn.setAttribute("aria-label", abaVendas ? "Nova venda avulsa" : "Novo produto");
  btn.onclick = abaVendas ? abrirNovaVendaAvulsa : abrirNovoProduto;
}

function atualizarTituloHeader(abaVendas) {
  qs("#js-vendas-titulo").textContent = abaVendas ? "Vendas" : "Produtos";
}

/* Botão "?" também é o mesmo elemento pras duas abas — só troca qual tela
   de ajuda ele reinicia, mesmo padrão do botão "+" acima. */
function atualizarBotaoAjudaHeader(abaVendas) {
  qs("#js-btn-ajuda-vendas").onclick = () => reiniciarTour(abaVendas ? "vendas" : "produtos");
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarProdutos();
  renderizarHistoricoVendas();
  atualizarBotaoAcaoHeader(true);
  atualizarBotaoAjudaHeader(true);
  iniciarTour("vendas");

  qs("#js-historico-vendas-toggle").addEventListener("click", () => {
    historicoVendasExpandido = !historicoVendasExpandido;
    renderizarHistoricoVendas();
  });
  aplicarMascaraMoeda(qs("#js-novo-produto-preco-venda"));
  aplicarMascaraMoeda(qs("#js-novo-produto-preco-custo"));
  aplicarMascaraMoeda(qs("#js-editar-produto-preco-venda"));
  aplicarMascaraMoeda(qs("#js-editar-produto-preco-custo"));

  qsa(".segmented__item", qs("#js-aba-vendas")).forEach((item) => {
    item.addEventListener("click", () => {
      qsa(".segmented__item", qs("#js-aba-vendas")).forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
      const abaVendas = item.dataset.aba === "vendas";
      qs("#js-conteudo-vendas-vendas").classList.toggle("is-hidden", !abaVendas);
      qs("#js-conteudo-vendas-produtos").classList.toggle("is-hidden", abaVendas);
      atualizarBotaoAcaoHeader(abaVendas);
      atualizarBotaoAjudaHeader(abaVendas);
      atualizarTituloHeader(abaVendas);
      if (!abaVendas) iniciarTour("produtos");
    });
  });

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
