/* ============================================================
   AGENDA V3 — Telas Pendentes (Fase 3, Etapa 7)
   Atende pendentes.html, pendentes-quem-deve.html,
   pendentes-pagos.html e pendentes-devedores.html — cada função
   só roda se os elementos daquela tela existirem no documento.
   "Receber" leva à Agenda na data exata do pendente (?data=...).
   ============================================================ */

function listaPendentes() {
  return obterAgendamentos()
    .filter((a) => a.status === "realizado_pendente")
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

function listaPagosRecentes() {
  return obterAgendamentos()
    .filter((a) => a.status === "realizado_pago")
    .sort((a, b) => (b.realizadoEm || "").localeCompare(a.realizadoEm || ""));
}

function diasEmAberto(dataIso) {
  const diffMs = isoParaDate(hojeIso()) - isoParaDate(dataIso);
  return Math.max(0, Math.floor(diffMs / 86400000));
}

function isoParaDate(iso) {
  return new Date(`${iso}T00:00:00`);
}

function formatarPagoEm(agendamento) {
  const dias = diasEmAberto(agendamento.data);
  if (dias === 0) return "Pago hoje";
  if (dias === 1) return "Pago ontem";
  return `Pago em ${formatarDataCurta(agendamento.data)}`;
}

function montarLinhaPendente(agendamento, indice) {
  const linha = document.createElement("a");
  linha.href = `index.html?data=${agendamento.data}`;
  linha.className = "list-item";
  linha.style.textDecoration = "none";
  linha.style.color = "inherit";
  const dias = diasEmAberto(agendamento.data);
  linha.innerHTML = `
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle"><span class="js-data"></span> · <span class="text-danger js-dias"></span></p>
    </div>
    <div class="list-item__trailing">
      <p style="font-weight:700;" class="js-valor"></p>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(agendamento.nomeCliente);
  linha.querySelector(".list-item__title").textContent = agendamento.nomeCliente;
  linha.querySelector(".js-data").textContent = formatarDataCurta(agendamento.data).slice(0, 5);
  linha.querySelector(".js-dias").textContent = dias === 0 ? "hoje" : `${dias} dia${dias === 1 ? "" : "s"} em aberto`;
  linha.querySelector(".js-valor").textContent = formatarMoeda(agendamento.valorPendente || agendamento.valorTotal || 0);
  return linha;
}

function montarLinhaPago(agendamento) {
  const linha = document.createElement("a");
  linha.href = `index.html?data=${agendamento.data}`;
  linha.className = "list-item";
  linha.style.textDecoration = "none";
  linha.style.color = "inherit";
  linha.innerHTML = `
    <span class="icon-circle icon-circle--green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg></span>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle"></p>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  linha.querySelector(".list-item__title").textContent = agendamento.nomeCliente;
  linha.querySelector(".list-item__subtitle").innerHTML = `${formatarMoeda(agendamento.valorTotal || 0)} · <span class="text-success">${formatarPagoEm(agendamento)}</span>`;
  return linha;
}

function rankingDevedores(ano) {
  const filtrados = listaPendentes().filter((a) => a.data.slice(0, 4) === String(ano));
  const contagem = {};
  filtrados.forEach((a) => {
    const chave = a.clienteId || `avulso:${a.nomeCliente}`;
    if (!contagem[chave]) contagem[chave] = { nome: a.nomeCliente, vezes: 0 };
    contagem[chave].vezes += 1;
  });
  return Object.values(contagem).sort((a, b) => b.vezes - a.vezes);
}

function montarLinhaDevedorCompleta(item, indice, posicao) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <span class="ranking-posicao ${classePosicaoRanking(posicao)}">${posicao}</span>
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <span class="text-primary-accent" style="font-weight:700;"></span>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.nome);
  linha.querySelector(".list-item__title").textContent = item.nome;
  linha.querySelector(".text-primary-accent").textContent = `${item.vezes} ${item.vezes === 1 ? "vez" : "vezes"}`;
  return linha;
}

