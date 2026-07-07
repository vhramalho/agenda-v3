/* ============================================================
   AGENDA V3 — Tela Formas de pagamento (Fase 3)
   CRUD completo, ligado de verdade a agendaV3:formasPagamento.
   Exclusão é lógica (ativo:false) — preserva o histórico.
   ============================================================ */

function ordenarFormasPorTipo(formas) {
  const posicao = (tipo) => {
    const indice = ORDEM_TIPOS_PAGAMENTO.indexOf(tipo);
    return indice === -1 ? ORDEM_TIPOS_PAGAMENTO.length : indice;
  };
  return [...formas].sort((a, b) => posicao(a.tipo) - posicao(b.tipo));
}

let formaEditandoId = null;

function montarLinhaForma(forma) {
  const icone = ICONES_TIPO_PAGAMENTO[forma.tipo] || ICONES_TIPO_PAGAMENTO.outras;
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.style.cursor = "pointer";
  linha.innerHTML = `
    <div class="icon-circle ${icone.classe}">${icone.svg}</div>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    ${forma.taxaPercentual ? `<span class="badge badge--neutro">Taxa ${String(forma.taxaPercentual).replace(".", ",")}%</span>` : ""}
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  linha.querySelector(".list-item__title").textContent = forma.nome;
  linha.addEventListener("click", () => abrirEdicaoForma(forma.id));
  return linha;
}

function calcularMaisUtilizada(formasAtivas) {
  const totais = {};
  let totalGeral = 0;
  obterAgendamentos().forEach((agendamento) => {
    if (agendamento.status !== "realizado_pago") return;
    (agendamento.pagamentos || []).forEach((p) => {
      if (!p.formaPagamentoId) return;
      totais[p.formaPagamentoId] = (totais[p.formaPagamentoId] || 0) + p.valor;
      totalGeral += p.valor;
    });
  });
  const destaque = qs("#js-forma-destaque");
  let melhorId = null;
  let melhorValor = 0;
  Object.entries(totais).forEach(([id, valor]) => {
    if (valor > melhorValor) { melhorValor = valor; melhorId = id; }
  });
  const forma = formasAtivas.find((f) => f.id === melhorId);
  if (!forma || totalGeral === 0) {
    destaque.classList.add("is-hidden");
    return;
  }
  qs("#js-forma-destaque-nome").textContent = forma.nome;
  qs("#js-forma-destaque-percentual").textContent = `${Math.round((melhorValor / totalGeral) * 100)}% dos recebimentos`;
  destaque.classList.remove("is-hidden");
}

function renderizarFormas() {
  const formasAtivas = ordenarFormasPorTipo(obterFormasPagamento().filter((f) => f.ativo));
  const container = qs("#js-lista-formas");
  const vazio = qs("#js-formas-vazio");
  container.innerHTML = "";

  if (formasAtivas.length === 0) {
    container.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
  } else {
    container.classList.remove("is-hidden");
    vazio.classList.add("is-hidden");
    formasAtivas.forEach((forma) => container.appendChild(montarLinhaForma(forma)));
  }

  calcularMaisUtilizada(formasAtivas);
}

function selecionarChipTipo(containerId, tipo) {
  qsa(".chip", qs(`#${containerId}`)).forEach((chip) => {
    chip.classList.toggle("chip--ativo", chip.dataset.tipo === tipo);
  });
}

function tipoSelecionado(containerId) {
  const ativo = qs(`#${containerId} .chip--ativo`);
  return ativo ? ativo.dataset.tipo : "outras";
}

function extrairTaxa(texto) {
  const limpo = (texto || "").replace(",", ".").replace("%", "").trim();
  const numero = parseFloat(limpo);
  return isNaN(numero) ? null : numero;
}

function abrirNovaForma() {
  qs("#js-nova-forma-nome").value = "";
  qs("#js-nova-forma-taxa").value = "";
  selecionarChipTipo("js-nova-forma-tipo", "credito");
  abrirModal("modal-nova-forma");
}

function abrirEdicaoForma(id) {
  const forma = obterFormasPagamento().find((f) => f.id === id);
  if (!forma) return;
  formaEditandoId = id;
  qs("#js-editar-forma-nome").value = forma.nome;
  qs("#js-editar-forma-taxa").value = forma.taxaPercentual != null ? String(forma.taxaPercentual).replace(".", ",") : "";
  selecionarChipTipo("js-editar-forma-tipo", forma.tipo);
  abrirModal("modal-editar-forma");
}

document.addEventListener("DOMContentLoaded", () => {
  garantirFormasPagamentoPadrao();
  renderizarFormas();

  qs("#js-btn-nova-forma").addEventListener("click", abrirNovaForma);

  qs("#js-nova-forma-salvar").addEventListener("click", () => {
    const nome = qs("#js-nova-forma-nome").value.trim();
    if (!nome) return;
    const lista = obterFormasPagamento();
    lista.push({
      id: gerarId("pgto"),
      nome,
      tipo: tipoSelecionado("js-nova-forma-tipo"),
      taxaPercentual: extrairTaxa(qs("#js-nova-forma-taxa").value),
      ativo: true,
    });
    salvarFormasPagamento(lista);
    fecharModal("modal-nova-forma");
    mostrarSucesso();
    renderizarFormas();
  });

  qs("#js-editar-forma-salvar").addEventListener("click", () => {
    const nome = qs("#js-editar-forma-nome").value.trim();
    if (!nome || !formaEditandoId) return;
    const lista = obterFormasPagamento();
    const forma = lista.find((f) => f.id === formaEditandoId);
    if (!forma) return;
    forma.nome = nome;
    forma.tipo = tipoSelecionado("js-editar-forma-tipo");
    forma.taxaPercentual = extrairTaxa(qs("#js-editar-forma-taxa").value);
    salvarFormasPagamento(lista);
    fecharModal("modal-editar-forma");
    mostrarSucesso();
    renderizarFormas();
  });

  qs("#js-confirmar-exclusao-forma").addEventListener("click", () => {
    if (!formaEditandoId) return;
    const lista = obterFormasPagamento();
    const forma = lista.find((f) => f.id === formaEditandoId);
    if (forma) {
      forma.ativo = false;
      salvarFormasPagamento(lista);
    }
    formaEditandoId = null;
    fecharModal("modal-confirmar-exclusao-forma");
    renderizarFormas();
  });
});
