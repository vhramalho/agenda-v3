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
   scrollWidth/clientWidth vêm zerados.
   Grupos com `data-chip-sem-encolher` (ex.: nomes de serviço, que podem
   ser bem longos) ficam de fora desse encolhimento por decisão do usuário
   — preferem manter o tamanho da fonte e cortar com "..." (já é o
   comportamento padrão do chip via CSS) a ficar ilegível em 8px
   (auditoria pré-backend P1, 2026-08-10). */
function ajustarTextoChips(raiz) {
  qsa(".chip-group .chip", raiz).forEach((chip) => {
    if (chip.closest("[data-chip-sem-encolher]")) return;
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
    // Seletor "+" de duração (js/agenda.js, montarDuracaoChips) cuida do
    // próprio clique — abre um menu em vez de só alternar chip--ativo.
    if (chip.dataset.duracaoMais) return;
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

/* ---------- Seletor "dropdown-picker" genérico ----------
   Popula o menu (montarOpcoesDropdownPicker) e liga abrir/fechar/escolher
   (inicializarDropdownPicker) de um `.dropdown-picker` — usado em
   Onboarding e Configurações pro campo Primeiro/Último horário (2026-09-01,
   substituiu <select> nativo e bottom-sheet-com-chips respectivamente,
   pra ficar no mesmo padrão do "+" de duração em js/agenda.js). Quem chama
   é dono do estado (texto exibido, classe is-ativo) — `aoSelecionar`
   recebe o valor escolhido e faz essa atualização; se retornar `false`
   explicitamente, a escolha é rejeitada (menu continua aberto, nada muda
   — usado em Configurações pra bloquear horário inválido). */
function montarOpcoesDropdownPicker(menuEl, opcoes, valorAtual) {
  menuEl.innerHTML = opcoes
    .map((v) => `<button type="button" class="time-select__option${v === valorAtual ? " is-ativo" : ""}" data-valor="${v}">${v}</button>`)
    .join("");
}

function inicializarDropdownPicker(wrapperEl, aoSelecionar) {
  const trigger = qs(".dropdown-picker__trigger", wrapperEl);
  const menu = qs(".dropdown-picker__menu", wrapperEl);

  trigger.addEventListener("click", (evento) => {
    evento.stopPropagation();
    const estavaAberto = !menu.classList.contains("is-hidden");
    qsa(".dropdown-picker__menu").forEach((m) => m.classList.add("is-hidden"));
    if (estavaAberto) return;
    menu.classList.remove("is-hidden");
    const ativa = qs(".is-ativo", menu);
    if (ativa) ativa.scrollIntoView({ block: "center" });
  });

  menu.addEventListener("click", (evento) => {
    const opcao = evento.target.closest(".time-select__option");
    if (!opcao) return;
    if (aoSelecionar(opcao.dataset.valor) === false) return;
    menu.classList.add("is-hidden");
  });
}

document.addEventListener("click", () => {
  qsa(".dropdown-picker__menu").forEach((m) => m.classList.add("is-hidden"));
});

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
