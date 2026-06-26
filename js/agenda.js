/* ============================================================
   AGENDA V3 — Tela Agenda (Fase 3), parte 1: estado, datas,
   classificação da grade do dia (algoritmo de encaixe) e
   renderização da lista de horários.
   ============================================================ */

const DIAS_SEMANA_ABREV = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const DIAS_SEMANA_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

let dataSelecionada = hojeIso();
let horaModalAtual = null;
let agendamentoModalAtual = null;
let bloqueioPontualEditandoId = null;

function dataParaIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isoParaDate(iso) {
  return new Date(`${iso}T00:00:00`);
}

function diaDaSemanaAbrev(iso) {
  return DIAS_SEMANA_ABREV[isoParaDate(iso).getDay()];
}

function formatarDataLonga(iso) {
  const d = isoParaDate(iso);
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${dias[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${meses[d.getMonth()]}`;
}

function somarDias(iso, n) {
  const d = isoParaDate(iso);
  d.setDate(d.getDate() + n);
  return dataParaIso(d);
}

function inicioDaSemana(iso) {
  const d = isoParaDate(iso);
  d.setDate(d.getDate() - d.getDay());
  return dataParaIso(d);
}

/* ---------- Classificação da grade do dia (algoritmo de encaixe) ---------- */

function obterCompromissosDoDia(iso) {
  return obterAgendamentos().filter((a) => a.data === iso);
}

function obterBloqueiosFixosDoDia(iso) {
  const abrev = diaDaSemanaAbrev(iso);
  return obterBloqueiosFixos().filter((b) => b.ativo && b.diasSemana.includes(abrev));
}

function classificarGradeDoDia(iso) {
  const config = obterConfig();
  const grade = gerarGradeHorarios(config.horaInicio, config.horaFim, config.intervaloGrade);
  const compromissos = obterCompromissosDoDia(iso);
  const bloqueiosFixos = obterBloqueiosFixosDoDia(iso);
  const horariosFixos = new Map();
  bloqueiosFixos.forEach((b) => b.horariosBloqueados.forEach((h) => horariosFixos.set(h, b)));

  const porHora = {};
  compromissos.forEach((a) => { porHora[a.hora] = a; });

  let ponteiro = config.horaInicio;
  const estrategico = config.modoCompartilhamento === "estrategico";

  return grade.map((hora) => {
    const agendamento = porHora[hora];
    if (agendamento) {
      ponteiro = somarMinutos(agendamento.hora, config.tempoPadraoAtendimento);
      if (agendamento.status === "bloqueado") {
        return { hora, tipo: "bloqueado", pontual: true, agendamento };
      }
      if (agendamento.status && agendamento.status.startsWith("realizado_")) {
        return { hora, tipo: "realizado", agendamento };
      }
      return { hora, tipo: "agendado", agendamento };
    }

    if (horariosFixos.has(hora)) {
      const fimDoSlot = somarMinutos(hora, config.intervaloGrade);
      if (fimDoSlot > ponteiro) ponteiro = fimDoSlot;
      return { hora, tipo: "bloqueado", pontual: false, bloqueio: horariosFixos.get(hora) };
    }

    if (!estrategico) {
      return { hora, tipo: "livre" };
    }

    const proximo = compromissos
      .filter((a) => a.hora > hora)
      .sort((a, b) => (a.hora < b.hora ? -1 : 1))[0];
    const fimJanela = somarMinutos(hora, config.tempoPadraoAtendimento);
    const colideComProximo = proximo && fimJanela > proximo.hora;
    const noRitmo = hora === ponteiro;

    if (noRitmo && !colideComProximo) {
      ponteiro = somarMinutos(hora, config.tempoPadraoAtendimento);
      return { hora, tipo: "livre" };
    }
    return { hora, tipo: "encaixe" };
  });
}

/* ---------- Renderização: cabeçalho, semana, lista de slots ---------- */

function nomesServicosPorIds(ids) {
  const servicos = obterServicos();
  return (ids || []).map((id) => (servicos.find((s) => s.id === id) || {}).nome).filter(Boolean).join(" + ");
}

function montarSlotLivreOuEncaixe(item) {
  const isEncaixe = item.tipo === "encaixe";
  const el = document.createElement("a");
  el.href = "#";
  el.className = "agenda-slot" + (isEncaixe ? " agenda-slot--encaixe" : " agenda-slot--livre");
  el.innerHTML = `
    <span class="agenda-slot__hora">${item.hora}</span>
    <span class="agenda-slot__icone agenda-slot__icone--${isEncaixe ? "encaixe" : ""}"></span>
    <div class="agenda-slot__body"><p class="agenda-slot__titulo">${isEncaixe ? "Encaixe" : "Livre"}</p></div>
  `;
  el.addEventListener("click", (e) => { e.preventDefault(); abrirHorarioLivre(item.hora); });
  return el;
}

function montarSlotAgendado(item) {
  const a = item.agendamento;
  const el = document.createElement("a");
  el.href = "#";
  el.className = "agenda-slot";
  el.innerHTML = `
    <span class="agenda-slot__hora">${item.hora}</span>
    <span class="agenda-slot__icone agenda-slot__icone--agendado"></span>
    <div class="agenda-slot__body">
      <p class="agenda-slot__titulo"></p>
      <p class="agenda-slot__subtitulo"></p>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  el.querySelector(".agenda-slot__titulo").textContent = a.nomeCliente;
  el.querySelector(".agenda-slot__subtitulo").textContent = nomesServicosPorIds(a.servicosIds) || "—";
  el.addEventListener("click", (e) => { e.preventDefault(); abrirHorarioAgendado(a); });
  return el;
}

function montarSlotRealizado(item) {
  const a = item.agendamento;
  const el = document.createElement("a");
  el.href = "#";
  el.className = "agenda-slot";
  el.innerHTML = `
    <span class="agenda-slot__hora">${item.hora}</span>
    <svg class="agenda-slot__icone--realizado" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
    <div class="agenda-slot__body">
      <p class="agenda-slot__titulo"></p>
      <p class="agenda-slot__subtitulo"></p>
    </div>
    <span class="${a.status === "realizado_pago" ? "text-success" : "text-warning"}" style="font-weight:600;font-size:var(--text-sm);">${a.status === "realizado_pago" ? "Pago" : "Pendente"}</span>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  el.querySelector(".agenda-slot__titulo").textContent = a.nomeCliente;
  el.querySelector(".agenda-slot__subtitulo").textContent = nomesServicosPorIds(a.servicosIds) || "—";
  el.addEventListener("click", (e) => { e.preventDefault(); abrirHorarioRealizado(a); });
  return el;
}

function montarSlotBloqueado(item) {
  const el = document.createElement("div");
  el.className = "agenda-slot agenda-slot--bloqueado";
  const nome = item.pontual ? (item.agendamento.nomeBloqueio || "Bloqueado") : item.bloqueio.nome;
  el.innerHTML = `
    <span class="agenda-slot__hora">${item.hora}</span>
    <svg class="agenda-slot__icone--bloqueado" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
    <div class="agenda-slot__body">
      <p class="agenda-slot__titulo"></p>
      <p class="agenda-slot__subtitulo">Bloqueado</p>
    </div>
  `;
  el.querySelector(".agenda-slot__titulo").textContent = nome;
  el.addEventListener("click", () => abrirHorarioBloqueado(item));
  return el;
}

function renderizarAgendaLista() {
  const container = qs("#js-agenda-lista");
  container.innerHTML = "";
  const itens = classificarGradeDoDia(dataSelecionada);
  itens.forEach((item) => {
    let el;
    if (item.tipo === "livre" || item.tipo === "encaixe") el = montarSlotLivreOuEncaixe(item);
    else if (item.tipo === "agendado") el = montarSlotAgendado(item);
    else if (item.tipo === "realizado") el = montarSlotRealizado(item);
    else el = montarSlotBloqueado(item);
    container.appendChild(el);
  });
}

function renderizarCabecalho() {
  const d = isoParaDate(dataSelecionada);
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  qs("#js-agenda-mes").textContent = `${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function renderizarSemana() {
  const container = qs("#js-week-carousel");
  container.innerHTML = "";
  const inicio = inicioDaSemana(dataSelecionada);
  for (let i = 0; i < 7; i++) {
    const iso = somarDias(inicio, i);
    const d = isoParaDate(iso);
    const el = document.createElement("div");
    el.className = "week-day" + (iso === dataSelecionada ? " is-active" : "");
    el.innerHTML = `<span class="week-day__label">${DIAS_SEMANA_LABEL[d.getDay()]}</span><span class="week-day__numero">${String(d.getDate()).padStart(2, "0")}</span>`;
    el.addEventListener("click", () => selecionarData(iso));
    container.appendChild(el);
  }
}

function selecionarData(iso) {
  dataSelecionada = iso;
  renderizarCabecalho();
  renderizarSemana();
  renderizarAgendaLista();
}

window.aoSelecionarDiaCalendarioAgenda = (ano, mes, dia) => {
  const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  selecionarData(iso);
};

/* ============================================================
   Parte 2: modais de horário (livre, agendado, bloqueado),
   novo/editar agendamento com busca de cliente, finalizar
   atendimento, editar/excluir realizado, lembrete e WhatsApp.
   ============================================================ */

let clienteSelecionadoId = null;
let agendamentoEditandoId = null;
let pendenteAgendamentoNome = null;

function montarServicosChips(containerId, selecionadosIds) {
  const container = qs(`#${containerId}`);
  container.innerHTML = "";
  obterServicos().filter((s) => s.ativo).forEach((servico) => {
    const chip = document.createElement("span");
    chip.className = "chip" + (selecionadosIds.includes(servico.id) ? " chip--ativo" : "");
    chip.dataset.id = servico.id;
    chip.textContent = servico.nome;
    container.appendChild(chip);
  });
  inicializarGrupoChips(container, true);
}

function idsSelecionados(containerId) {
  return qsa(".chip--ativo", qs(`#${containerId}`)).map((c) => c.dataset.id);
}

function adicionarLinhaForma(container, nome, valor) {
  const linha = document.createElement("div");
  linha.className = "row";
  linha.style.gap = "8px";
  linha.dataset.linhaForma = nome;
  linha.innerHTML = `<span class="text-secondary" style="width:110px;flex-shrink:0;">${nome}</span><input class="input" placeholder="R$ 0,00" style="flex:1;" value="${valor != null ? formatarMoeda(valor) : ""}" />`;
  container.appendChild(linha);
}

function montarFormasChips(chipsContainerId, linhasContainerId, nomesSelecionados, valoresPorNome) {
  const chipsContainer = qs(`#${chipsContainerId}`);
  const linhasContainer = qs(`#${linhasContainerId}`);
  chipsContainer.innerHTML = "";
  linhasContainer.innerHTML = "";
  obterFormasPagamento().filter((f) => f.ativo).forEach((forma) => {
    const ativo = nomesSelecionados.includes(forma.nome);
    const chip = document.createElement("span");
    chip.className = "chip" + (ativo ? " chip--ativo" : "");
    chip.dataset.nome = forma.nome;
    chip.textContent = forma.nome;
    chipsContainer.appendChild(chip);
    if (ativo) adicionarLinhaForma(linhasContainer, forma.nome, valoresPorNome && valoresPorNome[forma.nome]);
  });
  qsa(".chip", chipsContainer).forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("chip--ativo");
      const nome = chip.dataset.nome;
      const existente = linhasContainer.querySelector(`[data-linha-forma="${nome}"]`);
      if (chip.classList.contains("chip--ativo")) {
        if (!existente) adicionarLinhaForma(linhasContainer, nome);
      } else if (existente) {
        existente.remove();
      }
    });
  });
}

