/* ============================================================
   AGENDA V3 — Agenda diário: Anotação/Tarefa/Lista por dia
   Card entre o carrossel de semana e a lista de horários (ver
   Documentacao/MASTER_CONTEXT.md §24, "Em discussão 2026-07-06").
   Acionado por js/agenda.js via window.renderizarAgendaDiario(iso)
   sempre que o dia selecionado muda — este arquivo é dono de toda
   a renderização, dados e modais dessa seção.
   ============================================================ */

let notaDiarioEditandoId = null;
let tarefaDiarioEditandoId = null;
let listaDiarioAtualId = null;
let exclusaoDiarioAtual = null; // { tipo: "nota"|"tarefa"|"lista", id }
let agendaDiarioAberto = false;

function obterNotaDoDiaDiario(iso) {
  return obterNotasDiarias().find((n) => n.dataIso === iso) || null;
}
function obterTarefasDoDiaDiario(iso) {
  return obterTarefasDiarias().filter((t) => t.dataIso === iso);
}
function obterListasDoDiaDiario(iso) {
  return obterListasDiarias().filter((l) => l.dataIso === iso);
}

function contarItensDiario(iso) {
  const nota = obterNotaDoDiaDiario(iso) ? 1 : 0;
  const tarefasPendentes = obterTarefasDoDiaDiario(iso).filter((t) => !t.feito).length;
  const listas = obterListasDoDiaDiario(iso).length;
  return { nota, tarefas: tarefasPendentes, listas, total: nota + tarefasPendentes + listas };
}

function iconeClipeSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12V6a4 4 0 0 1 8 0v9a2.5 2.5 0 0 1-5 0V8"/></svg>`;
}

function iconeCheckDiario(feito) {
  if (feito) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;
}

function renderizarAgendaDiario(iso) {
  agendaDiarioAberto = false;
  montarAgendaDiario(iso);
}
window.renderizarAgendaDiario = renderizarAgendaDiario;

function montarAgendaDiario(iso) {
  const container = qs("#js-agenda-diario");
  container.classList.toggle("is-aberto", agendaDiarioAberto);

  const contagem = contarItensDiario(iso);
  const partes = [];
  if (contagem.tarefas > 0) partes.push(`${contagem.tarefas} ${contagem.tarefas === 1 ? "tarefa" : "tarefas"}`);
  if (contagem.nota > 0) partes.push("1 nota");
  if (contagem.listas > 0) partes.push(`${contagem.listas} ${contagem.listas === 1 ? "lista" : "listas"}`);

  const titulo = contagem.total > 0
    ? `${contagem.total} ${contagem.total === 1 ? "lembrete" : "lembretes"}`
    : "Nada por aqui hoje, toque pra adicionar";
  const subtitulo = partes.join(", ");

  const nota = obterNotaDoDiaDiario(iso);
  const tarefas = obterTarefasDoDiaDiario(iso);
  const listas = obterListasDoDiaDiario(iso);

  container.innerHTML = `
    <div class="agenda-diario__cabecalho">
      <div class="icon-circle">${iconeClipeSvg()}</div>
      <div class="agenda-diario__body">
        <p class="agenda-diario__titulo">${titulo}</p>
        ${subtitulo ? `<p class="agenda-diario__subtitulo">${subtitulo}</p>` : ""}
      </div>
      <svg class="agenda-diario__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
    </div>
    <div class="agenda-diario__painel">
      <div class="agenda-diario__painel-acoes">
        <button type="button" class="agenda-diario__btn-add" id="js-agenda-diario-btn-add" aria-label="Adicionar">+</button>
      </div>
      ${nota ? `
        <div class="agenda-diario__secao">
          <p class="agenda-diario__secao-titulo">Nota</p>
          <p class="agenda-diario__nota" data-abrir-nota>${nota.texto}</p>
        </div>
      ` : ""}
      ${tarefas.length > 0 ? `
        <div class="agenda-diario__secao">
          <p class="agenda-diario__secao-titulo">Tarefas</p>
          ${tarefas.map((t) => montarLinhaItemDiario(t, "tarefa")).join("")}
        </div>
      ` : ""}
      ${listas.map((lista) => `
        <div class="agenda-diario__secao">
          <p class="agenda-diario__secao-titulo agenda-diario__secao-titulo--lista" data-abrir-lista="${lista.id}">${lista.nome}</p>
          ${lista.itens.map((item) => montarLinhaItemDiario(item, "item", lista.id)).join("")}
        </div>
      `).join("")}
    </div>
  `;

  const notaEl = qs("[data-abrir-nota]", container);
  if (notaEl) notaEl.addEventListener("click", () => abrirEdicaoNotaDiario(nota));

  qsa("[data-abrir-lista]", container).forEach((el) => {
    el.addEventListener("click", () => abrirEdicaoListaDiario(listas.find((l) => l.id === el.dataset.abrirLista)));
  });

  qsa("[data-check-tarefa]", container).forEach((el) => {
    el.addEventListener("click", (evento) => {
      evento.stopPropagation();
      alternarFeitoTarefaDiario(el.dataset.checkTarefa);
    });
  });
  qsa("[data-texto-tarefa]", container).forEach((el) => {
    el.addEventListener("click", () => abrirEdicaoTarefaDiario(tarefas.find((t) => t.id === el.dataset.textoTarefa)));
  });

  qsa("[data-check-item]", container).forEach((el) => {
    el.addEventListener("click", (evento) => {
      evento.stopPropagation();
      alternarFeitoItemListaDiario(el.dataset.listaId, el.dataset.checkItem);
    });
  });
  qsa("[data-texto-item]", container).forEach((el) => {
    el.addEventListener("click", () => abrirEdicaoListaDiario(listas.find((l) => l.id === el.dataset.listaId)));
  });

  qs(".agenda-diario__cabecalho", container).addEventListener("click", () => {
    agendaDiarioAberto = !agendaDiarioAberto;
    container.classList.toggle("is-aberto", agendaDiarioAberto);
  });

  qs("#js-agenda-diario-btn-add", container).addEventListener("click", () => abrirModal("modal-agenda-diario-add"));
}

