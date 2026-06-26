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

function configurarBotaoVoltar() {
  const botaoVoltar = qs("#js-btn-voltar");
  if (!botaoVoltar) return;
  botaoVoltar.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "index.html";
    }
  });
}
