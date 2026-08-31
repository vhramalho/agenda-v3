/* ============================================================
   AGENDA V3 — Utilitários gerais
   ============================================================ */

function qs(seletor, escopo) {
  return (escopo || document).querySelector(seletor);
}

function qsa(seletor, escopo) {
  return Array.from((escopo || document).querySelectorAll(seletor));
}

/**
 * Busca um componente HTML (components/*.html) e injeta dentro do
 * elemento alvo. Requer servidor local (file:// puro bloqueia fetch
 * por CORS) — use "Abrir com Live Server" ou rode `npx serve`.
 */
async function loadComponent(seletorAlvo, caminho) {
  const alvo = qs(seletorAlvo);
  if (!alvo) return null;
  const resposta = await fetch(caminho);
  const html = await resposta.text();
  alvo.innerHTML = html;
  return alvo;
}

function formatarMoeda(valor) {
  return (valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataCurta(isoDate) {
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}

/* ---------- Período (Ano / Mês / Personalizado) ----------
   Usado pelas 3 páginas de ranking completo (Ranking, Ranking de
   serviços, Devedores) pro botão "Filtrar". periodo = { tipo: "ano",
   ano } | { tipo: "mes", ano, mes (1-12) } | { tipo: "personalizado",
   inicio, fim (ISO) }. */

function dataNoPeriodo(dataIso, periodo) {
  if (periodo.tipo === "mes") return dataIso.slice(0, 7) === `${periodo.ano}-${String(periodo.mes).padStart(2, "0")}`;
  if (periodo.tipo === "personalizado") return dataIso >= periodo.inicio && dataIso <= periodo.fim;
  return dataIso.slice(0, 4) === String(periodo.ano);
}

function rotuloPeriodo(periodo) {
  if (periodo.tipo === "mes") return `${MESES_NOME_UTILS[periodo.mes - 1].slice(0, 3)}/${periodo.ano}`;
  if (periodo.tipo === "personalizado") return `${formatarDataCurta(periodo.inicio)} – ${formatarDataCurta(periodo.fim)}`;
  return String(periodo.ano);
}

function periodoAnterior(periodo) {
  if (periodo.tipo === "mes") {
    const mes = periodo.mes === 1 ? 12 : periodo.mes - 1;
    const ano = periodo.mes === 1 ? periodo.ano - 1 : periodo.ano;
    return { tipo: "mes", ano, mes };
  }
  return { tipo: "ano", ano: periodo.ano - 1 };
}

function periodoProximo(periodo) {
  if (periodo.tipo === "mes") {
    const mes = periodo.mes === 12 ? 1 : periodo.mes + 1;
    const ano = periodo.mes === 12 ? periodo.ano + 1 : periodo.ano;
    return { tipo: "mes", ano, mes };
  }
  return { tipo: "ano", ano: periodo.ano + 1 };
}

/**
 * Liga o botão "Filtrar" (#js-btn-filtrar) e o modal #modal-filtrar-periodo
 * (Ano / Mês / Personalizado) de uma página de ranking completo.
 * obterPeriodoAtual: função que devolve o período em uso agora (pra
 * sincronizar o modal toda vez que ele abre). aoAplicar: callback
 * chamado com o novo período quando o usuário confirma.
 */
function configurarFiltroPeriodo(obterPeriodoAtual, aoAplicar) {
  let tipoModal = "ano";
  let anoModal = new Date().getFullYear();
  let mesModal = { ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 };

  function mostrarCampoDoTipo() {
    qs("#js-filtro-campo-ano").classList.toggle("is-hidden", tipoModal !== "ano");
    qs("#js-filtro-campo-mes").classList.toggle("is-hidden", tipoModal !== "mes");
    qs("#js-filtro-campo-personalizado").classList.toggle("is-hidden", tipoModal !== "personalizado");
  }

  function atualizarLabelAnoModal() {
    qs("#js-filtro-ano-label").textContent = String(anoModal);
  }

  function atualizarLabelMesModal() {
    qs("#js-filtro-mes-label").textContent = `${MESES_NOME_UTILS[mesModal.mes - 1]} ${mesModal.ano}`;
  }

  function sincronizarComPeriodoAtual() {
    const periodo = obterPeriodoAtual();
    tipoModal = periodo.tipo;
    if (periodo.tipo === "ano") anoModal = periodo.ano;
    if (periodo.tipo === "mes") mesModal = { ano: periodo.ano, mes: periodo.mes };
    if (periodo.tipo === "personalizado") {
      qs("#js-filtro-data-inicio").value = periodo.inicio;
      qs("#js-filtro-data-fim").value = periodo.fim;
    }
    qsa(".segmented__item[data-tipo]", qs("#js-filtro-tipo")).forEach((i) => i.classList.toggle("is-active", i.dataset.tipo === tipoModal));
    mostrarCampoDoTipo();
    atualizarLabelAnoModal();
    atualizarLabelMesModal();
  }

  qs("#js-btn-filtrar").addEventListener("click", () => {
    sincronizarComPeriodoAtual();
    abrirModal("modal-filtrar-periodo");
  });

  qs("#js-filtro-ano-anterior").addEventListener("click", () => { anoModal -= 1; atualizarLabelAnoModal(); });
  qs("#js-filtro-ano-proximo").addEventListener("click", () => { anoModal += 1; atualizarLabelAnoModal(); });
  qs("#js-filtro-mes-anterior").addEventListener("click", () => { mesModal = periodoAnterior({ tipo: "mes", ...mesModal }); atualizarLabelMesModal(); });
  qs("#js-filtro-mes-proximo").addEventListener("click", () => { mesModal = periodoProximo({ tipo: "mes", ...mesModal }); atualizarLabelMesModal(); });

  qsa(".segmented__item[data-tipo]", qs("#js-filtro-tipo")).forEach((item) => {
    item.addEventListener("click", () => {
      qsa(".segmented__item[data-tipo]", qs("#js-filtro-tipo")).forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
      tipoModal = item.dataset.tipo;
      mostrarCampoDoTipo();
    });
  });

  qs("#js-filtro-aplicar").addEventListener("click", () => {
    let periodo;
    if (tipoModal === "ano") {
      periodo = { tipo: "ano", ano: anoModal };
    } else if (tipoModal === "mes") {
      periodo = { tipo: "mes", ano: mesModal.ano, mes: mesModal.mes };
    } else {
      const inicio = qs("#js-filtro-data-inicio").value;
      const fim = qs("#js-filtro-data-fim").value;
      if (!inicio || !fim || inicio > fim) return;
      periodo = { tipo: "personalizado", inicio, fim };
    }
    fecharModal("modal-filtrar-periodo");
    aoAplicar(periodo);
  });
}

function gerarGradeHorarios(horaInicio, horaFim, intervaloGrade) {
  const grade = [];
  let [h, m] = (horaInicio || "").split(":").map(Number);
  const [hf, mf] = (horaFim || "").split(":").map(Number);
  if (![h, m, hf, mf, intervaloGrade].every(Number.isFinite) || intervaloGrade <= 0) return grade;
  while (h < hf || (h === hf && m <= mf)) {
    grade.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += intervaloGrade;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
  }
  return grade;
}

/* Opções de duração/compartilhamento: sempre múltiplos exatos da grade, até
   o total chegar em pelo menos 120min E existirem pelo menos 3 opções —
   regra validada nas simulações antes da implementação (ver
   docs/REFATORACAO_DURACAO_COMPARTILHAMENTO.md). */
function gerarOpcoesDuracao(grade) {
  const opcoes = [];
  let total = 0;
  let mult = 1;
  while (true) {
    const valor = grade * mult;
    opcoes.push(valor);
    total = valor;
    mult++;
    if (total >= 120 && opcoes.length >= 3) break;
    if (opcoes.length > 20) break;
  }
  return opcoes;
}

function somarMinutos(hora, minutos) {
  let [h, m] = hora.split(":").map(Number);
  m += minutos;
  h += Math.floor(m / 60);
  m = ((m % 60) + 60) % 60;
  h = h % 24;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function horaParaMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/* Como somarMinutos(), mas nunca vira o dia (fica preso em 00:00–23:59) —
   usado pra estender o início/fim da grade de um dia específico, onde
   "passar da meia-noite" não faz sentido (ver extensão da grade em agenda.js). */
function somarMinutosClampado(hora, minutos) {
  const total = Math.min(23 * 60 + 59, Math.max(0, horaParaMinutos(hora) + minutos));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function hojeIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function saudacaoPorHora() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function formatarDiaRelativo(iso) {
  const diffDias = Math.round((new Date(`${iso}T00:00:00`) - new Date(`${hojeIso()}T00:00:00`)) / 86400000);
  if (diffDias === 0) return "hoje";
  if (diffDias === 1) return "amanhã";
  const d = new Date(`${iso}T00:00:00`);
  return `dia ${d.getDate()} de ${MESES_NOME_UTILS[d.getMonth()]}`;
}

function gerarLinkMapa(endereco, linkMapa) {
  if (linkMapa) return linkMapa;
  if (endereco) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
  return "";
}

function substituirPlaceholders(texto, dados) {
  let resultado = (texto || "").split("{saudacao}").join(saudacaoPorHora());
  dados = dados || {};
  if (dados.nome !== undefined) resultado = resultado.split("{nome}").join(dados.nome);
  if (dados.hora !== undefined) resultado = resultado.split("{hora}").join(dados.hora);
  if (dados.dia !== undefined) resultado = resultado.split("{dia}").join(dados.dia);
  if (dados.endereco !== undefined) resultado = resultado.split("{endereco}").join(dados.endereco);
  if (dados.mapa !== undefined) resultado = resultado.split("{mapa}").join(dados.mapa);
  if (dados.dias !== undefined) resultado = resultado.split("{dias}").join(dados.dias);
  return resultado;
}

function mostrarAviso(mensagem) {
  const toast = document.createElement("div");
  toast.className = "aviso-toast";
  toast.textContent = mensagem;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function extrairAniversario(texto) {
  const partes = (texto || "").split("/");
  if (partes.length < 2) return { dia: null, mes: null };
  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10);
  return { dia: isNaN(dia) ? null : dia, mes: isNaN(mes) ? null : mes };
}

function extrairValor(texto) {
  const limpo = (texto || "").replace(/[^\d,.-]/g, "").replace(",", ".");
  const numero = parseFloat(limpo);
  return isNaN(numero) ? null : numero;
}

/**
 * Aplica máscara de moeda num input: digita-se só números (teclado
 * numérico via inputmode="decimal") e a vírgula/separador de milhar
 * se posicionam sozinhos, sempre com 2 casas decimais (ex.: "150" -> "1,50").
 */
function aplicarMascaraMoeda(input) {
  input.setAttribute("inputmode", "decimal");
  input.addEventListener("input", () => {
    const digitos = input.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    if (!digitos) { input.value = ""; return; }
    const comCentavos = digitos.padStart(3, "0");
    const inteiro = comCentavos.slice(0, -2);
    const centavos = comCentavos.slice(-2);
    input.value = `R$ ${parseInt(inteiro, 10).toLocaleString("pt-BR")},${centavos}`;
  });
}

function estatisticasCliente(clienteId) {
  const realizados = obterAgendamentos().filter(
    (a) => a.clienteId === clienteId && a.status && a.status.startsWith("realizado_")
  );
  const visitas = realizados.length;
  const totalGasto = realizados.reduce((soma, a) => soma + (a.valorTotal || 0), 0);
  let ultimaVisitaDias = null;
  if (visitas > 0) {
    const maisRecente = realizados.reduce((max, a) => (a.data > max ? a.data : max), realizados[0].data);
    const diffMs = new Date() - new Date(`${maisRecente}T00:00:00`);
    ultimaVisitaDias = Math.max(0, Math.floor(diffMs / 86400000));
  }
  return { visitas, totalGasto, ultimaVisitaDias };
}

function mostrarSucesso() {
  const overlay = document.createElement("div");
  overlay.className = "sucesso-overlay";
  overlay.innerHTML = `
    <div class="sucesso-overlay__circulo">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 900);
}

function classePosicaoRanking(posicao) {
  if (posicao === 1) return "ranking-posicao--ouro";
  if (posicao === 2) return "ranking-posicao--prata";
  if (posicao === 3) return "ranking-posicao--bronze";
  return "";
}

function classeAvatarPorIndice(indice) {
  const classes = ["", "list-item__avatar--c2", "list-item__avatar--c3", "list-item__avatar--c4", "list-item__avatar--c5"];
  return classes[indice % classes.length];
}

function iniciaisCliente(nome) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0] ? partes[0][0] : "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

const INICIAIS_ITEM_STOPWORDS = new Set(["de", "da", "do", "das", "dos", "e", "com", "em", "para", "pra", "no", "na", "um", "uma", "a", "o", "sem"]);

/* Nomes de serviço/produto costumam repetir as primeiras palavras
   ("Maquiagem para festa" / "Maquiagem para ensaio fotográfico") —
   iniciaisCliente (1ª+última letra) faz as duas virarem "MF". Aqui,
   em vez de só 1ª+última palavra, pega até 3 palavras "de conteúdo"
   (ignorando conectivos curtos tipo "para"/"de"/"com"), o que separa
   naturalmente nomes com mais palavras distintas dos mais curtos
   (auditoria pré-backend P3, 2026-08-10). */
function iniciaisItem(nome) {
  const palavras = nome.trim().split(/\s+/).filter((p) => p.length > 1 && !INICIAIS_ITEM_STOPWORDS.has(p.toLowerCase()));
  if (palavras.length === 0) return iniciaisCliente(nome);
  if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase();
  return palavras.slice(0, 3).map((p) => p[0]).join("").toUpperCase();
}

const MESES_NOME_UTILS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function formatarDesdeCadastro(isoDate) {
  if (!isoDate) return "data de cadastro não disponível";
  const [ano, mes] = isoDate.split("-");
  return `desde ${MESES_NOME_UTILS[parseInt(mes, 10) - 1]} ${ano}`;
}

function montarLinhaCliente(cliente, indice, modoSubtitulo = "padrao") {
  const stats = estatisticasCliente(cliente.id);
  const linha = document.createElement("a");
  linha.href = `cliente-detalhe.html?id=${cliente.id}`;
  linha.className = "list-item";
  linha.style.textDecoration = "none";
  linha.style.color = "inherit";
  linha.innerHTML = `
    <div class="avatar-wrap">
      <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    </div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle"></p>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(cliente.nome);
  linha.querySelector(".list-item__title").textContent = cliente.nome;

  if (modoSubtitulo === "cadastro") {
    linha.querySelector(".list-item__subtitle").textContent = formatarDesdeCadastro(cliente.criadoEm);
    return linha;
  }

  const visitasTexto = `${stats.visitas} visita${stats.visitas === 1 ? "" : "s"}`;
  linha.querySelector(".list-item__subtitle").textContent =
    stats.ultimaVisitaDias === null
      ? "ainda sem atendimentos"
      : stats.ultimaVisitaDias === 0
      ? `última visita hoje · ${visitasTexto}`
      : `última visita há ${stats.ultimaVisitaDias} dia${stats.ultimaVisitaDias === 1 ? "" : "s"} · ${visitasTexto}`;
  return linha;
}

/* Ícone por tipo de forma de pagamento — movido de pagamentos.js pra cá
   porque montarFormasChips() (abaixo) também precisa, e roda em páginas
   que não carregam pagamentos.js (Finalizar atendimento, Editar
   realizado, Venda). */
const ICONES_TIPO_PAGAMENTO = {
  pix: { classe: "icon-circle--teal", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l4 4-4 4-4-4 4-4zM12 14l4 4-4 4-4-4 4-4zM2 12l4-4 4 4-4 4-4-4zM14 12l4-4 4 4-4 4-4-4z"/></svg>' },
  dinheiro: { classe: "icon-circle--green", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>' },
  credito: { classe: "", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>' },
  debito: { classe: "icon-circle--blue", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>' },
  outras: { classe: "icon-circle--gray", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>' },
};

const ORDEM_TIPOS_PAGAMENTO = ["pix", "dinheiro", "credito", "debito", "outras"];

/* Formas de pagamento (chips + linhas de valor) — movido de agenda.js pra cá
   na Etapa 3 de Vendas, porque js/produtos.js/js/vendas.js também precisam
   (usado por Finalizar atendimento, Editar realizado E o modal de venda). */
function adicionarLinhaForma(container, nome, valor, formaExcluida) {
  const linha = document.createElement("div");
  linha.dataset.linhaForma = nome;
  if (formaExcluida) linha.dataset.formaExcluida = "true";
  linha.innerHTML = `
    <div class="row" style="gap:8px;">
      <span class="text-secondary" style="width:110px;flex-shrink:0;">${nome}</span>
      <input class="input" placeholder="R$ 0,00" style="flex:1;" value="${valor != null ? formatarMoeda(valor) : ""}" />
    </div>
    ${formaExcluida ? '<p class="text-warning" style="font-size:var(--text-sm);margin-top:4px;">Forma de pagamento excluída — esse valor continua contando no relatório. Escolha outra forma se quiser trocar.</p>' : ""}
  `;
  container.appendChild(linha);
  aplicarMascaraMoeda(linha.querySelector("input"));
}

function montarFormasChips(chipsContainerId, linhasContainerId, nomesSelecionados, valoresPorNome, valorEsperadoFn) {
  const chipsContainer = qs(`#${chipsContainerId}`);
  const linhasContainer = qs(`#${linhasContainerId}`);
  chipsContainer.innerHTML = "";
  linhasContainer.innerHTML = "";
  const formasAtivas = obterFormasPagamento().filter((f) => f.ativo);
  const nomesAtivos = formasAtivas.map((f) => f.nome);
  formasAtivas.forEach((forma) => {
    const ativo = nomesSelecionados.includes(forma.nome);
    const chip = document.createElement("span");
    chip.className = "chip" + (ativo ? " chip--ativo" : "");
    chip.dataset.nome = forma.nome;
    chip.textContent = forma.nome;
    chipsContainer.appendChild(chip);
    if (ativo) adicionarLinhaForma(linhasContainer, forma.nome, valoresPorNome && valoresPorNome[forma.nome]);
  });
  // Formas usadas neste pagamento que já foram excluídas: sem chip (não dá pra escolher de novo),
  // mas a linha continua mostrada — senão "Salvar" perderia esse valor silenciosamente.
  nomesSelecionados.filter((nome) => !nomesAtivos.includes(nome)).forEach((nome) => {
    adicionarLinhaForma(linhasContainer, nome, valoresPorNome && valoresPorNome[nome], true);
  });
  distribuirChipGroup(chipsContainer);

  qsa(".chip", chipsContainer).forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("chip--ativo");
      const nome = chip.dataset.nome;
      const existente = linhasContainer.querySelector(`[data-linha-forma="${nome}"]`);
      if (chip.classList.contains("chip--ativo")) {
        if (!existente) {
          // Escolher uma forma nova enquanto há linha(s) de forma excluída pendente
          // substitui todas elas por essa, somando os valores (sem volta).
          const linhasExcluidas = qsa("[data-forma-excluida]", linhasContainer);
          if (linhasExcluidas.length > 0) {
            const somaExcluidas = linhasExcluidas.reduce((soma, linha) => soma + (extrairValor(linha.querySelector("input").value) || 0), 0);
            linhasExcluidas.forEach((linha) => linha.remove());
            adicionarLinhaForma(linhasContainer, nome, somaExcluidas);
          } else {
            // Primeira linha do pagamento: se há um valor esperado (soma do
            // valorOpcional dos serviços, ou subtotal do carrinho em Vendas),
            // pré-preenche com ele — economiza digitação quando o valor bate certinho.
            const primeiraLinha = linhasContainer.children.length === 0;
            const valorEsperado = valorEsperadoFn ? valorEsperadoFn() : 0;
            adicionarLinhaForma(linhasContainer, nome, primeiraLinha && valorEsperado > 0 ? valorEsperado : null);
          }
        }
      } else if (existente) {
        existente.remove();
      }
    });
  });
}

function lerPagamentosDeLinhas(linhasContainerId) {
  const formas = obterFormasPagamento();
  return qsa(`#${linhasContainerId} [data-linha-forma]`).map((linha) => {
    const nome = linha.dataset.linhaForma;
    const valor = extrairValor(linha.querySelector("input").value) || 0;
    // Prefere a forma ATIVA com esse nome — se uma forma foi excluída e
    // recriada do zero com o mesmo nome (ex.: "Débito" cadastrada errada
    // como tipo Crédito, depois excluída e recriada certa), as duas
    // continuam no array (exclusão é lógica) e sem essa preferência o
    // pagamento linkava silenciosamente com a antiga, entrando no
    // Relatório sob o tipo errado.
    const forma = formas.find((f) => f.nome === nome && f.ativo) || formas.find((f) => f.nome === nome);
    return { formaPagamentoId: forma ? forma.id : null, valor };
  });
}

/* ---------- Período (Dia/Semana/Mês/Ano) — Relatório (Atendimentos) e Vendas ----------
   Movido de js/relatorio.js (2026-08-04) porque a página Vendas passou a ter
   seu próprio seletor de período, independente do de Atendimentos — as duas
   páginas (js/relatorio.js e js/vendas-pagina.js) precisam destes mesmos
   helpers de data/formatação/gráfico. */

const MESES_NOME_RELATORIO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MESES_ABREV_RELATORIO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS_ABREV_RELATORIO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_SEMANA_RELATORIO = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const CORES_FORMA = { pix: "#3B82F6", dinheiro: "#22C55E", credito: "#EC4899", debito: "#EAB308", outras: "#94A3B8", pendentes: "var(--danger)" };
const ROTULO_TIPO_FORMA = { pix: "Pix", dinheiro: "Dinheiro", credito: "Crédito", debito: "Débito", outras: "Outras", pendentes: "Pendentes" };
const ORDEM_TIPOS_FORMA = ["pix", "dinheiro", "credito", "debito", "outras", "pendentes"];

function dataLocalParaIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function inicioDaSemanaRelatorio(data) {
  const d = new Date(data);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function limitesPeriodo(tipo, refData) {
  if (tipo === "dia") {
    return { inicio: new Date(refData), fim: new Date(refData) };
  }
  if (tipo === "semana") {
    const inicio = inicioDaSemanaRelatorio(refData);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    return { inicio, fim };
  }
  if (tipo === "mes") {
    const inicio = new Date(refData.getFullYear(), refData.getMonth(), 1);
    const fim = new Date(refData.getFullYear(), refData.getMonth() + 1, 0);
    return { inicio, fim };
  }
  const inicio = new Date(refData.getFullYear(), 0, 1);
  const fim = new Date(refData.getFullYear(), 11, 31);
  return { inicio, fim };
}

function periodoAnteriorRef(tipo, refData) {
  const anterior = new Date(refData);
  if (tipo === "dia") anterior.setDate(anterior.getDate() - 1);
  else if (tipo === "semana") anterior.setDate(anterior.getDate() - 7);
  else if (tipo === "mes") anterior.setMonth(anterior.getMonth() - 1);
  else anterior.setFullYear(anterior.getFullYear() - 1);
  return anterior;
}

/* incluirRotulo=true só no card de Faturamento e Atendimentos/Vendas (destaques
   com espaço de sobra); os insight-cards menores (Ticket médio, Taxas)
   mostram só a seta + valor, sem "vs X anterior". Quando incluirRotulo=true,
   o "vs X anterior" vem num <span> à parte (texto é HTML, não texto puro)
   pra poder ficar em cor secundária, diferente da seta+valor que fica
   verde/vermelho. */
function formatarComparacao(atual, anterior, rotuloPeriodo, tipo = "valor", incluirRotulo = true) {
  const diff = atual - anterior;
  const sufixo = incluirRotulo ? ` <span class="text-secondary">vs ${rotuloPeriodo} anterior</span>` : "";
  if (diff === 0) return { texto: incluirRotulo ? `sem variação${sufixo}` : "sem variação", classe: "text-secondary" };

  const seta = diff > 0 ? "▲" : "▼";
  const classe = diff > 0 ? "text-success" : "text-danger";

  if (tipo === "contagem") {
    return { texto: `${seta}${Math.abs(diff)}${sufixo}`, classe };
  }

  // tipo "valor" (dinheiro)
  return { texto: `${seta}${formatarMoeda(Math.abs(diff))}${sufixo}`, classe };
}

function formatarEixoY(v) {
  if (v >= 1000) {
    const milhares = v / 1000;
    return `R$${milhares % 1 === 0 ? milhares : milhares.toFixed(1)}k`;
  }
  return `R$${Math.round(v)}`;
}

/* obterValorPeriodo(inicio, fim) => number — abstrai a fonte dos pontos
   (faturamento de atendimentos ou de vendas) pra essa função e o
   desenho do gráfico (montarGraficoFaturamento, abaixo) servirem tanto
   Atendimentos quanto Vendas sem duplicar a lógica de dia/mês/ano. */
function calcularPontosGrafico(tipoPeriodo, refData, obterValorPeriodo) {
  if (tipoPeriodo === "mes") {
    const ultimoDia = new Date(refData.getFullYear(), refData.getMonth() + 1, 0).getDate();
    const pontos = [];
    const rotulos = [];
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const data = new Date(refData.getFullYear(), refData.getMonth(), dia);
      const valor = obterValorPeriodo(data, data);
      const frac = (dia - 1) / (ultimoDia - 1 || 1);
      pontos.push({ frac, valor, marcado: true });
      if (dia === 1 || dia % 5 === 0) rotulos.push({ frac, texto: String(dia) });
    }
    return { pontos, rotulos };
  }

  if (tipoPeriodo === "ano") {
    const pontos = [];
    const rotulos = [];
    for (let mes = 0; mes < 12; mes++) {
      const inicio = new Date(refData.getFullYear(), mes, 1);
      const fim = new Date(refData.getFullYear(), mes + 1, 0);
      const valor = obterValorPeriodo(inicio, fim);
      const frac = mes / 11;
      pontos.push({ frac, valor, marcado: true });
      rotulos.push({ frac, texto: MESES_ABREV_RELATORIO[mes][0].toUpperCase() + MESES_ABREV_RELATORIO[mes].slice(1) });
    }
    return { pontos, rotulos };
  }

  // semana (padrão)
  const inicio = inicioDaSemanaRelatorio(refData);
  const pontos = [];
  const rotulos = [];
  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicio);
    dia.setDate(dia.getDate() + i);
    const valor = obterValorPeriodo(dia, dia);
    const frac = i / 6;
    pontos.push({ frac, valor, marcado: true });
    rotulos.push({ frac, texto: DIAS_ABREV_RELATORIO[i] });
  }
  return { pontos, rotulos };
}

/* ids = { linha, area, dias, eixoMax, eixoMeio } — os ids dos elementos
   do SVG a preencher (o gráfico existe em duas páginas, com ids
   "js-relatorio-*" no Atendimentos e "js-vendas-*" no Vendas). Sem
   marcador de ponto em cada dia (removido 2026-08-05, pedido do
   usuário) — só a linha. */
function montarGraficoFaturamento(tipoPeriodo, refData, obterValorPeriodo, ids) {
  const { pontos, rotulos } = calcularPontosGrafico(tipoPeriodo, refData, obterValorPeriodo);
  const maximo = Math.max(...pontos.map((p) => p.valor), 1);
  const plotTop = 10;
  const plotBottom = 126;
  const plotLeft = 42;
  const plotRight = 288;
  const paraXY = (p) => [plotLeft + p.frac * (plotRight - plotLeft), plotBottom - (p.valor / maximo) * (plotBottom - plotTop)];

  const pontosTexto = pontos.map((p) => paraXY(p).join(",")).join(" ");
  qs(`#${ids.linha}`).setAttribute("points", pontosTexto);
  qs(`#${ids.area}`).setAttribute("points", `${pontosTexto} ${plotRight},${plotBottom} ${plotLeft},${plotBottom}`);

  const grupoDias = qs(`#${ids.dias}`);
  grupoDias.innerHTML = "";
  rotulos.forEach((r) => {
    const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");
    texto.setAttribute("x", plotLeft + r.frac * (plotRight - plotLeft));
    texto.setAttribute("y", "143");
    texto.textContent = r.texto;
    grupoDias.appendChild(texto);
  });

  qs(`#${ids.eixoMax}`).textContent = formatarEixoY(maximo);
  qs(`#${ids.eixoMeio}`).textContent = formatarEixoY(maximo / 2);
}

/* Pendente NÃO entra na pizza/lista de formas — o donut representa só
   dinheiro que já entrou de fato (100% = resumo.totalRecebido). "A
   receber" aparece como uma linha à parte, separada por divisória,
   pra nunca ser somada visualmente junto do que já foi recebido
   (decisão do usuário, auditoria pré-backend P1, 2026-08-10). */
function montarRecebimentos(resumo, formasContainerId, pizzaContainerId) {
  const todasFormas = obterFormasPagamento();
  const tiposComFormaAtiva = new Set(todasFormas.filter((f) => f.ativo).map((f) => f.tipo));
  const container = qs(`#${formasContainerId || "js-relatorio-formas"}`);
  const pizza = qs(`#${pizzaContainerId || "js-relatorio-pizza"}`);
  container.innerHTML = "";
  pizza.innerHTML = "";

  const valorPorTipo = {};
  todasFormas.forEach((forma) => {
    const valor = resumo.porFormaValor[forma.id] || 0;
    if (valor > 0) valorPorTipo[forma.tipo] = (valorPorTipo[forma.tipo] || 0) + valor;
  });

  const tipos = ORDEM_TIPOS_FORMA.filter((tipo) => tipo !== "pendentes" && (tiposComFormaAtiva.has(tipo) || valorPorTipo[tipo] > 0));

  if (tipos.length === 0 && !(resumo.pendente > 0)) {
    container.innerHTML = `<p class="text-secondary" style="margin:0;">Nenhuma forma de pagamento cadastrada.</p>`;
    return;
  }

  const totalRecebido = resumo.totalRecebido || 0;
  const circunferencia = 2 * Math.PI * 45;
  let acumulado = 0;

  tipos.forEach((tipo) => {
    const valor = valorPorTipo[tipo] || 0;
    const percentual = totalRecebido > 0 ? (valor / totalRecebido) * 100 : 0;
    const cor = CORES_FORMA[tipo] || "var(--text-muted)";

    const linha = document.createElement("div");
    linha.className = "row row--between";
    linha.innerHTML = `
      <span class="row" style="gap:8px;"><span style="width:8px;height:8px;border-radius:50%;background:${cor};display:inline-block;"></span><span class="js-nome-forma"></span></span>
      <span class="js-valor-forma" style="color:var(--text-secondary);"></span>
    `;
    linha.querySelector(".js-nome-forma").textContent = ROTULO_TIPO_FORMA[tipo] || tipo;
    linha.querySelector(".js-valor-forma").textContent = formatarMoeda(valor);
    container.appendChild(linha);

    if (valor > 0) {
      const fatia = (percentual / 100) * circunferencia;
      const circulo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circulo.setAttribute("cx", "60");
      circulo.setAttribute("cy", "60");
      circulo.setAttribute("r", "45");
      circulo.setAttribute("fill", "none");
      circulo.setAttribute("stroke", cor);
      circulo.setAttribute("stroke-width", "18");
      circulo.setAttribute("stroke-dasharray", `${fatia} ${circunferencia - fatia}`);
      circulo.setAttribute("stroke-dashoffset", `${-acumulado}`);
      pizza.appendChild(circulo);
      acumulado += fatia;
    }
  });

  if (resumo.pendente > 0) {
    const nota = document.createElement("div");
    nota.className = "row row--between";
    nota.style.cssText = "margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);";
    nota.innerHTML = `
      <span style="color:var(--text-secondary);">Pendente</span>
      <span style="color:var(--danger);font-weight:600;"></span>
    `;
    nota.lastElementChild.textContent = formatarMoeda(resumo.pendente);
    container.appendChild(nota);
  }
}

/* ---------- Pódio de ranking (top 3 + "Ver todos" expande o resto) ----------
   Compartilhado entre "Serviços mais realizados" (Atendimentos) e "Mais
   vendidos" (Vendas, 2026-08-05) — cada item da lista precisa só de
   { nome, valor } (quem chama normaliza a forma antes de passar, ex.
   { nome: produto.nome, valor: quantidade }). 2º/1º/3º da esquerda pra
   direita. Posição vira medalha (anel colorido + selo ouro/prata/bronze
   no avatar, 2026-08-31) em vez dos degraus antigos — número sempre
   visível em cada coluna. "Ver todos" expande uma lista normal com o 4º
   em diante, embaixo do pódio — não repete o top 3. `expandido` é
   controlado por quem chama (cada página guarda seu próprio estado). */
function montarPodioColuna(item, posicao) {
  const coluna = document.createElement("div");
  const sufixo = classePosicaoRanking(posicao).replace("ranking-posicao--", "");
  coluna.className = `podio__coluna podio__coluna--${posicao}`;
  coluna.innerHTML = `
    <div class="podio__avatar-wrap podio__avatar-wrap--${sufixo}">
      <div class="list-item__avatar podio__avatar ${classeAvatarPorIndice(posicao - 1)}"></div>
      <span class="podio__medalha podio__medalha--${sufixo}">${posicao}º</span>
    </div>
    <p class="podio__nome"></p>
    <p class="podio__valor"></p>
  `;
  coluna.querySelector(".podio__avatar").textContent = iniciaisCliente(item.nome);
  coluna.querySelector(".podio__nome").textContent = item.nome;
  coluna.querySelector(".podio__valor").textContent = item.valor;
  return coluna;
}

function montarLinhaRestoRanking(item, posicao) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <span class="ranking-posicao--texto"></span>
    <div class="list-item__avatar"></div>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <span class="text-primary-accent" style="font-weight:700;"></span>
  `;
  linha.querySelector(".ranking-posicao--texto").textContent = `${posicao}º`;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.nome);
  linha.querySelector(".list-item__title").textContent = item.nome;
  linha.querySelector(".text-primary-accent").textContent = item.valor;
  return linha;
}

function montarRankingPodio(lista, containerId, restoId, vazioId, botaoId, expandido) {
  const container = qs(`#${containerId}`);
  const resto = qs(`#${restoId}`);
  const vazio = qs(`#${vazioId}`);
  const botao = qs(`#${botaoId}`);
  container.innerHTML = "";
  resto.innerHTML = "";

  if (lista.length === 0) {
    container.classList.add("is-hidden");
    resto.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    botao.classList.add("is-hidden");
    return;
  }

  container.classList.remove("is-hidden");
  vazio.classList.add("is-hidden");

  const podio = document.createElement("div");
  podio.className = "podio";
  const top3 = lista.slice(0, 3).map((item, i) => ({ item, posicao: i + 1 }));
  [top3[1], top3[0], top3[2]].filter(Boolean).forEach(({ item, posicao }) => podio.appendChild(montarPodioColuna(item, posicao)));
  container.appendChild(podio);

  const restantes = lista.slice(3);
  if (expandido && restantes.length > 0) {
    restantes.forEach((item, i) => resto.appendChild(montarLinhaRestoRanking(item, i + 4)));
    resto.classList.remove("is-hidden");
  } else {
    resto.classList.add("is-hidden");
  }

  if (lista.length > 3) {
    botao.classList.remove("is-hidden");
    botao.textContent = expandido ? "Ver menos" : "Ver todos";
  } else {
    botao.classList.add("is-hidden");
  }
}

/* ---------- Resolver cliente por nome digitado (Agendamento e Venda avulsa) ----------
   Mecanismo compartilhado pelas duas telas que deixam digitar um nome sem
   necessariamente escolher um resultado de busca: se o nome bate exatamente
   com um cliente ativo já cadastrado, pergunta se é a mesma pessoa ou um
   cadastro novo (modal #modal-nome-duplicado, duplicado como markup em
   index.html/vendas.html/pendentes.html); senão cria um cliente novo na
   hora. Nunca descarta silenciosamente um nome digitado. */
function criarClienteRapido(nome) {
  const hoje = hojeIso();
  const clientes = obterClientes();
  const novoCliente = {
    id: gerarId("cli"), nome, telefone: "",
    aniversarioDia: null, aniversarioMes: null, aniversarioAno: null,
    observacao: "", criadoEm: hoje, atualizadoEm: hoje, ativo: true,
  };
  clientes.push(novoCliente);
  salvarClientes(clientes);
  return novoCliente;
}

function proximoNomeDisponivel(nomeBase) {
  const clientes = obterClientes();
  if (!clientes.some((c) => c.nome === nomeBase)) return nomeBase;
  let n = 2;
  while (clientes.some((c) => c.nome === `${nomeBase} ${n}`)) n++;
  return `${nomeBase} ${n}`;
}

let nomeDuplicadoResolver = null;
let nomeDuplicadoNomeBase = null;
let nomeDuplicadoClienteExistenteId = null;

/* aoResolver(clienteId, nome) roda depois que a pessoa escolhe "usar
   existente" ou "criar novo" — fecha modal-nome-duplicado sozinho antes de
   chamar, quem chamou só precisa terminar o fluxo (salvar o agendamento/
   venda) dentro do callback. */
function abrirNomeDuplicado(nome, clienteExistenteId, origemModalId, aoResolver) {
  nomeDuplicadoNomeBase = nome;
  nomeDuplicadoClienteExistenteId = clienteExistenteId;
  nomeDuplicadoResolver = aoResolver;
  qs("#js-nome-duplicado-nome").textContent = nome;
  if (origemModalId) fecharModal(origemModalId);
  abrirModal("modal-nome-duplicado");
}

document.addEventListener("DOMContentLoaded", () => {
  const btnUsarExistente = qs("#js-nome-duplicado-usar-existente");
  const btnCriarNovo = qs("#js-nome-duplicado-criar-novo");
  if (!btnUsarExistente || !btnCriarNovo) return;

  btnUsarExistente.addEventListener("click", () => {
    fecharModal("modal-nome-duplicado");
    if (nomeDuplicadoResolver) nomeDuplicadoResolver(nomeDuplicadoClienteExistenteId, nomeDuplicadoNomeBase);
  });

  btnCriarNovo.addEventListener("click", () => {
    fecharModal("modal-nome-duplicado");
    const novoCliente = criarClienteRapido(proximoNomeDisponivel(nomeDuplicadoNomeBase));
    if (nomeDuplicadoResolver) nomeDuplicadoResolver(novoCliente.id, novoCliente.nome);
  });
});