function montarLinhaItemDiario(item, tipo, listaId) {
  if (tipo === "tarefa") {
    return `
      <div class="agenda-diario__item">
        <span class="agenda-diario__item-check ${item.feito ? "agenda-diario__item-check--feito" : "agenda-diario__item-check--pendente"}" data-check-tarefa="${item.id}">${iconeCheckDiario(item.feito)}</span>
        <span class="agenda-diario__item-texto ${item.feito ? "agenda-diario__item-texto--feito" : ""}" data-texto-tarefa="${item.id}">${item.texto}</span>
      </div>
    `;
  }
  return `
    <div class="agenda-diario__item">
      <span class="agenda-diario__item-check ${item.feito ? "agenda-diario__item-check--feito" : "agenda-diario__item-check--pendente"}" data-check-item="${item.id}" data-lista-id="${listaId}">${iconeCheckDiario(item.feito)}</span>
      <span class="agenda-diario__item-texto ${item.feito ? "agenda-diario__item-texto--feito" : ""}" data-texto-item="${item.id}" data-lista-id="${listaId}">${item.texto}</span>
    </div>
  `;
}

function alternarFeitoTarefaDiario(id) {
  const lista = obterTarefasDiarias();
  const item = lista.find((t) => t.id === id);
  if (!item) return;
  item.feito = !item.feito;
  salvarTarefasDiarias(lista);
  montarAgendaDiario(dataSelecionada);
}

function alternarFeitoItemListaDiario(listaId, itemId) {
  const listas = obterListasDiarias();
  const lista = listas.find((l) => l.id === listaId);
  const item = lista && lista.itens.find((i) => i.id === itemId);
  if (!item) return;
  item.feito = !item.feito;
  salvarListasDiarias(listas);
  montarAgendaDiario(dataSelecionada);
}

/* ---------- Nota ---------- */
function prepararNotaDiario() {
  const existente = obterNotaDoDiaDiario(dataSelecionada);
  abrirEdicaoNotaDiario(existente);
}
function abrirEdicaoNotaDiario(nota) {
  notaDiarioEditandoId = nota ? nota.id : null;
  qs("#js-agenda-diario-nota-titulo").textContent = nota ? "Editar anotação" : "Anotação do dia";
  qs("#js-agenda-diario-nota-texto").value = nota ? nota.texto : "";
  qs("#js-agenda-diario-nota-excluir").classList.toggle("is-hidden", !nota);
  abrirModal("modal-agenda-diario-nota");
}

