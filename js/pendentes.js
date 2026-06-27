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

function rankingDevedores() {
  const contagem = {};
  listaPendentes().forEach((a) => {
    const chave = a.clienteId || `avulso:${a.nomeCliente}`;
    if (!contagem[chave]) contagem[chave] = { nome: a.nomeCliente, vezes: 0 };
    contagem[chave].vezes += 1;
  });
  return Object.values(contagem).sort((a, b) => b.vezes - a.vezes);
}

function montarLinhaDevedor(item, indice) {
  const cores = [
    { background: "#F59E0B", color: "#1a1200" },
    null,
    { background: "#B45309", color: "#1a1200" },
  ];
  const cor = cores[indice];
  const linha = document.createElement("div");
  linha.className = "row row--between";
  linha.innerHTML = `
    <div class="row"><span class="badge ${cor ? "" : "badge--neutro"}"${cor ? ` style="background:${cor.background};color:${cor.color};"` : ""}></span><span></span></div>
    <span class="badge badge--alerta"></span>
  `;
  linha.querySelector(".badge").textContent = indice + 1;
  linha.querySelector(".row span:last-child").textContent = item.nome;
  linha.querySelector(".badge--alerta").textContent = `${item.vezes} ${item.vezes === 1 ? "vez" : "vezes"}`;
  return linha;
}

function montarLinhaDevedorCompleta(item, indice) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  const cores = [
    { background: "#F59E0B", color: "#1a1200" },
    null,
    { background: "#B45309", color: "#1a1200" },
  ];
  const cor = cores[indice];
  linha.innerHTML = `
    <span class="badge ${cor ? "" : "badge--neutro"}"${cor ? ` style="background:${cor.background};color:${cor.color};"` : ""}></span>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <span class="badge badge--alerta"></span>
  `;
  linha.querySelector(".badge").textContent = indice + 1;
  linha.querySelector(".list-item__title").textContent = item.nome;
  linha.querySelector(".badge--alerta").textContent = `${item.vezes} ${item.vezes === 1 ? "vez" : "vezes"}`;
  return linha;
}

document.addEventListener("DOMContentLoaded", () => {
  const pendentes = listaPendentes();
  const totalPendente = pendentes.reduce((soma, a) => soma + (a.valorPendente || a.valorTotal || 0), 0);

  if (qs("#js-pendentes-valor")) {
    qs("#js-pendentes-valor").textContent = formatarMoeda(totalPendente);
    qs("#js-pendentes-contagem").textContent = `${pendentes.length} cobrança${pendentes.length === 1 ? "" : "s"} pendente${pendentes.length === 1 ? "" : "s"}`;
  }

  if (qs("#js-quem-deve-lista")) {
    const limite = qs("#js-quem-deve-rodape") ? Infinity : 3;
    const titulo = qs("#js-quem-deve-titulo");
    if (titulo) titulo.textContent = `Quem deve (${pendentes.length})`;
    const visiveis = pendentes.slice(0, limite);
    const container = qs("#js-quem-deve-lista");
    const vazio = qs("#js-quem-deve-vazio");
    container.innerHTML = "";
    if (visiveis.length === 0) {
      container.classList.add("is-hidden");
      vazio.classList.remove("is-hidden");
    } else {
      container.classList.remove("is-hidden");
      vazio.classList.add("is-hidden");
      visiveis.forEach((a, i) => container.appendChild(montarLinhaPendente(a, i)));
    }
    const rodape = qs("#js-quem-deve-rodape");
    if (rodape) rodape.textContent = `Mostrando todas as ${pendentes.length} cobrança${pendentes.length === 1 ? "" : "s"} pendente${pendentes.length === 1 ? "" : "s"}.`;
  }

  if (qs("#js-pagos-lista")) {
    const pagos = listaPagosRecentes();
    const ehResumo = !window.location.pathname.includes("pendentes-pagos.html");
    const visiveis = pagos.slice(0, ehResumo ? 2 : 5);
    const container = qs("#js-pagos-lista");
    const vazio = qs("#js-pagos-vazio");
    container.innerHTML = "";
    if (visiveis.length === 0) {
      container.classList.add("is-hidden");
      vazio.classList.remove("is-hidden");
    } else {
      container.classList.remove("is-hidden");
      vazio.classList.add("is-hidden");
      visiveis.forEach((a) => container.appendChild(montarLinhaPago(a)));
    }
  }

  if (qs("#js-devedores-lista")) {
    const ranking = rankingDevedores().slice(0, 3);
    const container = qs("#js-devedores-lista");
    const vazio = qs("#js-devedores-vazio");
    container.innerHTML = "";
    if (ranking.length === 0) {
      container.classList.add("is-hidden");
      vazio.classList.remove("is-hidden");
    } else {
      container.classList.remove("is-hidden");
      vazio.classList.add("is-hidden");
      ranking.forEach((item, i) => container.appendChild(montarLinhaDevedor(item, i)));
    }
  }

  if (qs("#js-devedores-lista-completa")) {
    const ranking = rankingDevedores();
    const container = qs("#js-devedores-lista-completa");
    const vazio = qs("#js-devedores-vazio-completo");
    container.innerHTML = "";
    if (ranking.length === 0) {
      container.classList.add("is-hidden");
      vazio.classList.remove("is-hidden");
    } else {
      container.classList.remove("is-hidden");
      vazio.classList.add("is-hidden");
      ranking.forEach((item, i) => container.appendChild(montarLinhaDevedorCompleta(item, i)));
    }
  }
});
