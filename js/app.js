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

/* Bug conhecido do Safari/iOS: depois que o teclado do sistema fecha
   (ao sair de um input), a página às vezes não resincroniza o viewport
   — os elementos aparecem no lugar certo visualmente, mas o toque
   seguinte acerta a posição de ANTES do teclado fechar (um toque em
   "Agendar" cai no botão de baixo, por exemplo), e o header fixo fica
   cortado até um pinch manual forçar o recálculo. Um jiggle de 1px no
   scroll (da janela e do modal aberto, se houver) força esse recálculo
   sem depender do usuário — 300ms de espera pra dar tempo da animação
   de fechar o teclado terminar antes. */
document.addEventListener("focusout", (evento) => {
  if (!evento.target.matches("input, textarea, select")) return;
  setTimeout(() => {
    const modalVisivel = qs(".modal-overlay:not(.is-hidden) .modal-sheet");
    [window, modalVisivel].forEach((alvo) => {
      if (!alvo) return;
      const scrollAtual = alvo === window ? window.scrollY : alvo.scrollTop;
      if (alvo === window) {
        window.scrollTo(0, scrollAtual + 1);
        requestAnimationFrame(() => window.scrollTo(0, scrollAtual));
      } else {
        alvo.scrollTop = scrollAtual + 1;
        requestAnimationFrame(() => { alvo.scrollTop = scrollAtual; });
      }
    });
  }, 300);
});
