/* ============================================================
   AGENDA V3 — Telas Pendentes
   Atende pendentes.html e pendentes-devedores.html — cada função só roda
   se os elementos daquela tela existirem no documento.
   pendentes.html: dois cards "A receber" lado a lado (atendimentos/vendas),
   uma lista única "Quem deve" (mistura os dois tipos, cada linha diz qual é
   qual num texto terciário) e um card "Devedores" com ranking combinado.
   pendentes-devedores.html: ranking completo, com abas Atendimentos/Vendas
   (cada ocorrência ainda precisa saber seu tipo, pro modal de "conta/não
   conta" funcionar — só a lista resumida de pendentes.html é que não
   precisa mais dessa separação).
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

function listaVendasPendentes() {
  return obterVendas()
    .filter((v) => v.status === "pendente")
    .sort((a, b) => (a.criadaEm < b.criadaEm ? -1 : 1));
}

/* Uma lista só, misturando pendência de atendimento e de venda — cada linha
   leva um texto terciário dizendo qual é qual, em vez de duas listas
   separadas (ver conversa 2026-07-20). */
function pendenciasUnificadas() {
  const atendimentos = listaPendentes().map((a) => ({
    tipo: "atendimento",
    data: a.data,
    nomeCliente: a.nomeCliente,
    valor: a.valorPendente || a.valorTotal || 0,
  }));
  const vendas = listaVendasPendentes().map((v) => ({
    tipo: "venda",
    data: v.criadaEm.slice(0, 10),
    nomeCliente: v.nomeCliente || "Avulso",
    valor: v.valorPendente || v.valorTotal || 0,
  }));
  return [...atendimentos, ...vendas].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

function montarLinhaPendenteUnificada(item, indice) {
  const linha = document.createElement("a");
  linha.href = `index.html?data=${item.data}`;
  linha.className = "list-item";
  linha.style.textDecoration = "none";
  linha.style.color = "inherit";
  const dias = diasEmAberto(item.data);
  linha.innerHTML = `
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle"><span class="js-data"></span> · <span class="text-danger js-dias"></span></p>
      <p class="list-item__terciario js-tipo"></p>
    </div>
    <div class="list-item__trailing">
      <p style="font-weight:700;" class="js-valor"></p>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.nomeCliente);
  linha.querySelector(".list-item__title").textContent = item.nomeCliente;
  linha.querySelector(".js-data").textContent = formatarDataCurta(item.data).slice(0, 5);
  linha.querySelector(".js-dias").textContent = dias === 0 ? "hoje" : `${dias} dia${dias === 1 ? "" : "s"} em aberto`;
  linha.querySelector(".js-tipo").textContent = item.tipo === "atendimento" ? "Atendimento" : "Venda";
  linha.querySelector(".js-valor").textContent = formatarMoeda(item.valor);
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

/* Ranking combinado (atendimento + venda somados por cliente) — só pro
   preview "top 3" de pendentes.html, que não separa mais em duas listas.
   A tela cheia (pendentes-devedores.html) continua distinguindo os dois,
   agora por abas em vez de duas páginas — ali cada ocorrência precisa ficar
   ligada ao tipo certo (agendamento x venda) pro modal de "conta/não conta"
   funcionar, então não dá pra usar essa versão combinada lá. */
function rankingDevedoresCombinado(periodo) {
  const combinado = {};
  [...rankingDevedores(periodo), ...rankingDevedoresVendas(periodo)].forEach((item) => {
    if (!combinado[item.nome]) combinado[item.nome] = { nome: item.nome, vezes: 0 };
    combinado[item.nome].vezes += item.vezes;
  });
  return Object.values(combinado).sort((a, b) => b.vezes - a.vezes);
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
  const vendasPendentes = listaVendasPendentes();
  const totalVendasPendentes = vendasPendentes.reduce((soma, v) => soma + (v.valorPendente || v.valorTotal || 0), 0);

  // ---- Cards A receber (atendimentos + vendas, lado a lado) ----
  if (qs("#js-pendentes-valor")) {
    iniciarTour("pendentes");
    qs("#js-pendentes-valor").textContent = formatarMoeda(totalPendente);
    qs("#js-pendentes-contagem").textContent = `${pendentes.length} cobrança${pendentes.length === 1 ? "" : "s"} pendente${pendentes.length === 1 ? "" : "s"}`;
    qs("#js-pendentes-vendas-valor").textContent = formatarMoeda(totalVendasPendentes);
    qs("#js-pendentes-vendas-contagem").textContent = `${vendasPendentes.length} venda${vendasPendentes.length === 1 ? "" : "s"} pendente${vendasPendentes.length === 1 ? "" : "s"}`;
  }

  // ---- Quem deve — lista única, atendimento e venda misturados (expansível, limite 5) ----
  if (qs("#js-quem-deve-lista")) {
    const unificada = pendenciasUnificadas();
    const titulo = qs("#js-quem-deve-titulo");
    const toggle = qs("#js-quem-deve-toggle");
    const container = qs("#js-quem-deve-lista");
    const vazio = qs("#js-quem-deve-vazio");
    let expandido = false;

    function renderQuemDeve() {
      container.innerHTML = "";
      if (unificada.length === 0) {
        container.classList.add("is-hidden");
        vazio.classList.remove("is-hidden");
        titulo.textContent = "Quem deve";
        toggle.classList.add("is-hidden");
      } else {
        container.classList.remove("is-hidden");
        vazio.classList.add("is-hidden");
        (expandido ? unificada : unificada.slice(0, 2)).forEach((item, i) => container.appendChild(montarLinhaPendenteUnificada(item, i)));
        if (unificada.length > 2) {
          titulo.textContent = `Quem deve (${unificada.length})`;
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
    if (unificada.length > 0 && obterAjuda().pendentes.introVista) {
      mostrarDicaSpotlight("pendentes", "receber", qs("#js-quem-deve-lista .list-item"));
    }
  }

  // ---- Devedores — card resumo top 3 combinado (pendentes.html) ----
  if (qs("#js-devedores-top3")) {
    const top3 = rankingDevedoresCombinado({ tipo: "ano", ano: new Date().getFullYear() }).slice(0, 3);
    const container = qs("#js-devedores-top3");
    container.innerHTML = "";
    if (top3.length === 0) {
      container.innerHTML = `<p class="text-secondary" style="text-align:center;">Nenhum cliente com pendência no momento.</p>`;
    } else {
      top3.forEach((item, i) => container.appendChild(montarLinhaDevedorCompleta(item, i, i + 1)));
    }
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

  /* ---- Devedores — lista completa, com abas Atendimentos/Vendas
     (pendentes-devedores.html). Um período só (ano-nav + modal de filtro)
     vale pras duas abas — trocar de aba não reseta o período escolhido.
     Os dois rankings são sempre renderizados (não só o da aba ativa), só a
     visibilidade do container muda — mesmo padrão já usado em Relatório. ---- */
  if (qs("#js-devedores-lista-completa")) {
    const containerAtendimento = qs("#js-devedores-lista-completa");
    const vazioAtendimento = qs("#js-devedores-vazio-completo");
    const containerVendas = qs("#js-devedores-vendas-lista-completa");
    const vazioVendas = qs("#js-devedores-vendas-vazio-completo");
    let periodoAtual = { tipo: "ano", ano: new Date().getFullYear() };

    function renderDevedoresCompleto() {
      const ranking = rankingDevedores(periodoAtual);
      containerAtendimento.innerHTML = "";
      if (ranking.length === 0) {
        containerAtendimento.classList.add("is-hidden");
        vazioAtendimento.classList.remove("is-hidden");
      } else {
        containerAtendimento.classList.remove("is-hidden");
        vazioAtendimento.classList.add("is-hidden");
        ranking.forEach((item, i) => containerAtendimento.appendChild(montarLinhaDevedorCompleta(item, i, i + 1, renderDevedoresCompleto)));
      }
    }

    function renderDevedoresVendasCompleto() {
      const ranking = rankingDevedoresVendas(periodoAtual);
      containerVendas.innerHTML = "";
      if (ranking.length === 0) {
        containerVendas.classList.add("is-hidden");
        vazioVendas.classList.remove("is-hidden");
      } else {
        containerVendas.classList.remove("is-hidden");
        vazioVendas.classList.add("is-hidden");
        ranking.forEach((item, i) => containerVendas.appendChild(montarLinhaDevedorVendaCompleta(item, i, i + 1, renderDevedoresVendasCompleto)));
      }
    }

    function renderTudo() {
      qs("#js-ano-label").textContent = rotuloPeriodo(periodoAtual);
      qs("#js-ano-anterior").classList.toggle("is-hidden", periodoAtual.tipo === "personalizado");
      qs("#js-ano-proximo").classList.toggle("is-hidden", periodoAtual.tipo === "personalizado");
      renderDevedoresCompleto();
      renderDevedoresVendasCompleto();
    }

    qsa(".segmented__item", qs("#js-devedores-tabs")).forEach((item) => {
      item.addEventListener("click", () => {
        qsa(".segmented__item", qs("#js-devedores-tabs")).forEach((i) => i.classList.remove("is-active"));
        item.classList.add("is-active");
        qs("#js-devedores-conteudo-atendimento").classList.toggle("is-hidden", item.dataset.aba !== "atendimento");
        qs("#js-devedores-conteudo-vendas").classList.toggle("is-hidden", item.dataset.aba !== "vendas");
      });
    });

    qs("#js-ano-anterior").addEventListener("click", () => { periodoAtual = periodoAnterior(periodoAtual); renderTudo(); });
    qs("#js-ano-proximo").addEventListener("click", () => { periodoAtual = periodoProximo(periodoAtual); renderTudo(); });
    renderTudo();

    configurarFiltroPeriodo(() => periodoAtual, (novoPeriodo) => {
      periodoAtual = novoPeriodo;
      renderTudo();
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
