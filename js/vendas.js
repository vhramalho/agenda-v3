/* ============================================================
   AGENDA V3 — Fluxo de venda
   Compartilhado entre index.html (hook "Vendeu algo pra esse
   cliente?" dentro de Finalizar/Editar atendimento, js/agenda.js)
   e vendas.html (venda avulsa + histórico, js/produtos.js). O
   modal #modal-nova-venda existe duplicado nos dois documentos
   (mesmo padrão já usado por #modal-calendario em
   index.html/relatorio.html, com a lógica centralizada aqui).

   Tela única rolável (cliente/avulso → produtos → itens
   selecionados → foi pago → forma de pagamento) — sem passos
   intermediários.

   prepararNovaVenda(contexto, aoConcluir) só prepara o estado —
   quem chama decide quando abrir/fechar o modal, igual
   prepararFinalizarAtendimento/prepararNovoAgendamento em
   js/agenda.js.
   ============================================================ */

let vendaContexto = { clienteId: null, nomeCliente: null, agendamentoId: null };
let vendaAoConcluir = null;
let vendaAoCancelar = null;
let vendaCarrinho = {};
let vendaClienteSelecionadoId = null;
let vendaEditandoId = null;
let vendaItensOriginais = {};
let vendaAoExcluir = null;

/* Quantidade disponível pra adicionar ao carrinho — em modo edição, os itens
   que já pertenciam a esta mesma venda contam como "disponíveis de volta",
   senão editar uma venda existente pareceria estar sem estoque pro que ela
   mesma já tinha vendido. */
function estoqueDisponivelParaCarrinho(produto) {
  if (!vendaEditandoId) return produto.estoque;
  return produto.estoque + (vendaItensOriginais[produto.id] || 0);
}

function prepararNovaVenda(contexto, aoConcluir, aoCancelar) {
  vendaContexto = { clienteId: contexto.clienteId || null, nomeCliente: contexto.nomeCliente || null, agendamentoId: contexto.agendamentoId || null, data: contexto.data || null };
  vendaAoConcluir = aoConcluir;
  vendaAoCancelar = aoCancelar || null;
  vendaCarrinho = {};
  vendaClienteSelecionadoId = contexto.clienteId || null;
  vendaEditandoId = null;
  vendaItensOriginais = {};
  vendaAoExcluir = null;
  qs("#js-venda-modal-titulo").textContent = "Registrar venda";
  qs("#js-venda-confirmar").textContent = "Confirmar venda";
  qs("#js-venda-excluir").classList.add("is-hidden");

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

  qsa("[data-pago]", qs("#modal-nova-venda")).forEach((b) => b.classList.remove("chip--ativo"));
  qsa("[data-campo-pago]", qs("#modal-nova-venda")).forEach((campo) => campo.classList.add("is-hidden"));
  montarFormasChips("js-venda-formas", "js-venda-linhas-pagamento", [], {}, () => subtotalCarrinhoVenda(itensCarrinhoVenda()), "js-venda-desconto-gorjeta-aviso");
  qs("#js-venda-valor-pendente").value = "";

  renderizarListaVendaProdutos();
  renderizarCarrinhoVenda();
}

/* Reabre o modal único de venda já preenchido, pra editar produtos/
   quantidade/cliente/pagamento de uma venda existente (ver "seta" no resumo
   de venda em Finalizar/Editar atendimento, js/agenda.js). Cliente fica
   travado quando a venda está presa a um atendimento (mesma regra de
   prepararNovaVenda), editável numa venda avulsa. Estoque é ajustado pela
   diferença ao confirmar (js-venda-confirmar), não descontado do zero. */
