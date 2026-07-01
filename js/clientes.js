/* ============================================================
   AGENDA V3 — Tela Clientes (Fase 3)
   Lista real, busca, ranking/aniversariantes/sem-retornar
   calculados a partir de clientes + agendamentos.
   ============================================================ */

function renderizarRankingTop3(clientesAtivos) {
  const ranqueados = clientesAtivos
    .map((c) => ({ cliente: c, stats: estatisticasRanking(c.id, { tipo: "ano", ano: new Date().getFullYear() }) }))
    .filter((r) => r.stats.visitas > 0)
    .sort((a, b) => b.stats.totalGasto - a.stats.totalGasto)
    .slice(0, 3);

  const container = qs("#js-ranking-top3");
  container.innerHTML = "";
  if (ranqueados.length === 0) {
    container.innerHTML = `<p class="text-secondary" style="text-align:center;">Ainda não há atendimentos realizados.</p>`;
    return;
  }
  ranqueados.forEach((item, indice) => container.appendChild(montarLinhaRanking(item, indice, indice + 1, "faturamento")));
}

function renderizarAniversariantesESemRetornar(clientesAtivos) {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const aniversariantes = clientesAtivos.filter((c) => c.aniversarioMes === mesAtual);
  qs("#js-aniversariantes-contagem").textContent = `${aniversariantes.length} este mês`;

  const bucketsInsight = obterConfig().semRetornarBucketsInsight || [20, 30, 45];
  const semRetornar = clientesAtivos.filter((c) => {
    const stats = estatisticasCliente(c.id);
    if (stats.ultimaVisitaDias === null) return false;
    const bucket = bucketDiasSemRetornar(stats.ultimaVisitaDias);
    return bucketsInsight.includes(bucket);
  });
  qs("#js-sem-retornar-contagem").textContent = `${semRetornar.length} cliente${semRetornar.length === 1 ? "" : "s"}`;
}

function renderizarClientes() {
  const clientesAtivos = obterClientes()
    .filter((c) => c.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  renderizarRankingTop3(clientesAtivos);
  renderizarAniversariantesESemRetornar(clientesAtivos);

  qs("#js-clientes-titulo").textContent = `Todos os clientes (${clientesAtivos.length})`;

  const visiveis = clientesAtivos.slice(0, 5);

  const container = qs("#js-lista-clientes");
  const vazio = qs("#js-clientes-vazio");
  container.innerHTML = "";

  if (clientesAtivos.length === 0) {
    container.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
  } else {
    container.classList.remove("is-hidden");
    vazio.classList.add("is-hidden");
    visiveis.forEach((cliente, indice) => container.appendChild(montarLinhaCliente(cliente, indice)));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarClientes();

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
    renderizarClientes();
  });
});
