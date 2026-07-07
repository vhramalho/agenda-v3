/* ============================================================
   AGENDA V3 — Fluxo de venda (Vendas, etapa 3)
   Compartilhado entre produtos.html (venda avulsa, botão
   "Registrar venda") e index.html (venda ligada a um atendimento,
   via "Vendeu algo pra esse cliente?" dentro de Finalizar
   atendimento — ver js/agenda.js). O modal #modal-nova-venda
   existe duplicado nos dois documentos (mesmo padrão já usado
   por #modal-calendario em index.html/relatorio.html, com a
   lógica centralizada aqui).

   prepararNovaVenda(contexto, aoConcluir) só prepara o estado —
   quem chama decide quando abrir/fechar o modal, igual
   prepararFinalizarAtendimento/prepararNovoAgendamento em
   js/agenda.js.
   ============================================================ */

const ESTOQUE_BAIXO_LIMITE_VENDA = 3;

let vendaContexto = { clienteId: null, nomeCliente: null, agendamentoId: null };
let vendaAoConcluir = null;
let vendaCarrinho = {};
let vendaClienteSelecionadoId = null;

function prepararNovaVenda(contexto, aoConcluir) {
  vendaContexto = { clienteId: contexto.clienteId || null, nomeCliente: contexto.nomeCliente || null, agendamentoId: contexto.agendamentoId || null };
  vendaAoConcluir = aoConcluir;
  vendaCarrinho = {};
  vendaClienteSelecionadoId = contexto.clienteId || null;

  const vindoDeAtendimento = !!vendaContexto.agendamentoId;
  qs("#js-venda-cliente-toggle-wrap").classList.toggle("is-hidden", vindoDeAtendimento);
  const fixo = qs("#js-venda-cliente-fixo");
  if (vindoDeAtendimento) {
    fixo.textContent = `Vendendo para: ${vendaContexto.nomeCliente || "—"}`;
    fixo.classList.remove("is-hidden");
  } else {
    fixo.classList.add("is-hidden");
    qsa("#js-venda-cliente-tipo .chip").forEach((chip) => chip.classList.toggle("chip--ativo", chip.dataset.tipoCliente === "avulso"));
    qs("#js-venda-cliente-busca-wrap").classList.add("is-hidden");
    qs("#js-venda-cliente-busca").value = "";
    qs("#js-venda-cliente-resultados").classList.add("is-hidden");
  }

  qsa("[data-pago]", qs("#modal-nova-venda")).forEach((b) => b.classList.toggle("chip--ativo", b.dataset.pago === "sim"));
  qsa("[data-campo-pago]", qs("#modal-nova-venda")).forEach((campo) => campo.classList.toggle("is-hidden", campo.dataset.campoPago !== "sim"));
  montarFormasChips("js-venda-formas", "js-venda-linhas-pagamento", [], {});
  qs("#js-venda-valor-pendente").value = "";

  renderizarListaVendaProdutos();
  renderizarCarrinhoVenda();
}

function renderizarListaVendaProdutos() {
  const container = qs("#js-venda-lista-produtos");
  const produtosAtivos = obterProdutos().filter((p) => p.ativo);
  container.innerHTML = "";
  if (produtosAtivos.length === 0) {
    container.innerHTML = `<p class="text-muted" style="padding:12px;">Nenhum produto cadastrado ainda.</p>`;
    return;
  }
  produtosAtivos.forEach((produto) => {
    const linha = document.createElement("div");
    linha.className = "list-item";
    linha.style.cursor = "pointer";
    linha.innerHTML = `
      <div class="list-item__body">
        <p class="list-item__title"></p>
        <p class="list-item__subtitle"></p>
      </div>
      <div class="list-item__trailing"><p style="font-weight:700;"></p></div>
    `;
    linha.querySelector(".list-item__title").textContent = produto.nome;
    linha.querySelector(".list-item__subtitle").textContent = `Estoque: ${produto.estoque}`;
    linha.querySelector(".list-item__trailing p").textContent = formatarMoeda(produto.precoVenda);
    linha.addEventListener("click", () => {
      vendaCarrinho[produto.id] = (vendaCarrinho[produto.id] || 0) + 1;
      renderizarCarrinhoVenda();
    });
    container.appendChild(linha);
  });
}

