/* ============================================================
   AGENDA V3 — Tela Relatório (Fase 3, Etapa 8)
   Card de período navegável (Dia/Semana/Mês/Ano) com todos os
   números calculados de verdade a partir de agendaV3:agendamentos.
   "Faturamento" conta realizado_pago + realizado_pendente (regra
   já fechada: pendente conta no dia do atendimento). "Recebimentos"
   mostra o que já entrou por forma de pagamento (só realizado_pago)
   mais uma fatia "Pendentes" com o que ainda está em aberto no
   período, pra dar a foto completa do que é dinheiro na mão vs.
   dinheiro a receber.
   ============================================================ */

const MESES_NOME_RELATORIO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MESES_ABREV_RELATORIO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const CORES_FORMA = { pix: "#3B82F6", dinheiro: "#22C55E", credito: "#EC4899", debito: "#EAB308", outras: "#94A3B8", pendentes: "var(--danger)" };
const ROTULO_TIPO_FORMA = { pix: "Pix", dinheiro: "Dinheiro", credito: "Crédito", debito: "Débito", outras: "Outras", pendentes: "Pendentes" };
const ORDEM_TIPOS_FORMA = ["pix", "dinheiro", "credito", "debito", "outras", "pendentes"];

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

function vendasNoPeriodo(inicio, fim) {
  const inicioIso = dataLocalParaIso(inicio);
  const fimIso = dataLocalParaIso(fim);
  return obterVendas().filter((v) => {
    const dataVenda = v.criadaEm.slice(0, 10);
    return dataVenda >= inicioIso && dataVenda <= fimIso;
  });
}

/* Custo/lucro só consideram itens de produtos com precoCusto informado
   (campo opcional) — sem isso não há como saber o custo daquele item. */
