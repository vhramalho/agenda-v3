/* ============================================================
   AGENDA V3 — Bootstrap
   Roda em toda página. Injeta o menu inferior (se houver
   #js-bottom-nav-mount), depois ativa o item ativo.
   Requer servidor local por causa do fetch em loadComponent.
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  if (qs("#js-bottom-nav-mount")) {
    await loadComponent("#js-bottom-nav-mount", "components/menu.html");
    destacarItemMenuAtivo();
  }
});

/* Toda tela renderiza seus dados uma vez, no carregamento. Ao voltar
   (history.back()) o navegador pode restaurar a página do bfcache sem
   reexecutar nenhum script — recarrega pra garantir dado sempre fresco. */
window.addEventListener("pageshow", (evento) => {
  if (evento.persisted) location.reload();
});