function lerPagamentosDeLinhas(linhasContainerId) {
  const formas = obterFormasPagamento();
  return qsa(`#${linhasContainerId} [data-linha-forma]`).map((linha) => {
    const nome = linha.dataset.linhaForma;
    const valor = extrairValor(linha.querySelector("input").value) || 0;
    const forma = formas.find((f) => f.nome === nome);
    return { formaPagamentoId: forma ? forma.id : null, valor };
  });
}

/* ---------- Horário livre / encaixe ---------- */

function abrirHorarioLivre(hora) {
  horaModalAtual = hora;
  qs("#js-horario-livre-hora").textContent = hora;
  abrirModal("modal-horario-livre");
}

/* ---------- Horário agendado ---------- */

function abrirHorarioAgendado(agendamento) {
  agendamentoModalAtual = agendamento;
  horaModalAtual = agendamento.hora;
  qs("#js-agendado-avatar").textContent = iniciaisCliente(agendamento.nomeCliente);
  qs("#js-agendado-nome").textContent = agendamento.nomeCliente;
  qs("#js-agendado-info").textContent = `${agendamento.hora} · ${nomesServicosPorIds(agendamento.servicosIds) || "—"}`;
  const cliente = agendamento.clienteId ? obterClientes().find((c) => c.id === agendamento.clienteId) : null;
  qs("#js-btn-lembrete").classList.toggle("is-hidden", !(cliente && cliente.telefone));
  abrirModal("modal-horario-agendado");
}