function prepararEditarVenda(venda, aoConcluir, aoCancelar, aoExcluir) {
  vendaContexto = { clienteId: venda.clienteId || null, nomeCliente: venda.nomeCliente || null, agendamentoId: venda.agendamentoId || null };
  vendaAoConcluir = aoConcluir;
  vendaAoCancelar = aoCancelar || null;
  vendaAoExcluir = aoExcluir || null;
  vendaEditandoId = venda.id;
  vendaCarrinho = {};
  vendaItensOriginais = {};
  (venda.itens || []).forEach((item) => {
    vendaCarrinho[item.produtoId] = (vendaCarrinho[item.produtoId] || 0) + item.quantidade;
    vendaItensOriginais[item.produtoId] = (vendaItensOriginais[item.produtoId] || 0) + item.quantidade;
  });
  vendaClienteSelecionadoId = venda.clienteId || null;
  qs("#js-venda-modal-titulo").textContent = "Editar venda";
  qs("#js-venda-confirmar").textContent = "Salvar alterações";
  qs("#js-venda-excluir").classList.remove("is-hidden");

  const vindoDeAtendimento = !!vendaContexto.agendamentoId;
  qs("#js-venda-cliente-toggle-wrap").classList.toggle("is-hidden", vindoDeAtendimento);
  const fixo = qs("#js-venda-cliente-fixo");
  if (vindoDeAtendimento) {
    fixo.textContent = `Vendendo para: ${vendaContexto.nomeCliente || "—"}`;
    fixo.classList.remove("is-hidden");
  } else {
    fixo.classList.add("is-hidden");
    const ehExistente = !!venda.clienteId;
    qsa("#js-venda-cliente-tipo .chip").forEach((chip) => chip.classList.toggle("chip--ativo", chip.dataset.tipoCliente === (ehExistente ? "existente" : "avulso")));
    qs("#js-venda-cliente-busca-wrap").classList.toggle("is-hidden", !ehExistente);
    qs("#js-venda-cliente-busca").value = ehExistente ? venda.nomeCliente || "" : "";
    qs("#js-venda-cliente-resultados").classList.add("is-hidden");
  }

  const modal = qs("#modal-nova-venda");
  qsa("[data-pago]", modal).forEach((b) => b.classList.toggle("chip--ativo", b.dataset.pago === (venda.status === "paga" ? "sim" : "nao")));
  qsa("[data-campo-pago]", modal).forEach((campo) => campo.classList.toggle("is-hidden", campo.dataset.campoPago !== (venda.status === "paga" ? "sim" : "nao")));

  if (venda.status === "paga") {
    const valoresPorNome = {};
    const nomesSelecionados = [];
    const formas = obterFormasPagamento();
    (venda.pagamentos || []).forEach((p) => {
      const forma = formas.find((f) => f.id === p.formaPagamentoId);
      if (forma) { nomesSelecionados.push(forma.nome); valoresPorNome[forma.nome] = p.valor; }
    });
    montarFormasChips("js-venda-formas", "js-venda-linhas-pagamento", nomesSelecionados, valoresPorNome, () => subtotalCarrinhoVenda(itensCarrinhoVenda()), "js-venda-desconto-gorjeta-aviso");
    qs("#js-venda-valor-pendente").value = "";
  } else {
    montarFormasChips("js-venda-formas", "js-venda-linhas-pagamento", [], {}, () => subtotalCarrinhoVenda(itensCarrinhoVenda()), "js-venda-desconto-gorjeta-aviso");
    qs("#js-venda-valor-pendente").value = venda.valorPendente != null ? formatarMoeda(venda.valorPendente) : "";
  }

  renderizarListaVendaProdutos();
  renderizarCarrinhoVenda();
}

