/* ============================================================
   AGENDA V3 — Chips e abas selecionáveis (Fase 2)
   Motor genérico: qualquer container com [data-chips="single"]
   ou [data-chips="multi"] vira um grupo de chips selecionáveis.
   Containers .segmented (Ranking, Relatório) são sempre únicos.
   Não salva nada ainda — isso é Fase 3.
   ============================================================ */

/* Distribuição do chip-group por um tamanho de coluna fixo, à esquerda —
   não por quantidade real nem largura de texto. Todo chip do app tem o
   mesmo tamanho (referência: 5 por linha); um grupo com 2 chips (ex. "Foi
   pago?") ocupa só as 2 primeiras colunas dessa grade de 5, sem esticar
   nem centralizar — o resto da linha fica vazio. 5+ chips completam a
   linha e o excedente quebra pra próxima, sempre em colunas de 5.
   Exceções:
   - chip de dia da semana (data-dia ou .chip--dia) usa referência 7, porque
     os 7 dias sempre precisam caber juntos numa linha só;
   - um chip-group pode declarar sua própria referência via
     `data-chip-colunas="N"` no HTML, pra listas pequenas e fixas que ficam
     melhor num formato diferente (ex.: "Visualização da agenda", 6 opções
     em 2 linhas de 3) — opt-in explícito na tela, não adivinhado pelo JS.
   `calc()`/`%` são resolvidos pelo navegador só na hora de desenhar a tela,
   então funciona mesmo chamado com o modal ainda escondido (`display:none`,
   `clientWidth` zerado). */
const CHIP_GROUP_COLUNAS_REFERENCIA = 5;
const CHIP_GROUP_COLUNAS_SEMANA = 7;
const CHIP_GROUP_GAP_PX = 8; // precisa bater com `gap` de `.chip-group` (css/components.css)

function distribuirChipGroup(container) {
  if (!container.classList.contains("chip-group")) return;
  const chips = qsa(".chip", container);
  if (chips.length === 0) return;
  let referencia;
  if (container.dataset.chipColunas) {
    referencia = parseInt(container.dataset.chipColunas, 10);
  } else {
    const ehSemana = chips.every((chip) => chip.dataset.dia || chip.classList.contains("chip--dia"));
    referencia = ehSemana ? CHIP_GROUP_COLUNAS_SEMANA : CHIP_GROUP_COLUNAS_REFERENCIA;
  }
  const larguraColuna = `calc((100% - ${CHIP_GROUP_GAP_PX * (referencia - 1)}px) / ${referencia})`;
  container.style.display = "grid";
  container.style.justifyContent = "";
  container.style.gridTemplateColumns = `repeat(${referencia}, ${larguraColuna})`;
}

/* Se o texto de um chip não coube na coluna (nome de forma de pagamento
   comprido, ex. "Cartão de crédito"), diminui a fonte até caber em vez de
   deixar a coluna crescer ou o texto cortar — só roda quando o modal já
   está visível de verdade (chamado por abrirModal, js/modal.js), senão
   scrollWidth/clientWidth vêm zerados. */
function ajustarTextoChips(raiz) {
  qsa(".chip-group .chip", raiz).forEach((chip) => {
    chip.style.fontSize = "";
    if (chip.scrollWidth <= chip.clientWidth) return;
    let tamanho = parseFloat(getComputedStyle(chip).fontSize);
    while (chip.scrollWidth > chip.clientWidth && tamanho > 8) {
      tamanho -= 1;
      chip.style.fontSize = `${tamanho}px`;
    }
  });
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
