/* ============================================================
   AGENDA V3 — Tela "Todos os clientes"
   Diretório completo, sem limite de 5, com busca própria.
   ============================================================ */

function renderizarClientesTodos() {
  const termo = (qs("#js-busca-cliente-todos").value || "").trim().toLowerCase();
  const clientesAtivos = obterClientes()
    .filter((c) => c.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

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
  renderizarClientesTodos();
  qs("#js-busca-cliente-todos").addEventListener("input", renderizarClientesTodos);
});
