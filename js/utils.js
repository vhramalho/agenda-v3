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
  let [h, m] = horaInicio.split(":").map(Number);
  const [hf, mf] = horaFim.split(":").map(Number);
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

/* Mostra "Desconto: R$X"/"Gorjeta: R$X" em avisoId, ao vivo, comparando a
   soma das linhas de pagamento com valorEsperadoFn() — mesma mecânica em
   Vendas e Atendimentos (ver js/vendas.js e js/agenda.js). Sem linha
   nenhuma ainda, ou sem valor esperado (nenhum valorOpcional/subtotal),
   o aviso fica escondido — só aparece quando há de fato uma diferença. */
function atualizarAvisoDescontoGorjeta(linhasContainerId, avisoId, valorEsperadoFn) {
  const aviso = qs(`#${avisoId}`);
  if (!aviso) return;
  const valorEsperado = valorEsperadoFn ? valorEsperadoFn() : 0;
  const linhas = qsa(`#${linhasContainerId} [data-linha-forma]`);
  if (valorEsperado <= 0 || linhas.length === 0) {
    aviso.classList.add("is-hidden");
    return;
  }
  const soma = lerPagamentosDeLinhas(linhasContainerId).reduce((s, p) => s + p.valor, 0);
  const diferenca = valorEsperado - soma;
  if (diferenca > 0.004) {
    aviso.textContent = `Desconto: ${formatarMoeda(diferenca)}`;
    aviso.classList.remove("is-hidden");
  } else if (diferenca < -0.004) {
    aviso.textContent = `Gorjeta: ${formatarMoeda(-diferenca)}`;
    aviso.classList.remove("is-hidden");
  } else {
    aviso.classList.add("is-hidden");
  }
}

function montarFormasChips(chipsContainerId, linhasContainerId, nomesSelecionados, valoresPorNome, valorEsperadoFn, avisoId) {
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

  if (avisoId && !linhasContainer.dataset.avisoWired) {
    linhasContainer.dataset.avisoWired = "true";
    linhasContainer.addEventListener("input", () => atualizarAvisoDescontoGorjeta(linhasContainerId, avisoId, valorEsperadoFn));
  }
  if (avisoId) atualizarAvisoDescontoGorjeta(linhasContainerId, avisoId, valorEsperadoFn);

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
            // pré-preenche com ele — digitar outra coisa vira desconto/gorjeta
            // automaticamente ao salvar (e já aparece no aviso ao vivo).
            const primeiraLinha = linhasContainer.children.length === 0;
            const valorEsperado = valorEsperadoFn ? valorEsperadoFn() : 0;
            adicionarLinhaForma(linhasContainer, nome, primeiraLinha && valorEsperado > 0 ? valorEsperado : null);
          }
        }
      } else if (existente) {
        existente.remove();
      }
      if (avisoId) atualizarAvisoDescontoGorjeta(linhasContainerId, avisoId, valorEsperadoFn);
    });
  });
}

function lerPagamentosDeLinhas(linhasContainerId) {
  const formas = obterFormasPagamento();
  return qsa(`#${linhasContainerId} [data-linha-forma]`).map((linha) => {
    const nome = linha.dataset.linhaForma;
    const valor = extrairValor(linha.querySelector("input").value) || 0;
    const forma = formas.find((f) => f.nome === nome);
    return { formaPagamentoId: forma ? forma.id : null, valor };
  });
}
