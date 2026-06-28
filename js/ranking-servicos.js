/* ============================================================
   AGENDA V3 — Ranking de serviços
   Lista com nome e quantidade de atendimentos por serviço
   (sem métrica de faturamento — só contagem), top 3 com leve
   destaque ouro/prata/bronze.
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

function montarLinhaRankingServico(item, posicao) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <span class="ranking-posicao ${classePosicaoRanking(posicao)}">${posicao}</span>
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
  const tabela = qs("#js-ranking-servicos-tabela");
  const vazio = qs("#js-ranking-servicos-vazio");
  tabela.innerHTML = "";

  if (ranking.length === 0) {
    tabela.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    return;
  }
  tabela.classList.remove("is-hidden");
  vazio.classList.add("is-hidden");

  ranking.forEach((item, i) => tabela.appendChild(montarLinhaRankingServico(item, i + 1)));
});
