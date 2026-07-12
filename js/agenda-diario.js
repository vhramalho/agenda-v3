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
let lembreteDiarioTipoAtual = "nota"; // "nota"|"tarefa"|"lista" — tipo ativo no modal unificado
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

  const titulo = `${contagem.total} ${contagem.total === 1 ? "lembrete" : "lembretes"}`;
  const subtitulo = contagem.total > 0 ? partes.join(", ") : "Toque pra adicionar";

  const nota = obterNotaDoDiaDiario(iso);
  const tarefas = obterTarefasDoDiaDiario(iso);
  const listas = obterListasDoDiaDiario(iso);

  container.innerHTML = `
    <div class="agenda-diario__cabecalho">
      <span class="agenda-diario__icone">${iconeClipeSvg()}</span>
      <div class="agenda-diario__body">
        <p class="agenda-diario__titulo">${titulo}${subtitulo ? ` <span class="agenda-diario__subtitulo">· ${subtitulo}</span>` : ""}</p>
      </div>
      <svg class="agenda-diario__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
    </div>
    <div class="agenda-diario__painel">
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
          <p class="agenda-diario__secao-titulo agenda-diario__secao-titulo--lista" data-abrir-lista="${lista.id}">${lista.nome ? `Lista ${lista.nome}` : "Lista"}</p>
          ${lista.itens.map((item) => montarLinhaItemDiario(item, "item", lista.id)).join("")}
        </div>
      `).join("")}
      <button type="button" class="text-primary-accent" id="js-agenda-diario-btn-novo" style="font-weight:600;font-size:var(--text-sm);background:none;border:none;text-align:left;padding:0;cursor:pointer;">+ Adicionar novo lembrete</button>
    </div>
  `;

  const notaEl = qs("[data-abrir-nota]", container);
  if (notaEl) notaEl.addEventListener("click", () => abrirModalLembreteDiario("editar", "nota", nota));

  qsa("[data-abrir-lista]", container).forEach((el) => {
    el.addEventListener("click", () => abrirModalLembreteDiario("editar", "lista", listas.find((l) => l.id === el.dataset.abrirLista)));
  });

  qsa("[data-check-tarefa]", container).forEach((el) => {
    el.addEventListener("click", (evento) => {
      evento.stopPropagation();
      alternarFeitoTarefaDiario(el.dataset.checkTarefa);
    });
  });
  qsa("[data-texto-tarefa]", container).forEach((el) => {
    el.addEventListener("click", () => abrirModalLembreteDiario("editar", "tarefa", tarefas.find((t) => t.id === el.dataset.textoTarefa)));
  });

  qsa("[data-check-item]", container).forEach((el) => {
    el.addEventListener("click", (evento) => {
      evento.stopPropagation();
      alternarFeitoItemListaDiario(el.dataset.listaId, el.dataset.checkItem);
    });
  });
  qsa("[data-texto-item]", container).forEach((el) => {
    el.addEventListener("click", () => abrirModalLembreteDiario("editar", "lista", listas.find((l) => l.id === el.dataset.listaId)));
  });

  qs(".agenda-diario__cabecalho", container).addEventListener("click", () => {
    agendaDiarioAberto = !agendaDiarioAberto;
    container.classList.toggle("is-aberto", agendaDiarioAberto);
  });

  qs("#js-agenda-diario-btn-novo", container).addEventListener("click", () => abrirModalLembreteDiario("novo", "nota", null));
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

/* ---------- Modal único "Novo lembrete" / edição (Nota, Tarefa ou Lista) ---------- */
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

function selecionarTipoLembreteDiario(tipo) {
  lembreteDiarioTipoAtual = tipo;
  qsa("[data-tipo-lembrete]").forEach((chip) => chip.classList.toggle("chip--ativo", chip.dataset.tipoLembrete === tipo));
  qsa("[data-campo-lembrete]").forEach((campo) => campo.classList.toggle("is-hidden", campo.dataset.campoLembrete !== tipo));
}

function abrirModalLembreteDiario(modo, tipo, dados) {
  notaDiarioEditandoId = null;
  tarefaDiarioEditandoId = null;
  listaDiarioAtualId = null;

  const nomePorTipo = { nota: "nota", tarefa: "tarefa", lista: "lista" };
  qs("#js-agenda-diario-lembrete-titulo").textContent = modo === "novo" ? "Novo lembrete" : `Editar ${nomePorTipo[tipo]}`;
  qs("#js-agenda-diario-lembrete-tipo-wrap").classList.toggle("is-hidden", modo === "editar");
  selecionarTipoLembreteDiario(tipo);

  qs("#js-agenda-diario-lembrete-nota-texto").value = tipo === "nota" && dados ? dados.texto : "";
  qs("#js-agenda-diario-lembrete-tarefa-texto").value = tipo === "tarefa" && dados ? dados.texto : "";
  qs("#js-agenda-diario-lembrete-lista-nome").value = tipo === "lista" && dados ? dados.nome : "";

  const itensEl = qs("#js-agenda-diario-lembrete-lista-itens");
  itensEl.innerHTML = "";
  const itensLista = (tipo === "lista" && dados && dados.itens) || [];
  itensLista.forEach((item) => itensEl.appendChild(linhaItemListaModal(item.texto, item.id)));
  if (itensLista.length === 0) itensEl.appendChild(linhaItemListaModal("", null));

  if (modo === "editar") {
    if (tipo === "nota") notaDiarioEditandoId = dados.id;
    if (tipo === "tarefa") tarefaDiarioEditandoId = dados.id;
    if (tipo === "lista") listaDiarioAtualId = dados.id;
  }

  qs("#js-agenda-diario-lembrete-excluir").classList.toggle("is-hidden", modo === "novo");
  abrirModal("modal-agenda-diario-lembrete");
}

function salvarLembreteDiario() {
  const tipo = lembreteDiarioTipoAtual;

  if (tipo === "nota") {
    const texto = qs("#js-agenda-diario-lembrete-nota-texto").value.trim();
    if (!texto) return;
    const lista = obterNotasDiarias();
    const existente = notaDiarioEditandoId
      ? lista.find((n) => n.id === notaDiarioEditandoId)
      : lista.find((n) => n.dataIso === dataSelecionada); // evita duplicar a nota do dia mesmo criando pelo "+"
    if (existente) existente.texto = texto;
    else lista.push({ id: gerarId("nota"), dataIso: dataSelecionada, texto });
    salvarNotasDiarias(lista);
  } else if (tipo === "tarefa") {
    const texto = qs("#js-agenda-diario-lembrete-tarefa-texto").value.trim();
    if (!texto) return;
    const lista = obterTarefasDiarias();
    if (tarefaDiarioEditandoId) {
      const item = lista.find((t) => t.id === tarefaDiarioEditandoId);
      if (item) item.texto = texto;
    } else {
      lista.push({ id: gerarId("tarefa"), dataIso: dataSelecionada, texto, feito: false });
    }
    salvarTarefasDiarias(lista);
  } else if (tipo === "lista") {
    const nome = qs("#js-agenda-diario-lembrete-lista-nome").value.trim();
    const itensExistentesPorId = {};
    if (listaDiarioAtualId) {
      const atual = obterListasDiarias().find((l) => l.id === listaDiarioAtualId);
      if (atual) atual.itens.forEach((item) => { itensExistentesPorId[item.id] = item; });
    }
    const itens = qsa("#js-agenda-diario-lembrete-lista-itens > div").map((row) => {
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
  }

  fecharModal("modal-agenda-diario-lembrete");
  mostrarSucesso();
  montarAgendaDiario(dataSelecionada);
}

function excluirLembreteDiario() {
  const tipo = lembreteDiarioTipoAtual;
  if (tipo === "nota" && notaDiarioEditandoId) pedirConfirmacaoExclusaoDiario({ tipo: "nota", id: notaDiarioEditandoId }, "Excluir anotação?");
  else if (tipo === "tarefa" && tarefaDiarioEditandoId) pedirConfirmacaoExclusaoDiario({ tipo: "tarefa", id: tarefaDiarioEditandoId }, "Excluir tarefa?");
  else if (tipo === "lista" && listaDiarioAtualId) pedirConfirmacaoExclusaoDiario({ tipo: "lista", id: listaDiarioAtualId }, "Excluir lista e todos os itens dela?");
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
  qsa("[data-tipo-lembrete]").forEach((chip) => {
    chip.addEventListener("click", () => selecionarTipoLembreteDiario(chip.dataset.tipoLembrete));
  });

  qs("#js-agenda-diario-lembrete-lista-item-add").addEventListener("click", () => {
    const itensEl = qs("#js-agenda-diario-lembrete-lista-itens");
    const row = linhaItemListaModal("", null);
    itensEl.appendChild(row);
    row.querySelector("input").focus();
  });

  qs("#js-agenda-diario-lembrete-salvar").addEventListener("click", salvarLembreteDiario);
  qs("#js-agenda-diario-lembrete-excluir").addEventListener("click", excluirLembreteDiario);

  qs("#js-agenda-diario-confirmar-exclusao-btn").addEventListener("click", executarExclusaoDiario);
});
