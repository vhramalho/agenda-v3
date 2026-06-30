/* ============================================================
   AGENDA V3 — Tela Lixeira de clientes
   Mostra os clientes movidos pra lixeira, com opção de restaurar
   ou excluir permanentemente (um por um ou todos de uma vez).
   ============================================================ */

function montarLinhaLixeira(cliente) {
  const linha = document.createElement("button");
  linha.className = "list-item";
  linha.style.cssText = "width:100%;text-align:left;background:none;border:none;cursor:pointer;font-family:inherit;";
  linha.dataset.id = cliente.id;
  linha.innerHTML = `
    <div class="list-item__avatar" style="background:var(--danger-soft);color:var(--danger);"></div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle"></p>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(cliente.nome);
  linha.querySelector(".list-item__title").textContent = cliente.nome;
  linha.querySelector(".list-item__subtitle").textContent = `Excluído em ${formatarDataCurta(cliente.movidoParaLixeiraEm || cliente.criadoEm)}`;
  return linha;
}

function renderizarLixeira() {
  const lixeira = obterClientesLixeira().sort((a, b) => (b.movidoParaLixeiraEm || "").localeCompare(a.movidoParaLixeiraEm || ""));
  const lista = qs("#js-lixeira-lista");
  const vazio = qs("#js-lixeira-vazio");
  const esvaziar = qs("#js-lixeira-esvaziar");
  lista.innerHTML = "";

  if (lixeira.length === 0) {
    lista.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    esvaziar.classList.add("is-hidden");
  } else {
    lista.classList.remove("is-hidden");
    vazio.classList.add("is-hidden");
    esvaziar.classList.remove("is-hidden");
    lixeira.forEach((cliente) => lista.appendChild(montarLinhaLixeira(cliente)));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarLixeira();
  let clienteSelecionadoId = null;

  qs("#js-lixeira-lista").addEventListener("click", (evento) => {
    const linha = evento.target.closest("[data-id]");
    if (!linha) return;
    clienteSelecionadoId = linha.dataset.id;
    const cliente = obterClientesLixeira().find((c) => c.id === clienteSelecionadoId);
    if (!cliente) return;
    qs("#js-lixeira-acoes-nome").textContent = cliente.nome;
    abrirModal("modal-lixeira-acoes");
  });

  qs("#js-lixeira-restaurar").addEventListener("click", () => {
    const lixeira = obterClientesLixeira();
    const indice = lixeira.findIndex((c) => c.id === clienteSelecionadoId);
    if (indice === -1) return;
    const [cliente] = lixeira.splice(indice, 1);
    salvarClientesLixeira(lixeira);
    const clientes = obterClientes();
    clientes.push({ ...cliente, ativo: true });
    salvarClientes(clientes);
    fecharModal("modal-lixeira-acoes");
    renderizarLixeira();
  });

  qs("#js-lixeira-confirmar-exclusao").addEventListener("click", () => {
    salvarClientesLixeira(obterClientesLixeira().filter((c) => c.id !== clienteSelecionadoId));
    salvarAgendamentos(obterAgendamentos().filter((a) => a.clienteId !== clienteSelecionadoId));
    fecharModal("modal-lixeira-confirmar-exclusao");
    renderizarLixeira();
  });

  qs("#js-lixeira-esvaziar").addEventListener("click", () => abrirModal("modal-lixeira-esvaziar-confirmar"));

  qs("#js-lixeira-confirmar-esvaziar").addEventListener("click", () => {
    const idsLixeira = obterClientesLixeira().map((c) => c.id);
    salvarClientesLixeira([]);
    salvarAgendamentos(obterAgendamentos().filter((a) => !idsLixeira.includes(a.clienteId)));
    fecharModal("modal-lixeira-esvaziar-confirmar");
    renderizarLixeira();
  });
});
