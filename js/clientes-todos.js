/* ============================================================
   AGENDA V3 — Tela "Todos os clientes"
   Diretório completo, sem limite de 5, com busca própria.
   ============================================================ */

function ordenarClientes(clientes, ordem) {
  const lista = clientes.slice();
  if (ordem === "za") return lista.sort((a, b) => b.nome.localeCompare(a.nome, "pt-BR"));
  if (ordem === "novos") return lista.sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""));
  if (ordem === "antigos") return lista.sort((a, b) => (a.criadoEm || "").localeCompare(b.criadoEm || ""));
  return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function renderizarClientesTodos(ordem) {
  const termo = (qs("#js-busca-cliente-todos").value || "").trim().toLowerCase();
  const clientesAtivos = ordenarClientes(obterClientes().filter((c) => c.ativo), ordem);

  const filtrados = termo ? clientesAtivos.filter((c) => c.nome.toLowerCase().includes(termo)) : clientesAtivos;

  const container = qs("#js-lista-clientes-todos");
  const vazio = qs("#js-clientes-todos-vazio");
  container.innerHTML = "";

  if (filtrados.length === 0) {
    container.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
  } else {
    container.classList.remove("is-hidden");
    vazio.classList.add("is-hidden");
    const modoSubtitulo = ordem === "novos" || ordem === "antigos" ? "cadastro" : "padrao";
    filtrados.forEach((cliente, indice) => container.appendChild(montarLinhaCliente(cliente, indice, modoSubtitulo)));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let ordemAtual = "az";
  renderizarClientesTodos(ordemAtual);

  qs("#js-busca-cliente-todos").addEventListener("input", () => renderizarClientesTodos(ordemAtual));

  qsa(".segmented__item[data-ordem]").forEach((item) => {
    item.addEventListener("click", () => {
      qsa(".segmented__item[data-ordem]").forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
      ordemAtual = item.dataset.ordem;
      renderizarClientesTodos(ordemAtual);
    });
  });

  qs("#js-btn-novo-cliente").addEventListener("click", () => {
    qs("#js-novo-cliente-nome").value = "";
    qs("#js-novo-cliente-telefone").value = "";
    qs("#js-novo-cliente-aniversario").value = "";
    qs("#js-novo-cliente-observacao").value = "";
    abrirModal("modal-novo-cliente");
  });

  qs("#js-novo-cliente-salvar").addEventListener("click", () => {
    const nome = qs("#js-novo-cliente-nome").value.trim();
    if (!nome) return;
    const { dia, mes } = extrairAniversario(qs("#js-novo-cliente-aniversario").value);
    const hoje = hojeIso();
    const lista = obterClientes();
    lista.push({
      id: gerarId("cli"),
      nome,
      telefone: qs("#js-novo-cliente-telefone").value.trim(),
      aniversarioDia: dia,
      aniversarioMes: mes,
      aniversarioAno: null,
      observacao: qs("#js-novo-cliente-observacao").value.trim(),
      criadoEm: hoje,
      atualizadoEm: hoje,
      ativo: true,
    });
    salvarClientes(lista);
    fecharModal("modal-novo-cliente");
    mostrarSucesso();
    renderizarClientesTodos(ordemAtual);
  });
});
