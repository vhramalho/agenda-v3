/* ============================================================
   AGENDA V3 — Ranking de serviços
   Pódio + lista com nome e quantidade de atendimentos por
   serviço (sem métrica de faturamento — só contagem).
   ============================================================ */

function calcularRankingServicos() {
  const servicosAtivos = obterServicos().filter((s) => s.ativo);
  const contagem = {};
  obterAgendamentos().forEach((agendamento) => {
    if (!agendamento.status || !agendamento.status.startsWith("realizado_")) return;
    (agendamento.servicosIds || []).forEach((id) => {
      contagem[id] = (contagem[id] || 0) + 1;
    });
  });
  return servicosAtivos
    .map((servico) => ({ servico, quantidade: contagem[servico.id] || 0 }))
    .filter((item) => item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade);
}

function montarPodioCardServico(item, posicaoVisual) {
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
  card.querySelector(".list-item__avatar").textContent = item.servico.nome.slice(0, 2).toUpperCase();
  card.querySelector(".podio-card__nome").textContent = item.servico.nome;
  card.querySelector(".podio-card__valor").textContent = `${item.quantidade} atendimento${item.quantidade === 1 ? "" : "s"}`;
  return card;
}

function montarLinhaRankingServico(item, posicao) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <span style="width:24px;color:var(--text-secondary);font-weight:700;">${posicao}º</span>
    <div class="list-item__avatar"></div>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <span class="text-primary-accent" style="font-weight:700;"></span>
  `;
  linha.querySelector(".list-item__avatar").textContent = item.servico.nome.slice(0, 2).toUpperCase();
  linha.querySelector(".list-item__title").textContent = item.servico.nome;
  linha.querySelector(".text-primary-accent").textContent = `${item.quantidade} atendimento${item.quantidade === 1 ? "" : "s"}`;
  return linha;
}

document.addEventListener("DOMContentLoaded", () => {
  const ranking = calcularRankingServicos();
  const podio = qs("#js-ranking-servicos-podio");
  const tabela = qs("#js-ranking-servicos-tabela");
  const vazio = qs("#js-ranking-servicos-vazio");
  podio.innerHTML = "";
  tabela.innerHTML = "";

  if (ranking.length === 0) {
    podio.classList.add("is-hidden");
    tabela.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    return;
  }
  podio.classList.remove("is-hidden");
  tabela.classList.remove("is-hidden");
  vazio.classList.add("is-hidden");

  const top3 = ranking.slice(0, 3);
  [top3[1], top3[0], top3[2]].forEach((item, posicaoVisual) => {
    if (!item) return;
    podio.appendChild(montarPodioCardServico(item, posicaoVisual));
  });

  ranking.slice(3).forEach((item, i) => tabela.appendChild(montarLinhaRankingServico(item, i + 4)));
});
