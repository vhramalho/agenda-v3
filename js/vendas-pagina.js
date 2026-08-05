/* ============================================================
   AGENDA V3 — Tela Vendas (vendas.html): análise (período, mais
   vendidos, insights, recebimentos — migrados de js/relatorio.js em
   2026-08-04, período próprio e independente do de Atendimentos) +
   venda avulsa/histórico, reaproveitando prepararNovaVenda/
   prepararEditarVenda de js/vendas.js. CRUD de produto mora em
   js/produtos.js (produtos.html).
   ============================================================ */

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

const LIMITE_HISTORICO_VENDAS = 5;
let historicoVendasExpandido = false;
let filtroVendasAtual = "todas";

/* Estado de período — próprio desta página, independente do de
   Atendimentos (js/relatorio.js). "Ver todos" (produtos e histórico) e
   ordenação do gráfico ficam fora do closure do DOMContentLoaded pra
   sobreviver a atualizarVendas(), mesmo padrão que já existia aqui. */
let refData = new Date();
let tipoPeriodo = "dia";
const estadoExpandidoRanking = { vendidos: false };

function vendasNoPeriodo(inicio, fim) {
  const inicioIso = dataLocalParaIso(inicio);
  const fimIso = dataLocalParaIso(fim);
  return obterVendas().filter((v) => {
    const dataVenda = v.criadaEm.slice(0, 10);
    return dataVenda >= inicioIso && dataVenda <= fimIso;
  });
}

/* item.precoUnitario é sempre o preço CADASTRADO do produto (não editável
   por item na hora da venda) — quando o valor pago difere do subtotal do
   carrinho (ex.: desconto combinado na hora), essa diferença precisa
   refletir em qualquer número do Relatório de Vendas que fale de "valor
   real" (faturamento por produto, lucro). "Custo"/"lucro potencial" — o
   preço de tabela puro, sem olhar pra vendas — mora só em produtos.html
   (`js/produtos.js`, baseado em estoque×preço cadastrado), não aqui.
   Sem um preço real por item salvo, a diferença é distribuída
   proporcionalmente entre os itens da mesma venda (fatorReal = valorTotal
   ÷ subtotal) — pra uma venda de 1 item só, isso já é o valor exato pago;
   pra vendas com vários itens, é uma aproximação proporcional, não um
   valor exato por item. */
function fatorRealVenda(venda) {
  return venda.subtotal > 0 ? (venda.valorTotal || 0) / venda.subtotal : 1;
}

/* Custo/lucro só consideram itens de produtos com precoCusto informado
   (campo opcional) — sem isso não há como saber o custo daquele item.
   Custo não muda com desconto (é o que você pagou pra ter o produto em
   estoque, não o que cobrou do cliente) — só a quantidade real já entra
   aí. Lucro = receita REAL (valor realmente pago, não o de tabela) menos
   esse custo. */
function calcularCustoLucroVendas(vendas) {
  const produtos = obterProdutos();
  let custo = 0;
  let lucro = 0;
  vendas.forEach((v) => {
    const fatorReal = fatorRealVenda(v);
    (v.itens || []).forEach((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId);
      if (produto && produto.precoCusto != null) {
        const custoItem = produto.precoCusto * item.quantidade;
        const receitaRealItem = item.precoUnitario * fatorReal * item.quantidade;
        custo += custoItem;
        lucro += receitaRealItem - custoItem;
      }
    });
  });
  return { custo, lucro };
}

function porFormaValorVendas(vendas) {
  const formas = obterFormasPagamento();
  const porFormaValor = {};
  vendas.filter((v) => v.status === "paga").forEach((v) => {
    (v.pagamentos || []).forEach((p) => {
      const forma = formas.find((f) => f.id === p.formaPagamentoId);
      if (!forma) return;
      porFormaValor[forma.id] = (porFormaValor[forma.id] || 0) + p.valor;
    });
  });
  return porFormaValor;
}

