/* ============================================================
   AGENDA V3 — Abrir e fechar modais (Fase 2)
   Motor genérico orientado a atributos, sem precisar de JS
   específico em cada página:

   data-abrir-modal="id"   -> abre o modal com esse id
   data-fechar-modal        -> fecha o modal mais próximo
   data-trocar-modal="id"  -> fecha o modal atual e abre outro

   Tocar fora do cartão (no fundo escuro) também fecha.
   Ainda não salva nenhum dado real — isso é Fase 3.
   ============================================================ */

function abrirModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove("is-hidden");
  // Garante o tamanho certo em TODO chip-group do modal, mesmo os que não
  // passam por inicializarGrupoChips (ex.: "Foi pago?", que usa seu próprio
  // mecanismo de clique em js/acoes-simuladas.js e nunca chamava isso).
  qsa(".chip-group", overlay).forEach(distribuirChipGroup);
  ajustarTextoChips(overlay);
}

function fecharModal(origem) {
  const overlay = typeof origem === "string" ? document.getElementById(origem) : origem.closest(".modal-overlay");
  if (overlay) overlay.classList.add("is-hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  qsa(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (evento) => {
      if (evento.target === overlay) fecharModal(overlay);
    });
  });

  qsa(".modal-close, [data-fechar-modal]").forEach((botao) => {
    botao.addEventListener("click", (evento) => {
      evento.preventDefault();
      fecharModal(botao);
    });
  });

  qsa("[data-abrir-modal]").forEach((gatilho) => {
    gatilho.addEventListener("click", (evento) => {
      evento.preventDefault();
      abrirModal(gatilho.dataset.abrirModal);
    });
  });

  qsa("[data-trocar-modal]").forEach((gatilho) => {
    gatilho.addEventListener("click", (evento) => {
      evento.preventDefault();
      fecharModal(gatilho);
      abrirModal(gatilho.dataset.trocarModal);
    });
  });
});