function renderizarListaVendaProdutos() {
  const container = qs("#js-venda-lista-produtos");
  const produtosAtivos = obterProdutos().filter((p) => p.ativo);
  container.innerHTML = "";
  if (produtosAtivos.length === 0) {
    container.innerHTML = `<p class="text-muted" style="padding:12px;grid-column:1 / -1;">Nenhum produto cadastrado ainda.</p>`;
    return;
  }
  produtosAtivos.forEach((produto) => {
    const quantidadeNoCarrinho = vendaCarrinho[produto.id] || 0;
    const card = document.createElement("div");
    card.className = "card";
    card.style.cursor = "pointer";
    card.style.textAlign = "center";
    card.style.position = "relative";
    card.innerHTML = `
      ${quantidadeNoCarrinho > 0 ? `<span style="position:absolute;top:6px;right:6px;background:var(--primary);color:#fff;border-radius:999px;min-width:20px;height:20px;font-size:var(--text-xs);font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px;">${quantidadeNoCarrinho}</span>` : ""}
      <div class="list-item__avatar" style="margin:0 auto 8px;"></div>
      <p style="font-weight:600;font-size:var(--text-sm);"></p>
      <p class="text-secondary" style="font-size:var(--text-xs);"></p>
    `;
    card.querySelector(".list-item__avatar").textContent = iniciaisCliente(produto.nome);
    card.querySelectorAll("p")[0].textContent = produto.nome;
    card.querySelectorAll("p")[1].textContent = formatarMoeda(produto.precoVenda);
    card.addEventListener("click", () => {
      const atual = vendaCarrinho[produto.id] || 0;
      if (atual >= estoqueDisponivelParaCarrinho(produto)) {
        mostrarAviso("Estoque insuficiente");
        return;
      }
      vendaCarrinho[produto.id] = atual + 1;
      renderizarListaVendaProdutos();
      renderizarCarrinhoVenda();
    });
    container.appendChild(card);
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
    qs("#js-venda-total").textContent = formatarMoeda(0);
    atualizarAvisoDescontoGorjeta("js-venda-linhas-pagamento", "js-venda-desconto-gorjeta-aviso", () => 0);
    return;
  }
  wrap.classList.remove("is-hidden");

  let total = 0;
  entradas.forEach(([produtoId, quantidade]) => {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return;
    const subtotal = produto.precoVenda * quantidade;
    total += subtotal;

    const linha = document.createElement("div");
    linha.className = "row row--between";
    linha.innerHTML = `
      <div style="flex:1;">
        <p style="font-weight:600;">${produto.nome}</p>
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
      renderizarListaVendaProdutos();
      renderizarCarrinhoVenda();
    });
    linha.querySelector("[data-carrinho-mais]").addEventListener("click", () => {
      const atual = vendaCarrinho[produtoId] || 0;
      if (atual >= estoqueDisponivelParaCarrinho(produto)) {
        mostrarAviso("Estoque insuficiente");
        return;
      }
      vendaCarrinho[produtoId] = atual + 1;
      renderizarListaVendaProdutos();
      renderizarCarrinhoVenda();
    });
    container.appendChild(linha);
  });

  qs("#js-venda-total").textContent = formatarMoeda(total);
  atualizarAvisoDescontoGorjeta("js-venda-linhas-pagamento", "js-venda-desconto-gorjeta-aviso", () => total);
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

function subtotalCarrinhoVenda(itens) {
  return itens.reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0);
}

/* Apaga uma venda e devolve o estoque dos produtos que ela consumia — usada
   tanto ao desanexar uma venda de um atendimento cancelado (js/agenda.js)
   quanto ao excluir uma venda avulsa direto do histórico (js/produtos.js). */
function removerVendaAnexada(vendaId) {
  const vendas = obterVendas();
  const venda = vendas.find((v) => v.id === vendaId);
  if (!venda) return;
  const produtos = obterProdutos();
  venda.itens.forEach((item) => {
    const produto = produtos.find((p) => p.id === item.produtoId);
    if (produto) produto.estoque += item.quantidade;
  });
  salvarProdutos(produtos);
  salvarVendas(vendas.filter((v) => v.id !== vendaId));
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarMascaraMoeda(qs("#js-venda-valor-pendente"));

  // Cancelar a venda (Cancelar, ✕ ou tocar fora) sem confirmar avisa quem abriu
  // o modal — necessário pro fluxo "Vendeu algo?" (js/agenda.js) voltar pro
  // modal de Finalizar atendimento em vez de deixar tudo fechado.
  const dispararCancelamentoVenda = () => {
    if (!vendaAoCancelar) return;
    const callback = vendaAoCancelar;
    vendaAoCancelar = null;
    callback();
  };
  qsa("#modal-nova-venda [data-fechar-modal], #modal-nova-venda .modal-close").forEach((el) => {
    el.addEventListener("click", dispararCancelamentoVenda);
  });
  qs("#modal-nova-venda").addEventListener("click", (e) => {
    if (e.target.id === "modal-nova-venda") dispararCancelamentoVenda();
  });

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
    const subtotal = subtotalCarrinhoVenda(itens);

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

    const pagoAtivo = qs("[data-pago].chip--ativo", qs("#modal-nova-venda"));
    if (!pagoAtivo) {
      mostrarAviso("Selecione se foi pago");
      return;
    }

    const vendas = obterVendas();
    const venda = vendaEditandoId
      ? vendas.find((v) => v.id === vendaEditandoId)
      : {
          id: gerarId("venda"),
          // Venda presa a um atendimento herda a data do atendimento (não a
          // do momento em que a venda foi registrada) — senão editar um
          // realizado de outro dia e vender algo ali gravaria a venda como
          // se fosse de hoje.
          criadaEm: vendaContexto.agendamentoId && vendaContexto.data ? `${vendaContexto.data}T12:00:00.000Z` : new Date().toISOString(),
          agendamentoId: vendaContexto.agendamentoId,
        };
    if (!venda) return;

    venda.clienteId = clienteId;
    venda.nomeCliente = nomeCliente;
    venda.itens = itens;
    venda.subtotal = subtotal;
    delete venda.desconto;
    delete venda.gorjeta;

    const pagoEscolha = pagoAtivo.dataset.pago;
    if (pagoEscolha === "sim") {
      const pagamentos = lerPagamentosDeLinhas("js-venda-linhas-pagamento");
      venda.status = "paga";
      venda.pagamentos = pagamentos;
      venda.valorTotal = pagamentos.reduce((s, p) => s + p.valor, 0);
      delete venda.valorPendente;
    } else {
      const valorPendente = extrairValor(qs("#js-venda-valor-pendente").value) || 0;
      venda.status = "pendente";
      venda.valorPendente = valorPendente;
      venda.valorTotal = valorPendente;
      delete venda.pagamentos;
    }
    const diferenca = subtotal - venda.valorTotal;
    if (diferenca > 0) venda.desconto = diferenca;
    else if (diferenca < 0) venda.gorjeta = -diferenca;

    const produtos = obterProdutos();
    if (vendaEditandoId) {
      // Ajusta pela diferença entre o que a venda tinha antes e o que tem agora
      // — nunca desconta do zero, senão dobraria o consumo de estoque.
      const idsEnvolvidos = new Set([...Object.keys(vendaItensOriginais), ...itens.map((i) => i.produtoId)]);
      idsEnvolvidos.forEach((produtoId) => {
        const produto = produtos.find((p) => p.id === produtoId);
        if (!produto) return;
        const antes = vendaItensOriginais[produtoId] || 0;
        const depois = itens.find((i) => i.produtoId === produtoId)?.quantidade || 0;
        produto.estoque -= (depois - antes);
      });
    } else {
      itens.forEach((item) => {
        const produto = produtos.find((p) => p.id === item.produtoId);
        if (produto) produto.estoque -= item.quantidade;
      });
    }
    salvarProdutos(produtos);

    if (!vendaEditandoId) vendas.push(venda);
    salvarVendas(vendas);

    mostrarSucesso();
    vendaAoCancelar = null;
    if (vendaAoConcluir) vendaAoConcluir(venda);
  });

  qs("#js-venda-excluir").addEventListener("click", () => {
    abrirModal("modal-confirmar-exclusao-venda");
  });

  qs("#js-confirmar-exclusao-venda").addEventListener("click", () => {
    fecharModal("modal-confirmar-exclusao-venda");
    vendaAoCancelar = null;
    if (vendaAoExcluir) vendaAoExcluir();
  });
});
