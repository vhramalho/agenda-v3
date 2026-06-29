/* ============================================================
   AGENDA V3 — Ações simuladas dentro dos modais (Fase 2)
   1) Alternar "Foi pago? Sim/Não" mostra/esconde o campo certo.
   2) Mostrar/ocultar senha nos campos de login e cadastro.
   Nada aqui salva dado real — isso é Fase 3.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // ---------- Foi pago? Sim / Não ----------
  qsa("[data-pago]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const grupo = botao.closest(".btn-row");
      const modal = botao.closest(".modal-sheet");
      const escolha = botao.dataset.pago;

      qsa("[data-pago]", grupo).forEach((b) => {
        b.classList.toggle("chip--ativo", b === botao);
      });

      qsa("[data-campo-pago]", modal).forEach((campo) => {
        campo.classList.toggle("is-hidden", campo.dataset.campoPago !== escolha);
      });
    });
  });

  // ---------- Mostrar / ocultar senha ----------
  const ICONE_OLHO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  const ICONE_OLHO_FECHADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 1 0 2.8 2.8"/><path d="M6.6 6.6C4 8.3 1 12 1 12s4 7 11 7a10.6 10.6 0 0 0 4.2-.8M17.4 17.4C20 15.7 23 12 23 12s-1.6-2.8-4.4-4.8"/></svg>';

  qsa(".input-icon__trailing").forEach((botao) => {
    botao.addEventListener("click", () => {
      const input = botao.closest(".input-icon").querySelector(".input--senha");
      if (!input) return;
      const estaVisivel = input.type === "text";
      input.type = estaVisivel ? "password" : "text";
      botao.innerHTML = estaVisivel ? ICONE_OLHO : ICONE_OLHO_FECHADO;
    });
  });

  // ---------- Formas de pagamento: cada forma escolhida ganha seu campo ----------
  // Roda depois do js/chips.js (incluído antes), que já alternou a classe chip--ativo.
  qsa("[data-linhas-pagamento]").forEach((container) => {
    const campo = container.closest(".field");
    const grupoChips = qs('[data-chips="multi"]', campo);
    if (!grupoChips) return;

    qsa(".chip", grupoChips).forEach((chip) => {
      chip.addEventListener("click", () => {
        const forma = chip.dataset.formaPagamento;
        const linhaExistente = container.querySelector(`[data-linha-forma="${forma}"]`);

        if (chip.classList.contains("chip--ativo")) {
          if (!linhaExistente) {
            const linha = document.createElement("div");
            linha.className = "row";
            linha.style.gap = "8px";
            linha.dataset.linhaForma = forma;
            linha.innerHTML = `<span class="text-secondary" style="width:110px;flex-shrink:0;">${forma}</span><input class="input" placeholder="R$ 0,00" style="flex:1;" />`;
            container.appendChild(linha);
          }
        } else if (linhaExistente) {
          linhaExistente.remove();
        }
      });
    });
  });
});
