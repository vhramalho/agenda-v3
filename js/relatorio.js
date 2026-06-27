/* ============================================================
   AGENDA V3 — Tela Relatório (Fase 3, Etapa 8)
   Card de período navegável (Dia/Semana/Mês/Ano) com todos os
   números calculados de verdade a partir de agendaV3:agendamentos.
   "Faturamento" conta realizado_pago + realizado_pendente (regra
   já fechada: pendente conta no dia do atendimento). "Recebimentos"
   só conta realizado_pago, já que é dinheiro que entrou de fato
   numa forma de pagamento conhecida.
   ============================================================ */

const MESES_NOME_RELATORIO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MESES_ABREV_RELATORIO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const CORES_FORMA = { pix: "var(--primary)", dinheiro: "var(--success)", credito: "#F59E0B", debito: "#3B82F6", outras: "var(--text-muted)" };

function dataLocalParaIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function inicioDaSemanaRelatorio(data) {
  const d = new Date(data);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function limitesPeriodo(tipo, refData) {
  if (tipo === "dia") {
    return { inicio: new Date(refData), fim: new Date(refData) };
  }
  if (tipo === "semana") {
    const inicio = inicioDaSemanaRelatorio(refData);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    return { inicio, fim };
  }
  if (tipo === "mes") {
    const inicio = new Date(refData.getFullYear(), refData.getMonth(), 1);
    const fim = new Date(refData.getFullYear(), refData.getMonth() + 1, 0);
    return { inicio, fim };
  }
  const inicio = new Date(refData.getFullYear(), 0, 1);
  const fim = new Date(refData.getFullYear(), 11, 31);
  return { inicio, fim };
}

function periodoAnteriorRef(tipo, refData) {
  const anterior = new Date(refData);
  if (tipo === "dia") anterior.setDate(anterior.getDate() - 1);
  else if (tipo === "semana") anterior.setDate(anterior.getDate() - 7);
  else if (tipo === "mes") anterior.setMonth(anterior.getMonth() - 1);
  else anterior.setFullYear(anterior.getFullYear() - 1);
  return anterior;
}

function agendamentosNoPeriodo(inicio, fim) {
  const inicioIso = dataLocalParaIso(inicio);
  const fimIso = dataLocalParaIso(fim);
  return obterAgendamentos().filter((a) => a.status && a.status.startsWith("realizado_") && a.data >= inicioIso && a.data <= fimIso);
}

function calcularResumo(agendamentos) {
  const formas = obterFormasPagamento();
  const faturamento = agendamentos.reduce((soma, a) => soma + (a.valorTotal || 0), 0);
  const atendimentos = agendamentos.length;

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

  return { faturamento, atendimentos, totalRecebido, taxas, porFormaValor };
}

function formatarComparacao(atual, anterior, rotuloPeriodo) {
  if (anterior === 0) {
    if (atual === 0) return { texto: `sem variação vs ${rotuloPeriodo} anterior`, classe: "text-secondary" };
    return { texto: `▲ novo vs ${rotuloPeriodo} anterior`, classe: "text-success" };
  }
  const variacao = ((atual - anterior) / anterior) * 100;
  const seta = variacao >= 0 ? "▲" : "▼";
  const classe = variacao >= 0 ? "text-success" : "text-danger";
  return { texto: `${seta} ${Math.abs(variacao).toFixed(1).replace(".", ",")}% vs ${rotuloPeriodo} anterior`, classe };
}

function montarGraficoSemana(refData) {
  const inicio = inicioDaSemanaRelatorio(refData);
  const valores = [];
  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicio);
    dia.setDate(dia.getDate() + i);
    const agendamentosDoDia = agendamentosNoPeriodo(dia, dia);
    valores.push(agendamentosDoDia.reduce((soma, a) => soma + (a.valorTotal || 0), 0));
  }
  const maximo = Math.max(...valores, 1);
  const xs = [10, 56.7, 103.3, 150, 196.7, 243.3, 290];
  const pontos = valores.map((v, i) => {
    const y = 140 - (v / maximo) * 110;
    return [xs[i], y];
  });
  const pontosTexto = pontos.map((p) => p.join(",")).join(" ");
  qs("#js-relatorio-grafico-linha").setAttribute("points", pontosTexto);
  qs("#js-relatorio-grafico-area").setAttribute("points", `${pontosTexto} 290,140 10,140`);
  const grupoPontos = qs("#js-relatorio-grafico-pontos");
  grupoPontos.innerHTML = "";
  pontos.forEach(([x, y]) => {
    const circulo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circulo.setAttribute("cx", x);
    circulo.setAttribute("cy", y);
    circulo.setAttribute("r", "3.5");
    circulo.setAttribute("fill", "var(--primary)");
    grupoPontos.appendChild(circulo);
  });
}

