/* ============================================================
   AGENDA V3 — Tela Serviços (Fase 3)
   CRUD completo, ligado de verdade a agendaV3:servicos.
   Exclusão é lógica (ativo:false) — preserva o histórico.
   ============================================================ */

const ICONE_SERVICO_GENERICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24"/></svg>';

let servicoEditandoId = null;

function montarLinhaServico(servico) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.style.cursor = "pointer";
  linha.innerHTML = `
    <div class="icon-circle">${ICONE_SERVICO_GENERICO}</div>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <div class="list-item__trailing"><p style="font-weight:700;"></p></div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  linha.querySelector(".list-item__title").textContent = servico.nome;
  linha.querySelector(".list-item__trailing p").textContent = servico.valorOpcional ? formatarMoeda(servico.valorOpcional) : "—";
  linha.addEventListener("click", () => abrirEdicaoServico(servico.id));
  return linha;
}

function calcularMaisRealizado(servicosAtivos) {
  const contagem = {};
  obterAgendamentos().forEach((agendamento) => {
    if (!agendamento.status || !agendamento.status.startsWith("realizado_")) return;
    (agendamento.servicosIds || []).forEach((id) => {
      contagem[id] = (contagem[id] || 0) + 1;
    });
  });
  let melhorId = null;
  let melhorContagem = 0;
  Object.entries(contagem).forEach(([id, qtd]) => {
    if (qtd > melhorContagem) { melhorContagem = qtd; melhorId = id; }
  });
  const destaque = qs("#js-servico-destaque");
  if (!melhorId || melhorContagem === 0) {
    destaque.classList.add("is-hidden");
    return;
  }
  const servico = servicosAtivos.find((s) => s.id === melhorId);
  if (!servico) { destaque.classList.add("is-hidden"); return; }
  qs("#js-servico-destaque-nome").textContent = servico.nome;
  qs("#js-servico-destaque-contagem").textContent = `${melhorContagem} atendimento${melhorContagem === 1 ? "" : "s"}`;
  destaque.classList.remove("is-hidden");
}

function renderizarServicos() {
  const servicosAtivos = obterServicos().filter((s) => s.ativo);
  const container = qs("#js-lista-servicos");
  const vazio = qs("#js-servicos-vazio");
  container.innerHTML = "";

  if (servicosAtivos.length === 0) {
    container.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
  } else {
    container.classList.remove("is-hidden");
    vazio.classList.add("is-hidden");
    servicosAtivos.forEach((servico) => container.appendChild(montarLinhaServico(servico)));
  }

  calcularMaisRealizado(servicosAtivos);
}

function abrirNovoServico() {
  qs("#js-novo-servico-nome").value = "";
  qs("#js-novo-servico-valor").value = "";
  abrirModal("modal-novo-servico");
}

function abrirEdicaoServico(id) {
  const servico = obterServicos().find((s) => s.id === id);
  if (!servico) return;
  servicoEditandoId = id;
  qs("#js-editar-servico-nome").value = servico.nome;
  qs("#js-editar-servico-valor").value = servico.valorOpcional ? formatarMoeda(servico.valorOpcional) : "";
  abrirModal("modal-editar-servico");
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarServicos();

  qs("#js-btn-novo-servico").addEventListener("click", abrirNovoServico);

  qs("#js-novo-servico-salvar").addEventListener("click", () => {
    const nome = qs("#js-novo-servico-nome").value.trim();
    if (!nome) return;
    const hoje = hojeIso();
    const lista = obterServicos();
    lista.push({
      id: gerarId("srv"),
      nome,
      valorOpcional: extrairValor(qs("#js-novo-servico-valor").value),
      ativo: true,
      criadoEm: hoje,
      atualizadoEm: hoje,
    });
    salvarServicos(lista);
    fecharModal("modal-novo-servico");
    renderizarServicos();
  });

  qs("#js-editar-servico-salvar").addEventListener("click", () => {
    const nome = qs("#js-editar-servico-nome").value.trim();
    if (!nome || !servicoEditandoId) return;
    const lista = obterServicos();
    const servico = lista.find((s) => s.id === servicoEditandoId);
    if (!servico) return;
    servico.nome = nome;
    servico.valorOpcional = extrairValor(qs("#js-editar-servico-valor").value);
    servico.atualizadoEm = hojeIso();
    salvarServicos(lista);
    fecharModal("modal-editar-servico");
    renderizarServicos();
  });

  qs("#js-confirmar-exclusao-servico").addEventListener("click", () => {
    if (!servicoEditandoId) return;
    const lista = obterServicos();
    const servico = lista.find((s) => s.id === servicoEditandoId);
    if (servico) {
      servico.ativo = false;
      salvarServicos(lista);
    }
    servicoEditandoId = null;
    fecharModal("modal-confirmar-exclusao-servico");
    renderizarServicos();
  });
});