/* ---------- Tarefa ---------- */
function prepararNovaTarefaDiario() {
  tarefaDiarioEditandoId = null;
  qs("#js-agenda-diario-tarefa-titulo").textContent = "Tarefa";
  qs("#js-agenda-diario-tarefa-texto").value = "";
  qs("#js-agenda-diario-tarefa-excluir").classList.add("is-hidden");
}
function abrirEdicaoTarefaDiario(tarefa) {
  if (!tarefa) return;
  tarefaDiarioEditandoId = tarefa.id;
  qs("#js-agenda-diario-tarefa-titulo").textContent = "Editar tarefa";
  qs("#js-agenda-diario-tarefa-texto").value = tarefa.texto;
  qs("#js-agenda-diario-tarefa-excluir").classList.remove("is-hidden");
  abrirModal("modal-agenda-diario-tarefa");
}

/* ---------- Lista (nome + itens editados juntos, no mesmo modal) ---------- */
function linhaItemListaModal(texto, itemId) {
  const row = document.createElement("div");
  row.className = "agenda-diario__modal-item-row";
  row.dataset.itemId = itemId || "";
  row.innerHTML = `
    <input class="input" value="${texto || ""}" placeholder="Ex.: Leite" />
    <button type="button" class="agenda-diario__modal-item-remover" aria-label="Remover item">✕</button>
  `;
  row.querySelector(".agenda-diario__modal-item-remover").addEventListener("click", () => row.remove());
  return row;
}
function prepararNovaListaDiario() {
  listaDiarioAtualId = null;
  qs("#js-agenda-diario-lista-titulo").textContent = "Nova lista";
  qs("#js-agenda-diario-lista-nome").value = "";
  qs("#js-agenda-diario-lista-excluir").classList.add("is-hidden");
  const itensEl = qs("#js-agenda-diario-lista-itens");
  itensEl.innerHTML = "";
  itensEl.appendChild(linhaItemListaModal("", null));
}
function abrirEdicaoListaDiario(lista) {
  if (!lista) return;
  listaDiarioAtualId = lista.id;
  qs("#js-agenda-diario-lista-titulo").textContent = "Editar lista";
  qs("#js-agenda-diario-lista-nome").value = lista.nome;
  qs("#js-agenda-diario-lista-excluir").classList.remove("is-hidden");
  const itensEl = qs("#js-agenda-diario-lista-itens");
  itensEl.innerHTML = "";
  lista.itens.forEach((item) => itensEl.appendChild(linhaItemListaModal(item.texto, item.id)));
  if (lista.itens.length === 0) itensEl.appendChild(linhaItemListaModal("", null));
  abrirModal("modal-agenda-diario-lista");
}

/* ---------- Exclusão (modal de confirmação compartilhado) ---------- */
function pedirConfirmacaoExclusaoDiario(alvo, titulo) {
  exclusaoDiarioAtual = alvo;
  qs("#js-agenda-diario-confirmar-exclusao-titulo").textContent = titulo;
}
function executarExclusaoDiario() {
  if (!exclusaoDiarioAtual) return;
  const { tipo } = exclusaoDiarioAtual;
  if (tipo === "nota") {
    salvarNotasDiarias(obterNotasDiarias().filter((n) => n.id !== exclusaoDiarioAtual.id));
  } else if (tipo === "tarefa") {
    salvarTarefasDiarias(obterTarefasDiarias().filter((t) => t.id !== exclusaoDiarioAtual.id));
  } else if (tipo === "lista") {
    salvarListasDiarias(obterListasDiarias().filter((l) => l.id !== exclusaoDiarioAtual.id));
  }
  exclusaoDiarioAtual = null;
  fecharModal("modal-agenda-diario-confirmar-exclusao");
  montarAgendaDiario(dataSelecionada);
}

