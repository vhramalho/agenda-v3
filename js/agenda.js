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
let vendaAnexadaId = null;

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

/* Formato específico da mensagem de Compartilhar horários no WhatsApp
   (ver "Novo modelo de mensagem" §12 no MASTER_CONTEXT.md) — dia da
   semana por extenso + DD/MM, ex.: "Terça-feira 14/07". */
function formatarDataWhatsapp(iso) {
  const d = isoParaDate(iso);
  const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return `${dias[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
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

/* horaInicio/horaFim globais (Configurações) + extensão pontual daquele dia
   (ver "+ Adicionar mais 1 hora", obterExtensoesGrade() em js/storage.js) —
   nunca mexe em agendaV3:config, só no que é exibido pra esse dia. */
function limitesGradeDoDia(iso) {
  const config = obterConfig();
  const extensao = obterExtensoesGrade()[iso] || {};
  return {
    horaInicio: somarMinutosClampado(config.horaInicio, -(extensao.antes || 0)),
    horaFim: somarMinutosClampado(config.horaFim, extensao.depois || 0),
    intervaloGrade: config.intervaloGrade,
  };
}

function classificarGradeDoDia(iso) {
  const limites = limitesGradeDoDia(iso);
  const grade = gerarGradeHorarios(limites.horaInicio, limites.horaFim, limites.intervaloGrade);
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

  /* Compromissos/bloqueios num horário que não bate com a grade atual (ex.:
     agendamento feito com um intervaloGrade diferente do de hoje) continuam
     aparecendo — a lista do dia é a grade oficial + qualquer horário já ocupado. */
  const horariosParaExibir = Array.from(new Set([...grade, ...horariosOcupados])).sort();

  return horariosParaExibir.map((hora) => {
    const agendamento = porHora[hora];
    if (agendamento) {
      if (agendamento.status === "bloqueado") {
        return { hora, tipo: "bloqueado", pontual: true, agendamento };
      }
      if (agendamento.status && agendamento.status.startsWith("realizado_")) {
        return { hora, tipo: "realizado", agendamento };
      }
      return { hora, tipo: "agendado", agendamento };
    }

    if (horariosFixos.has(hora)) {
      return { hora, tipo: "bloqueado", pontual: false, bloqueio: horariosFixos.get(hora) };
    }

    /* "Encaixe": cai dentro da duração real de um agendamento/realizado anterior
       (compromisso sem duracaoMinutos definida não empurra nada — ocupa só o
       próprio horário). Não depende de nenhum ritmo/modo — é sempre calculado
       assim, e não muda o que a Agenda mostra pro profissional. */
    const horaMin = horaParaMinutos(hora);
    const dentroDeAlgumAtendimento = compromissos.some((a) => {
      if (!a.duracaoMinutos || a.status === "bloqueado") return false;
      const ini = horaParaMinutos(a.hora);
      return horaMin > ini && horaMin < ini + a.duracaoMinutos;
    });
    if (dentroDeAlgumAtendimento) return { hora, tipo: "encaixe" };

    return { hora, tipo: "livre" };
  });
}

/* ---------- Compartilhar horários: trechos contínuos livres + passo ---------- */

/* Agrupa os horários "livre" da grade do dia em trechos contínuos (quebrados
   por qualquer agendado/bloqueado/encaixe), pra depois "andar" dentro de
   cada trecho no passo da duração escolhida (regra validada nas simulações,
   ver docs/REFATORACAO_DURACAO_COMPARTILHAMENTO.md). */
function calcularTrechosLivresDoDia(iso) {
  const config = obterConfig();
  const limites = limitesGradeDoDia(iso);
  const grade = gerarGradeHorarios(limites.horaInicio, limites.horaFim, limites.intervaloGrade);
  const porHora = {};
  classificarGradeDoDia(iso).forEach((item) => { porHora[item.hora] = item.tipo; });
  const trechos = [];
  let atual = null;
  grade.forEach((hora) => {
    const tipo = porHora[hora] || "livre";
    const min = horaParaMinutos(hora);
    if (tipo === "livre") {
      if (!atual) {
        atual = { inicioMin: min, fimMin: min + config.intervaloGrade };
        trechos.push(atual);
      } else {
        atual.fimMin = min + config.intervaloGrade;
      }
    } else {
      atual = null;
    }
  });
  return trechos;
}

/* Horários que cabem inteiros (compartilháveis) pra uma duração escolhida, e
   as "sobras" — o resto de cada trecho que não é grande o bastante pra caber
   essa duração. As sobras viram "encaixe" só pra esse compartilhamento, sem
   afetar a Agenda em si. */
function calcularLivresEsobrasDoDia(iso, duracao) {
  const config = obterConfig();
  const trechos = calcularTrechosLivresDoDia(iso);
  const compartilhaveis = [];
  const sobras = [];
  trechos.forEach((t) => {
    let cursor = t.inicioMin;
    while (cursor + duracao <= t.fimMin) {
      compartilhaveis.push(somarMinutos("00:00", cursor));
      cursor += duracao;
    }
    for (let m = cursor; m < t.fimMin; m += config.intervaloGrade) {
      sobras.push(somarMinutos("00:00", m));
    }
  });
  return { compartilhaveis, sobras };
}

function todosEncaixesDoDia(iso) {
  return classificarGradeDoDia(iso).filter((item) => item.tipo === "encaixe").map((item) => item.hora);
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

function montarBotaoEstenderGrade(iso, direcao) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "text-primary-accent";
  botao.style.cssText = `display:block;width:100%;text-align:center;background:none;border:none;font-weight:600;font-size:var(--text-sm);cursor:pointer;opacity:0.7;${direcao === "antes" ? "margin-bottom:8px;" : "margin-top:8px;"}`;
  botao.textContent = "+ Adicionar mais 1 hora";
  botao.addEventListener("click", () => {
    const extensoes = obterExtensoesGrade();
    const atual = extensoes[iso] || {};
    atual[direcao] = (atual[direcao] || 0) + 60;
    extensoes[iso] = atual;
    salvarExtensoesGrade(extensoes);
    renderizarAgendaLista();
  });
  return botao;
}

function renderizarAgendaLista() {
  const container = qs("#js-agenda-lista");
  container.innerHTML = "";
  container.appendChild(montarBotaoEstenderGrade(dataSelecionada, "antes"));
  const itens = classificarGradeDoDia(dataSelecionada);
  itens.forEach((item) => {
    let el;
    if (item.tipo === "livre" || item.tipo === "encaixe") el = montarSlotLivreOuEncaixe(item);
    else if (item.tipo === "agendado") el = montarSlotAgendado(item);
    else if (item.tipo === "realizado") el = montarSlotRealizado(item);
    else el = montarSlotBloqueado(item);
    container.appendChild(el);
  });
  container.appendChild(montarBotaoEstenderGrade(dataSelecionada, "depois"));

  const espacadorFinal = document.createElement("div");
  espacadorFinal.setAttribute("aria-hidden", "true");
  espacadorFinal.style.cssText = "height:120px;flex-shrink:0;";
  container.appendChild(espacadorFinal);
}

function renderizarCabecalho() {
  const d = isoParaDate(dataSelecionada);
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  qs("#js-agenda-mes").textContent = `${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function montarDiasSemana(isoAtivo) {
  const inicio = inicioDaSemana(isoAtivo);
  const mesAtivo = isoParaDate(isoAtivo).getMonth();
  const dias = [];
  for (let i = 0; i < 7; i++) {
    const iso = somarDias(inicio, i);
    const d = isoParaDate(iso);
    const el = document.createElement("div");
    el.className = "week-day"
      + (iso === isoAtivo ? " is-active" : "")
      + (d.getMonth() !== mesAtivo ? " is-outro-mes" : "");
    el.innerHTML = `<span class="week-day__label">${DIAS_SEMANA_LABEL[d.getDay()]}</span><span class="week-day__numero">${String(d.getDate()).padStart(2, "0")}</span>`;
    el.dataset.iso = iso;
    dias.push(el);
  }
  return dias;
}

function renderizarSemana() {
  const container = qs("#js-week-carousel");
  container.innerHTML = "";
  montarDiasSemana(dataSelecionada).forEach((el) => {
    el.addEventListener("click", () => selecionarData(el.dataset.iso));
    container.appendChild(el);
  });
}

function selecionarData(iso) {
  dataSelecionada = iso;
  renderizarCabecalho();
  renderizarSemana();
  renderizarAgendaLista();
  qs("#js-btn-hoje").classList.toggle("is-invisivel", dataSelecionada === hojeIso());
  if (typeof window.renderizarAgendaDiario === "function") window.renderizarAgendaDiario(iso);
  if (typeof window.irParaMesCalendarioAgenda === "function") {
    const d = isoParaDate(iso);
    window.irParaMesCalendarioAgenda(d.getFullYear(), d.getMonth(), d.getDate());
  }
}

window.aoSelecionarDiaCalendarioAgenda = (ano, mes, dia) => {
  const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  selecionarData(iso);
};

function aplicarProgressoCarrossel(deltaX, comprometido) {
  const carrossel = qs("#js-week-carousel");
  const ativo = qs(".week-day.is-active", carrossel);
  if (!ativo) return;
  if (!deltaX && !comprometido) {
    qsa(".week-day", carrossel).forEach((el) => {
      el.classList.remove("week-day--preview");
      el.style.opacity = "";
    });
    return;
  }
  const progresso = comprometido ? 1 : Math.min(Math.abs(deltaX) / 100, 1);
  const vizinho = deltaX < 0 ? ativo.nextElementSibling : ativo.previousElementSibling;
  ativo.style.opacity = String(1 - progresso);
  qsa(".week-day", carrossel).forEach((el) => { if (el !== ativo && el !== vizinho) el.classList.remove("week-day--preview"); });
  if (vizinho) {
    vizinho.classList.add("week-day--preview");
    vizinho.style.opacity = String(progresso);
  }
}

function aplicarProgressoSemana(deltaX, comprometido) {
  const GAP_ENTRE_SEMANAS = 8; // mesmo valor de --space-2, o gap interno dos chips
  const wrap = qs("#js-week-carousel-wrap");
  const preview = qs("#js-week-carousel-preview");
  if (comprometido) {
    preview.style.transition = "transform 220ms ease, opacity 220ms ease";
    preview.style.transform = "translateX(0)";
    preview.style.opacity = "1";
    return;
  }
  if (!deltaX) {
    preview.classList.add("is-hidden");
    preview.innerHTML = "";
    preview.style.transition = "none";
    preview.style.transform = "";
    preview.style.opacity = "";
    return;
  }
  const largura = wrap.offsetWidth + GAP_ENTRE_SEMANAS;
  if (preview.classList.contains("is-hidden")) {
    const indoParaEsquerda = deltaX < 0;
    const isoVizinho = somarDias(dataSelecionada, indoParaEsquerda ? 7 : -7);
    preview.innerHTML = "";
    montarDiasSemana(isoVizinho).forEach((el) => preview.appendChild(el));
    preview.classList.remove("is-hidden");
    preview.dataset.lado = indoParaEsquerda ? "esquerda" : "direita";
    preview.style.transition = "none";
  }
  const offset = preview.dataset.lado === "esquerda" ? largura : -largura;
  preview.style.transform = `translateX(${offset + deltaX}px)`;
  preview.style.opacity = String(Math.min(Math.abs(deltaX) / 100, 1));
}

function adicionarGestoSwipe(elemento, aoArrastarEsquerda, aoArrastarDireita, aoProgresso, distanciaFlick = 24, duracaoComprometido = 130) {
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
    if (!decidido && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
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
    if (horizontal && Math.abs(deltaX) > 60) {
      const indoParaEsquerda = deltaX < 0;
      elemento.style.transform = `translateX(${indoParaEsquerda ? -distanciaFlick : distanciaFlick}px)`;
      if (aoProgresso) aoProgresso(deltaX, true);
      setTimeout(() => {
        elemento.style.transition = "none";
        elemento.style.transform = "translateX(0)";
        if (indoParaEsquerda) aoArrastarEsquerda(); else aoArrastarDireita();
        if (aoProgresso) aoProgresso(0);
      }, duracaoComprometido);
    } else {
      elemento.style.transform = "translateX(0)";
      if (aoProgresso) aoProgresso(0);
    }
  });
}

/* ============================================================
   Parte 2: modais de horário (livre, agendado, bloqueado),
   novo/editar agendamento com busca de cliente, finalizar
   atendimento, editar/excluir realizado, lembrete e WhatsApp.
   ============================================================ */

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

/* Soma do valorOpcional (preço de referência, opcional) dos serviços
   selecionados — usada pra pré-preencher a primeira linha de pagamento
   e, ao salvar, detectar desconto/gorjeta automaticamente (mesma lógica
   simétrica já usada em Vendas, ver js/vendas.js). Sem valorOpcional
   cadastrado em nenhum serviço selecionado, não há base de comparação
   (retorna 0) e nenhum desconto/gorjeta é gravado. */
function valorEsperadoServicos(servicosIds) {
  const servicos = obterServicos();
  return servicosIds.reduce((soma, id) => {
    const servico = servicos.find((s) => s.id === id);
    return soma + (servico && servico.valorOpcional ? servico.valorOpcional : 0);
  }, 0);
}

/* Grava ag.desconto/ag.gorjeta a partir da diferença entre o valor
   esperado (soma de valorOpcional dos serviços) e o valor final do
   atendimento — simétrico ao cálculo já usado em venda.desconto/gorjeta. */
function aplicarDescontoGorjeta(ag, valorEsperado) {
  delete ag.desconto;
  delete ag.gorjeta;
  if (valorEsperado <= 0) return;
  const diferenca = valorEsperado - ag.valorTotal;
  if (diferenca > 0) ag.desconto = diferenca;
  else if (diferenca < 0) ag.gorjeta = -diferenca;
}

/* Duração mais usada nos agendamentos já criados (dentre as opções válidas
   pra grade atual) — a sugestão de duração é "aprendida" pelo uso real, sem
   precisar de uma configuração manual de "duração padrão" que ficaria
   desatualizada toda vez que o usuário mudasse a grade. */
function duracaoAprendida(opcoes) {
  const contagem = {};
  obterAgendamentos().forEach((a) => {
    if (a.status === "bloqueado" || !a.duracaoMinutos || !opcoes.includes(a.duracaoMinutos)) return;
    contagem[a.duracaoMinutos] = (contagem[a.duracaoMinutos] || 0) + 1;
  });
  let melhor = null;
  let maiorContagem = 0;
  Object.keys(contagem).forEach((valor) => {
    if (contagem[valor] >= maiorContagem) {
      maiorContagem = contagem[valor];
      melhor = parseInt(valor, 10);
    }
  });
  return melhor;
}

/* Chips de duração do atendimento — sempre múltiplos da grade atual. Sem
   opção "sem duração": a menor opção já cobre "ocupa só este horário". */
function montarDuracaoChips(containerId, duracaoAtual) {
  const container = qs(`#${containerId}`);
  container.innerHTML = "";
  const config = obterConfig();
  const opcoes = gerarOpcoesDuracao(config.intervaloGrade);
  const aprendida = duracaoAprendida(opcoes);
  const sugestao = duracaoAtual || aprendida || (config.tempoPadraoAtendimento && opcoes.includes(config.tempoPadraoAtendimento) ? config.tempoPadraoAtendimento : opcoes[0]);
  opcoes.forEach((valor) => {
    const chip = document.createElement("span");
    chip.className = "chip" + (valor === sugestao ? " chip--ativo" : "");
    chip.dataset.valor = valor;
    chip.textContent = `${valor} min`;
    container.appendChild(chip);
  });
  inicializarGrupoChips(container, false);
}

function duracaoSelecionada(containerId) {
  const ativo = qs(".chip--ativo", qs(`#${containerId}`));
  return ativo ? parseInt(ativo.dataset.valor, 10) : null;
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
  abrirModal("modal-horario-agendado");
}

/* ---------- Horário realizado ---------- */

function abrirHorarioRealizado(agendamento) {
  agendamentoModalAtual = agendamento;
  qs("#js-realizado-nome").textContent = agendamento.nomeCliente;
  qs("#js-realizado-info").textContent = `${agendamento.hora} · ${nomesServicosPorIds(agendamento.servicosIds) || "—"}`;
  const vendaInfo = qs("#js-realizado-venda-info");
  const venda = agendamento.vendaId ? obterVendas().find((v) => v.id === agendamento.vendaId) : null;
  if (venda) {
    vendaInfo.textContent = textoResumoVenda(venda);
    vendaInfo.classList.remove("is-hidden");
  } else {
    vendaInfo.classList.add("is-hidden");
  }
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

/* ---------- Seletor de cliente genérico (busca ao vivo + card + completar cadastro) ----------
   Usado em 3 modais (Novo/Editar agendamento, Finalizar atendimento, Editar realizado),
   identificados por um "prefixo" que segue a convenção de ids:
   {prefixo}-nome-wrap, {prefixo}-nome, {prefixo}-resultados, {prefixo}-cliente-card,
   {prefixo}-cliente-avatar, {prefixo}-cliente-nome,
   {prefixo}-cliente-remover, {prefixo}-cadastro-wrap, {prefixo}-cadastro-toggle. */

const clientePickerEstado = {};

function clientePickerIds(prefixo) {
  return {
    nomeWrap: `${prefixo}-nome-wrap`, nome: `${prefixo}-nome`, resultados: `${prefixo}-resultados`,
    card: `${prefixo}-cliente-card`, avatar: `${prefixo}-cliente-avatar`, nomeCard: `${prefixo}-cliente-nome`,
    remover: `${prefixo}-cliente-remover`,
    cadastroWrap: `${prefixo}-cadastro-wrap`, cadastroToggle: `${prefixo}-cadastro-toggle`,
  };
}

function atualizarCadastroWrapPicker(prefixo) {
  const ids = clientePickerIds(prefixo);
  const temNome = qs(`#${ids.nome}`).value.trim().length > 0;
  qs(`#${ids.cadastroWrap}`).classList.toggle("is-hidden", !temNome);
}

function mostrarClienteCardPicker(prefixo, cliente) {
  const ids = clientePickerIds(prefixo);
  const card = qs(`#${ids.card}`);
  const nomeWrap = qs(`#${ids.nomeWrap}`);
  const cadastroWrap = qs(`#${ids.cadastroWrap}`);
  if (!cliente) {
    card.classList.add("is-hidden");
    nomeWrap.classList.remove("is-hidden");
    // Sem cliente casado ainda: "+ Completar cadastro" não tem card pra morar
    // dentro, então fica como linha solta logo abaixo do campo de busca.
    cadastroWrap.style.marginTop = "";
    nomeWrap.insertAdjacentElement("afterend", cadastroWrap);
    atualizarCadastroWrapPicker(prefixo);
    return;
  }
  qs(`#${ids.avatar}`).textContent = iniciaisCliente(cliente.nome);
  qs(`#${ids.nomeCard}`).textContent = cliente.nome;
  card.classList.remove("is-hidden");
  nomeWrap.classList.add("is-hidden");
  // Cliente já identificado: "+ Completar cadastro" edita essa mesma pessoa,
  // então passa a morar dentro do card dela, não solto embaixo.
  cadastroWrap.style.marginTop = "var(--space-3)";
  cadastroWrap.style.marginBottom = "0";
  card.appendChild(cadastroWrap);
  atualizarCadastroWrapPicker(prefixo);
}

function removerSelecaoClientePicker(prefixo) {
  clientePickerEstado[prefixo] = null;
  mostrarClienteCardPicker(prefixo, null);
  qs(`#${clientePickerIds(prefixo).nome}`).focus();
}

function renderizarResultadosBuscaPicker(prefixo, termo) {
  const ids = clientePickerIds(prefixo);
  const resultados = qs(`#${ids.resultados}`);
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
      clientePickerEstado[prefixo] = cliente.id;
      qs(`#${ids.nome}`).value = cliente.nome;
      mostrarClienteCardPicker(prefixo, cliente);
      resultados.classList.add("is-hidden");
    });
    resultados.appendChild(linha);
  });
  resultados.classList.remove("is-hidden");
}