function calcularCustoLucroVendas(vendas) {
  const produtos = obterProdutos();
  let custo = 0;
  let lucro = 0;
  vendas.forEach((v) => {
    (v.itens || []).forEach((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId);
      if (produto && produto.precoCusto != null) {
        custo += produto.precoCusto * item.quantidade;
        lucro += (item.precoUnitario - produto.precoCusto) * item.quantidade;
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

/* Mais realizados/vendidos — mesma lógica que existia em ranking-servicos.js/
   ranking-produtos.js, portada aqui pra usar o período Dia/Semana/Mês/Ano
   que a página já compartilha, em vez do sistema Ano/Mês/Personalizado
   daquelas páginas (aposentadas). */
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

function calcularMaisVendidos(vendas) {
  const produtosAtivos = obterProdutos().filter((p) => p.ativo);
  const contagem = {};
  const valorPorProduto = {};
  vendas.forEach((v) => {
    (v.itens || []).forEach((item) => {
      contagem[item.produtoId] = (contagem[item.produtoId] || 0) + item.quantidade;
      valorPorProduto[item.produtoId] = (valorPorProduto[item.produtoId] || 0) + item.quantidade * item.precoUnitario;
    });
  });
  return produtosAtivos
    .map((produto) => ({ produto, quantidade: contagem[produto.id] || 0, valor: valorPorProduto[produto.id] || 0 }))
    .filter((item) => item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade);
}

function montarLinhaRankingServico(item, posicao, indice) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <span class="ranking-posicao ${classePosicaoRanking(posicao)}">${posicao}</span>
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <span class="text-primary-accent" style="font-weight:700;"></span>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.servico.nome);
  linha.querySelector(".list-item__title").textContent = item.servico.nome;
  linha.querySelector(".text-primary-accent").textContent = item.quantidade;
  return linha;
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
  linha.querySelector(".text-primary-accent").textContent = item.quantidade;
  return linha;
}

/* Parados: produtos ativos, com estoque e com diasParaAvisarParado
   configurado (ver js/produtos.js), sem venda há pelo menos esse número
   de dias — checado contra hoje, não contra o período do relatório. */
function calcularParados() {
  const hoje = hojeIso();
  const vendas = obterVendas();
  return obterProdutos()
    .filter((p) => p.ativo && p.estoque > 0 && p.diasParaAvisarParado)
    .map((produto) => {
      const vendasProduto = vendas.filter((v) => (v.itens || []).some((i) => i.produtoId === produto.id));
      if (vendasProduto.length === 0) return { produto, diasSemVenda: null };
      const ultimaVenda = vendasProduto.reduce((max, v) => (v.criadaEm > max ? v.criadaEm : max), vendasProduto[0].criadaEm);
      const diasSemVenda = Math.floor((new Date(hoje) - new Date(ultimaVenda.slice(0, 10))) / 86400000);
      return { produto, diasSemVenda };
    })
    .filter((item) => item.diasSemVenda === null || item.diasSemVenda >= item.produto.diasParaAvisarParado);
}

/* Cards de ranking (Serviços mais realizados / Mais vendidos) mostram só o
   top 3 por padrão — "Ver todos" expande a lista inteira na mesma tela,
   sem navegar pra outra página (não existe mais ranking-servicos.html/
   ranking-produtos.html, ver comentário acima). O estado de expandido fica
   fora do closure do DOMContentLoaded pra sobreviver a atualizarRelatorio(). */
const estadoExpandidoRanking = { realizados: false, vendidos: false };

function montarListaRanking(lista, containerId, vazioId, botaoId, montarLinha, chaveEstado) {
  const container = qs(`#${containerId}`);
  const vazio = qs(`#${vazioId}`);
  const botao = qs(`#${botaoId}`);
  container.innerHTML = "";

  if (lista.length === 0) {
    container.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    botao.classList.add("is-hidden");
    return;
  }

  container.classList.remove("is-hidden");
  vazio.classList.add("is-hidden");

  const expandido = estadoExpandidoRanking[chaveEstado];
  const visiveis = expandido ? lista : lista.slice(0, 3);
  visiveis.forEach((item, i) => container.appendChild(montarLinha(item, i + 1, i)));

  if (lista.length > 3) {
    botao.classList.remove("is-hidden");
    botao.textContent = expandido ? "Ver menos" : "Ver todos";
  } else {
    botao.classList.add("is-hidden");
  }
}

/* Gráfico de barras (quantidade × produto) — substitui a lista de "Mais
   vendidos" (2026-07-12). Top 5 por padrão, "Ver todos" expande igual ao
   padrão de montarListaRanking, mesmo estadoExpandidoRanking.vendidos.
   Escala das barras é sempre contra o maior item da lista inteira (não só
   dos visíveis), pra não redimensionar ao expandir/recolher. */
function montarLinhaBarraProduto(item, maiorQuantidade) {
  const linha = document.createElement("div");
  linha.className = "grafico-barras__linha";
  linha.innerHTML = `
    <div class="row row--between" style="margin-bottom:4px;">
      <p class="grafico-barras__rotulo"></p>
      <span>
        <span class="grafico-barras__valor"></span>
        <span class="grafico-barras__valor-secundario"></span>
      </span>
    </div>
    <div class="grafico-barras__trilha">
      <div class="grafico-barras__preenchimento"></div>
    </div>
  `;
  linha.querySelector(".grafico-barras__rotulo").textContent = item.produto.nome;
  linha.querySelector(".grafico-barras__valor").textContent = item.quantidade;
  linha.querySelector(".grafico-barras__valor-secundario").textContent = ` · ${formatarMoeda(item.valor)}`;
  linha.querySelector(".grafico-barras__preenchimento").style.width = `${maiorQuantidade > 0 ? (item.quantidade / maiorQuantidade) * 100 : 0}%`;
  return linha;
}

function montarGraficoBarrasProdutos(lista, containerId, vazioId, botaoId, chaveEstado) {
  const container = qs(`#${containerId}`);
  const vazio = qs(`#${vazioId}`);
  const botao = qs(`#${botaoId}`);
  container.innerHTML = "";

  if (lista.length === 0) {
    container.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    botao.classList.add("is-hidden");
    return;
  }

  container.classList.remove("is-hidden");
  vazio.classList.add("is-hidden");

  const expandido = estadoExpandidoRanking[chaveEstado];
  const visiveis = expandido ? lista : lista.slice(0, 5);
  const maiorQuantidade = lista[0].quantidade;
  visiveis.forEach((item) => container.appendChild(montarLinhaBarraProduto(item, maiorQuantidade)));

  if (lista.length > 5) {
    botao.classList.remove("is-hidden");
    botao.textContent = expandido ? "Ver menos" : "Ver todos";
  } else {
    botao.classList.add("is-hidden");
  }
}

function montarLinhaParado(item) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <div class="list-item__avatar"></div>
    <div class="list-item__body"><p class="list-item__title"></p><p class="list-item__subtitle"></p></div>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.produto.nome);
  linha.querySelector(".list-item__title").textContent = item.produto.nome;
  linha.querySelector(".list-item__subtitle").textContent = item.diasSemVenda == null ? "Nunca vendido" : `${item.diasSemVenda} dias sem vender`;
  return linha;
}

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

/* incluirRotulo=true só no card de Faturamento e Atendimentos (destaques
   com espaço de sobra); os insight-cards menores (Ticket médio, Taxas)
   mostram só a seta + valor, sem "vs X anterior". Quando incluirRotulo=true,
   o "vs X anterior" vem num <span> à parte (texto é HTML, não texto puro)
   pra poder ficar em cor secundária, diferente da seta+valor que fica
   verde/vermelho. */
function formatarComparacao(atual, anterior, rotuloPeriodo, tipo = "valor", incluirRotulo = true) {
  const diff = atual - anterior;
  const sufixo = incluirRotulo ? ` <span class="text-secondary">vs ${rotuloPeriodo} anterior</span>` : "";
  if (diff === 0) return { texto: incluirRotulo ? `sem variação${sufixo}` : "sem variação", classe: "text-secondary" };

  const seta = diff > 0 ? "▲" : "▼";
  const classe = diff > 0 ? "text-success" : "text-danger";

  if (tipo === "contagem") {
    return { texto: `${seta}${Math.abs(diff)}${sufixo}`, classe };
  }

  // tipo "valor" (dinheiro)
  return { texto: `${seta}${formatarMoeda(Math.abs(diff))}${sufixo}`, classe };
}

const DIAS_ABREV_RELATORIO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_SEMANA_RELATORIO = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

function formatarEixoY(v) {
  if (v >= 1000) {
    const milhares = v / 1000;
    return `R$${milhares % 1 === 0 ? milhares : milhares.toFixed(1)}k`;
  }
  return `R$${Math.round(v)}`;
}

/* obterValorPeriodo(inicio, fim) => number — abstrai a fonte dos pontos
   (faturamento de atendimentos ou de vendas) pra essa função e o
   desenho do gráfico (montarGraficoFaturamento, abaixo) servirem as
   duas abas do Relatório sem duplicar a lógica de dia/mês/ano. */
function calcularPontosGrafico(tipoPeriodo, refData, obterValorPeriodo) {
  if (tipoPeriodo === "mes") {
    const ultimoDia = new Date(refData.getFullYear(), refData.getMonth() + 1, 0).getDate();
    const pontos = [];
    const rotulos = [];
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const data = new Date(refData.getFullYear(), refData.getMonth(), dia);
      const valor = obterValorPeriodo(data, data);
      const frac = (dia - 1) / (ultimoDia - 1 || 1);
      pontos.push({ frac, valor, marcado: true });
      if (dia === 1 || dia % 5 === 0) rotulos.push({ frac, texto: String(dia) });
    }
    return { pontos, rotulos };
  }

  if (tipoPeriodo === "ano") {
    const pontos = [];
    const rotulos = [];
    for (let mes = 0; mes < 12; mes++) {
      const inicio = new Date(refData.getFullYear(), mes, 1);
      const fim = new Date(refData.getFullYear(), mes + 1, 0);
      const valor = obterValorPeriodo(inicio, fim);
      const frac = mes / 11;
      pontos.push({ frac, valor, marcado: true });
      rotulos.push({ frac, texto: MESES_ABREV_RELATORIO[mes][0].toUpperCase() + MESES_ABREV_RELATORIO[mes].slice(1) });
    }
    return { pontos, rotulos };
  }

  // semana (padrão)
  const inicio = inicioDaSemanaRelatorio(refData);
  const pontos = [];
  const rotulos = [];
  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicio);
    dia.setDate(dia.getDate() + i);
    const valor = obterValorPeriodo(dia, dia);
    const frac = i / 6;
    pontos.push({ frac, valor, marcado: true });
    rotulos.push({ frac, texto: DIAS_ABREV_RELATORIO[i] });
  }
  return { pontos, rotulos };
}

