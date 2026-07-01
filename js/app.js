/* ============================================================
   AGENDA V3 — Bootstrap
   Roda em toda página. Injeta o menu inferior (se houver
   #js-bottom-nav-mount), depois ativa o item ativo.
   Requer servidor local por causa do fetch em loadComponent.
   ============================================================ */

/* Sem dados fictícios, um usuário novo (ou pós "Apagar todos os dados")
   precisa passar pelo Onboarding antes de usar o app de verdade — sem
   isso, telas como a Agenda ficariam sem horaInicio/horaFim/etc. */
const PAGINAS_SEM_GATE_ONBOARDING = ["onboarding", "login", "cadastro", "assinatura", "assinatura-vencida", "termos", "privacidade"];
if (!PAGINAS_SEM_GATE_ONBOARDING.includes(document.body.dataset.page) && !obterOnboarding().concluido) {
  window.location.href = "onboarding.html";
}

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
