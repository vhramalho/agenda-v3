/* ============================================================
   AGENDA V3 — Telas Pendentes
   Atende pendentes.html, pendentes-devedores.html e
   pendentes-devedores-vendas.html — cada função só roda se os
   elementos daquela tela existirem no documento.
   pendentes.html mostra Atendimento (bloco principal) e Vendas (bloco
   secundário, mesma estrutura — A receber + Quem deve + Devedores —
   só que com menos destaque visual), sempre visíveis, sem aba.
   "Quem deve" leva à Agenda na data exata do pendente (?data=...).
   ============================================================ */

function listaPendentes() {
  return obterAgendamentos()
    .filter((a) => a.status === "realizado_pendente")
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

function diasEmAberto(dataIso) {
  const diffMs = isoParaDate(hojeIso()) - isoParaDate(dataIso);
  return Math.max(0, Math.floor(diffMs / 86400000));
}

function isoParaDate(iso) {
  return new Date(`${iso}T00:00:00`);
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

function listaVendasPendentes() {
  return obterVendas()
    .filter((v) => v.status === "pendente")
    .sort((a, b) => (a.criadaEm < b.criadaEm ? -1 : 1));
}

/* Mesmo formato/comportamento de montarLinhaPendente (atendimentos):
   avatar, nome, "data · X dias em aberto", valor, chevron, clicável
   levando à Agenda no dia da venda. */
function montarLinhaVendaPendente(venda, indice) {
  const linha = document.createElement("a");
  const dataVenda = venda.criadaEm.slice(0, 10);
  linha.href = `index.html?data=${dataVenda}`;
  linha.className = "list-item";
  linha.style.textDecoration = "none";
  linha.style.color = "inherit";
  const dias = diasEmAberto(dataVenda);
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
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(venda.nomeCliente || "Avulso");
  linha.querySelector(".list-item__title").textContent = venda.nomeCliente || "Avulso";
  linha.querySelector(".js-data").textContent = formatarDataCurta(dataVenda).slice(0, 5);
  linha.querySelector(".js-dias").textContent = dias === 0 ? "hoje" : `${dias} dia${dias === 1 ? "" : "s"} em aberto`;
  linha.querySelector(".js-valor").textContent = formatarMoeda(venda.valorPendente || venda.valorTotal || 0);
  return linha;
}

function rankingDevedores(periodo) {
  // Histórico de quantas vezes o cliente já entrou como pendente, mesmo que
  // tenha pago depois — não é só quem está pendente agora (isso é listaPendentes()).
  // Ocorrências marcadas com excluidoDoRanking (lançamento por engano etc.) não
  // entram na contagem de "vezes", mas continuam na lista pra poder desmarcar depois.
  const candidatos = obterAgendamentos().filter((a) => (a.status === "realizado_pendente" || a.foiPendente) && dataNoPeriodo(a.data, periodo));
  const contagem = {};
  candidatos.forEach((a) => {
    const chave = a.clienteId || `avulso:${a.nomeCliente}`;
    if (!contagem[chave]) contagem[chave] = { nome: a.nomeCliente, vezes: 0, ocorrenciaIds: [] };
    contagem[chave].ocorrenciaIds.push(a.id);
    if (!a.excluidoDoRanking) contagem[chave].vezes += 1;
  });
  return Object.values(contagem).sort((a, b) => b.vezes - a.vezes);
}

function montarLinhaDevedorCompleta(item, indice, posicao, aoAtualizar) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <span class="ranking-posicao ${classePosicaoRanking(posicao)}">${posicao}</span>
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <span class="text-primary-accent" style="font-weight:700;"></span>
    ${aoAtualizar ? '<svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>' : ""}
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.nome);
  linha.querySelector(".list-item__title").textContent = item.nome;
  linha.querySelector(".text-primary-accent").textContent = `${item.vezes} ${item.vezes === 1 ? "vez" : "vezes"}`;
  if (aoAtualizar) {
    linha.style.cursor = "pointer";
    linha.addEventListener("click", () => abrirOcorrenciasDevedor(item, aoAtualizar));
  }
  return linha;
}

/* Devedores de vendas — mesmo padrão de rankingDevedores/montarLinhaDevedorCompleta,
   mas venda não tem foiPendente (nunca muda de status depois de criada, ver
   js/storage.js), então o candidato é só quem está pendente agora mesmo. */
