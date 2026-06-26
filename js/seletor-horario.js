/* ============================================================
   AGENDA V3 — Seletor de horário em dropdown (Fase 2)
   Substitui a digitação livre por uma lista tocável de horários,
   de 30 em 30 minutos, no estilo visual do app.
   ============================================================ */

const HORARIOS_DISPONIVEIS = (() => {
  const lista = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      lista.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return lista;
})();

function montarMenuHorario(container) {
  const menu = qs(".time-select__menu", container);
  const gatilho = qs(".time-select__trigger", container);
  if (!menu || !gatilho || menu.children.length > 0) return;

  HORARIOS_DISPONIVEIS.forEach((hora) => {
    const opcao = document.createElement("button");
    opcao.type = "button";
    opcao.className = "time-select__option";
    opcao.textContent = hora;
    if (hora === gatilho.textContent.trim()) opcao.classList.add("is-ativo");

    opcao.addEventListener("click", () => {
      gatilho.textContent = hora;
      qsa(".time-select__option", menu).forEach((o) => o.classList.remove("is-ativo"));
      opcao.classList.add("is-ativo");
      menu.classList.add("is-hidden");
    });

    menu.appendChild(opcao);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  qsa("[data-time-select]").forEach((container) => {
    montarMenuHorario(container);
    const gatilho = qs(".time-select__trigger", container);
    const menu = qs(".time-select__menu", container);

    gatilho.addEventListener("click", (evento) => {
      evento.stopPropagation();
      const estavaAberto = !menu.classList.contains("is-hidden");
      qsa(".time-select__menu").forEach((m) => m.classList.add("is-hidden"));
      if (estavaAberto) return;
      menu.classList.remove("is-hidden");
      const ativa = qs(".is-ativo", menu);
      if (ativa) ativa.scrollIntoView({ block: "center" });
    });
  });

  document.addEventListener("click", () => {
    qsa(".time-select__menu").forEach((m) => m.classList.add("is-hidden"));
  });
});
