/* ============================================================
   AGENDA V3 — Tela Intervalos (Fase 3)
   CRUD completo de bloqueios fixos, ligado de verdade a
   agendaV3:bloqueiosFixos. A grade de horários dos chips vem
   de gerarGradeHorarios(horaInicio, horaFim, intervaloGrade) —
   a mesma função única que a Agenda também vai usar.
   ============================================================ */

const DIAS_LABEL = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom" };
const ICONES_INTERVALO = [
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3v8a3 3 0 0 0 6 0V3M9 11v10M16 3c-1.5 2-1.5 5 0 7v10"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9h13a3 3 0 0 1 0 6h-1M4 9v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2M4 9V6h12v3"/></svg>',
];
const ICONE_FOLGA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="7" rx="1"/><path d="M5 11V8a4 4 0 0 1 8 0M19 18v2M5 18v2"/></svg>';

let intervaloEditandoId = null;
let filtroDiaAtual = "todos";

function gradeAtual() {
  const config = obterConfig();
  return gerarGradeHorarios(config.horaInicio, config.horaFim, config.intervaloGrade);
}

function montarGradeHorarioChips(container, ativos) {
  container.innerHTML = "";
  gradeAtual().forEach((hora) => {
    const chip = document.createElement("span");
    chip.className = "chip" + (ativos.includes(hora) ? " chip--ativo" : "");
    chip.dataset.hora = hora;
    chip.textContent = hora;
    container.appendChild(chip);
  });
  inicializarGrupoChips(container, true);
}

function horariosSelecionados(container) {
  return qsa(".chip--ativo", container).map((chip) => chip.dataset.hora);
}

function diasSelecionados(container) {
  return qsa(".chip--ativo", container).map((chip) => chip.dataset.dia);
}

function marcarDiasAtivos(container, dias) {
  qsa(".chip", container).forEach((chip) => {
    chip.classList.toggle("chip--ativo", dias.includes(chip.dataset.dia));
  });
}

function descreverHorario(bloqueio) {
  const horarios = [...bloqueio.horariosBloqueados].sort();
  if (horarios.length === 0) return "—";
  const grade = gradeAtual();
  const intervaloGrade = obterConfig().intervaloGrade;

  if (horarios.length === grade.length && grade.every((h) => horarios.includes(h))) {
    return "Dia todo";
  }

  const indicesContiguos = horarios.every((h, i) => i === 0 || somarMinutos(horarios[i - 1], intervaloGrade) === h);
  if (indicesContiguos) {
    const fim = somarMinutos(horarios[horarios.length - 1], intervaloGrade);
    return `${horarios[0]} - ${fim}`;
  }
  return `${horarios.length} horários bloqueados`;
}

function montarLinhaIntervalo(bloqueio, indice) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.cursor = "pointer";
  const icone = bloqueio.diasSemana.length === 1 && bloqueio.diasSemana[0] === "dom"
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>'
    : (bloqueio.diasSemana.length === 1 ? ICONE_FOLGA : ICONES_INTERVALO[indice % ICONES_INTERVALO.length]);

  card.innerHTML = `
    <div class="row row--between" style="margin-bottom:10px;">
      <div class="row">
        <div class="icon-circle">${icone}</div>
        <p style="font-weight:700;"></p>
      </div>
      <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
    </div>
    <div class="row" style="margin-bottom:10px;flex-wrap:wrap;"></div>
    <div class="row text-secondary">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
      <span></span>
    </div>
  `;
  card.querySelector("p").textContent = bloqueio.nome;
  const diasContainer = card.querySelector(".row:nth-child(2)");
  bloqueio.diasSemana.forEach((dia) => {
    const chip = document.createElement("span");
    chip.className = "chip chip--outline-ativo";
    chip.textContent = DIAS_LABEL[dia];
    diasContainer.appendChild(chip);
  });
  card.querySelector(".text-secondary span").textContent = descreverHorario(bloqueio);
  card.addEventListener("click", () => abrirEdicaoIntervalo(bloqueio.id));
  return card;
}