function prepararClientePicker(prefixo, clienteId, nome) {
  clientePickerEstado[prefixo] = clienteId || null;
  const ids = clientePickerIds(prefixo);
  qs(`#${ids.nome}`).value = nome || "";
  qs(`#${ids.resultados}`).classList.add("is-hidden");
  const cliente = clienteId ? obterClientes().find((c) => c.id === clienteId) : null;
  mostrarClienteCardPicker(prefixo, cliente);
}

let cadastroAgendaOrigemModalId = null;
let cadastroAgendaClienteEditandoId = null;
let cadastroAgendaAoSalvar = null;

function abrirCompletarCadastro(origemModalId, clienteExistente, nomeAtual, aoSalvar) {
  cadastroAgendaOrigemModalId = origemModalId;
  cadastroAgendaClienteEditandoId = clienteExistente ? clienteExistente.id : null;
  cadastroAgendaAoSalvar = aoSalvar;
  qs("#js-cadastro-agenda-nome").value = clienteExistente ? clienteExistente.nome : (nomeAtual || "");
  qs("#js-cadastro-agenda-telefone").value = clienteExistente ? (clienteExistente.telefone || "") : "";
  qs("#js-cadastro-agenda-aniversario").value = clienteExistente && clienteExistente.aniversarioDia
    ? `${String(clienteExistente.aniversarioDia).padStart(2, "0")}/${String(clienteExistente.aniversarioMes).padStart(2, "0")}`
    : "";
  qs("#js-cadastro-agenda-observacao").value = clienteExistente ? (clienteExistente.observacao || "") : "";
  fecharModal(origemModalId);
  abrirModal("modal-completar-cadastro-agenda");
}

