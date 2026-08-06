/* ============================================================
   AGENDA V3 — Tela Atendimentos (ex-Relatório, Fase 3, Etapa 8)
   Card de período navegável (Dia/Semana/Mês/Ano) com todos os
   números calculados de verdade a partir de agendaV3:agendamentos.
   "Faturamento" conta realizado_pago + realizado_pendente (regra
   já fechada: pendente conta no dia do atendimento). "Recebimentos"
   mostra o que já entrou por forma de pagamento (só realizado_pago)
   mais uma fatia "Pendentes" com o que ainda está em aberto no
   período, pra dar a foto completa do que é dinheiro na mão vs.
   dinheiro a receber.

   A seção de Vendas que existia aqui (gráfico, insights, recebimentos,
   parados) se mudou pra vendas.html/js/vendas-pagina.js (2026-08-04) —
   Atendimentos e Vendas agora são páginas próprias do menu inferior,
   cada uma com seu período independente. Os helpers genéricos de
   data/formatação/gráfico usados pelas duas ficaram centralizados em
   js/utils.js.
   ============================================================ */

function agendamentosNoPeriodo(inicio, fim) {
  const inicioIso = dataLocalParaIso(inicio);
  const fimIso = dataLocalParaIso(fim);
  return obterAgendamentos().filter((a) => a.status && a.status.startsWith("realizado_") && a.data >= inicioIso && a.data <= fimIso);
}

/* Mais realizados — mesma lógica que existia em ranking-servicos.js,
   portada aqui pra usar o período Dia/Semana/Mês/Ano que a página já
   tem, em vez do sistema Ano/Mês/Personalizado daquela página
   (aposentada). */
function calcularMaisRealizados(agendamentos) {
  const servicosAtivos = obterServicos().filter((s) => s.ativo);
  const contagem = {};
  agendamentos.forEach((a) => {
    (a.servicosIds || []).forEach((id) => { contagem[id] = (contagem[id] || 0) + 1; });
  });
  return servicosAtivos
    .map((servico) => ({ servico, quantidade: contagem[servico.id] || 0 }))
    .filter((item) => item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade);
}

/* Serviços mais realizados: pódio (2026-07-30) via montarRankingPodio,
   compartilhado com "Mais vendidos" de Vendas (js/utils.js, 2026-08-05).
   Estado de expandido fora do closure do DOMContentLoaded pra sobreviver
   a atualizarRelatorio(). */
const estadoExpandidoRanking = { realizados: false };

function calcularResumo(agendamentos) {
  const formas = obterFormasPagamento();
  const faturamento = agendamentos.reduce((soma, a) => soma + (a.valorTotal || 0), 0);
  const atendimentos = agendamentos.length;
  const pendente = agendamentos.filter((a) => a.status === "realizado_pendente").reduce((soma, a) => soma + (a.valorTotal || 0), 0);

  const porFormaValor = {};
  let totalRecebido = 0;
  let taxas = 0;

  agendamentos.filter((a) => a.status === "realizado_pago").forEach((a) => {
    (a.pagamentos || []).forEach((p) => {
      const forma = formas.find((f) => f.id === p.formaPagamentoId);
      if (!forma) return;
      porFormaValor[forma.id] = (porFormaValor[forma.id] || 0) + p.valor;
      totalRecebido += p.valor;
      if (forma.taxaPercentual) taxas += (p.valor * forma.taxaPercentual) / 100;
    });
  });

  return { faturamento, atendimentos, totalRecebido, taxas, pendente, porFormaValor };
}

function valorFaturamentoAtendimentos(inicio, fim) {
  return agendamentosNoPeriodo(inicio, fim).reduce((s, a) => s + (a.valorTotal || 0), 0);
}

const IDS_GRAFICO_ATENDIMENTOS = { linha: "js-relatorio-grafico-linha", area: "js-relatorio-grafico-area", dias: "js-relatorio-grafico-dias", eixoMax: "js-relatorio-eixo-max", eixoMeio: "js-relatorio-eixo-meio" };