document.addEventListener("DOMContentLoaded", () => {
  qs('#modal-agenda-diario-add [data-trocar-modal="modal-agenda-diario-nota"]').addEventListener("click", prepararNotaDiario);
  qs('#modal-agenda-diario-add [data-trocar-modal="modal-agenda-diario-tarefa"]').addEventListener("click", prepararNovaTarefaDiario);
  qs('#modal-agenda-diario-add [data-trocar-modal="modal-agenda-diario-lista"]').addEventListener("click", prepararNovaListaDiario);

  qs("#js-agenda-diario-nota-salvar").addEventListener("click", () => {
    const texto = qs("#js-agenda-diario-nota-texto").value.trim();
    if (!texto) return;
    const lista = obterNotasDiarias();
    if (notaDiarioEditandoId) {
      const existente = lista.find((n) => n.id === notaDiarioEditandoId);
      if (existente) existente.texto = texto;
    } else {
      lista.push({ id: gerarId("nota"), dataIso: dataSelecionada, texto });
    }
    salvarNotasDiarias(lista);
    fecharModal("modal-agenda-diario-nota");
    mostrarSucesso();
    montarAgendaDiario(dataSelecionada);
  });
  qs("#js-agenda-diario-nota-excluir").addEventListener("click", () => {
    if (!notaDiarioEditandoId) return;
    pedirConfirmacaoExclusaoDiario({ tipo: "nota", id: notaDiarioEditandoId }, "Excluir anotação?");
  });

  qs("#js-agenda-diario-tarefa-salvar").addEventListener("click", () => {
    const texto = qs("#js-agenda-diario-tarefa-texto").value.trim();
    if (!texto) return;
    const lista = obterTarefasDiarias();
    if (tarefaDiarioEditandoId) {
      const item = lista.find((t) => t.id === tarefaDiarioEditandoId);
      if (item) item.texto = texto;
    } else {
      lista.push({ id: gerarId("tarefa"), dataIso: dataSelecionada, texto, feito: false });
    }
    salvarTarefasDiarias(lista);
    fecharModal("modal-agenda-diario-tarefa");
    mostrarSucesso();
    montarAgendaDiario(dataSelecionada);
  });
  qs("#js-agenda-diario-tarefa-excluir").addEventListener("click", () => {
    if (!tarefaDiarioEditandoId) return;
    pedirConfirmacaoExclusaoDiario({ tipo: "tarefa", id: tarefaDiarioEditandoId }, "Excluir tarefa?");
  });

  qs("#js-agenda-diario-lista-item-add").addEventListener("click", () => {
    const itensEl = qs("#js-agenda-diario-lista-itens");
    const row = linhaItemListaModal("", null);
    itensEl.appendChild(row);
    row.querySelector("input").focus();
  });

  qs("#js-agenda-diario-lista-salvar").addEventListener("click", () => {
    const nome = qs("#js-agenda-diario-lista-nome").value.trim();
    if (!nome) return;

    const itensExistentesPorId = {};
    if (listaDiarioAtualId) {
      const atual = obterListasDiarias().find((l) => l.id === listaDiarioAtualId);
      if (atual) atual.itens.forEach((item) => { itensExistentesPorId[item.id] = item; });
    }
    const itens = qsa("#js-agenda-diario-lista-itens > div").map((row) => {
      const texto = row.querySelector("input").value.trim();
      if (!texto) return null;
      const existente = row.dataset.itemId && itensExistentesPorId[row.dataset.itemId];
      return existente ? { ...existente, texto } : { id: gerarId("item"), texto, feito: false };
    }).filter(Boolean);

    const listas = obterListasDiarias();
    if (listaDiarioAtualId) {
      const existente = listas.find((l) => l.id === listaDiarioAtualId);
      if (existente) { existente.nome = nome; existente.itens = itens; }
    } else {
      listas.push({ id: gerarId("lista"), dataIso: dataSelecionada, nome, itens });
    }
    salvarListasDiarias(listas);
    fecharModal("modal-agenda-diario-lista");
    mostrarSucesso();
    montarAgendaDiario(dataSelecionada);
  });
  qs("#js-agenda-diario-lista-excluir").addEventListener("click", () => {
    if (!listaDiarioAtualId) return;
    pedirConfirmacaoExclusaoDiario({ tipo: "lista", id: listaDiarioAtualId }, "Excluir lista e todos os itens dela?");
  });

  qs("#js-agenda-diario-confirmar-exclusao-btn").addEventListener("click", executarExclusaoDiario);
});