function calcularResumoVendas(vendas) {
  const formas = obterFormasPagamento();
  const faturamento = vendas.reduce((soma, v) => soma + (v.valorTotal || 0), 0);
  const totalRecebido = vendas
    .filter((v) => v.status === "paga")
    .reduce((soma, v) => soma + (v.pagamentos || []).reduce((s, p) => s + p.valor, 0), 0);
  const pendente = vendas.filter((v) => v.status === "pendente").reduce((soma, v) => soma + (v.valorTotal || 0), 0);
  const contagem = vendas.length;
  const { custo, lucro } = calcularCustoLucroVendas(vendas);

  let taxas = 0;
  vendas.filter((v) => v.status === "paga").forEach((v) => {
    (v.pagamentos || []).forEach((p) => {
      const forma = formas.find((f) => f.id === p.formaPagamentoId);
      if (forma && forma.taxaPercentual) taxas += (p.valor * forma.taxaPercentual) / 100;
    });
  });

  return { faturamento, totalRecebido, pendente, contagem, custo, lucro, taxas, porFormaValor: porFormaValorVendas(vendas) };
}

function calcularMaisVendidos(vendas) {
  const produtosAtivos = obterProdutos().filter((p) => p.ativo);
  const contagem = {};
  const valorPorProduto = {};
  vendas.forEach((v) => {
    const fatorReal = fatorRealVenda(v);
    (v.itens || []).forEach((item) => {
      contagem[item.produtoId] = (contagem[item.produtoId] || 0) + item.quantidade;
      valorPorProduto[item.produtoId] = (valorPorProduto[item.produtoId] || 0) + item.quantidade * item.precoUnitario * fatorReal;
    });
  });
  return produtosAtivos
    .map((produto) => ({ produto, quantidade: contagem[produto.id] || 0, valor: valorPorProduto[produto.id] || 0 }))
    .filter((item) => item.quantidade > 0);
}

/* "Mais vendidos" vira pódio (2026-08-05, mesmo componente de "Serviços
   mais realizados" em Atendimentos) via montarRankingPodio (js/utils.js)
   — destaca UNIDADES vendidas (não faturamento), pra ficar consistente
   com "mais realizados" (que também conta ocorrências, não dinheiro).
   Antes disso era um gráfico de barras próprio (com e sem seletor
   Unidades/Faturamento); removido inteiro, ver histórico do commit.

   "Produtos menos vendidos" (Parados) também removido nesta rodada, a
   pedido do usuário — calcularParados()/montarLinhaParado() saíram junto.
   O campo diasParaAvisarParado continua existindo no cadastro de produto
   (js/produtos.js) mas não é mais lido em lugar nenhum. */

/* Lista de vendas — combina o período da página (Dia/Semana/Mês/Ano,
   igual aos cards acima, ver [[project-agenda-v3-feature-vendas]]) com
   o filtro Todas/Avulsas/De atendimento. Antes (2026-07-11) a lista
   mostrava histórico bruto sem filtro de período — decisão revertida
   a pedido do usuário em 2026-08-04. */
function vendasFiltradas() {
  const { inicio, fim } = limitesPeriodo(tipoPeriodo, refData);
  let vendas = vendasNoPeriodo(inicio, fim).slice().sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
  if (filtroVendasAtual === "avulsas") vendas = vendas.filter((v) => !v.agendamentoId);
  else if (filtroVendasAtual === "atendimento") vendas = vendas.filter((v) => !!v.agendamentoId);
  return vendas;
}