/* ---------- Horário realizado ---------- */

function abrirHorarioRealizado(agendamento) {
  agendamentoModalAtual = agendamento;
  qs("#js-realizado-nome").textContent = agendamento.nomeCliente;
  qs("#js-realizado-info").textContent = `${agendamento.hora} · ${nomesServicosPorIds(agendamento.servicosIds) || "—"}`;
  abrirModal("modal-horario-realizado");
}

/* ---------- Horário bloqueado (pontual ou fixo) ---------- */

function abrirHorarioBloqueado(item) {
  horaModalAtual = item.hora;
  const acoesPontual = qs("#js-bloqueado-acoes-pontual");
  const acoesFixo = qs("#js-bloqueado-acoes-fixo");
  const aviso = qs("#js-bloqueado-aviso-fixo");
  if (item.pontual) {
    agendamentoModalAtual = item.agendamento;
    bloqueioPontualEditandoId = item.agendamento.id;
    qs("#js-bloqueado-nome").textContent = item.agendamento.nomeBloqueio || "Bloqueado";
    qs("#js-bloqueado-info").textContent = item.hora;
    acoesPontual.classList.remove("is-hidden");
    acoesFixo.classList.add("is-hidden");
    aviso.classList.add("is-hidden");
  } else {
    agendamentoModalAtual = null;
    bloqueioPontualEditandoId = null;
    qs("#js-bloqueado-nome").textContent = item.bloqueio.nome;
    qs("#js-bloqueado-info").textContent = item.hora;
    acoesPontual.classList.add("is-hidden");
    acoesFixo.classList.remove("is-hidden");
    aviso.classList.remove("is-hidden");
  }
  abrirModal("modal-horario-bloqueado");
}