function rankingDevedoresVendas(periodo) {
  const candidatos = obterVendas().filter((v) => v.status === "pendente" && dataNoPeriodo(v.criadaEm.slice(0, 10), periodo));
  const contagem = {};
  candidatos.forEach((v) => {
    const chave = v.clienteId || `avulso:${v.nomeCliente}`;
    if (!contagem[chave]) contagem[chave] = { nome: v.nomeCliente || "Avulso", vezes: 0, ocorrenciaIds: [] };
    contagem[chave].ocorrenciaIds.push(v.id);
    if (!v.excluidoDoRanking) contagem[chave].vezes += 1;
  });
  return Object.values(contagem).sort((a, b) => b.vezes - a.vezes);
}

function montarLinhaDevedorVendaCompleta(item, indice, posicao, aoAtualizar) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <span class="ranking-posicao ${classePosicaoRanking(posicao)}">${posicao}</span>
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <span class="text-primary-accent" style="font-weight:700;"></span>
    ${aoAtualizar ? '<svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>' : ""}
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.nome);
  linha.querySelector(".list-item__title").textContent = item.nome;
  linha.querySelector(".text-primary-accent").textContent = `${item.vezes} ${item.vezes === 1 ? "vez" : "vezes"}`;
  if (aoAtualizar) {
    linha.style.cursor = "pointer";
    linha.addEventListener("click", () => abrirOcorrenciasDevedorVenda(item, aoAtualizar));
  }
  return linha;
}

let aoAtualizarOcorrenciasVendaAtual = null;

function abrirOcorrenciasDevedorVenda(item, aoAtualizar) {
  aoAtualizarOcorrenciasVendaAtual = aoAtualizar;
  qs("#js-devedor-ocorrencias-vendas-titulo").textContent = item.nome;
  renderizarOcorrenciasDevedorVenda(item);
  abrirModal("modal-devedor-ocorrencias-vendas");
}

function renderizarOcorrenciasDevedorVenda(item) {
  const lista = qs("#js-devedor-ocorrencias-vendas-lista");
  lista.innerHTML = "";
  const ocorrencias = obterVendas()
    .filter((v) => item.ocorrenciaIds.includes(v.id))
    .sort((a, b) => (a.criadaEm < b.criadaEm ? 1 : -1));
  ocorrencias.forEach((v) => {
    const conta = !v.excluidoDoRanking;
    const linha = document.createElement("div");
    linha.className = "card row row--between";
    linha.innerHTML = `
      <div>
        <p style="font-weight:600;">${formatarDataCurta(v.criadaEm.slice(0, 10))}</p>
        <p class="text-secondary" style="font-size:var(--text-sm);">${formatarMoeda(v.valorPendente || v.valorTotal || 0)} · Pendente</p>
      </div>
      <span class="chip${conta ? " chip--ativo" : ""}" data-venda-id="${v.id}">${conta ? "Conta" : "Não conta"}</span>
    `;
    lista.appendChild(linha);
  });
}

let aoAtualizarOcorrenciasAtual = null;

function abrirOcorrenciasDevedor(item, aoAtualizar) {
  aoAtualizarOcorrenciasAtual = aoAtualizar;
  qs("#js-devedor-ocorrencias-titulo").textContent = item.nome;
  renderizarOcorrenciasDevedor(item);
  abrirModal("modal-devedor-ocorrencias");
}

