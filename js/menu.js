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

/* Bolinha vermelha (estilo Instagram) no ícone "Clientes" quando há
   cliente novo em "Sem retornar" ou "Aniversariantes" ainda não visto
   (js/notificacoes-clientes.js) — roda em toda página, não só em
   clientes.html, porque o ícone do menu é visível em qualquer tela. */
function atualizarBadgeClientes() {
  const badge = qs("#js-nav-clientes-badge .notificacao-bolinha");
  if (!badge) return;
  const pendentes = calcularNotificacoesClientesPendentes();
  badge.classList.toggle("is-hidden", !(pendentes.semRetornar || pendentes.aniversariantes));
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