/* ---------- Novo / editar agendamento (com busca de cliente) ---------- */

function infoVisitaCliente(clienteId) {
  const realizados = obterAgendamentos().filter((a) => a.clienteId === clienteId && a.status && a.status.startsWith("realizado_"));
  if (realizados.length === 0) return "ainda sem atendimentos";
  const maisRecente = realizados.reduce((max, a) => (a.data > max ? a.data : max), realizados[0].data);
  const dias = Math.max(0, Math.floor((new Date() - new Date(`${maisRecente}T00:00:00`)) / 86400000));
  return dias === 0 ? "última visita hoje" : `última visita há ${dias} dia${dias === 1 ? "" : "s"}`;
}

function mostrarClienteCard(cliente) {
  const card = qs("#js-novo-agendamento-cliente-card");
  if (!cliente) { card.classList.add("is-hidden"); return; }
  qs("#js-novo-agendamento-cliente-avatar").textContent = iniciaisCliente(cliente.nome);
  qs("#js-novo-agendamento-cliente-nome").textContent = cliente.nome;
  qs("#js-novo-agendamento-cliente-info").textContent = infoVisitaCliente(cliente.id);
  card.classList.remove("is-hidden");
}

function prepararNovoAgendamento() {
  agendamentoEditandoId = null;
  clienteSelecionadoId = null;
  qs("#js-novo-agendamento-titulo").textContent = "Novo agendamento";
  qs("#js-novo-agendamento-data-hora").textContent = `${formatarDataLonga(dataSelecionada)} — ${horaModalAtual}`;
  qs("#js-novo-agendamento-nome").value = "";
  qs("#js-novo-agendamento-resultados").classList.add("is-hidden");
  mostrarClienteCard(null);
  montarServicosChips("js-novo-agendamento-servicos", []);
  qs("#js-novo-agendamento-observacao").value = "";
}

