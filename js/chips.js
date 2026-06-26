/* ============================================================
   AGENDA V3 — Chips e abas selecionáveis (Fase 2)
   Motor genérico: qualquer container com [data-chips="single"]
   ou [data-chips="multi"] vira um grupo de chips selecionáveis.
   Containers .segmented (Ranking, Relatório) são sempre únicos.
   Não salva nada ainda — isso é Fase 3.
   ============================================================ */

function inicializarGrupoChips(container, multiplo) {
  const classeAtiva = container.dataset.chipEstilo === "outline" ? "chip--outline-ativo" : "chip--ativo";
  const chips = qsa(".chip", container);
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      if (!multiplo) {
        chips.forEach((c) => c.classList.remove("chip--ativo", "chip--outline-ativo"));
        chip.classList.add(classeAtiva);
        return;
      }

      chip.classList.toggle(classeAtiva);
    });
  });
}

function inicializarSegmentado(container) {
  const itens = qsa(".segmented__item", container);
  itens.forEach((item) => {
    item.addEventListener("click", () => {
      itens.forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  qsa('[data-chips="single"]').forEach((el) => inicializarGrupoChips(el, false));
  qsa('[data-chips="multi"]').forEach((el) => inicializarGrupoChips(el, true));
  qsa(".segmented").forEach((el) => inicializarSegmentado(el));
});