function valorFaturamentoAtendimentos(inicio, fim) {
  return agendamentosNoPeriodo(inicio, fim).reduce((s, a) => s + (a.valorTotal || 0), 0);
}

function valorFaturamentoVendas(inicio, fim) {
  return vendasNoPeriodo(inicio, fim).reduce((s, v) => s + (v.valorTotal || 0), 0);
}

/* ids = { linha, area, pontos, dias, eixoMax, eixoMeio } — os ids dos
   elementos do SVG a preencher (o gráfico existe duas vezes na página,
   um por aba, com ids "js-relatorio-*" e "js-vendas-*"). */
function montarGraficoFaturamento(tipoPeriodo, refData, obterValorPeriodo, ids) {
  const { pontos, rotulos } = calcularPontosGrafico(tipoPeriodo, refData, obterValorPeriodo);
  const maximo = Math.max(...pontos.map((p) => p.valor), 1);
  const plotTop = 10;
  const plotBottom = 126;
  const plotLeft = 42;
  const plotRight = 288;
  const paraXY = (p) => [plotLeft + p.frac * (plotRight - plotLeft), plotBottom - (p.valor / maximo) * (plotBottom - plotTop)];

  const pontosTexto = pontos.map((p) => paraXY(p).join(",")).join(" ");
  qs(`#${ids.linha}`).setAttribute("points", pontosTexto);
  qs(`#${ids.area}`).setAttribute("points", `${pontosTexto} ${plotRight},${plotBottom} ${plotLeft},${plotBottom}`);

  const grupoPontos = qs(`#${ids.pontos}`);
  grupoPontos.innerHTML = "";
  pontos.filter((p) => p.marcado).forEach((p) => {
    const [x, y] = paraXY(p);
    const circulo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circulo.setAttribute("cx", x);
    circulo.setAttribute("cy", y);
    circulo.setAttribute("r", "3.5");
    circulo.setAttribute("fill", "var(--primary)");
    grupoPontos.appendChild(circulo);
  });

  const grupoDias = qs(`#${ids.dias}`);
  grupoDias.innerHTML = "";
  rotulos.forEach((r) => {
    const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");
    texto.setAttribute("x", plotLeft + r.frac * (plotRight - plotLeft));
    texto.setAttribute("y", "143");
    texto.textContent = r.texto;
    grupoDias.appendChild(texto);
  });

  qs(`#${ids.eixoMax}`).textContent = formatarEixoY(maximo);
  qs(`#${ids.eixoMeio}`).textContent = formatarEixoY(maximo / 2);
}