function prepararEdicaoAgendamento(agendamento) {
  agendamentoEditandoId = agendamento.id;
  clienteSelecionadoId = agendamento.clienteId || null;
  horaModalAtual = agendamento.hora;
  qs("#js-novo-agendamento-titulo").textContent = "Editar agendamento";
  qs("#js-novo-agendamento-data-hora").textContent = `${formatarDataLonga(agendamento.data)} — ${agendamento.hora}`;
  qs("#js-novo-agendamento-nome").value = agendamento.nomeCliente;
  qs("#js-novo-agendamento-resultados").classList.add("is-hidden");
  const cliente = agendamento.clienteId ? obterClientes().find((c) => c.id === agendamento.clienteId) : null;
  mostrarClienteCard(cliente);
  montarServicosChips("js-novo-agendamento-servicos", agendamento.servicosIds || []);
  qs("#js-novo-agendamento-observacao").value = agendamento.observacao || "";
}

function renderizarResultadosBusca(termo) {
  const resultados = qs("#js-novo-agendamento-resultados");
  if (!termo) { resultados.classList.add("is-hidden"); resultados.innerHTML = ""; return; }
  const encontrados = obterClientes().filter((c) => c.ativo && c.nome.toLowerCase().includes(termo.toLowerCase())).slice(0, 6);
  if (encontrados.length === 0) { resultados.classList.add("is-hidden"); resultados.innerHTML = ""; return; }
  resultados.innerHTML = "";
  encontrados.forEach((cliente) => {
    const linha = document.createElement("div");
    linha.className = "list-item";
    linha.style.cursor = "pointer";
    linha.innerHTML = `<div class="list-item__avatar"></div><div class="list-item__body"><p class="list-item__title"></p></div>`;
    linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(cliente.nome);
    linha.querySelector(".list-item__title").textContent = cliente.nome;
    linha.addEventListener("click", () => {
      clienteSelecionadoId = cliente.id;
      qs("#js-novo-agendamento-nome").value = cliente.nome;
      mostrarClienteCard(cliente);
      resultados.classList.add("is-hidden");
    });
    resultados.appendChild(linha);
  });
  resultados.classList.remove("is-hidden");
}

function finalizarCriacaoOuEdicaoAgendamento(clienteId, nome) {
  const servicosIds = idsSelecionados("js-novo-agendamento-servicos");
  const observacao = qs("#js-novo-agendamento-observacao").value.trim();
  const lista = obterAgendamentos();
  if (agendamentoEditandoId) {
    const ag = lista.find((a) => a.id === agendamentoEditandoId);
    if (ag) {
      ag.nomeCliente = nome;
      ag.clienteId = clienteId;
      ag.servicosIds = servicosIds;
      ag.observacao = observacao;
    }
  } else {
    lista.push({
      id: gerarId("agd"), data: dataSelecionada, hora: horaModalAtual,
      clienteId: clienteId || null, nomeCliente: nome,
      servicosIds, observacao, status: "agendado",
    });
  }
  salvarAgendamentos(lista);
  agendamentoEditandoId = null;
  fecharModal("modal-novo-agendamento");
  fecharModal("modal-adicionar-cliente-novo");
  renderizarAgendaLista();
}

/* ---------- Finalizar atendimento ---------- */

function prepararFinalizarAtendimento(agendamento) {
  const modal = qs("#modal-finalizar-atendimento");
  qs("#js-finalizar-avatar").textContent = iniciaisCliente(agendamento.nomeCliente);
  qs("#js-finalizar-nome").textContent = agendamento.nomeCliente;
  montarServicosChips("js-finalizar-servicos", agendamento.servicosIds || []);
  qs("#js-finalizar-observacao").value = "";
  qsa("[data-pago]", modal).forEach((b) => {
    b.classList.toggle("btn--primary", b.dataset.pago === "sim");
    b.classList.toggle("btn--secondary", b.dataset.pago !== "sim");
  });
  qsa("[data-campo-pago]", modal).forEach((campo) => {
    campo.classList.toggle("is-hidden", campo.dataset.campoPago !== "sim");
  });
  montarFormasChips("js-finalizar-formas", "js-finalizar-linhas-pagamento", [], {});
  qs("#js-finalizar-valor-pendente").value = "";
}