function renderizarHistoricoVendas() {
  const vendas = vendasFiltradas();
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
   sempre re-renderiza o histórico junto. */
function abrirEdicaoVenda(venda) {
  prepararEditarVenda(
    venda,
    () => {
      fecharModal("modal-nova-venda");
      renderizarHistoricoVendas();
    },
    null,
    () => {
      removerVendaAnexada(venda.id);
      fecharModal("modal-nova-venda");
      renderizarHistoricoVendas();
    }
  );
  abrirModal("modal-nova-venda");
}

function abrirNovaVendaAvulsa() {
  prepararNovaVenda({ clienteId: null, nomeCliente: null, agendamentoId: null }, () => {
    fecharModal("modal-nova-venda");
    renderizarHistoricoVendas();
  });
  abrirModal("modal-nova-venda");
}

document.addEventListener("DOMContentLoaded", () => {
  const rotulo = qs("#js-periodo-label");
  if (!rotulo) return;
  iniciarTour("vendas");
  const labelPrincipal = qs("#js-periodo-principal");
  const labelSecundario = qs("#js-periodo-secundario");
  const rotulosPeriodo = { dia: "dia", semana: "semana", mes: "mês", ano: "ano" };

  function formatarCurto(data) {
    return `${String(data.getDate()).padStart(2, "0")} ${MESES_ABREV_RELATORIO[data.getMonth()]}`;
  }

  function atualizarRotuloPeriodo() {
    if (tipoPeriodo === "dia") {
      labelPrincipal.textContent = `${String(refData.getDate()).padStart(2, "0")} de ${MESES_NOME_RELATORIO[refData.getMonth()].toLowerCase()}`;
      labelSecundario.textContent = DIAS_SEMANA_RELATORIO[refData.getDay()];
    } else if (tipoPeriodo === "semana") {
      const ini = inicioDaSemanaRelatorio(refData);
      const fim = new Date(ini);
      fim.setDate(fim.getDate() + 6);
      labelPrincipal.textContent = `${formatarCurto(ini)} – ${formatarCurto(fim)}`;
      labelSecundario.textContent = "domingo a sábado";
    } else if (tipoPeriodo === "mes") {
      labelPrincipal.textContent = `${MESES_NOME_RELATORIO[refData.getMonth()]} ${refData.getFullYear()}`;
      labelSecundario.textContent = "";
    } else {
      labelPrincipal.textContent = `${refData.getFullYear()}`;
      labelSecundario.textContent = "";
    }
  }

  function atualizarVendas() {
    atualizarRotuloPeriodo();

    const { inicio, fim } = limitesPeriodo(tipoPeriodo, refData);
    const vendasPeriodo = vendasNoPeriodo(inicio, fim);
    const resumoVendas = calcularResumoVendas(vendasPeriodo);

    const refAnterior = periodoAnteriorRef(tipoPeriodo, refData);
    const { inicio: inicioAnt, fim: fimAnt } = limitesPeriodo(tipoPeriodo, refAnterior);
    const resumoVendasAnterior = calcularResumoVendas(vendasNoPeriodo(inicioAnt, fimAnt));

    const rotuloComparacao = rotulosPeriodo[tipoPeriodo];

    qs("#js-vendas-faturamento").textContent = formatarMoeda(resumoVendas.faturamento);
    const compVendas = formatarComparacao(resumoVendas.faturamento, resumoVendasAnterior.faturamento, rotuloComparacao, "valor");
    qs("#js-vendas-faturamento-comparacao").innerHTML = compVendas.texto;
    qs("#js-vendas-faturamento-comparacao").className = `insight-card__comparacao ${compVendas.classe}`;

    qs("#js-vendas-contagem").textContent = resumoVendas.contagem;
    const compVendasContagem = formatarComparacao(resumoVendas.contagem, resumoVendasAnterior.contagem, rotuloComparacao, "contagem");
    qs("#js-vendas-contagem-comparacao").innerHTML = compVendasContagem.texto;
    qs("#js-vendas-contagem-comparacao").className = `insight-card__comparacao ${compVendasContagem.classe}`;

    const ticketMedioVendas = resumoVendas.contagem > 0 ? resumoVendas.faturamento / resumoVendas.contagem : 0;
    qs("#js-vendas-ticket").textContent = formatarMoeda(ticketMedioVendas);

    qs("#js-vendas-custo").textContent = formatarMoeda(resumoVendas.custo);
    qs("#js-vendas-lucro").textContent = formatarMoeda(resumoVendas.lucro);
    qs("#js-vendas-taxas").textContent = formatarMoeda(resumoVendas.taxas);

    montarRecebimentos(resumoVendas, "js-vendas-formas", "js-vendas-pizza");

    const maisVendidos = calcularMaisVendidos(vendasPeriodo)
      .sort((a, b) => b.quantidade - a.quantidade)
      .map((item) => ({ nome: item.produto.nome, valor: item.quantidade }));
    montarRankingPodio(maisVendidos, "js-vendas-mais-vendidos", "js-vendas-mais-vendidos-resto", "js-vendas-mais-vendidos-vazio", "js-vendas-mais-vendidos-ver-todos", estadoExpandidoRanking.vendidos);

    // Lista de vendas recentes respeita o mesmo período dos cards acima.
    renderizarHistoricoVendas();
  }

  qs("#js-vendas-mais-vendidos-ver-todos").addEventListener("click", () => {
    estadoExpandidoRanking.vendidos = !estadoExpandidoRanking.vendidos;
    atualizarVendas();
  });

  qs("#js-historico-vendas-toggle").addEventListener("click", () => {
    historicoVendasExpandido = !historicoVendasExpandido;
    renderizarHistoricoVendas();
  });

  qsa(".segmented__item", qs("#js-filtro-vendas")).forEach((item) => {
    item.addEventListener("click", () => {
      qsa(".segmented__item", qs("#js-filtro-vendas")).forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
      filtroVendasAtual = item.dataset.filtro;
      historicoVendasExpandido = false;
      renderizarHistoricoVendas();
    });
  });

  function avancarPeriodo(direcao) {
    if (tipoPeriodo === "dia") refData.setDate(refData.getDate() + direcao);
    else if (tipoPeriodo === "semana") refData.setDate(refData.getDate() + direcao * 7);
    else if (tipoPeriodo === "mes") refData.setMonth(refData.getMonth() + direcao);
    else refData.setFullYear(refData.getFullYear() + direcao);
    estadoExpandidoRanking.vendidos = false;
    historicoVendasExpandido = false;
    atualizarVendas();
  }

  qs("#js-periodo-anterior").addEventListener("click", () => avancarPeriodo(-1));
  qs("#js-periodo-proximo").addEventListener("click", () => avancarPeriodo(1));

  const mapaAba = { "dia": "dia", "semana": "semana", "mês": "mes", "ano": "ano" };
  qsa(".segmented__item", qs("#js-periodo-tabs")).forEach((item) => {
    item.addEventListener("click", () => {
      qsa(".segmented__item", qs("#js-periodo-tabs")).forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
      const chave = item.textContent.trim().toLowerCase();
      tipoPeriodo = mapaAba[chave] || tipoPeriodo;
      estadoExpandidoRanking.vendidos = false;
      historicoVendasExpandido = false;
      atualizarVendas();
    });
  });

  atualizarVendas();

  // Botão de calendário do cabeçalho — pula pro período de um dia escolhido.
  // Tem id próprio (não o seletor genérico [data-abrir-modal="modal-calendario"])
  // porque esta página também tem #js-venda-data-btn com o mesmo atributo (o
  // seletor de "Data da venda" dentro do modal de nova venda) — os dois
  // disputam o mesmo hook global window.aoSelecionarDiaCalendarioAgenda, então
  // cada um só o reivindica no momento do próprio clique (quem foi clicado por
  // último manda), nunca uma atribuição fixa no load.
  qs("#js-vendas-btn-calendario").addEventListener("click", () => {
    if (typeof window.irParaMesCalendarioAgenda === "function") {
      window.irParaMesCalendarioAgenda(refData.getFullYear(), refData.getMonth(), refData.getDate());
    }
    window.aoSelecionarDiaCalendarioAgenda = (ano, mes, dia) => {
      refData = new Date(ano, mes, dia);
      estadoExpandidoRanking.vendidos = false;
      historicoVendasExpandido = false;
      atualizarVendas();
    };
  });
});