function ligarEventosClientePicker(prefixo, origemModalId) {
  const ids = clientePickerIds(prefixo);
  qs(`#${ids.nome}`).addEventListener("input", (e) => {
    clientePickerEstado[prefixo] = null;
    renderizarResultadosBuscaPicker(prefixo, e.target.value.trim());
    atualizarCadastroWrapPicker(prefixo);
  });
  qs(`#${ids.nome}`).addEventListener("focus", (e) => {
    renderizarResultadosBuscaPicker(prefixo, e.target.value.trim());
  });
  qs(`#${ids.nome}`).addEventListener("blur", () => {
    setTimeout(() => qs(`#${ids.resultados}`).classList.add("is-hidden"), 150);
  });
  qs(`#${ids.remover}`).addEventListener("click", () => removerSelecaoClientePicker(prefixo));
  qs(`#${ids.cadastroToggle}`).addEventListener("click", () => {
    const clienteAtual = clientePickerEstado[prefixo] ? obterClientes().find((c) => c.id === clientePickerEstado[prefixo]) : null;
    abrirCompletarCadastro(origemModalId, clienteAtual, qs(`#${ids.nome}`).value.trim(), (cliente) => {
      clientePickerEstado[prefixo] = cliente.id;
      qs(`#${ids.nome}`).value = cliente.nome;
      mostrarClienteCardPicker(prefixo, cliente);
    });
  });
}