function montarRecebimentos(resumo) {
  const formas = obterFormasPagamento().filter((f) => f.ativo);
  const container = qs("#js-relatorio-formas");
  const pizza = qs("#js-relatorio-pizza");
  container.innerHTML = "";
  pizza.innerHTML = "";

  qs("#js-relatorio-total-recebido").textContent = `Total recebido: ${formatarMoeda(resumo.totalRecebido)}`;

  const circunferencia = 2 * Math.PI * 45;
  let acumulado = 0;

  formas.forEach((forma) => {
    const valor = resumo.porFormaValor[forma.id] || 0;
    const percentual = resumo.totalRecebido > 0 ? (valor / resumo.totalRecebido) * 100 : 0;
    const cor = CORES_FORMA[forma.tipo] || "var(--text-muted)";

    const linha = document.createElement("div");
    linha.className = "row row--between";
    linha.innerHTML = `
      <span class="row" style="gap:8px;"><span style="width:8px;height:8px;border-radius:50%;background:${cor};display:inline-block;"></span><span class="js-nome-forma"></span></span>
      <span class="js-valor-forma" style="font-weight:600;"></span>
      <span class="text-muted js-percentual-forma" style="width:44px;text-align:right;"></span>
    `;
    linha.querySelector(".js-nome-forma").textContent = forma.nome;
    linha.querySelector(".js-valor-forma").textContent = formatarMoeda(valor);
    linha.querySelector(".js-percentual-forma").textContent = `${percentual.toFixed(1).replace(".", ",")}%`;
    container.appendChild(linha);

    if (valor > 0) {
      const fatia = (percentual / 100) * circunferencia;
      const circulo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circulo.setAttribute("cx", "60");
      circulo.setAttribute("cy", "60");
      circulo.setAttribute("r", "45");
      circulo.setAttribute("fill", "none");
      circulo.setAttribute("stroke", cor);
      circulo.setAttribute("stroke-width", "18");
      circulo.setAttribute("stroke-dasharray", `${fatia} ${circunferencia - fatia}`);
      circulo.setAttribute("stroke-dashoffset", `${-acumulado}`);
      pizza.appendChild(circulo);
      acumulado += fatia;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const rotulo = qs("#js-periodo-label");
  if (!rotulo) return;

  let refData = new Date();
  let tipoPeriodo = "semana";
  const rotulosPeriodo = { dia: "dia", semana: "semana", mes: "mês", ano: "ano" };

  function formatarCurto(data) {
    return `${String(data.getDate()).padStart(2, "0")} ${MESES_ABREV_RELATORIO[data.getMonth()]}`;
  }

  function atualizarRotuloPeriodo() {
    if (tipoPeriodo === "dia") {
      rotulo.textContent = `${String(refData.getDate()).padStart(2, "0")} de ${MESES_NOME_RELATORIO[refData.getMonth()].toLowerCase()} de ${refData.getFullYear()}`;
    } else if (tipoPeriodo === "semana") {
      const ini = inicioDaSemanaRelatorio(refData);
      const fim = new Date(ini);
      fim.setDate(fim.getDate() + 6);
      rotulo.textContent = `${formatarCurto(ini)} – ${formatarCurto(fim)}`;
    } else if (tipoPeriodo === "mes") {
      rotulo.textContent = `${MESES_NOME_RELATORIO[refData.getMonth()]} ${refData.getFullYear()}`;
    } else {
      rotulo.textContent = `${refData.getFullYear()}`;
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
    const ticketMedioAnterior = resumoAnterior.atendimentos > 0 ? resumoAnterior.faturamento / resumoAnterior.atendimentos : 0;

    qs("#js-relatorio-faturamento").textContent = formatarMoeda(resumo.faturamento);
    const compFaturamento = formatarComparacao(resumo.faturamento, resumoAnterior.faturamento, rotuloComparacao);
    qs("#js-relatorio-faturamento-comparacao").textContent = compFaturamento.texto;
    qs("#js-relatorio-faturamento-comparacao").className = compFaturamento.classe;
    qs("#js-relatorio-faturamento-comparacao").style.fontWeight = "600";
    qs("#js-relatorio-faturamento-comparacao").style.fontSize = "var(--text-sm)";

    qs("#js-relatorio-atendimentos").textContent = resumo.atendimentos;
    const compAtendimentos = formatarComparacao(resumo.atendimentos, resumoAnterior.atendimentos, rotuloComparacao);
    qs("#js-relatorio-atendimentos-comparacao").textContent = compAtendimentos.texto;
    qs("#js-relatorio-atendimentos-comparacao").className = `insight-card__comparacao ${compAtendimentos.classe}`;

    qs("#js-relatorio-ticket").textContent = formatarMoeda(ticketMedio);
    const compTicket = formatarComparacao(ticketMedio, ticketMedioAnterior, rotuloComparacao);
    qs("#js-relatorio-ticket-comparacao").textContent = compTicket.texto;
    qs("#js-relatorio-ticket-comparacao").className = `insight-card__comparacao ${compTicket.classe}`;

    qs("#js-relatorio-taxas").textContent = formatarMoeda(resumo.taxas);
    const compTaxas = formatarComparacao(resumo.taxas, resumoAnterior.taxas, rotuloComparacao);
    qs("#js-relatorio-taxas-comparacao").textContent = compTaxas.texto;
    qs("#js-relatorio-taxas-comparacao").className = `insight-card__comparacao ${compTaxas.classe}`;

    montarRecebimentos(resumo);
    montarGraficoSemana(refData);
  }

  function avancarPeriodo(direcao) {
    if (tipoPeriodo === "dia") refData.setDate(refData.getDate() + direcao);
    else if (tipoPeriodo === "semana") refData.setDate(refData.getDate() + direcao * 7);
    else if (tipoPeriodo === "mes") refData.setMonth(refData.getMonth() + direcao);
    else refData.setFullYear(refData.getFullYear() + direcao);
    atualizarRelatorio();
  }

  qs("#js-periodo-anterior").addEventListener("click", () => avancarPeriodo(-1));
  qs("#js-periodo-proximo").addEventListener("click", () => avancarPeriodo(1));

  const mapaAba = { "dia": "dia", "semana": "semana", "mês": "mes", "ano": "ano" };
  qsa(".segmented__item").forEach((item) => {
    item.addEventListener("click", () => {
      qsa(".segmented__item").forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
      const chave = item.textContent.trim().toLowerCase();
      tipoPeriodo = mapaAba[chave] || tipoPeriodo;
      atualizarRelatorio();
    });
  });

  atualizarRelatorio();
});