document.addEventListener("DOMContentLoaded", () => {
  const pendentes = listaPendentes();
  const totalPendente = pendentes.reduce((soma, a) => soma + (a.valorPendente || a.valorTotal || 0), 0);

  // ---- Card A receber ----
  if (qs("#js-pendentes-valor")) {
    qs("#js-pendentes-valor").textContent = formatarMoeda(totalPendente);
    qs("#js-pendentes-contagem").textContent = `${pendentes.length} cobrança${pendentes.length === 1 ? "" : "s"} pendente${pendentes.length === 1 ? "" : "s"}`;
  }

  // ---- Quem deve (expansível, limite 5) ----
  if (qs("#js-quem-deve-lista")) {
    const titulo = qs("#js-quem-deve-titulo");
    const toggle = qs("#js-quem-deve-toggle");
    const container = qs("#js-quem-deve-lista");
    const vazio = qs("#js-quem-deve-vazio");
    let expandido = false;

    function renderQuemDeve() {
      container.innerHTML = "";
      if (pendentes.length === 0) {
        container.classList.add("is-hidden");
        vazio.classList.remove("is-hidden");
        titulo.textContent = "Quem deve";
        toggle.classList.add("is-hidden");
      } else {
        container.classList.remove("is-hidden");
        vazio.classList.add("is-hidden");
        (expandido ? pendentes : pendentes.slice(0, 2)).forEach((a, i) => container.appendChild(montarLinhaPendente(a, i)));
        if (pendentes.length > 2) {
          titulo.textContent = `Quem deve (${pendentes.length})`;
          toggle.textContent = expandido ? "Ver menos" : "Ver todos";
          toggle.classList.remove("is-hidden");
        } else {
          titulo.textContent = "Quem deve";
          toggle.classList.add("is-hidden");
        }
      }
    }

    toggle.addEventListener("click", () => { expandido = !expandido; renderQuemDeve(); });
    renderQuemDeve();
  }

  // ---- Pagos recentemente (expansível, resumo 2, máximo 5 na memória) ----
  if (qs("#js-pagos-lista")) {
    const pagos = listaPagosRecentes().slice(0, 5);
    const toggle = qs("#js-pagos-toggle");
    const container = qs("#js-pagos-lista");
    const vazio = qs("#js-pagos-vazio");
    let expandido = false;

    function renderPagos() {
      container.innerHTML = "";
      if (pagos.length === 0) {
        container.classList.add("is-hidden");
        vazio.classList.remove("is-hidden");
        toggle.classList.add("is-hidden");
      } else {
        container.classList.remove("is-hidden");
        vazio.classList.add("is-hidden");
        (expandido ? pagos : pagos.slice(0, 2)).forEach((a) => container.appendChild(montarLinhaPago(a)));
        if (pagos.length > 2) {
          toggle.textContent = expandido ? "Ver menos" : "Ver todos";
          toggle.classList.remove("is-hidden");
        } else {
          toggle.classList.add("is-hidden");
        }
      }
    }

    toggle.addEventListener("click", () => { expandido = !expandido; renderPagos(); });
    renderPagos();
  }

  // ---- Devedores — card resumo top 3 (pendentes.html) ----
  if (qs("#js-devedores-top3")) {
    const top3 = rankingDevedores(new Date().getFullYear()).slice(0, 3);
    const container = qs("#js-devedores-top3");
    container.innerHTML = "";
    if (top3.length === 0) {
      container.innerHTML = `<p class="text-secondary" style="text-align:center;">Nenhum cliente com pendência no momento.</p>`;
    } else {
      top3.forEach((item, i) => container.appendChild(montarLinhaDevedorCompleta(item, i, i + 1)));
    }
  }

  // ---- Devedores — lista completa (pendentes-devedores.html) ----
  if (qs("#js-devedores-lista-completa")) {
    const container = qs("#js-devedores-lista-completa");
    const vazio = qs("#js-devedores-vazio-completo");
    let anoAtual = new Date().getFullYear();

    function renderDevedoresCompleto() {
      qs("#js-ano-label").textContent = String(anoAtual);
      const ranking = rankingDevedores(anoAtual);
      container.innerHTML = "";
      if (ranking.length === 0) {
        container.classList.add("is-hidden");
        vazio.classList.remove("is-hidden");
      } else {
        container.classList.remove("is-hidden");
        vazio.classList.add("is-hidden");
        ranking.forEach((item, i) => container.appendChild(montarLinhaDevedorCompleta(item, i, i + 1)));
      }
    }

    qs("#js-ano-anterior").addEventListener("click", () => { anoAtual -= 1; renderDevedoresCompleto(); });
    qs("#js-ano-proximo").addEventListener("click", () => { anoAtual += 1; renderDevedoresCompleto(); });
    renderDevedoresCompleto();
  }
});
