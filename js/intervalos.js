/* ============================================================
   AGENDA V3 — Tela Intervalos (Fase 3)
   CRUD completo de bloqueios fixos, ligado de verdade a
   agendaV3:bloqueiosFixos. A grade de horários dos chips vem
   de gerarGradeHorarios(horaInicio, horaFim, intervaloGrade) —
   a mesma função única que a Agenda também vai usar.
   ============================================================ */

const DIAS_LABEL = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom" };

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
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.style.cursor = "pointer";

  linha.innerHTML = `
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle js-intervalo-dias"></p>
      <p class="list-item__terciario js-intervalo-horario"></p>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(bloqueio.nome);
  linha.querySelector(".list-item__title").textContent = bloqueio.nome;
  linha.querySelector(".js-intervalo-dias").textContent = bloqueio.diasSemana.map((dia) => DIAS_LABEL[dia]).join(", ");
  linha.querySelector(".js-intervalo-horario").textContent = descreverHorario(bloqueio);
  linha.addEventListener("click", () => abrirEdicaoIntervalo(bloqueio.id));
  return linha;
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
    const item = evento.target.closest(".segmented__item");
    if (!item) return;
    filtroDiaAtual = item.dataset.dia;
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
    mostrarSucesso();
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
    mostrarSucesso();
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