function nomesServicosAtendimento(ids) {
  const servicos = obterServicos();
  return (ids || []).map((id) => (servicos.find((s) => s.id === id) || {}).nome).filter(Boolean).join(", ");
}

/* Lista de atendimentos realizados no período — cada linha é um link real
   pra Agenda (não um modal nesta página): index.html?data=X&abrirAtendimento=Y
   navega pro dia certo e já abre o modal de editar realizado direto lá,
   reaproveitando prepararEditarRealizado()/js/agenda.js sem precisar
   duplicar toda aquela lógica (cliente/serviços/observação/venda anexada)
   nesta página — ver js/agenda.js pro bootstrap que lê esse parâmetro. */
const LIMITE_ATENDIMENTOS_REALIZADOS = 5;
let atendimentosRealizadosExpandido = false;

function montarLinhaAtendimento(agendamento, indice) {
  const linha = document.createElement("a");
  linha.href = `index.html?data=${agendamento.data}&abrirAtendimento=${agendamento.id}`;
  linha.className = "list-item";
  linha.style.textDecoration = "none";
  linha.style.color = "inherit";
  const pago = agendamento.status === "realizado_pago";
  linha.innerHTML = `
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
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
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(agendamento.nomeCliente);
  linha.querySelector(".list-item__title").textContent = agendamento.nomeCliente;
  const servicos = nomesServicosAtendimento(agendamento.servicosIds);
  linha.querySelector(".list-item__subtitle").textContent = `${servicos || "—"} · ${formatarDataCurta(agendamento.data)}`;
  linha.querySelector(".list-item__trailing p").textContent = formatarMoeda(agendamento.valorTotal || 0);
  return linha;
}

function renderizarAtendimentosRealizados(agendamentos) {
  const lista = agendamentos.slice().sort((a, b) => `${b.data}${b.hora}`.localeCompare(`${a.data}${a.hora}`));
  qs("#js-atendimentos-realizados-titulo").textContent = `Atendimentos (${lista.length})`;
  const container = qs("#js-lista-atendimentos-realizados");
  const vazio = qs("#js-atendimentos-realizados-vazio");
  const toggle = qs("#js-atendimentos-realizados-toggle");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    toggle.classList.add("is-hidden");
    return;
  }

  container.classList.remove("is-hidden");
  vazio.classList.add("is-hidden");
  const visiveis = atendimentosRealizadosExpandido ? lista : lista.slice(0, LIMITE_ATENDIMENTOS_REALIZADOS);
  visiveis.forEach((ag, i) => container.appendChild(montarLinhaAtendimento(ag, i)));

  if (lista.length > LIMITE_ATENDIMENTOS_REALIZADOS) {
    toggle.classList.remove("is-hidden");
    toggle.textContent = atendimentosRealizadosExpandido ? "Ver menos" : "Ver todas";
  } else {
    toggle.classList.add("is-hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const rotulo = qs("#js-periodo-label");
  if (!rotulo) return;
  iniciarTour("relatorios");
  const labelPrincipal = qs("#js-periodo-principal");
  const labelSecundario = qs("#js-periodo-secundario");

  let refData = new Date();
  let tipoPeriodo = "dia";
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

  function atualizarRelatorio() {
    atualizarRotuloPeriodo();

    const { inicio, fim } = limitesPeriodo(tipoPeriodo, refData);
    const resumo = calcularResumo(agendamentosNoPeriodo(inicio, fim));

    const refAnterior = periodoAnteriorRef(tipoPeriodo, refData);
    const { inicio: inicioAnt, fim: fimAnt } = limitesPeriodo(tipoPeriodo, refAnterior);
    const resumoAnterior = calcularResumo(agendamentosNoPeriodo(inicioAnt, fimAnt));

    const rotuloComparacao = rotulosPeriodo[tipoPeriodo];
    const ticketMedio = resumo.atendimentos > 0 ? resumo.faturamento / resumo.atendimentos : 0;

    qs("#js-relatorio-faturamento").textContent = formatarMoeda(resumo.faturamento);
    const compFaturamento = formatarComparacao(resumo.faturamento, resumoAnterior.faturamento, rotuloComparacao, "valor");
    qs("#js-relatorio-faturamento-comparacao").innerHTML = compFaturamento.texto;
    qs("#js-relatorio-faturamento-comparacao").className = `insight-card__comparacao ${compFaturamento.classe}`;

    qs("#js-relatorio-atendimentos").textContent = resumo.atendimentos;
    const compAtendimentos = formatarComparacao(resumo.atendimentos, resumoAnterior.atendimentos, rotuloComparacao, "contagem");
    qs("#js-relatorio-atendimentos-comparacao").innerHTML = compAtendimentos.texto;
    qs("#js-relatorio-atendimentos-comparacao").className = `insight-card__comparacao ${compAtendimentos.classe}`;

    qs("#js-relatorio-ticket").textContent = formatarMoeda(ticketMedio);
    qs("#js-relatorio-taxas").textContent = formatarMoeda(resumo.taxas);

    montarRecebimentos(resumo, "js-relatorio-formas", "js-relatorio-pizza");

    const maisRealizados = calcularMaisRealizados(agendamentosNoPeriodo(inicio, fim))
      .map((item) => ({ nome: item.servico.nome, valor: item.quantidade }));
    montarRankingPodio(maisRealizados, "js-relatorio-mais-realizados", "js-relatorio-mais-realizados-resto", "js-relatorio-mais-realizados-vazio", "js-relatorio-mais-realizados-ver-todos", estadoExpandidoRanking.realizados);

    renderizarAtendimentosRealizados(agendamentosNoPeriodo(inicio, fim));

    const svgGrafico = qs("#js-relatorio-grafico-svg");
    if (tipoPeriodo === "dia") {
      svgGrafico.classList.add("is-hidden");
    } else {
      svgGrafico.classList.remove("is-hidden");
      montarGraficoFaturamento(tipoPeriodo, refData, valorFaturamentoAtendimentos, IDS_GRAFICO_ATENDIMENTOS);
    }
  }

  qs("#js-relatorio-mais-realizados-ver-todos").addEventListener("click", () => {
    estadoExpandidoRanking.realizados = !estadoExpandidoRanking.realizados;
    atualizarRelatorio();
  });

  qs("#js-atendimentos-realizados-toggle").addEventListener("click", () => {
    atendimentosRealizadosExpandido = !atendimentosRealizadosExpandido;
    atualizarRelatorio();
  });

  function avancarPeriodo(direcao) {
    if (tipoPeriodo === "dia") refData.setDate(refData.getDate() + direcao);
    else if (tipoPeriodo === "semana") refData.setDate(refData.getDate() + direcao * 7);
    else if (tipoPeriodo === "mes") refData.setMonth(refData.getMonth() + direcao);
    else refData.setFullYear(refData.getFullYear() + direcao);
    estadoExpandidoRanking.realizados = false;
    atendimentosRealizadosExpandido = false;
    atualizarRelatorio();
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
      estadoExpandidoRanking.realizados = false;
      atendimentosRealizadosExpandido = false;
      atualizarRelatorio();
    });
  });

  atualizarRelatorio();

  qs('[data-abrir-modal="modal-calendario"]').addEventListener("click", () => {
    if (typeof window.irParaMesCalendarioAgenda === "function") {
      window.irParaMesCalendarioAgenda(refData.getFullYear(), refData.getMonth(), refData.getDate());
    }
    window.aoSelecionarDiaCalendarioAgenda = (ano, mes, dia) => {
      refData = new Date(ano, mes, dia);
      estadoExpandidoRanking.realizados = false;
      atendimentosRealizadosExpandido = false;
      atualizarRelatorio();
    };
  });
});
