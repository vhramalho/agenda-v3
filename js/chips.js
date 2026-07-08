/* ============================================================
   AGENDA V3 — Chips e abas selecionáveis (Fase 2)
   Motor genérico: qualquer container com [data-chips="single"]
   ou [data-chips="multi"] vira um grupo de chips selecionáveis.
   Containers .segmented (Ranking, Relatório) são sempre únicos.
   Não salva nada ainda — isso é Fase 3.
   ============================================================ */

/* Distribuição do chip-group pela quantidade de chips, não por largura de
   texto — 1 chip fica centralizado (sem esticar), 2 a 4 dividem a mesma
   linha em partes iguais, 5+ quebra em linhas de 4 (mesma regra que já
   existia só pra forma de pagamento, generalizada pra todo chip-group). */
function distribuirChipGroup(container) {
  if (!container.classList.contains("chip-group")) return;
  const chips = qsa(".chip", container);
  if (chips.length === 0) return;
  if (chips.length === 1) {
    container.style.gridTemplateColumns = "";
    container.style.justifyContent = "center";
    container.style.display = "flex";
  } else {
    container.style.display = "grid";
    container.style.justifyContent = "";
    container.style.gridTemplateColumns = `repeat(${Math.min(chips.length, 4)}, 1fr)`;
  }
}

function inicializarGrupoChips(container, multiplo) {
  distribuirChipGroup(container);
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