function renderizarCarrinhoVenda() {
  const produtos = obterProdutos();
  const wrap = qs("#js-venda-carrinho-wrap");
  const container = qs("#js-venda-carrinho");
  container.innerHTML = "";
  const entradas = Object.entries(vendaCarrinho).filter(([, qtd]) => qtd > 0);

  if (entradas.length === 0) {
    wrap.classList.add("is-hidden");
    return;
  }
  wrap.classList.remove("is-hidden");

  let total = 0;
  entradas.forEach(([produtoId, quantidade]) => {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return;
    const subtotal = produto.precoVenda * quantidade;
    total += subtotal;
    const estoqueInsuficiente = quantidade > produto.estoque;

    const linha = document.createElement("div");
    linha.className = "row row--between";
    linha.innerHTML = `
      <div style="flex:1;">
        <p style="font-weight:600;">${produto.nome}</p>
        ${estoqueInsuficiente ? `<p class="text-warning" style="font-size:var(--text-sm);">Estoque disponível: ${produto.estoque}</p>` : ""}
      </div>
      <div class="row" style="gap:8px;flex-shrink:0;">
        <button type="button" class="icon-btn" data-carrinho-menos style="width:32px;height:32px;">−</button>
        <span style="min-width:20px;text-align:center;">${quantidade}</span>
        <button type="button" class="icon-btn" data-carrinho-mais style="width:32px;height:32px;">+</button>
        <span style="min-width:70px;text-align:right;font-weight:600;">${formatarMoeda(subtotal)}</span>
      </div>
    `;
    linha.querySelector("[data-carrinho-menos]").addEventListener("click", () => {
      vendaCarrinho[produtoId] = Math.max(0, (vendaCarrinho[produtoId] || 0) - 1);
      renderizarCarrinhoVenda();
    });
    linha.querySelector("[data-carrinho-mais]").addEventListener("click", () => {
      vendaCarrinho[produtoId] = (vendaCarrinho[produtoId] || 0) + 1;
      renderizarCarrinhoVenda();
    });
    container.appendChild(linha);
  });

  qs("#js-venda-total").textContent = formatarMoeda(total);
}

function itensCarrinhoVenda() {
  const produtos = obterProdutos();
  return Object.entries(vendaCarrinho)
    .filter(([, qtd]) => qtd > 0)
    .map(([produtoId, quantidade]) => {
      const produto = produtos.find((p) => p.id === produtoId);
      return produto ? { produtoId, nomeProduto: produto.nome, quantidade, precoUnitario: produto.precoVenda } : null;
    })
    .filter(Boolean);
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarMascaraMoeda(qs("#js-venda-valor-pendente"));

  const tipoClienteContainer = qs("#js-venda-cliente-tipo");
  if (tipoClienteContainer) {
    tipoClienteContainer.addEventListener("click", (e) => {
      if (!e.target.closest(".chip")) return;
      const modoExistente = e.target.closest(".chip").dataset.tipoCliente === "existente";
      qs("#js-venda-cliente-busca-wrap").classList.toggle("is-hidden", !modoExistente);
      if (!modoExistente) {
        vendaClienteSelecionadoId = null;
        qs("#js-venda-cliente-busca").value = "";
        qs("#js-venda-cliente-resultados").classList.add("is-hidden");
      }
    });
  }

  const buscaInput = qs("#js-venda-cliente-busca");
  if (buscaInput) {
    buscaInput.addEventListener("input", () => {
      const termo = buscaInput.value.trim().toLowerCase();
      const resultados = qs("#js-venda-cliente-resultados");
      vendaClienteSelecionadoId = null;
      if (!termo) {
        resultados.classList.add("is-hidden");
        return;
      }
      const encontrados = obterClientes().filter((c) => c.nome.toLowerCase().includes(termo)).slice(0, 6);
      resultados.innerHTML = "";
      if (encontrados.length === 0) {
        resultados.classList.add("is-hidden");
        return;
      }
      encontrados.forEach((cliente) => {
        const item = document.createElement("p");
        item.style.padding = "8px 0";
        item.style.cursor = "pointer";
        item.textContent = cliente.nome;
        item.addEventListener("click", () => {
          vendaClienteSelecionadoId = cliente.id;
          buscaInput.value = cliente.nome;
          resultados.classList.add("is-hidden");
        });
        resultados.appendChild(item);
      });
      resultados.classList.remove("is-hidden");
    });
  }

  qs("#js-venda-confirmar").addEventListener("click", () => {
    const itens = itensCarrinhoVenda();
    if (itens.length === 0) return;

    const vindoDeAtendimento = !!vendaContexto.agendamentoId;
    let clienteId = null;
    let nomeCliente = "Avulso";
    if (vindoDeAtendimento) {
      clienteId = vendaContexto.clienteId;
      nomeCliente = vendaContexto.nomeCliente;
    } else if (vendaClienteSelecionadoId) {
      const cliente = obterClientes().find((c) => c.id === vendaClienteSelecionadoId);
      if (cliente) {
        clienteId = cliente.id;
        nomeCliente = cliente.nome;
      }
    }

    const venda = {
      id: gerarId("venda"),
      clienteId,
      nomeCliente,
      agendamentoId: vendaContexto.agendamentoId,
      itens,
      valorTotal: 0,
      status: "pendente",
      criadaEm: new Date().toISOString(),
    };

    const pagoEscolha = qs("[data-pago].chip--ativo", qs("#modal-nova-venda")).dataset.pago;
    if (pagoEscolha === "sim") {
      const pagamentos = lerPagamentosDeLinhas("js-venda-linhas-pagamento");
      venda.status = "paga";
      venda.pagamentos = pagamentos;
      venda.valorTotal = pagamentos.reduce((s, p) => s + p.valor, 0);
    } else {
      const valorPendente = extrairValor(qs("#js-venda-valor-pendente").value) || 0;
      venda.status = "pendente";
      venda.valorPendente = valorPendente;
      venda.valorTotal = valorPendente;
    }

    const produtos = obterProdutos();
    itens.forEach((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId);
      if (produto) produto.estoque -= item.quantidade;
    });
    salvarProdutos(produtos);

    const vendas = obterVendas();
    vendas.push(venda);
    salvarVendas(vendas);

    mostrarSucesso();
    if (vendaAoConcluir) vendaAoConcluir(venda);
  });
});
