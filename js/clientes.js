/* ============================================================
   AGENDA V3 — Tela Clientes (Fase 3)
   Lista real, busca, ranking/aniversariantes/sem-retornar
   calculados a partir de clientes + agendamentos.
   ============================================================ */

function montarLinhaCliente(cliente, indice) {
  const stats = estatisticasCliente(cliente.id);
  const linha = document.createElement("a");
  linha.href = `cliente-detalhe.html?id=${cliente.id}`;
  linha.className = "list-item";
  linha.style.textDecoration = "none";
  linha.style.color = "inherit";
  linha.innerHTML = `
    <div class="avatar-wrap">
      <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    </div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle"></p>
    </div>
    <div class="list-item__trailing">
      <p style="font-weight:700;"></p>
      <p class="text-muted" style="font-size:var(--text-xs);"></p>
    </div>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(cliente.nome);
  linha.querySelector(".list-item__title").textContent = cliente.nome;
  linha.querySelector(".list-item__subtitle").textContent =
    stats.ultimaVisitaDias === null
      ? "ainda sem atendimentos"
      : stats.ultimaVisitaDias === 0
      ? "última visita hoje"
      : `última visita há ${stats.ultimaVisitaDias} dia${stats.ultimaVisitaDias === 1 ? "" : "s"}`;
  linha.querySelector(".list-item__trailing p").textContent = formatarMoeda(stats.totalGasto);
  linha.querySelector(".list-item__trailing .text-muted").textContent = `${stats.visitas} visita${stats.visitas === 1 ? "" : "s"}`;
  return linha;
}

function renderizarRankingTop3(clientesAtivos) {
  const cores = [
    { background: "#F59E0B", color: "#1a1200" },
    null,
    { background: "#B45309", color: "#1a1200" },
  ];
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
  ranqueados.forEach((r, indice) => {
    const linha = document.createElement("div");
    linha.className = "row row--between";
    const corBadge = cores[indice];
    linha.innerHTML = `
      <div class="row"><span class="badge ${corBadge ? "" : "badge--neutro"}"${corBadge ? ` style="background:${corBadge.background};color:${corBadge.color};"` : ""}>${indice + 1}</span><span></span></div>
      <span class="text-primary-accent" style="font-weight:700;"></span>
    `;
    linha.querySelector(".row span:last-child").textContent = r.cliente.nome;
    linha.querySelector(".text-primary-accent").textContent = formatarMoeda(r.totalGasto);
    container.appendChild(linha);
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

  const container = qs("#js-lista-clientes");
  const vazio = qs("#js-clientes-vazio");
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
