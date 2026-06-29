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
let bloqueioFixoEditando = null;

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
  bloqueiosFixos.forEach((b) => {
    const excecoes = b.excecoes || [];
    b.horariosBloqueados.forEach((h) => {
      if (!excecoes.includes(`${iso}_${h}`)) horariosFixos.set(h, b);
    });
  });

  const porHora = {};
  compromissos.forEach((a) => { porHora[a.hora] = a; });

  const horariosOcupados = Array.from(new Set([...compromissos.map((a) => a.hora), ...horariosFixos.keys()])).sort();

  let ponteiro = config.horaInicio;
  const estrategico = config.modoCompartilhamento === "estrategico";

  return grade.map((hora) => {
    const agendamento = porHora[hora];
    if (agendamento) {
      if (agendamento.status === "bloqueado") {
        const fimDoSlot = somarMinutos(hora, config.intervaloGrade);
        if (fimDoSlot > ponteiro) ponteiro = fimDoSlot;
        return { hora, tipo: "bloqueado", pontual: true, agendamento };
      }
      ponteiro = somarMinutos(agendamento.hora, config.tempoPadraoAtendimento);
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

    const proximo = horariosOcupados.find((h) => h > hora);
    const fimJanela = somarMinutos(hora, config.tempoPadraoAtendimento);
    const colideComProximo = proximo && fimJanela > proximo;
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
      <p class="agenda-slot__observacao"></p>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  el.querySelector(".agenda-slot__titulo").textContent = a.nomeCliente;
  el.querySelector(".agenda-slot__subtitulo").textContent = nomesServicosPorIds(a.servicosIds) || "—";
  const obsEl = el.querySelector(".agenda-slot__observacao");
  if (a.observacao) obsEl.textContent = a.observacao; else obsEl.remove();
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
      <p class="agenda-slot__observacao"></p>
    </div>
    <div class="agenda-slot__status">
      <p class="${a.status === "realizado_pago" ? "text-success" : "text-warning"}" style="font-weight:600;font-size:var(--text-sm);">${a.status === "realizado_pago" ? "Pago" : "Pendente"}</p>
      <p class="agenda-slot__status-valor"></p>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  el.querySelector(".agenda-slot__titulo").textContent = a.nomeCliente;
  el.querySelector(".agenda-slot__subtitulo").textContent = nomesServicosPorIds(a.servicosIds) || "—";
  const obsEl = el.querySelector(".agenda-slot__observacao");
  if (a.observacao) obsEl.textContent = a.observacao; else obsEl.remove();
  el.querySelector(".agenda-slot__status-valor").textContent = formatarMoeda(a.valorTotal || 0);
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
      <p class="agenda-slot__titulo">Bloqueado</p>
      <p class="agenda-slot__subtitulo"></p>
    </div>
  `;
  el.querySelector(".agenda-slot__subtitulo").textContent = nome;
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
  const mesSelecionado = isoParaDate(dataSelecionada).getMonth();
  for (let i = 0; i < 7; i++) {
    const iso = somarDias(inicio, i);
    const d = isoParaDate(iso);
    const el = document.createElement("div");
    el.className = "week-day"
      + (iso === dataSelecionada ? " is-active" : "")
      + (d.getMonth() !== mesSelecionado ? " is-outro-mes" : "");
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
  qs("#js-btn-hoje").classList.toggle("is-invisivel", dataSelecionada === hojeIso());
  if (typeof window.irParaMesCalendarioAgenda === "function") {
    const d = isoParaDate(iso);
    window.irParaMesCalendarioAgenda(d.getFullYear(), d.getMonth(), d.getDate());
  }
}

window.aoSelecionarDiaCalendarioAgenda = (ano, mes, dia) => {
  const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  selecionarData(iso);
};

function aplicarProgressoCarrossel(deltaX) {
  const carrossel = qs("#js-week-carousel");
  const ativo = qs(".week-day.is-active", carrossel);
  if (!ativo) return;
  if (!deltaX) {
    qsa(".week-day", carrossel).forEach((el) => {
      el.classList.remove("week-day--preview");
      el.style.opacity = "";
    });
    return;
  }
  const progresso = Math.min(Math.abs(deltaX) / 100, 1);
  const vizinho = deltaX < 0 ? ativo.nextElementSibling : ativo.previousElementSibling;
  ativo.style.opacity = String(1 - progresso);
  qsa(".week-day", carrossel).forEach((el) => { if (el !== ativo && el !== vizinho) el.classList.remove("week-day--preview"); });
  if (vizinho) {
    vizinho.classList.add("week-day--preview");
    vizinho.style.opacity = String(progresso);
  }
}

function adicionarGestoSwipe(elemento, aoArrastarEsquerda, aoArrastarDireita, aoProgresso) {
  let inicioX = 0;
  let inicioY = 0;
  let deltaX = 0;
  let arrastando = false;
  let decidido = false;
  let horizontal = false;

  elemento.addEventListener("touchstart", (e) => {
    inicioX = e.touches[0].clientX;
    inicioY = e.touches[0].clientY;
    deltaX = 0;
    arrastando = true;
    decidido = false;
    horizontal = false;
    elemento.style.transition = "none";
  }, { passive: true });

  elemento.addEventListener("touchmove", (e) => {
    if (!arrastando) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    deltaX = x - inicioX;
    const deltaY = y - inicioY;
    if (!decidido && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
      horizontal = Math.abs(deltaX) > Math.abs(deltaY);
      decidido = true;
    }
    if (horizontal) {
      if (e.cancelable) e.preventDefault();
      elemento.style.transform = `translateX(${deltaX}px)`;
      if (aoProgresso) aoProgresso(deltaX);
    }
  }, { passive: false });

  elemento.addEventListener("touchend", () => {
    if (!arrastando) return;
    arrastando = false;
    elemento.style.transition = "transform 200ms ease";
    if (aoProgresso) aoProgresso(0);
    if (horizontal && Math.abs(deltaX) > 60) {
      const indoParaEsquerda = deltaX < 0;
      elemento.style.transform = `translateX(${indoParaEsquerda ? "-24px" : "24px"})`;
      setTimeout(() => {
        elemento.style.transition = "none";
        elemento.style.transform = "translateX(0)";
        if (indoParaEsquerda) aoArrastarEsquerda(); else aoArrastarDireita();
      }, 130);
    } else {
      elemento.style.transform = "translateX(0)";
    }
  });
}

/* ============================================================
   Parte 2: modais de horário (livre, agendado, bloqueado),
   novo/editar agendamento com busca de cliente, finalizar
   atendimento, editar/excluir realizado, lembrete e WhatsApp.
   ============================================================ */

let clienteSelecionadoId = null;
let agendamentoEditandoId = null;
let pendenteAgendamentoNome = null;
let pendenteClienteExistenteId = null;

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
    bloqueioFixoEditando = { bloqueioId: item.bloqueio.id, hora: item.hora };
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

function atualizarTelefoneWrap() {
  const wrap = qs("#js-novo-agendamento-telefone-wrap");
  const temNome = qs("#js-novo-agendamento-nome").value.trim().length > 0;
  wrap.classList.toggle("is-hidden", !!clienteSelecionadoId || !temNome);
}

function mostrarClienteCard(cliente) {
  const card = qs("#js-novo-agendamento-cliente-card");
  const nomeWrap = qs("#js-novo-agendamento-nome-wrap");
  if (!cliente) {
    card.classList.add("is-hidden");
    nomeWrap.classList.remove("is-hidden");
    atualizarTelefoneWrap();
    return;
  }
  qs("#js-novo-agendamento-cliente-avatar").textContent = iniciaisCliente(cliente.nome);
  qs("#js-novo-agendamento-cliente-nome").textContent = cliente.nome;
  qs("#js-novo-agendamento-cliente-info").textContent = infoVisitaCliente(cliente.id);
  card.classList.remove("is-hidden");
  nomeWrap.classList.add("is-hidden");
  atualizarTelefoneWrap();
}

function removerSelecaoCliente() {
  clienteSelecionadoId = null;
  mostrarClienteCard(null);
  qs("#js-novo-agendamento-nome").focus();
}

function proximoNomeDisponivel(nomeBase) {
  const clientes = obterClientes();
  if (!clientes.some((c) => c.nome === nomeBase)) return nomeBase;
  let n = 2;
  while (clientes.some((c) => c.nome === `${nomeBase} ${n}`)) n++;
  return `${nomeBase} ${n}`;
}

function limparTelefoneNovo() {
  qs("#js-novo-agendamento-telefone").value = "";
  qs("#js-novo-agendamento-telefone").classList.add("is-hidden");
  qs("#js-novo-agendamento-telefone-toggle").classList.remove("is-hidden");
  qs("#js-novo-agendamento-telefone-wrap").classList.add("is-hidden");
}

function prepararObservacaoWrap(idTextarea, idToggle, texto) {
  const textarea = qs(`#${idTextarea}`);
  const toggle = qs(`#${idToggle}`);
  textarea.value = texto || "";
  textarea.classList.add("is-hidden");
  toggle.classList.remove("is-hidden");
}

function prepararNovoAgendamento() {
  agendamentoEditandoId = null;
  clienteSelecionadoId = null;
  qs("#js-novo-agendamento-titulo").textContent = "Novo agendamento";
  qs("#js-novo-agendamento-data-hora").textContent = `${formatarDataLonga(dataSelecionada)} — ${horaModalAtual}`;
  qs("#js-novo-agendamento-nome").value = "";
  qs("#js-novo-agendamento-resultados").classList.add("is-hidden");
  limparTelefoneNovo();
  mostrarClienteCard(null);
  montarServicosChips("js-novo-agendamento-servicos", []);
  prepararObservacaoWrap("js-novo-agendamento-observacao", "js-novo-agendamento-observacao-toggle", "");
}

function prepararEdicaoAgendamento(agendamento) {
  agendamentoEditandoId = agendamento.id;
  clienteSelecionadoId = agendamento.clienteId || null;
  horaModalAtual = agendamento.hora;
  qs("#js-novo-agendamento-titulo").textContent = "Editar agendamento";
  qs("#js-novo-agendamento-data-hora").textContent = `${formatarDataLonga(agendamento.data)} — ${agendamento.hora}`;
  qs("#js-novo-agendamento-nome").value = agendamento.nomeCliente;
  qs("#js-novo-agendamento-resultados").classList.add("is-hidden");
  limparTelefoneNovo();
  const cliente = agendamento.clienteId ? obterClientes().find((c) => c.id === agendamento.clienteId) : null;
  mostrarClienteCard(cliente);
  montarServicosChips("js-novo-agendamento-servicos", agendamento.servicosIds || []);
  prepararObservacaoWrap("js-novo-agendamento-observacao", "js-novo-agendamento-observacao-toggle", agendamento.observacao || "");
}

function renderizarResultadosBusca(termo) {
  const resultados = qs("#js-novo-agendamento-resultados");
  resultados.innerHTML = "";
  if (!termo) { resultados.classList.add("is-hidden"); return; }

  const encontrados = obterClientes().filter((c) => c.ativo && c.nome.toLowerCase().includes(termo.toLowerCase())).slice(0, 5);
  if (encontrados.length === 0) { resultados.classList.add("is-hidden"); return; }
  encontrados.forEach((cliente) => {
    const linha = document.createElement("div");
    linha.className = "list-item";
    linha.style.cursor = "pointer";
    linha.style.padding = "8px 0";
    linha.innerHTML = `<div class="list-item__avatar list-item__avatar--sm"></div><div class="list-item__body"><p class="list-item__title" style="font-size:var(--text-sm);"></p></div>`;
    linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(cliente.nome);
    linha.querySelector(".list-item__title").textContent = cliente.nome;
    linha.addEventListener("mousedown", (e) => e.preventDefault());
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
  fecharModal("modal-nome-duplicado");
  renderizarAgendaLista();
  mostrarSucesso();
}

/* ---------- Finalizar atendimento ---------- */

function resetarEdicaoNome(idCard, idInput) {
  qs(`#${idCard}`).classList.remove("is-hidden");
  qs(`#${idInput}`).classList.add("is-hidden");
  qs(`#${idInput}`).value = "";
}

function aplicarEdicaoNome(ag, idInput) {
  const input = qs(`#${idInput}`);
  if (input.classList.contains("is-hidden")) return;
  const novoNome = input.value.trim();
  if (!novoNome || novoNome === ag.nomeCliente) return;
  ag.nomeCliente = novoNome;
  if (ag.clienteId) {
    const clientes = obterClientes();
    const cliente = clientes.find((c) => c.id === ag.clienteId);
    if (cliente) {
      cliente.nome = novoNome;
      cliente.atualizadoEm = hojeIso();
      salvarClientes(clientes);
    }
  }
}

function prepararFinalizarAtendimento(agendamento) {
  const modal = qs("#modal-finalizar-atendimento");
  qs("#js-finalizar-avatar").textContent = iniciaisCliente(agendamento.nomeCliente);
  qs("#js-finalizar-nome").textContent = agendamento.nomeCliente;
  resetarEdicaoNome("js-finalizar-nome-card", "js-finalizar-nome-input");
  montarServicosChips("js-finalizar-servicos", agendamento.servicosIds || []);
  prepararObservacaoWrap("js-finalizar-observacao", "js-finalizar-observacao-toggle", agendamento.observacao || "");
  qsa("[data-pago]", modal).forEach((b) => {
    b.classList.toggle("chip--ativo", b.dataset.pago === "sim");
  });
  qsa("[data-campo-pago]", modal).forEach((campo) => {
    campo.classList.toggle("is-hidden", campo.dataset.campoPago !== "sim");
  });
  montarFormasChips("js-finalizar-formas", "js-finalizar-linhas-pagamento", [], {});
  qs("#js-finalizar-valor-pendente").value = "";
}

/* ---------- Editar realizado ---------- */

function definirPagoEditarRealizado(pago) {
  const modal = qs("#modal-editar-realizado");
  qsa("[data-pago-editar]", modal).forEach((b) => {
    b.classList.toggle("chip--ativo", (b.dataset.pagoEditar === "sim") === pago);
  });
  qs("#js-editar-realizado-campo-formas").classList.toggle("is-hidden", !pago);
  qs("#js-editar-realizado-campo-pendente").classList.toggle("is-hidden", pago);
}

function prepararEditarRealizado(agendamento) {
  qs("#js-editar-realizado-avatar").textContent = iniciaisCliente(agendamento.nomeCliente);
  qs("#js-editar-realizado-nome").textContent = agendamento.nomeCliente;
  resetarEdicaoNome("js-editar-realizado-nome-card", "js-editar-realizado-nome-input");
  montarServicosChips("js-editar-realizado-servicos", agendamento.servicosIds || []);
  prepararObservacaoWrap("js-editar-realizado-observacao", "js-editar-realizado-observacao-toggle", agendamento.observacao || "");
  const pago = agendamento.status === "realizado_pago";
  definirPagoEditarRealizado(pago);
  if (pago) {
    const valoresPorNome = {};
    const nomesSelecionados = [];
    const formas = obterFormasPagamento();
    (agendamento.pagamentos || []).forEach((p) => {
      const forma = formas.find((f) => f.id === p.formaPagamentoId);
      if (forma) { nomesSelecionados.push(forma.nome); valoresPorNome[forma.nome] = p.valor; }
    });
    montarFormasChips("js-editar-realizado-formas", "js-editar-realizado-linhas-pagamento", nomesSelecionados, valoresPorNome);
    qs("#js-editar-realizado-valor-pendente").value = "";
  } else {
    montarFormasChips("js-editar-realizado-formas", "js-editar-realizado-linhas-pagamento", [], {});
    qs("#js-editar-realizado-valor-pendente").value = agendamento.valorPendente != null ? formatarMoeda(agendamento.valorPendente) : "";
  }
}

/* ============================================================
   Parte 3: ligação dos eventos e renderização inicial
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const dataDaUrl = new URLSearchParams(window.location.search).get("data");
  selecionarData(dataDaUrl || dataSelecionada);

  qs("#js-btn-hoje").addEventListener("click", () => {
    selecionarData(hojeIso());
  });

  adicionarGestoSwipe(qs("#js-week-carousel"),
    () => selecionarData(somarDias(dataSelecionada, 7)),
    () => selecionarData(somarDias(dataSelecionada, -7)));
  adicionarGestoSwipe(qs("#js-agenda-lista"),
    () => selecionarData(somarDias(dataSelecionada, 1)),
    () => selecionarData(somarDias(dataSelecionada, -1)),
    aplicarProgressoCarrossel);

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
    mostrarSucesso();
  });

  qs("#js-btn-desbloquear").addEventListener("click", () => {
    if (!bloqueioPontualEditandoId) return;
    salvarAgendamentos(obterAgendamentos().filter((a) => a.id !== bloqueioPontualEditandoId));
    bloqueioPontualEditandoId = null;
    fecharModal("modal-horario-bloqueado");
    renderizarAgendaLista();
    mostrarSucesso();
  });

  qs("#js-btn-desbloquear-fixo").addEventListener("click", () => {
    if (!bloqueioFixoEditando) return;
    const lista = obterBloqueiosFixos();
    const bloqueio = lista.find((b) => b.id === bloqueioFixoEditando.bloqueioId);
    if (bloqueio) {
      bloqueio.excecoes = bloqueio.excecoes || [];
      bloqueio.excecoes.push(`${dataSelecionada}_${bloqueioFixoEditando.hora}`);
      salvarBloqueiosFixos(lista);
    }
    bloqueioFixoEditando = null;
    fecharModal("modal-horario-bloqueado");
    renderizarAgendaLista();
    mostrarSucesso();
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
    mostrarSucesso();
  });

  qs("#js-novo-agendamento-nome").addEventListener("input", (e) => {
    clienteSelecionadoId = null;
    renderizarResultadosBusca(e.target.value.trim());
    atualizarTelefoneWrap();
  });

  qs("#js-novo-agendamento-nome").addEventListener("focus", (e) => {
    renderizarResultadosBusca(e.target.value.trim());
  });

  qs("#js-novo-agendamento-nome").addEventListener("blur", () => {
    setTimeout(() => qs("#js-novo-agendamento-resultados").classList.add("is-hidden"), 150);
  });

  qs("#js-novo-agendamento-telefone-toggle").addEventListener("click", () => {
    qs("#js-novo-agendamento-telefone").classList.remove("is-hidden");
    qs("#js-novo-agendamento-telefone-toggle").classList.add("is-hidden");
    qs("#js-novo-agendamento-telefone").focus();
  });

  qs("#js-novo-agendamento-observacao-toggle").addEventListener("click", () => {
    qs("#js-novo-agendamento-observacao").classList.remove("is-hidden");
    qs("#js-novo-agendamento-observacao-toggle").classList.add("is-hidden");
    qs("#js-novo-agendamento-observacao").focus();
  });

  qs("#js-finalizar-observacao-toggle").addEventListener("click", () => {
    qs("#js-finalizar-observacao").classList.remove("is-hidden");
    qs("#js-finalizar-observacao-toggle").classList.add("is-hidden");
    qs("#js-finalizar-observacao").focus();
  });

  qs("#js-editar-realizado-observacao-toggle").addEventListener("click", () => {
    qs("#js-editar-realizado-observacao").classList.remove("is-hidden");
    qs("#js-editar-realizado-observacao-toggle").classList.add("is-hidden");
    qs("#js-editar-realizado-observacao").focus();
  });

  qs("#js-finalizar-nome-editar").addEventListener("click", () => {
    qs("#js-finalizar-nome-input").value = qs("#js-finalizar-nome").textContent;
    qs("#js-finalizar-nome-card").classList.add("is-hidden");
    qs("#js-finalizar-nome-input").classList.remove("is-hidden");
    qs("#js-finalizar-nome-input").focus();
  });

  qs("#js-editar-realizado-nome-editar").addEventListener("click", () => {
    qs("#js-editar-realizado-nome-input").value = qs("#js-editar-realizado-nome").textContent;
    qs("#js-editar-realizado-nome-card").classList.add("is-hidden");
    qs("#js-editar-realizado-nome-input").classList.remove("is-hidden");
    qs("#js-editar-realizado-nome-input").focus();
  });

  qs("#js-novo-agendamento-cliente-remover").addEventListener("click", removerSelecaoCliente);

  qs("#js-novo-agendamento-salvar").addEventListener("click", () => {
    const nome = qs("#js-novo-agendamento-nome").value.trim();
    if (!nome) return;
    if (clienteSelecionadoId) {
      finalizarCriacaoOuEdicaoAgendamento(clienteSelecionadoId, nome);
      return;
    }

    const existente = obterClientes().find((c) => c.ativo && c.nome.toLowerCase() === nome.toLowerCase());
    if (existente) {
      pendenteAgendamentoNome = nome;
      pendenteClienteExistenteId = existente.id;
      qs("#js-nome-duplicado-nome").textContent = nome;
      fecharModal("modal-novo-agendamento");
      abrirModal("modal-nome-duplicado");
      return;
    }

    const telefoneNovo = qs("#js-novo-agendamento-telefone").value.trim();
    const hoje = hojeIso();
    const clientes = obterClientes();
    const novoCliente = {
      id: gerarId("cli"), nome, telefone: telefoneNovo,
      aniversarioDia: null, aniversarioMes: null, aniversarioAno: null,
      observacao: "", criadoEm: hoje, atualizadoEm: hoje, ativo: true,
    };
    clientes.push(novoCliente);
    salvarClientes(clientes);
    finalizarCriacaoOuEdicaoAgendamento(novoCliente.id, nome);
  });

  qs("#js-nome-duplicado-usar-existente").addEventListener("click", () => {
    finalizarCriacaoOuEdicaoAgendamento(pendenteClienteExistenteId, pendenteAgendamentoNome);
  });

  qs("#js-nome-duplicado-criar-novo").addEventListener("click", () => {
    const nomeFinal = proximoNomeDisponivel(pendenteAgendamentoNome);
    const hoje = hojeIso();
    const clientes = obterClientes();
    const novoCliente = { id: gerarId("cli"), nome: nomeFinal, telefone: "", aniversarioDia: null, aniversarioMes: null, aniversarioAno: null, observacao: "", criadoEm: hoje, atualizadoEm: hoje, ativo: true };
    clientes.push(novoCliente);
    salvarClientes(clientes);
    finalizarCriacaoOuEdicaoAgendamento(novoCliente.id, nomeFinal);
  });

  qs("#js-finalizar-confirmar").addEventListener("click", () => {
    const agendamento = agendamentoModalAtual;
    if (!agendamento) return;
    const lista = obterAgendamentos();
    const ag = lista.find((a) => a.id === agendamento.id);
    if (!ag) return;
    aplicarEdicaoNome(ag, "js-finalizar-nome-input");
    ag.servicosIds = idsSelecionados("js-finalizar-servicos");
    ag.observacao = qs("#js-finalizar-observacao").value.trim();
    ag.realizadoEm = new Date().toISOString();
    const pagoEscolha = qs("[data-pago].chip--ativo", qs("#modal-finalizar-atendimento")).dataset.pago;
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
    mostrarSucesso();
  });

  qs("#js-btn-editar-realizado").addEventListener("click", () => {
    fecharModal("modal-horario-realizado");
    prepararEditarRealizado(agendamentoModalAtual);
    abrirModal("modal-editar-realizado");
  });

  qs("#modal-editar-realizado").addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-pago-editar]");
    if (!botao) return;
    definirPagoEditarRealizado(botao.dataset.pagoEditar === "sim");
  });

  qs("#js-editar-realizado-salvar").addEventListener("click", () => {
    const agendamento = agendamentoModalAtual;
    if (!agendamento) return;
    const lista = obterAgendamentos();
    const ag = lista.find((a) => a.id === agendamento.id);
    if (!ag) return;
    aplicarEdicaoNome(ag, "js-editar-realizado-nome-input");
    ag.servicosIds = idsSelecionados("js-editar-realizado-servicos");
    ag.observacao = qs("#js-editar-realizado-observacao").value.trim();
    const pagoEscolhido = qs("[data-pago-editar].chip--ativo", qs("#modal-editar-realizado")).dataset.pagoEditar === "sim";
    if (pagoEscolhido) {
      const pagamentos = lerPagamentosDeLinhas("js-editar-realizado-linhas-pagamento");
      ag.status = "realizado_pago";
      ag.pago = true;
      ag.pagamentos = pagamentos;
      ag.valorTotal = pagamentos.reduce((s, p) => s + p.valor, 0);
      delete ag.valorPendente;
    } else {
      const valorPendente = extrairValor(qs("#js-editar-realizado-valor-pendente").value) || 0;
      ag.status = "realizado_pendente";
      ag.pago = false;
      ag.valorPendente = valorPendente;
      ag.valorTotal = valorPendente;
      delete ag.pagamentos;
    }
    salvarAgendamentos(lista);
    fecharModal("modal-editar-realizado");
    renderizarAgendaLista();
    mostrarSucesso();
  });

  qs("#js-confirmar-exclusao-realizado").addEventListener("click", () => {
    if (!agendamentoModalAtual) return;
    salvarAgendamentos(obterAgendamentos().filter((a) => a.id !== agendamentoModalAtual.id));
    fecharModal("modal-confirmar-exclusao-realizado");
    fecharModal("modal-horario-realizado");
    renderizarAgendaLista();
    mostrarSucesso();
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