const IDS_GRAFICO_ATENDIMENTOS = { linha: "js-relatorio-grafico-linha", area: "js-relatorio-grafico-area", pontos: "js-relatorio-grafico-pontos", dias: "js-relatorio-grafico-dias", eixoMax: "js-relatorio-eixo-max", eixoMeio: "js-relatorio-eixo-meio" };
const IDS_GRAFICO_VENDAS = { linha: "js-vendas-grafico-linha", area: "js-vendas-grafico-area", pontos: "js-vendas-grafico-pontos", dias: "js-vendas-grafico-dias", eixoMax: "js-vendas-eixo-max", eixoMeio: "js-vendas-eixo-meio" };

function montarRecebimentos(resumo, formasContainerId, pizzaContainerId) {
  const todasFormas = obterFormasPagamento();
  const tiposComFormaAtiva = new Set(todasFormas.filter((f) => f.ativo).map((f) => f.tipo));
  const container = qs(`#${formasContainerId || "js-relatorio-formas"}`);
  const pizza = qs(`#${pizzaContainerId || "js-relatorio-pizza"}`);
  container.innerHTML = "";
  pizza.innerHTML = "";

  const valorPorTipo = {};
  todasFormas.forEach((forma) => {
    const valor = resumo.porFormaValor[forma.id] || 0;
    if (valor > 0) valorPorTipo[forma.tipo] = (valorPorTipo[forma.tipo] || 0) + valor;
  });
  if (resumo.pendente > 0) valorPorTipo.pendentes = resumo.pendente;

  const tipos = ORDEM_TIPOS_FORMA.filter((tipo) => tiposComFormaAtiva.has(tipo) || valorPorTipo[tipo] > 0);

  const totalComPendente = resumo.totalRecebido + (resumo.pendente || 0);
  const circunferencia = 2 * Math.PI * 45;
  let acumulado = 0;

  tipos.forEach((tipo) => {
    const valor = valorPorTipo[tipo] || 0;
    const percentual = totalComPendente > 0 ? (valor / totalComPendente) * 100 : 0;
    const cor = CORES_FORMA[tipo] || "var(--text-muted)";

    const linha = document.createElement("div");
    linha.className = "row row--between";
    linha.innerHTML = `
      <span class="row" style="gap:8px;"><span style="width:8px;height:8px;border-radius:50%;background:${cor};display:inline-block;"></span><span class="js-nome-forma"></span></span>
      <span class="js-valor-forma" style="color:var(--text-secondary);"></span>
    `;
    linha.querySelector(".js-nome-forma").textContent = ROTULO_TIPO_FORMA[tipo] || tipo;
    linha.querySelector(".js-valor-forma").textContent = formatarMoeda(valor);
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
    const ticketMedioAnterior = resumoAnterior.atendimentos > 0 ? resumoAnterior.faturamento / resumoAnterior.atendimentos : 0;

    qs("#js-relatorio-faturamento").textContent = formatarMoeda(resumo.faturamento);
    const compFaturamento = formatarComparacao(resumo.faturamento, resumoAnterior.faturamento, rotuloComparacao, "valor");
    qs("#js-relatorio-faturamento-comparacao").innerHTML = compFaturamento.texto;
    qs("#js-relatorio-faturamento-comparacao").className = `texto-variacao ${compFaturamento.classe}`;
    qs("#js-relatorio-faturamento-comparacao").style.fontWeight = "600";
    qs("#js-relatorio-faturamento-comparacao").style.fontSize = "calc(var(--text-2xs) + 2px)";

    qs("#js-relatorio-atendimentos").textContent = resumo.atendimentos;
    const compAtendimentos = formatarComparacao(resumo.atendimentos, resumoAnterior.atendimentos, rotuloComparacao, "contagem");
    qs("#js-relatorio-atendimentos-comparacao").innerHTML = compAtendimentos.texto;
    qs("#js-relatorio-atendimentos-comparacao").className = `insight-card__comparacao texto-variacao ${compAtendimentos.classe}`;

    qs("#js-relatorio-ticket").textContent = formatarMoeda(ticketMedio);
    qs("#js-relatorio-taxas").textContent = formatarMoeda(resumo.taxas);

    montarRecebimentos(resumo, "js-relatorio-formas", "js-relatorio-pizza");

    const maisRealizados = calcularMaisRealizados(agendamentosNoPeriodo(inicio, fim));
    montarListaRanking(maisRealizados, "js-relatorio-mais-realizados", "js-relatorio-mais-realizados-vazio", "js-relatorio-mais-realizados-ver-todos", montarLinhaRankingServico, "realizados");

    const svgGrafico = qs("#js-relatorio-grafico-svg");
    if (tipoPeriodo === "dia") {
      svgGrafico.classList.add("is-hidden");
    } else {
      svgGrafico.classList.remove("is-hidden");
      montarGraficoFaturamento(tipoPeriodo, refData, valorFaturamentoAtendimentos, IDS_GRAFICO_ATENDIMENTOS);
    }

    /* ---------- Aba Vendas ---------- */
    const vendasPeriodo = vendasNoPeriodo(inicio, fim);
    const resumoVendas = calcularResumoVendas(vendasPeriodo);
    const resumoVendasAnterior = calcularResumoVendas(vendasNoPeriodo(inicioAnt, fimAnt));

    qs("#js-vendas-faturamento").textContent = formatarMoeda(resumoVendas.faturamento);
    const compVendas = formatarComparacao(resumoVendas.faturamento, resumoVendasAnterior.faturamento, rotuloComparacao, "valor");
    qs("#js-vendas-faturamento-comparacao").innerHTML = compVendas.texto;
    qs("#js-vendas-faturamento-comparacao").className = `texto-variacao ${compVendas.classe}`;

    // Gráfico de faturamento da aba Vendas desativado (2026-07-12) — substituído
    // pelo gráfico de barras de produtos mais vendidos, mais útil pra retail.
    // const svgGraficoVendas = qs("#js-vendas-grafico-svg");
    // if (tipoPeriodo === "dia") {
    //   svgGraficoVendas.classList.add("is-hidden");
    // } else {
    //   svgGraficoVendas.classList.remove("is-hidden");
    //   montarGraficoFaturamento(tipoPeriodo, refData, valorFaturamentoVendas, IDS_GRAFICO_VENDAS);
    // }

    qs("#js-vendas-contagem").textContent = resumoVendas.contagem;
    const compVendasContagem = formatarComparacao(resumoVendas.contagem, resumoVendasAnterior.contagem, rotuloComparacao, "contagem");
    qs("#js-vendas-contagem-comparacao").innerHTML = compVendasContagem.texto;
    qs("#js-vendas-contagem-comparacao").className = `insight-card__comparacao ${compVendasContagem.classe}`;

    qs("#js-vendas-custo").textContent = formatarMoeda(resumoVendas.custo);
    qs("#js-vendas-lucro").textContent = formatarMoeda(resumoVendas.lucro);
    qs("#js-vendas-taxas").textContent = formatarMoeda(resumoVendas.taxas);

    montarRecebimentos(resumoVendas, "js-vendas-formas", "js-vendas-pizza");

    const maisVendidos = calcularMaisVendidos(vendasPeriodo);
    montarGraficoBarrasProdutos(maisVendidos, "js-vendas-mais-vendidos", "js-vendas-mais-vendidos-vazio", "js-vendas-mais-vendidos-ver-todos", "vendidos");

    const parados = calcularParados();
    const containerParados = qs("#js-vendas-parados");
    const vazioParados = qs("#js-vendas-parados-vazio");
    containerParados.innerHTML = "";
    if (parados.length === 0) {
      containerParados.classList.add("is-hidden");
      vazioParados.classList.remove("is-hidden");
    } else {
      containerParados.classList.remove("is-hidden");
      vazioParados.classList.add("is-hidden");
      parados.forEach((item) => containerParados.appendChild(montarLinhaParado(item)));
    }
  }

  qs("#js-relatorio-mais-realizados-ver-todos").addEventListener("click", () => {
    estadoExpandidoRanking.realizados = !estadoExpandidoRanking.realizados;
    atualizarRelatorio();
  });
  qs("#js-vendas-mais-vendidos-ver-todos").addEventListener("click", () => {
    estadoExpandidoRanking.vendidos = !estadoExpandidoRanking.vendidos;
    atualizarRelatorio();
  });

  function avancarPeriodo(direcao) {
    if (tipoPeriodo === "dia") refData.setDate(refData.getDate() + direcao);
    else if (tipoPeriodo === "semana") refData.setDate(refData.getDate() + direcao * 7);
    else if (tipoPeriodo === "mes") refData.setMonth(refData.getMonth() + direcao);
    else refData.setFullYear(refData.getFullYear() + direcao);
    estadoExpandidoRanking.realizados = false;
    estadoExpandidoRanking.vendidos = false;
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
      estadoExpandidoRanking.vendidos = false;
      atualizarRelatorio();
    });
  });

  atualizarRelatorio();

  qs('[data-abrir-modal="modal-calendario"]').addEventListener("click", () => {
    if (typeof window.irParaMesCalendarioAgenda === "function") {
      window.irParaMesCalendarioAgenda(refData.getFullYear(), refData.getMonth(), refData.getDate());
    }
  });

  window.aoSelecionarDiaCalendarioAgenda = (ano, mes, dia) => {
    refData = new Date(ano, mes, dia);
    estadoExpandidoRanking.realizados = false;
    estadoExpandidoRanking.vendidos = false;
    atualizarRelatorio();
  };
});
