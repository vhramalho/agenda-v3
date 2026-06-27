/* ============================================================
   AGENDA V3 — Tela Clientes (Fase 3)
   Lista real, busca, ranking/aniversariantes/sem-retornar
   calculados a partir de clientes + agendamentos.
   ============================================================ */

function montarPodioCardResumo(item, posicaoVisual) {
  const medalhas = ["🥈", "🥇", "🥉"];
  const card = document.createElement("div");
  card.className = "podio-card" + (posicaoVisual === 1 ? " podio-card--ouro" : "");
  const tamanho = posicaoVisual === 1 ? "width:56px;height:56px;font-size:var(--text-md);" : "";
  card.innerHTML = `
    <p class="podio-card__medalha">${medalhas[posicaoVisual]}</p>
    <div class="list-item__avatar" style="margin:0 auto;${tamanho}"></div>
    <p class="podio-card__nome"></p>
    <p class="podio-card__valor"></p>
  `;
  card.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.cliente.nome);
  card.querySelector(".podio-card__nome").textContent = item.cliente.nome;
  card.querySelector(".podio-card__valor").textContent = formatarMoeda(item.totalGasto);
  return card;
}

function renderizarRankingTop3(clientesAtivos) {
  const ranqueados = clientesAtivos
    .map((c) => ({ cliente: c, totalGasto: estatisticasCliente(c.id).totalGasto }))
    .filter((r) => r.totalGasto > 0)
    .sort((a, b) => b.totalGasto - a.totalGasto)
    .slice(0, 3);

  const container = qs("#js-ranking-top3");
  container.innerHTML = "";
  if (ranqueados.length === 0) {
    container.innerHTML = `<p class="text-secondary" style="text-align:center;">Ainda não há atendimentos realizados.</p>`;
    return;
  }
  [ranqueados[1], ranqueados[0], ranqueados[2]].forEach((item, posicaoVisual) => {
    if (!item) return;
    container.appendChild(montarPodioCardResumo(item, posicaoVisual));
  });
}

function renderizarAniversariantesESemRetornar(clientesAtivos) {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const aniversariantes = clientesAtivos.filter((c) => c.aniversarioMes === mesAtual);
  qs("#js-aniversariantes-contagem").textContent = `${aniversariantes.length} este mês`;

  const semRetornar = clientesAtivos.filter((c) => {
    const stats = estatisticasCliente(c.id);
    return stats.ultimaVisitaDias === null || stats.ultimaVisitaDias > 30;
  });
  qs("#js-sem-retornar-contagem").textContent = `${semRetornar.length} cliente${semRetornar.length === 1 ? "" : "s"}`;
}

function renderizarClientes() {
  const termo = (qs("#js-busca-cliente").value || "").trim().toLowerCase();
  const clientesAtivos = obterClientes()
    .filter((c) => c.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  renderizarRankingTop3(clientesAtivos);
  renderizarAniversariantesESemRetornar(clientesAtivos);

  const filtrados = termo ? clientesAtivos.filter((c) => c.nome.toLowerCase().includes(termo)) : clientesAtivos;
  const visiveis = termo ? filtrados : filtrados.slice(0, 5);

  const container = qs("#js-lista-clientes");
  const vazio = qs("#js-clientes-vazio");
  container.innerHTML = "";

  if (filtrados.length === 0) {
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

  qs("#js-busca-cliente").addEventListener("input", renderizarClientes);

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
    renderizarClientes();
  });
});