/* ---------- Editar realizado ---------- */

function prepararEditarRealizado(agendamento) {
  qs("#js-editar-realizado-avatar").textContent = iniciaisCliente(agendamento.nomeCliente);
  qs("#js-editar-realizado-nome").textContent = agendamento.nomeCliente;
  montarServicosChips("js-editar-realizado-servicos", agendamento.servicosIds || []);
  qs("#js-editar-realizado-observacao").value = agendamento.observacao || "";
  const pago = agendamento.status === "realizado_pago";
  qs("#js-editar-realizado-status-pago").classList.toggle("is-hidden", !pago);
  qs("#js-editar-realizado-campo-formas").classList.toggle("is-hidden", !pago);
  qs("#js-editar-realizado-campo-pendente").classList.toggle("is-hidden", pago);
  if (pago) {
    const dataHora = agendamento.realizadoEm ? new Date(agendamento.realizadoEm) : null;
    qs("#js-editar-realizado-pago-em").textContent = dataHora
      ? `Pago em ${formatarDataCurta(agendamento.data)} às ${String(dataHora.getHours()).padStart(2, "0")}:${String(dataHora.getMinutes()).padStart(2, "0")}`
      : "Pago";
    const valoresPorNome = {};
    const nomesSelecionados = [];
    const formas = obterFormasPagamento();
    (agendamento.pagamentos || []).forEach((p) => {
      const forma = formas.find((f) => f.id === p.formaPagamentoId);
      if (forma) { nomesSelecionados.push(forma.nome); valoresPorNome[forma.nome] = p.valor; }
    });
    montarFormasChips("js-editar-realizado-formas", "js-editar-realizado-linhas-pagamento", nomesSelecionados, valoresPorNome);
  } else {
    qs("#js-editar-realizado-valor-pendente").value = agendamento.valorPendente != null ? formatarMoeda(agendamento.valorPendente) : "";
  }
}