function renderizarOcorrenciasDevedor(item) {
  const lista = qs("#js-devedor-ocorrencias-lista");
  lista.innerHTML = "";
  const ocorrencias = obterAgendamentos()
    .filter((ag) => item.ocorrenciaIds.includes(ag.id))
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  ocorrencias.forEach((ag) => {
    const conta = !ag.excluidoDoRanking;
    const statusTexto = ag.status === "realizado_pendente" ? "Ainda pendente" : `Pago${ag.pagoEm ? ` em ${formatarDataCurta(ag.pagoEm.slice(0, 10))}` : ""}`;
    const linha = document.createElement("div");
    linha.className = "card row row--between";
    linha.innerHTML = `
      <div>
        <p style="font-weight:600;">${formatarDataCurta(ag.data)}</p>
        <p class="text-secondary" style="font-size:var(--text-sm);">${formatarMoeda(ag.valorPendente || ag.valorTotal || 0)} · ${statusTexto}</p>
      </div>
      <span class="chip${conta ? " chip--ativo" : ""}" data-agendamento-id="${ag.id}">${conta ? "Conta" : "Não conta"}</span>
    `;
    lista.appendChild(linha);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const pendentes = listaPendentes();
  const totalPendente = pendentes.reduce((soma, a) => soma + (a.valorPendente || a.valorTotal || 0), 0);

  // ---- Card A receber ----
  if (qs("#js-pendentes-valor")) {
    iniciarTour("pendentes");
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

    // Dica avulsa "clique para receber": só numa visita DEPOIS que o tour de
    // boas-vindas já foi visto (nunca na mesma visita que ele, pra não brigar
    // pelo mesmo overlay) — normalmente já é assim, já que o pendente é criado
    // lá na Agenda, numa visita anterior.
    if (pendentes.length > 0 && obterAjuda().pendentes.introVista) {
      mostrarDicaSpotlight("pendentes", "receber", qs("#js-quem-deve-lista .list-item"));
    }
  }

  // ---- Aba Vendas: A receber + Quem deve (mesmo padrão da aba Atendimento) ----
  if (qs("#js-pendentes-vendas-valor")) {
    const vendasPendentes = listaVendasPendentes();
    const totalVendasPendentes = vendasPendentes.reduce((soma, v) => soma + (v.valorPendente || v.valorTotal || 0), 0);
    qs("#js-pendentes-vendas-valor").textContent = formatarMoeda(totalVendasPendentes);
    qs("#js-pendentes-vendas-contagem").textContent = `${vendasPendentes.length} venda${vendasPendentes.length === 1 ? "" : "s"} pendente${vendasPendentes.length === 1 ? "" : "s"}`;
  }

  if (qs("#js-quem-deve-vendas-lista")) {
    const vendasPendentes = listaVendasPendentes();
    const titulo = qs("#js-quem-deve-vendas-titulo");
    const toggle = qs("#js-quem-deve-vendas-toggle");
    const container = qs("#js-quem-deve-vendas-lista");
    const vazio = qs("#js-quem-deve-vendas-vazio");
    let expandido = false;

    function renderQuemDeveVendas() {
      container.innerHTML = "";
      if (vendasPendentes.length === 0) {
        container.classList.add("is-hidden");
        vazio.classList.remove("is-hidden");
        titulo.textContent = "Quem deve";
        toggle.classList.add("is-hidden");
      } else {
        container.classList.remove("is-hidden");
        vazio.classList.add("is-hidden");
        (expandido ? vendasPendentes : vendasPendentes.slice(0, 2)).forEach((v, i) => container.appendChild(montarLinhaVendaPendente(v, i)));
        if (vendasPendentes.length > 2) {
          titulo.textContent = `Quem deve (${vendasPendentes.length})`;
          toggle.textContent = expandido ? "Ver menos" : "Ver todos";
          toggle.classList.remove("is-hidden");
        } else {
          titulo.textContent = "Quem deve";
          toggle.classList.add("is-hidden");
        }
      }
    }

    toggle.addEventListener("click", () => { expandido = !expandido; renderQuemDeveVendas(); });
    renderQuemDeveVendas();
  }

  // ---- Devedores — card resumo top 3 (pendentes.html) ----
  if (qs("#js-devedores-top3")) {
    const top3 = rankingDevedores({ tipo: "ano", ano: new Date().getFullYear() }).slice(0, 3);
    const container = qs("#js-devedores-top3");
    container.innerHTML = "";
    if (top3.length === 0) {
      container.innerHTML = `<p class="text-secondary" style="text-align:center;">Nenhum cliente com pendência no momento.</p>`;
    } else {
      top3.forEach((item, i) => container.appendChild(montarLinhaDevedorCompleta(item, i, i + 1)));
    }
  }

  // ---- Devedores de vendas — card resumo top 3 (pendentes.html) ----
  if (qs("#js-devedores-vendas-top3")) {
    const top3 = rankingDevedoresVendas({ tipo: "ano", ano: new Date().getFullYear() }).slice(0, 3);
    const container = qs("#js-devedores-vendas-top3");
    container.innerHTML = "";
    if (top3.length === 0) {
      container.innerHTML = `<p class="text-secondary" style="text-align:center;">Nenhuma venda com pendência no momento.</p>`;
    } else {
      top3.forEach((item, i) => container.appendChild(montarLinhaDevedorVendaCompleta(item, i, i + 1)));
    }
  }

  // ---- Devedores de vendas — lista completa (pendentes-devedores-vendas.html) ----
  if (qs("#js-devedores-vendas-lista-completa")) {
    const container = qs("#js-devedores-vendas-lista-completa");
    const vazio = qs("#js-devedores-vendas-vazio-completo");
    let periodoAtual = { tipo: "ano", ano: new Date().getFullYear() };

    function renderDevedoresVendasCompleto() {
      qs("#js-ano-label").textContent = rotuloPeriodo(periodoAtual);
      qs("#js-ano-anterior").classList.toggle("is-hidden", periodoAtual.tipo === "personalizado");
      qs("#js-ano-proximo").classList.toggle("is-hidden", periodoAtual.tipo === "personalizado");
      const ranking = rankingDevedoresVendas(periodoAtual);
      container.innerHTML = "";
      if (ranking.length === 0) {
        container.classList.add("is-hidden");
        vazio.classList.remove("is-hidden");
      } else {
        container.classList.remove("is-hidden");
        vazio.classList.add("is-hidden");
        ranking.forEach((item, i) => container.appendChild(montarLinhaDevedorVendaCompleta(item, i, i + 1, renderDevedoresVendasCompleto)));
      }
    }

    qs("#js-ano-anterior").addEventListener("click", () => { periodoAtual = periodoAnterior(periodoAtual); renderDevedoresVendasCompleto(); });
    qs("#js-ano-proximo").addEventListener("click", () => { periodoAtual = periodoProximo(periodoAtual); renderDevedoresVendasCompleto(); });
    renderDevedoresVendasCompleto();

    configurarFiltroPeriodo(() => periodoAtual, (novoPeriodo) => {
      periodoAtual = novoPeriodo;
      renderDevedoresVendasCompleto();
    });
  }

  // ---- Toggle "Conta"/"Não conta" nas ocorrências de um devedor de vendas ----
  if (qs("#js-devedor-ocorrencias-vendas-lista")) {
    qs("#js-devedor-ocorrencias-vendas-lista").addEventListener("click", (evento) => {
      const chip = evento.target.closest("[data-venda-id]");
      if (!chip) return;
      const lista = obterVendas();
      const v = lista.find((venda) => venda.id === chip.dataset.vendaId);
      if (!v) return;
      v.excluidoDoRanking = !v.excluidoDoRanking;
      salvarVendas(lista);
      chip.classList.toggle("chip--ativo", !v.excluidoDoRanking);
      chip.textContent = v.excluidoDoRanking ? "Não conta" : "Conta";
      if (aoAtualizarOcorrenciasVendaAtual) aoAtualizarOcorrenciasVendaAtual();
    });
  }

  // ---- Devedores — lista completa (pendentes-devedores.html) ----
  if (qs("#js-devedores-lista-completa")) {
    const container = qs("#js-devedores-lista-completa");
    const vazio = qs("#js-devedores-vazio-completo");
    let periodoAtual = { tipo: "ano", ano: new Date().getFullYear() };

    function renderDevedoresCompleto() {
      qs("#js-ano-label").textContent = rotuloPeriodo(periodoAtual);
      qs("#js-ano-anterior").classList.toggle("is-hidden", periodoAtual.tipo === "personalizado");
      qs("#js-ano-proximo").classList.toggle("is-hidden", periodoAtual.tipo === "personalizado");
      const ranking = rankingDevedores(periodoAtual);
      container.innerHTML = "";
      if (ranking.length === 0) {
        container.classList.add("is-hidden");
        vazio.classList.remove("is-hidden");
      } else {
        container.classList.remove("is-hidden");
        vazio.classList.add("is-hidden");
        ranking.forEach((item, i) => container.appendChild(montarLinhaDevedorCompleta(item, i, i + 1, renderDevedoresCompleto)));
      }
    }

    qs("#js-ano-anterior").addEventListener("click", () => { periodoAtual = periodoAnterior(periodoAtual); renderDevedoresCompleto(); });
    qs("#js-ano-proximo").addEventListener("click", () => { periodoAtual = periodoProximo(periodoAtual); renderDevedoresCompleto(); });
    renderDevedoresCompleto();

    configurarFiltroPeriodo(() => periodoAtual, (novoPeriodo) => {
      periodoAtual = novoPeriodo;
      renderDevedoresCompleto();
    });
  }

  // ---- Toggle "Conta"/"Não conta" nas ocorrências de um devedor ----
  if (qs("#js-devedor-ocorrencias-lista")) {
    qs("#js-devedor-ocorrencias-lista").addEventListener("click", (evento) => {
      const chip = evento.target.closest("[data-agendamento-id]");
      if (!chip) return;
      const lista = obterAgendamentos();
      const ag = lista.find((a) => a.id === chip.dataset.agendamentoId);
      if (!ag) return;
      ag.excluidoDoRanking = !ag.excluidoDoRanking;
      salvarAgendamentos(lista);
      chip.classList.toggle("chip--ativo", !ag.excluidoDoRanking);
      chip.textContent = ag.excluidoDoRanking ? "Não conta" : "Conta";
      if (aoAtualizarOcorrenciasAtual) aoAtualizarOcorrenciasAtual();
    });
  }
});
