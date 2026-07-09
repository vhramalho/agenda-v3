/* ============================================================
   AGENDA V3 — Tela Serviços (Fase 3)
   CRUD completo, ligado de verdade a agendaV3:servicos.
   Exclusão é lógica (ativo:false) — preserva o histórico.
   ============================================================ */

let servicoEditandoId = null;

function montarLinhaServico(servico, indice) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.style.cursor = "pointer";
  linha.innerHTML = `
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <div class="list-item__trailing"><p style="font-weight:700;"></p></div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(servico.nome);
  linha.querySelector(".list-item__title").textContent = servico.nome;
  linha.querySelector(".list-item__trailing p").textContent = servico.valorOpcional ? formatarMoeda(servico.valorOpcional) : "—";
  linha.addEventListener("click", () => abrirEdicaoServico(servico.id));
  return linha;
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
    servicosAtivos.forEach((servico, i) => container.appendChild(montarLinhaServico(servico, i)));
  }
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
  aplicarMascaraMoeda(qs("#js-novo-servico-valor"));
  aplicarMascaraMoeda(qs("#js-editar-servico-valor"));

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
    mostrarSucesso();
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
    mostrarSucesso();
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
