/* ============================================================
   AGENDA V3 — Bootstrap
   Roda em toda página. Injeta o menu inferior (se houver
   #js-bottom-nav-mount) e o header secundário (se houver
   #js-header-mount), depois ativa os comportamentos de cada um.
   Requer servidor local por causa do fetch em loadComponent.
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  if (qs("#js-bottom-nav-mount")) {
    await loadComponent("#js-bottom-nav-mount", "components/menu.html");
    destacarItemMenuAtivo();
  }

  if (qs("#js-header-mount")) {
    await loadComponent("#js-header-mount", "components/header.html");
    configurarBotaoVoltar();
    const titulo = document.body.dataset.titulo;
    const elTitulo = qs("#js-page-title");
    if (titulo && elTitulo) elTitulo.textContent = titulo;
  }
});