function proximoNomeDisponivel(nomeBase) {
  const clientes = obterClientes();
  if (!clientes.some((c) => c.nome === nomeBase)) return nomeBase;
  let n = 2;
  while (clientes.some((c) => c.nome === `${nomeBase} ${n}`)) n++;
  return `${nomeBase} ${n}`;
}

/* toggle é o card clicável (.list-item por dentro) — o texto some no
   .list-item__title, nunca no próprio toggle, senão apaga o ícone/seta. */
function textoToggleObservacao(toggle) {
  return qs(".list-item__title", toggle) || toggle;
}

function prepararObservacaoWrap(idTextarea, idToggle, texto) {
  const textarea = qs(`#${idTextarea}`);
  const toggle = qs(`#${idToggle}`);
  textarea.value = texto || "";
  // Já existe observação salva (ex.: editando um agendamento/realizado) —
  // mostra o campo direto, sem esconder atrás do "+ Adicionar observação"
  // (esse convite só faz sentido quando ainda não tem nada escrito).
  const jaTemTexto = !!(texto || "").trim();
  textarea.classList.toggle("is-hidden", !jaTemTexto);
  toggle.classList.toggle("is-hidden", jaTemTexto);
  textoToggleObservacao(toggle).textContent = "+ Adicionar observação";
}

