/* ============================================================
   AGENDA V3 — Menu inferior
   Marca o item ativo de acordo com a página atual e injeta o
   botão "Voltar" do header secundário, quando existir.
   ============================================================ */

function destacarItemMenuAtivo() {
  const paginaAtual = document.body.dataset.page;
  if (!paginaAtual) return;
  qsa(".bottom-nav__item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.page === paginaAtual);
  });
}

function voltarOuInicio() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "index.html";
  }
}

/* Botão de voltar das 5 telas do menu inferior (Atendimentos/Vendas/
   Pendentes/Clientes/Mais) — diferente de voltarOuInicio(), que desfaz o
   histórico de navegação (certo pra telas Tipo B, alcançadas navegando de
   algum lugar). Essas 5 são "irmãs" no menu, trocadas direto uma pela
   outra pelo ícone — usar histórico faria "voltar" reproduzir a sequência
   de abas tocadas (Vendas→Pendentes→"voltar" caía em Vendas, não na
   Agenda), em vez de sempre levar pra Agenda como o usuário espera. */
function voltarParaAgenda() {
  window.location.href = "index.html";
}