/* ============================================================
   Parte 3: ligação dos eventos e renderização inicial
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const dataDaUrl = new URLSearchParams(window.location.search).get("data");
  if (dataDaUrl) dataSelecionada = dataDaUrl;

  renderizarCabecalho();
  renderizarSemana();
  renderizarAgendaLista();

  qs("#js-btn-hoje").addEventListener("click", () => {
    selecionarData(hojeIso());
  });

  qs('#modal-horario-livre [data-trocar-modal="modal-novo-agendamento"]').addEventListener("click", prepararNovoAgendamento);
  qs('#modal-horario-livre [data-trocar-modal="modal-bloquear-horario"]').addEventListener("click", () => {
    bloqueioPontualEditandoId = null;
    agendamentoModalAtual = null;
    qs("#js-bloquear-hora").textContent = horaModalAtual;
    qs("#js-bloquear-nome").value = "";
  });

  qs("#js-btn-editar-agendamento").addEventListener("click", () => {
    fecharModal("modal-horario-agendado");
    prepararEdicaoAgendamento(agendamentoModalAtual);
    abrirModal("modal-novo-agendamento");
  });

  qs("#js-btn-realizar").addEventListener("click", () => {
    fecharModal("modal-horario-agendado");
    prepararFinalizarAtendimento(agendamentoModalAtual);
    abrirModal("modal-finalizar-atendimento");
  });

  qs("#js-btn-lembrete").addEventListener("click", () => {
    const agendamento = agendamentoModalAtual;
    if (!agendamento || !agendamento.clienteId) return;
    const cliente = obterClientes().find((c) => c.id === agendamento.clienteId);
    if (!cliente || !cliente.telefone) return;
    const mensagem = (obterWhatsapp().mensagemLembrete || "").replace("{hora}", agendamento.hora);
    const digitos = cliente.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${digitos}?text=${encodeURIComponent(mensagem)}`, "_blank");
  });

  qs("#js-confirmar-exclusao-agendamento").addEventListener("click", () => {
    if (!agendamentoModalAtual) return;
    salvarAgendamentos(obterAgendamentos().filter((a) => a.id !== agendamentoModalAtual.id));
    fecharModal("modal-confirmar-exclusao-agendamento");
    fecharModal("modal-horario-agendado");
    renderizarAgendaLista();
  });

  qs("#js-btn-desbloquear").addEventListener("click", () => {
    if (!bloqueioPontualEditandoId) return;
    salvarAgendamentos(obterAgendamentos().filter((a) => a.id !== bloqueioPontualEditandoId));
    bloqueioPontualEditandoId = null;
    fecharModal("modal-horario-bloqueado");
    renderizarAgendaLista();
  });

  qs("#js-btn-editar-bloqueio").addEventListener("click", () => {
    fecharModal("modal-horario-bloqueado");
    qs("#js-bloquear-hora").textContent = horaModalAtual;
    qs("#js-bloquear-nome").value = agendamentoModalAtual ? (agendamentoModalAtual.nomeBloqueio || "") : "";
    abrirModal("modal-bloquear-horario");
  });

  qs("#js-bloquear-salvar").addEventListener("click", () => {
    const nome = qs("#js-bloquear-nome").value.trim() || "Bloqueado";
    const lista = obterAgendamentos();
    if (bloqueioPontualEditandoId) {
      const ag = lista.find((a) => a.id === bloqueioPontualEditandoId);
      if (ag) ag.nomeBloqueio = nome;
    } else {
      lista.push({ id: gerarId("agd"), data: dataSelecionada, hora: horaModalAtual, clienteId: null, nomeCliente: "", servicosIds: [], observacao: "", status: "bloqueado", nomeBloqueio: nome });
    }
    salvarAgendamentos(lista);
    bloqueioPontualEditandoId = null;
    fecharModal("modal-bloquear-horario");
    renderizarAgendaLista();
  });

  qs("#js-novo-agendamento-nome").addEventListener("input", (e) => {
    clienteSelecionadoId = null;
    renderizarResultadosBusca(e.target.value.trim());
  });

  qs("#js-novo-agendamento-salvar").addEventListener("click", () => {
    const nome = qs("#js-novo-agendamento-nome").value.trim();
    if (!nome) return;
    if (clienteSelecionadoId) {
      finalizarCriacaoOuEdicaoAgendamento(clienteSelecionadoId, nome);
      return;
    }
    const matchExato = obterClientes().find((c) => c.ativo && c.nome.toLowerCase() === nome.toLowerCase());
    if (matchExato) {
      finalizarCriacaoOuEdicaoAgendamento(matchExato.id, nome);
      return;
    }
    pendenteAgendamentoNome = nome;
    qs("#js-adicionar-cliente-nome").textContent = nome;
    fecharModal("modal-novo-agendamento");
    abrirModal("modal-adicionar-cliente-novo");
  });

  qs("#js-adicionar-cliente-sim").addEventListener("click", () => {
    const nome = pendenteAgendamentoNome;
    const hoje = hojeIso();
    const clientes = obterClientes();
    const novoCliente = { id: gerarId("cli"), nome, telefone: "", aniversarioDia: null, aniversarioMes: null, aniversarioAno: null, observacao: "", criadoEm: hoje, atualizadoEm: hoje, ativo: true };
    clientes.push(novoCliente);
    salvarClientes(clientes);
    finalizarCriacaoOuEdicaoAgendamento(novoCliente.id, nome);
  });

  qs("#js-adicionar-cliente-avulso").addEventListener("click", () => {
    finalizarCriacaoOuEdicaoAgendamento(null, pendenteAgendamentoNome);
  });

  qs("#js-finalizar-confirmar").addEventListener("click", () => {
    const agendamento = agendamentoModalAtual;
    if (!agendamento) return;
    const lista = obterAgendamentos();
    const ag = lista.find((a) => a.id === agendamento.id);
    if (!ag) return;
    ag.servicosIds = idsSelecionados("js-finalizar-servicos");
    ag.observacao = qs("#js-finalizar-observacao").value.trim();
    ag.realizadoEm = new Date().toISOString();
    const pagoEscolha = qs("[data-pago].btn--primary", qs("#modal-finalizar-atendimento")).dataset.pago;
    if (pagoEscolha === "sim") {
      const pagamentos = lerPagamentosDeLinhas("js-finalizar-linhas-pagamento");
      ag.status = "realizado_pago";
      ag.pago = true;
      ag.pagamentos = pagamentos;
      ag.valorTotal = pagamentos.reduce((s, p) => s + p.valor, 0);
      delete ag.valorPendente;
    } else {
      const valorPendente = extrairValor(qs("#js-finalizar-valor-pendente").value) || 0;
      ag.status = "realizado_pendente";
      ag.pago = false;
      ag.valorPendente = valorPendente;
      ag.valorTotal = valorPendente;
      delete ag.pagamentos;
    }
    salvarAgendamentos(lista);
    fecharModal("modal-finalizar-atendimento");
    renderizarAgendaLista();
  });

  qs("#js-btn-editar-realizado").addEventListener("click", () => {
    fecharModal("modal-horario-realizado");
    prepararEditarRealizado(agendamentoModalAtual);
    abrirModal("modal-editar-realizado");
  });

  qs("#js-editar-realizado-salvar").addEventListener("click", () => {
    const agendamento = agendamentoModalAtual;
    if (!agendamento) return;
    const lista = obterAgendamentos();
    const ag = lista.find((a) => a.id === agendamento.id);
    if (!ag) return;
    ag.servicosIds = idsSelecionados("js-editar-realizado-servicos");
    ag.observacao = qs("#js-editar-realizado-observacao").value.trim();
    if (ag.status === "realizado_pago") {
      const pagamentos = lerPagamentosDeLinhas("js-editar-realizado-linhas-pagamento");
      ag.pagamentos = pagamentos;
      ag.valorTotal = pagamentos.reduce((s, p) => s + p.valor, 0);
    } else {
      const valorPendente = extrairValor(qs("#js-editar-realizado-valor-pendente").value) || 0;
      ag.valorPendente = valorPendente;
      ag.valorTotal = valorPendente;
    }
    salvarAgendamentos(lista);
    fecharModal("modal-editar-realizado");
    renderizarAgendaLista();
  });

  qs("#js-confirmar-exclusao-realizado").addEventListener("click", () => {
    if (!agendamentoModalAtual) return;
    salvarAgendamentos(obterAgendamentos().filter((a) => a.id !== agendamentoModalAtual.id));
    fecharModal("modal-confirmar-exclusao-realizado");
    fecharModal("modal-horario-realizado");
    renderizarAgendaLista();
  });

  qs("#js-btn-compartilhar-whatsapp").addEventListener("click", () => {
    const container = qs("#js-whatsapp-dias");
    container.innerHTML = "";
    const inicio = inicioDaSemana(dataSelecionada);
    for (let i = 0; i < 7; i++) {
      const iso = somarDias(inicio, i);
      const d = isoParaDate(iso);
      const chip = document.createElement("span");
      chip.className = "chip chip--dia" + (iso === dataSelecionada ? " chip--ativo" : "");
      chip.dataset.iso = iso;
      chip.innerHTML = `<span class="chip-dia__label">${DIAS_SEMANA_LABEL[d.getDay()]}</span><span class="chip-dia__numero">${String(d.getDate()).padStart(2, "0")}</span>`;
      container.appendChild(chip);
    }
    inicializarGrupoChips(container, true);
    abrirModal("modal-compartilhar-whatsapp");
  });

  qs("#js-whatsapp-enviar").addEventListener("click", () => {
    const diasSelecionados = qsa(".chip--ativo", qs("#js-whatsapp-dias")).map((c) => c.dataset.iso);
    if (diasSelecionados.length === 0) return;
    const whatsapp = obterWhatsapp();
    let mensagem = whatsapp.mensagemHorarios || "Horários disponíveis:";
    diasSelecionados.sort().forEach((iso) => {
      const livres = classificarGradeDoDia(iso).filter((item) => item.tipo === "livre").map((item) => item.hora);
      if (livres.length > 0) {
        mensagem += `\n\n*${formatarDataLonga(iso)}*\n${livres.join(", ")}`;
      }
    });
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, "_blank");
    fecharModal("modal-compartilhar-whatsapp");
  });
});