function alternarObservacaoWrap(idTextarea, idToggle) {
  const textarea = qs(`#${idTextarea}`);
  const toggle = qs(`#${idToggle}`);
  const abrir = textarea.classList.contains("is-hidden");
  textarea.classList.toggle("is-hidden", !abrir);
  textoToggleObservacao(toggle).textContent = abrir ? "- Adicionar observação" : "+ Adicionar observação";
  if (abrir) textarea.focus();
}

function prepararNovoAgendamento() {
  agendamentoEditandoId = null;
  qs("#js-novo-agendamento-titulo").textContent = "Novo agendamento";
  qs("#js-novo-agendamento-data-hora").textContent = `${formatarDataLonga(dataSelecionada)} — ${horaModalAtual}`;
  prepararClientePicker("js-novo-agendamento", null, "");
  montarServicosChips("js-novo-agendamento-servicos", []);
  montarDuracaoChips("js-novo-agendamento-duracao", null);
  prepararObservacaoWrap("js-novo-agendamento-observacao", "js-novo-agendamento-observacao-toggle", "");
  // Botão "Agendar cliente" (modal-horario-livre) troca de modal via
  // data-trocar-modal — abrirModal roda ANTES desta função (listener
  // genérico do modal.js é anexado antes do listener que chama esta
  // função), então os chips recém-montados acima ainda não tinham
  // passado pelo ajuste de tamanho de texto. Refaz aqui.
  ajustarTextoChips(qs("#modal-novo-agendamento"));
}

function prepararEdicaoAgendamento(agendamento) {
  agendamentoEditandoId = agendamento.id;
  horaModalAtual = agendamento.hora;
  qs("#js-novo-agendamento-titulo").textContent = "Editar agendamento";
  qs("#js-novo-agendamento-data-hora").textContent = `${formatarDataLonga(agendamento.data)} — ${agendamento.hora}`;
  prepararClientePicker("js-novo-agendamento", agendamento.clienteId || null, agendamento.nomeCliente);
  montarServicosChips("js-novo-agendamento-servicos", agendamento.servicosIds || []);
  montarDuracaoChips("js-novo-agendamento-duracao", agendamento.duracaoMinutos || null);
  prepararObservacaoWrap("js-novo-agendamento-observacao", "js-novo-agendamento-observacao-toggle", agendamento.observacao || "");
  ajustarTextoChips(qs("#modal-novo-agendamento"));
}

