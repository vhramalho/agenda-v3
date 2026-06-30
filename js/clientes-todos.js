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
    filtrados.forEach((cliente, indice) => container.appendChild(montarLinhaCliente(cliente, indice)));
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
});