function calcularTotaisBloqueados(bloqueios) {
  const intervaloGrade = obterConfig().intervaloGrade || 30;
  let totalMinutosSemana = 0;
  bloqueios.forEach((b) => {
    totalMinutosSemana += b.horariosBloqueados.length * intervaloGrade * b.diasSemana.length;
  });
  const mediaMinutosDia = totalMinutosSemana / 7;
  qs("#js-intervalos-total").textContent = formatarDuracao(totalMinutosSemana);
  qs("#js-intervalos-media").textContent = formatarDuracao(mediaMinutosDia);
}

function formatarDuracao(minutos) {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function renderizarIntervalos() {
  const bloqueios = obterBloqueiosFixos().filter((b) => b.ativo);
  const filtrados = filtroDiaAtual === "todos" ? bloqueios : bloqueios.filter((b) => b.diasSemana.includes(filtroDiaAtual));

  const container = qs("#js-lista-intervalos");
  const vazio = qs("#js-intervalos-vazio");
  container.innerHTML = "";

  if (filtrados.length === 0) {
    container.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
  } else {
    container.classList.remove("is-hidden");
    vazio.classList.add("is-hidden");
    filtrados.forEach((bloqueio, indice) => container.appendChild(montarLinhaIntervalo(bloqueio, indice)));
  }

  calcularTotaisBloqueados(bloqueios);
}

function abrirNovoIntervalo() {
  qs("#js-novo-intervalo-nome").value = "";
  marcarDiasAtivos(qs("#js-novo-intervalo-dias"), []);
  montarGradeHorarioChips(qs("#js-novo-intervalo-horarios"), []);
  abrirModal("modal-novo-intervalo");
}

function abrirEdicaoIntervalo(id) {
  const bloqueio = obterBloqueiosFixos().find((b) => b.id === id);
  if (!bloqueio) return;
  intervaloEditandoId = id;
  qs("#js-editar-intervalo-nome").value = bloqueio.nome;
  marcarDiasAtivos(qs("#js-editar-intervalo-dias"), bloqueio.diasSemana);
  montarGradeHorarioChips(qs("#js-editar-intervalo-horarios"), bloqueio.horariosBloqueados);
  abrirModal("modal-editar-intervalo");
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarIntervalos();

  qs("#js-filtro-dia").addEventListener("click", (evento) => {
    const chip = evento.target.closest(".chip");
    if (!chip) return;
    filtroDiaAtual = chip.dataset.dia;
    renderizarIntervalos();
  });

  qs("#js-btn-novo-intervalo").addEventListener("click", abrirNovoIntervalo);

  qs("#js-novo-intervalo-salvar").addEventListener("click", () => {
    const nome = qs("#js-novo-intervalo-nome").value.trim();
    const dias = diasSelecionados(qs("#js-novo-intervalo-dias"));
    const horarios = horariosSelecionados(qs("#js-novo-intervalo-horarios"));
    if (!nome || dias.length === 0 || horarios.length === 0) return;
    const lista = obterBloqueiosFixos();
    lista.push({ id: gerarId("blq"), nome, diasSemana: dias, horariosBloqueados: horarios, ativo: true });
    salvarBloqueiosFixos(lista);
    fecharModal("modal-novo-intervalo");
    renderizarIntervalos();
  });

  qs("#js-editar-intervalo-salvar").addEventListener("click", () => {
    const nome = qs("#js-editar-intervalo-nome").value.trim();
    const dias = diasSelecionados(qs("#js-editar-intervalo-dias"));
    const horarios = horariosSelecionados(qs("#js-editar-intervalo-horarios"));
    if (!nome || dias.length === 0 || horarios.length === 0 || !intervaloEditandoId) return;
    const lista = obterBloqueiosFixos();
    const bloqueio = lista.find((b) => b.id === intervaloEditandoId);
    if (!bloqueio) return;
    bloqueio.nome = nome;
    bloqueio.diasSemana = dias;
    bloqueio.horariosBloqueados = horarios;
    salvarBloqueiosFixos(lista);
    fecharModal("modal-editar-intervalo");
    renderizarIntervalos();
  });

  qs("#js-confirmar-exclusao-intervalo").addEventListener("click", () => {
    if (!intervaloEditandoId) return;
    const lista = obterBloqueiosFixos().filter((b) => b.id !== intervaloEditandoId);
    salvarBloqueiosFixos(lista);
    intervaloEditandoId = null;
    fecharModal("modal-confirmar-exclusao-intervalo");
    renderizarIntervalos();
  });
});