function finalizarCriacaoOuEdicaoAgendamento(clienteId, nome) {
  const servicosIds = idsSelecionados("js-novo-agendamento-servicos");
  const observacao = qs("#js-novo-agendamento-observacao").value.trim();
  const duracaoMinutos = duracaoSelecionada("js-novo-agendamento-duracao");
  const lista = obterAgendamentos();
  if (agendamentoEditandoId) {
    const ag = lista.find((a) => a.id === agendamentoEditandoId);
    if (ag) {
      ag.nomeCliente = nome;
      ag.clienteId = clienteId;
      ag.servicosIds = servicosIds;
      ag.observacao = observacao;
      ag.duracaoMinutos = duracaoMinutos;
    }
  } else {
    lista.push({
      id: gerarId("agd"), data: dataSelecionada, hora: horaModalAtual,
      clienteId: clienteId || null, nomeCliente: nome,
      servicosIds, observacao, status: "agendado", duracaoMinutos,
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

function salvarNomeClienteInline(ag, prefixo) {
  const nome = qs(`#${clientePickerIds(prefixo).nome}`).value.trim();
  if (!nome) return;
  const clienteId = clientePickerEstado[prefixo] || ag.clienteId || null;
  ag.nomeCliente = nome;
  ag.clienteId = clienteId;
  if (clienteId) {
    const clientes = obterClientes();
    const cliente = clientes.find((c) => c.id === clienteId);
    if (cliente && cliente.nome !== nome) {
      cliente.nome = nome;
      cliente.atualizadoEm = hojeIso();
      salvarClientes(clientes);
    }
  }
}

function prepararFinalizarAtendimento(agendamento) {
  const modal = qs("#modal-finalizar-atendimento");
  prepararClientePicker("js-finalizar", agendamento.clienteId || null, agendamento.nomeCliente);
  montarServicosChips("js-finalizar-servicos", agendamento.servicosIds || []);
  prepararObservacaoWrap("js-finalizar-observacao", "js-finalizar-observacao-toggle", agendamento.observacao || "");
  vendaAnexadaId = null;
  qs("#js-finalizar-venda-toggle").classList.remove("is-hidden");
  qs("#js-finalizar-venda-resumo").classList.add("is-hidden");
  qsa("[data-pago]", modal).forEach((b) => b.classList.remove("chip--ativo"));
  qsa("[data-campo-pago]", modal).forEach((campo) => campo.classList.add("is-hidden"));
  montarFormasChips("js-finalizar-formas", "js-finalizar-linhas-pagamento", [], {}, () => valorEsperadoServicos(idsSelecionados("js-finalizar-servicos")), "js-finalizar-desconto-gorjeta-aviso");
  qs("#js-finalizar-valor-pendente").value = "";
}

function textoResumoVenda(venda) {
  const statusTexto = venda.status === "paga" ? "Pago" : "Pendente";
  return `${venda.itens.length} ite${venda.itens.length === 1 ? "m" : "ns"} — ${formatarMoeda(venda.valorTotal)} — ${statusTexto}`;
}

function mostrarResumoVendaFinalizar(venda) {
  vendaAnexadaId = venda.id;
  qs("#js-finalizar-venda-resumo-texto").textContent = textoResumoVenda(venda);
  qs("#js-finalizar-venda-toggle").classList.add("is-hidden");
  qs("#js-finalizar-venda-resumo").classList.remove("is-hidden");
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

function mostrarResumoVendaEditarRealizado(venda) {
  vendaAnexadaId = venda.id;
  qs("#js-editar-realizado-venda-resumo-texto").textContent = textoResumoVenda(venda);
  qs("#js-editar-realizado-venda-toggle").classList.add("is-hidden");
  qs("#js-editar-realizado-venda-resumo").classList.remove("is-hidden");
}

function ocultarResumoVendaEditarRealizado() {
  qs("#js-editar-realizado-venda-toggle").classList.remove("is-hidden");
  qs("#js-editar-realizado-venda-resumo").classList.add("is-hidden");
}

function prepararEditarRealizado(agendamento) {
  prepararClientePicker("js-editar-realizado", agendamento.clienteId || null, agendamento.nomeCliente);
  montarServicosChips("js-editar-realizado-servicos", agendamento.servicosIds || []);
  prepararObservacaoWrap("js-editar-realizado-observacao", "js-editar-realizado-observacao-toggle", agendamento.observacao || "");
  const vendaExistente = agendamento.vendaId ? obterVendas().find((v) => v.id === agendamento.vendaId) : null;
  if (vendaExistente) {
    mostrarResumoVendaEditarRealizado(vendaExistente);
  } else {
    vendaAnexadaId = null;
    ocultarResumoVendaEditarRealizado();
  }
  const pago = agendamento.status === "realizado_pago";
  if (pago) {
    const valoresPorNome = {};
    const nomesSelecionados = [];
    const formas = obterFormasPagamento();
    (agendamento.pagamentos || []).forEach((p) => {
      const forma = formas.find((f) => f.id === p.formaPagamentoId);
      if (forma) { nomesSelecionados.push(forma.nome); valoresPorNome[forma.nome] = p.valor; }
    });
    montarFormasChips("js-editar-realizado-formas", "js-editar-realizado-linhas-pagamento", nomesSelecionados, valoresPorNome, () => valorEsperadoServicos(idsSelecionados("js-editar-realizado-servicos")), "js-editar-realizado-desconto-gorjeta-aviso");
    qs("#js-editar-realizado-valor-pendente").value = "";
  } else {
    montarFormasChips("js-editar-realizado-formas", "js-editar-realizado-linhas-pagamento", [], {}, () => valorEsperadoServicos(idsSelecionados("js-editar-realizado-servicos")), "js-editar-realizado-desconto-gorjeta-aviso");
    qs("#js-editar-realizado-valor-pendente").value = agendamento.valorPendente != null ? formatarMoeda(agendamento.valorPendente) : "";
  }
  definirPagoEditarRealizado(pago);
}

/* ============================================================
   Parte 3: ligação dos eventos e renderização inicial
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  garantirFormasPagamentoPadrao();
  aplicarMascaraMoeda(qs("#js-finalizar-valor-pendente"));
  aplicarMascaraMoeda(qs("#js-editar-realizado-valor-pendente"));
  const dataDaUrl = new URLSearchParams(window.location.search).get("data");
  selecionarData(dataDaUrl || dataSelecionada);

  qs("#js-btn-hoje").addEventListener("click", () => {
    selecionarData(hojeIso());
  });

  adicionarGestoSwipe(qs("#js-week-carousel"),
    () => selecionarData(somarDias(dataSelecionada, 7)),
    () => selecionarData(somarDias(dataSelecionada, -7)),
    aplicarProgressoSemana,
    500, 220);
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
    if (!agendamento) return;
    const cliente = agendamento.clienteId ? obterClientes().find((c) => c.id === agendamento.clienteId) : null;
    if (!cliente || !cliente.telefone) {
      mostrarAviso("Telefone não cadastrado");
      return;
    }
    const mensagem = substituirPlaceholders(obterWhatsapp().mensagemLembrete || "", {
      nome: cliente.nome,
      hora: agendamento.hora,
      dia: formatarDiaRelativo(agendamento.data),
      endereco: obterConfig().endereco || "",
    });
    const digitos = cliente.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${digitos}?text=${encodeURIComponent(mensagem)}`, "_blank");
  });

  qs("#js-btn-endereco-agendado").addEventListener("click", () => {
    const agendamento = agendamentoModalAtual;
    if (!agendamento) return;
    const cliente = agendamento.clienteId ? obterClientes().find((c) => c.id === agendamento.clienteId) : null;
    if (!cliente || !cliente.telefone) {
      mostrarAviso("Telefone não cadastrado");
      return;
    }
    const config = obterConfig();
    const mensagem = substituirPlaceholders(obterWhatsapp().mensagemEndereco || "", {
      nome: cliente.nome,
      endereco: config.endereco || "",
      mapa: gerarLinkMapa(config.endereco, config.linkMapa),
    });
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

  ligarEventosClientePicker("js-novo-agendamento", "modal-novo-agendamento");
  ligarEventosClientePicker("js-finalizar", "modal-finalizar-atendimento");
  ligarEventosClientePicker("js-editar-realizado", "modal-editar-realizado");

  qs("#js-finalizar-venda-toggle").addEventListener("click", () => {
    const agendamento = agendamentoModalAtual;
    if (!agendamento) return;
    fecharModal("modal-finalizar-atendimento");
    prepararNovaVenda(
      { clienteId: agendamento.clienteId, nomeCliente: agendamento.nomeCliente, agendamentoId: agendamento.id, data: agendamento.data },
      (venda) => {
        fecharModal("modal-nova-venda");
        abrirModal("modal-finalizar-atendimento");
        mostrarResumoVendaFinalizar(venda);
      },
      () => abrirModal("modal-finalizar-atendimento")
    );
    abrirModal("modal-nova-venda");
  });

  qs("#js-finalizar-venda-resumo").addEventListener("click", () => {
    const venda = vendaAnexadaId ? obterVendas().find((v) => v.id === vendaAnexadaId) : null;
    if (!venda) return;
    fecharModal("modal-finalizar-atendimento");
    prepararEditarVenda(
      venda,
      (vendaAtualizada) => {
        fecharModal("modal-nova-venda");
        abrirModal("modal-finalizar-atendimento");
        mostrarResumoVendaFinalizar(vendaAtualizada);
      },
      () => abrirModal("modal-finalizar-atendimento"),
      () => {
        removerVendaAnexada(venda.id);
        vendaAnexadaId = null;
        fecharModal("modal-nova-venda");
        abrirModal("modal-finalizar-atendimento");
        qs("#js-finalizar-venda-toggle").classList.remove("is-hidden");
        qs("#js-finalizar-venda-resumo").classList.add("is-hidden");
      }
    );
    abrirModal("modal-nova-venda");
  });

  // Se o usuário cancelar (ou tocar fora) o Finalizar atendimento depois de
  // já ter anexado uma venda, desfaz a venda e devolve o estoque — senão
  // ficaria uma venda "órfã" sem atendimento e o estoque descontado à toa.
  const abandonarVendaSeAnexada = () => {
    if (!vendaAnexadaId) return;
    removerVendaAnexada(vendaAnexadaId);
    vendaAnexadaId = null;
  };
  qs('#modal-finalizar-atendimento [data-fechar-modal]').addEventListener("click", abandonarVendaSeAnexada);
  qs("#modal-finalizar-atendimento").addEventListener("click", (e) => {
    if (e.target.id === "modal-finalizar-atendimento") abandonarVendaSeAnexada();
  });

  qs("#js-cadastro-agenda-cancelar").addEventListener("click", () => {
    fecharModal("modal-completar-cadastro-agenda");
    if (cadastroAgendaOrigemModalId) abrirModal(cadastroAgendaOrigemModalId);
  });

  qs("#js-cadastro-agenda-salvar").addEventListener("click", () => {
    const nome = qs("#js-cadastro-agenda-nome").value.trim();
    if (!nome) return;
    const { dia, mes } = extrairAniversario(qs("#js-cadastro-agenda-aniversario").value);
    const hoje = hojeIso();
    const clientes = obterClientes();
    let cliente = cadastroAgendaClienteEditandoId ? clientes.find((c) => c.id === cadastroAgendaClienteEditandoId) : null;
    if (cliente) {
      cliente.nome = nome;
      cliente.telefone = qs("#js-cadastro-agenda-telefone").value.trim();
      cliente.aniversarioDia = dia;
      cliente.aniversarioMes = mes;
      cliente.observacao = qs("#js-cadastro-agenda-observacao").value.trim();
      cliente.atualizadoEm = hoje;
    } else {
      cliente = {
        id: gerarId("cli"), nome,
        telefone: qs("#js-cadastro-agenda-telefone").value.trim(),
        aniversarioDia: dia, aniversarioMes: mes, aniversarioAno: null,
        observacao: qs("#js-cadastro-agenda-observacao").value.trim(),
        criadoEm: hoje, atualizadoEm: hoje, ativo: true,
      };
      clientes.push(cliente);
    }
    salvarClientes(clientes);
    fecharModal("modal-completar-cadastro-agenda");
    if (cadastroAgendaOrigemModalId) abrirModal(cadastroAgendaOrigemModalId);
    if (cadastroAgendaAoSalvar) cadastroAgendaAoSalvar(cliente);
  });

  qs("#js-novo-agendamento-observacao-toggle").addEventListener("click", () => {
    alternarObservacaoWrap("js-novo-agendamento-observacao", "js-novo-agendamento-observacao-toggle");
  });

  qs("#js-finalizar-observacao-toggle").addEventListener("click", () => {
    alternarObservacaoWrap("js-finalizar-observacao", "js-finalizar-observacao-toggle");
  });

  qs("#js-editar-realizado-observacao-toggle").addEventListener("click", () => {
    alternarObservacaoWrap("js-editar-realizado-observacao", "js-editar-realizado-observacao-toggle");
  });

  qs("#modal-editar-realizado").addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-pago-editar]");
    if (!botao) return;
    definirPagoEditarRealizado(botao.dataset.pagoEditar === "sim");
  });

  qs("#js-novo-agendamento-salvar").addEventListener("click", () => {
    const nome = qs("#js-novo-agendamento-nome").value.trim();
    if (!nome) return;
    const clienteId = clientePickerEstado["js-novo-agendamento"];
    if (clienteId) {
      finalizarCriacaoOuEdicaoAgendamento(clienteId, nome);
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

    const hoje = hojeIso();
    const clientes = obterClientes();
    const novoCliente = {
      id: gerarId("cli"), nome, telefone: "",
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
    salvarNomeClienteInline(ag, "js-finalizar");
    ag.servicosIds = idsSelecionados("js-finalizar-servicos");
    ag.observacao = qs("#js-finalizar-observacao").value.trim();
    const pagoAtivo = qs("[data-pago].chip--ativo", qs("#modal-finalizar-atendimento"));
    if (!pagoAtivo) {
      mostrarAviso("Selecione se foi pago");
      return;
    }
    ag.realizadoEm = new Date().toISOString();
    const pagoEscolha = pagoAtivo.dataset.pago;
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
    aplicarDescontoGorjeta(ag, valorEsperadoServicos(ag.servicosIds));
    if (vendaAnexadaId) ag.vendaId = vendaAnexadaId;
    salvarAgendamentos(lista);
    vendaAnexadaId = null;
    fecharModal("modal-finalizar-atendimento");
    renderizarAgendaLista();
    mostrarSucesso();
  });

  qs("#js-btn-editar-realizado").addEventListener("click", () => {
    fecharModal("modal-horario-realizado");
    prepararEditarRealizado(agendamentoModalAtual);
    abrirModal("modal-editar-realizado");
  });

  qs("#js-editar-realizado-venda-toggle").addEventListener("click", () => {
    const agendamento = agendamentoModalAtual;
    if (!agendamento) return;
    fecharModal("modal-editar-realizado");
    prepararNovaVenda(
      { clienteId: agendamento.clienteId, nomeCliente: agendamento.nomeCliente, agendamentoId: agendamento.id, data: agendamento.data },
      (venda) => {
        fecharModal("modal-nova-venda");
        abrirModal("modal-editar-realizado");
        mostrarResumoVendaEditarRealizado(venda);
      },
      () => abrirModal("modal-editar-realizado")
    );
    abrirModal("modal-nova-venda");
  });

  qs("#js-editar-realizado-venda-resumo").addEventListener("click", () => {
    const venda = vendaAnexadaId ? obterVendas().find((v) => v.id === vendaAnexadaId) : null;
    if (!venda) return;
    fecharModal("modal-editar-realizado");
    prepararEditarVenda(
      venda,
      (vendaAtualizada) => {
        fecharModal("modal-nova-venda");
        abrirModal("modal-editar-realizado");
        mostrarResumoVendaEditarRealizado(vendaAtualizada);
      },
      () => abrirModal("modal-editar-realizado"),
      () => {
        removerVendaAnexada(venda.id);
        vendaAnexadaId = null;
        fecharModal("modal-nova-venda");
        abrirModal("modal-editar-realizado");
        ocultarResumoVendaEditarRealizado();
      }
    );
    abrirModal("modal-nova-venda");
  });

  qs("#js-editar-realizado-salvar").addEventListener("click", () => {
    const agendamento = agendamentoModalAtual;
    if (!agendamento) return;
    const lista = obterAgendamentos();
    const ag = lista.find((a) => a.id === agendamento.id);
    if (!ag) return;
    salvarNomeClienteInline(ag, "js-editar-realizado");
    ag.servicosIds = idsSelecionados("js-editar-realizado-servicos");
    ag.observacao = qs("#js-editar-realizado-observacao").value.trim();
    const eraPendente = ag.status === "realizado_pendente";
    const pagoEscolhido = qs("[data-pago-editar].chip--ativo", qs("#modal-editar-realizado")).dataset.pagoEditar === "sim";
    if (pagoEscolhido) {
      const pagamentos = lerPagamentosDeLinhas("js-editar-realizado-linhas-pagamento");
      ag.status = "realizado_pago";
      ag.pago = true;
      ag.pagamentos = pagamentos;
      ag.valorTotal = pagamentos.reduce((s, p) => s + p.valor, 0);
      delete ag.valorPendente;
      if (eraPendente) {
        ag.foiPendente = true;
        ag.pagoEm = new Date().toISOString();
      }
    } else {
      const valorPendente = extrairValor(qs("#js-editar-realizado-valor-pendente").value) || 0;
      ag.status = "realizado_pendente";
      ag.pago = false;
      ag.valorPendente = valorPendente;
      ag.valorTotal = valorPendente;
      delete ag.pagamentos;
    }
    aplicarDescontoGorjeta(ag, valorEsperadoServicos(ag.servicosIds));
    if (vendaAnexadaId) ag.vendaId = vendaAnexadaId;
    else delete ag.vendaId;
    salvarAgendamentos(lista);
    fecharModal("modal-editar-realizado");
    renderizarAgendaLista();
    mostrarSucesso();
  });

  qs("#js-confirmar-exclusao-realizado").addEventListener("click", () => {
    if (!agendamentoModalAtual) return;
    const lista = obterAgendamentos();
    const ag = lista.find((a) => a.id === agendamentoModalAtual.id);
    if (ag && ag.vendaId) removerVendaAnexada(ag.vendaId);
    salvarAgendamentos(lista.filter((a) => a.id !== agendamentoModalAtual.id));
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
    montarDuracaoChips("js-whatsapp-duracao", null);
    atualizarPreviaWhatsapp();
    abrirModal("modal-compartilhar-whatsapp");
  });

  [qs("#js-whatsapp-dias"), qs("#js-whatsapp-duracao"), qs("#js-whatsapp-mostrar")].forEach((container) => {
    container.addEventListener("click", (e) => {
      if (e.target.closest(".chip")) atualizarPreviaWhatsapp();
    });
  });

  qs("#js-whatsapp-enviar").addEventListener("click", () => {
    const diasSelecionados = qsa(".chip--ativo", qs("#js-whatsapp-dias")).map((c) => c.dataset.iso);
    if (diasSelecionados.length === 0) return;
    const mensagem = qs("#js-whatsapp-previa").value.trim();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, "_blank");
    fecharModal("modal-compartilhar-whatsapp");
  });
});

function montarMensagemHorarios() {
  const diasSelecionados = qsa(".chip--ativo", qs("#js-whatsapp-dias")).map((c) => c.dataset.iso);
  if (diasSelecionados.length === 0) return "";
  const duracao = duracaoSelecionada("js-whatsapp-duracao");
  const mostrarValores = qsa(".chip--ativo", qs("#js-whatsapp-mostrar")).map((c) => c.dataset.valor);
  const mostrarLivre = mostrarValores.includes("livre");
  const mostrarEncaixe = mostrarValores.includes("encaixe");
  const whatsapp = obterWhatsapp();
  let mensagem = substituirPlaceholders(whatsapp.mensagemHorarios || "Horários disponíveis:");
  diasSelecionados.sort().forEach((iso) => {
    const resultado = calcularLivresEsobrasDoDia(iso, duracao);
    const livres = resultado.compartilhaveis;
    const sobras = resultado.sobras;
    const encaixes = Array.from(new Set([...todosEncaixesDoDia(iso), ...sobras])).sort();

    const linhas = [];
    if (mostrarLivre && livres.length > 0) linhas.push(...livres);
    if (mostrarEncaixe && encaixes.length > 0) {
      linhas.push("*Encaixes possíveis:");
      linhas.push(...encaixes);
    }

    mensagem += `\n\n${formatarDataWhatsapp(iso)}\n`;
    mensagem += linhas.length > 0 ? linhas.join("\n") : "(Sem horários disponíveis)";
  });
  return mensagem;
}

function atualizarPreviaWhatsapp() {
  const previa = qs("#js-whatsapp-previa");
  if (!previa) return;
  previa.value = montarMensagemHorarios();
}
