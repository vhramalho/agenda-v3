/* ============================================================
   AGENDA V3 — Ranking, Aniversariantes e Sem retornar (Fase 3,
   Etapa 9). Atende as 3 telas — cada bloco só roda se os
   elementos daquela tela existirem no documento.
   ============================================================ */

/* ---------- Botão de WhatsApp (sempre com o ícone de mensagem) ---------- */

function montarBotaoWhatsapp(cliente, mensagemTexto) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "icon-btn icon-btn--accent";
  botao.setAttribute("aria-label", "WhatsApp");
  botao.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  botao.addEventListener("click", () => {
    if (!cliente.telefone) { mostrarAviso("Telefone não cadastrado"); return; }
    const digitos = cliente.telefone.replace(/\D/g, "");
    const texto = mensagemTexto ? `?text=${encodeURIComponent(mensagemTexto)}` : "";
    window.open(`https://wa.me/55${digitos}${texto}`, "_blank");
  });
  return botao;
}

/* ---------- Ranking ---------- */

function estatisticasRanking(clienteId, periodo) {
  const realizados = obterAgendamentos().filter(
    (a) => a.clienteId === clienteId && a.status && a.status.startsWith("realizado_") && dataNoPeriodo(a.data, periodo)
  );
  const visitas = realizados.length;
  const totalGasto = realizados.reduce((s, a) => s + (a.valorTotal || 0), 0);
  const ticket = visitas > 0 ? totalGasto / visitas : 0;
  const vendasCliente = obterVendas().filter((v) => v.clienteId === clienteId && dataNoPeriodo(v.criadaEm.slice(0, 10), periodo));
  const totalComprado = vendasCliente.reduce((s, v) => s + (v.valorTotal || 0), 0);
  return { visitas, totalGasto, ticket, totalComprado };
}

function valorPorMetrica(stats, metrica) {
  if (metrica === "visitas") return stats.visitas;
  if (metrica === "ticket") return stats.ticket;
  if (metrica === "compras") return stats.totalComprado;
  return stats.totalGasto;
}

function formatarValorMetrica(valor, metrica) {
  return metrica === "visitas" ? String(valor) : formatarMoeda(valor);
}

function montarLinhaRanking(item, indice, posicao, metrica) {
  const linha = document.createElement("a");
  linha.href = `cliente-detalhe.html?id=${item.cliente.id}`;
  linha.className = "list-item";
  linha.style.textDecoration = "none";
  linha.style.color = "inherit";
  const sufixo = classePosicaoRanking(posicao).replace("ranking-posicao--", "");
  const avatar = sufixo
    ? `<div class="list-item__avatar-wrap list-item__avatar-wrap--${sufixo}">
         <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
         <span class="list-item__medalha list-item__medalha--${sufixo}">${posicao}</span>
       </div>`
    : `<span class="ranking-posicao">${posicao}</span><div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>`;
  linha.innerHTML = `
    ${avatar}
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <span class="text-primary-accent" style="font-weight:700;"></span>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.cliente.nome);
  linha.querySelector(".list-item__title").textContent = item.cliente.nome;
  linha.querySelector(".text-primary-accent").textContent = formatarValorMetrica(valorPorMetrica(item.stats, metrica), metrica);
  return linha;
}

function renderizarRanking(metrica, periodo) {
  const linhas = obterClientes()
    .filter((c) => c.ativo)
    .map((c) => ({ cliente: c, stats: estatisticasRanking(c.id, periodo) }))
    .filter((r) => valorPorMetrica(r.stats, metrica) > 0)
    .sort((a, b) => valorPorMetrica(b.stats, metrica) - valorPorMetrica(a.stats, metrica));

  const tabela = qs("#js-ranking-tabela");
  const vazio = qs("#js-ranking-vazio");
  tabela.innerHTML = "";

  if (linhas.length === 0) {
    tabela.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    return;
  }
  tabela.classList.remove("is-hidden");
  vazio.classList.add("is-hidden");

  linhas.forEach((item, i) => tabela.appendChild(montarLinhaRanking(item, i, i + 1, metrica)));
}

if (qs("#js-ranking-tabela")) {
  document.addEventListener("DOMContentLoaded", () => {
    let metricaAtual = "faturamento";
    let periodoAtual = { tipo: "ano", ano: new Date().getFullYear() };

    function atualizarRankingPeriodo() {
      qs("#js-ano-label").textContent = rotuloPeriodo(periodoAtual);
      qs("#js-ano-anterior").classList.toggle("is-hidden", periodoAtual.tipo === "personalizado");
      qs("#js-ano-proximo").classList.toggle("is-hidden", periodoAtual.tipo === "personalizado");
      qs("#js-ranking-ano-texto").textContent = rotuloPeriodo(periodoAtual);
      renderizarRanking(metricaAtual, periodoAtual);
    }

    atualizarRankingPeriodo();

    qs("#js-ano-anterior").addEventListener("click", () => { periodoAtual = periodoAnterior(periodoAtual); atualizarRankingPeriodo(); });
    qs("#js-ano-proximo").addEventListener("click", () => { periodoAtual = periodoProximo(periodoAtual); atualizarRankingPeriodo(); });

    qsa(".segmented__item[data-metrica]").forEach((item) => {
      item.addEventListener("click", () => {
        qsa(".segmented__item[data-metrica]").forEach((i) => i.classList.remove("is-active"));
        item.classList.add("is-active");
        metricaAtual = item.dataset.metrica;
        renderizarRanking(metricaAtual, periodoAtual);
      });
    });

    configurarFiltroPeriodo(() => periodoAtual, (novoPeriodo) => {
      periodoAtual = novoPeriodo;
      atualizarRankingPeriodo();
    });
  });
}

/* ---------- Aniversariantes ---------- */

function montarLinhaAniversariante(cliente, indice, ehNovo) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body">
      <p class="list-item__title"><span class="notificacao-ancora"><span class="js-aniv-nome"></span><span class="notificacao-bolinha is-hidden"></span></span></p>
      <p class="text-primary-accent js-aniv-data" style="font-size:var(--text-sm);"></p>
      <p class="js-aniv-telefone" style="font-size:var(--text-sm);"></p>
    </div>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(cliente.nome);
  linha.querySelector(".js-aniv-nome").textContent = cliente.nome;
  if (ehNovo) linha.querySelector(".notificacao-bolinha").classList.remove("is-hidden");
  linha.querySelector(".js-aniv-data").textContent = `${cliente.aniversarioDia} de ${MESES_NOME[(cliente.aniversarioMes || 1) - 1].toLowerCase()}`;

  const tel = linha.querySelector(".js-aniv-telefone");
  if (cliente.telefone) {
    tel.className = "text-secondary js-aniv-telefone";
    tel.textContent = cliente.telefone;
  } else {
    tel.className = "text-muted js-aniv-telefone";
    tel.textContent = "Sem telefone cadastrado";
  }
  const mensagem = substituirPlaceholders(obterWhatsapp().mensagemAniversario || "", { nome: cliente.nome });
  linha.appendChild(montarBotaoWhatsapp(cliente, mensagem));
  return linha;
}

if (qs("#js-aniv-mes-label")) {
  document.addEventListener("DOMContentLoaded", () => {
    const hoje = new Date();
    let anivAno = hoje.getFullYear();
    let anivMes = hoje.getMonth();

    function renderizarAniversariantes() {
      qs("#js-aniv-mes-label").textContent = `${MESES_NOME[anivMes]} de ${anivAno}`;
      const mesNumero = anivMes + 1;
      const lista = obterClientes()
        .filter((c) => c.ativo && c.aniversarioMes === mesNumero)
        .sort((a, b) => (a.aniversarioDia || 0) - (b.aniversarioDia || 0));

      qs("#js-aniv-titulo").textContent = `Aniversariantes (${lista.length})`;

      // Calcula quem é novidade ANTES de marcar como visto — a marcação
      // abaixo zeraria o diff, e a bolinha por cliente precisa refletir
      // o estado de quando a pessoa chegou nesta tela, não depois.
      const novosSet = new Set(calcularDiffNotificaveisClientes().clientesNovosAniversariantes);

      // Só marca como visto quando o mês exibido é o mês ATUAL de
      // verdade — navegar pra outros meses não conta como "viu a
      // novidade" (a bolinha é sobre quem faz aniversário agora).
      if (anivAno === hoje.getFullYear() && anivMes === hoje.getMonth()) {
        marcarAniversariantesVistos(lista.map((c) => c.id), `${anivAno}-${mesNumero}`);
        // Atualiza a bolinha do PRÓPRIO menu desta página também, não só
        // da próxima navegação (ver comentário em js/app.js).
        if (window.menuInferiorPronto) window.menuInferiorPronto.then(atualizarBadgeClientes);
      }

      const container = qs("#js-aniv-lista");
      const vazio = qs("#js-aniv-vazio");
      container.innerHTML = "";
      if (lista.length === 0) {
        container.classList.add("is-hidden");
        vazio.classList.remove("is-hidden");
      } else {
        container.classList.remove("is-hidden");
        vazio.classList.add("is-hidden");
        lista.forEach((c, i) => container.appendChild(montarLinhaAniversariante(c, i, novosSet.has(c.id))));
      }
    }

    qs("#js-aniv-anterior").addEventListener("click", () => {
      anivMes--;
      if (anivMes < 0) { anivMes = 11; anivAno--; }
      renderizarAniversariantes();
    });
    qs("#js-aniv-proximo").addEventListener("click", () => {
      anivMes++;
      if (anivMes > 11) { anivMes = 0; anivAno++; }
      renderizarAniversariantes();
    });

    renderizarAniversariantes();
  });
}

/* ---------- Sem retornar ----------
   bucketDiasSemRetornar/ultimaVisitaInfo moram agora em
   js/notificacoes-clientes.js (carregado em toda página, não só aqui)
   — a bolinha de notificação do menu inferior precisa delas em
   qualquer tela, não só nesta. */

function montarLinhaSemRetornar(item, indice, ehNovo) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body">
      <p class="list-item__title"><span class="notificacao-ancora"><span class="js-sr-nome"></span><span class="notificacao-bolinha is-hidden"></span></span></p>
      <p class="list-item__subtitle js-sr-data"></p>
    </div>
    <p class="text-primary-accent js-sr-dias" style="font-weight:700;white-space:nowrap;"></p>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.cliente.nome);
  linha.querySelector(".js-sr-nome").textContent = item.cliente.nome;
  if (ehNovo) linha.querySelector(".notificacao-bolinha").classList.remove("is-hidden");
  linha.querySelector(".js-sr-data").textContent = item.info.data ? `última visita em ${formatarDataCurta(item.info.data)}` : "Nunca atendido";
  linha.querySelector(".js-sr-dias").textContent = item.info.dias === null ? "—" : `${item.info.dias} dias`;

  const mensagem = substituirPlaceholders(obterWhatsapp().mensagemSemRetornar || "", {
    nome: item.cliente.nome,
    dias: item.info.dias === null ? "" : String(item.info.dias),
  });
  const botao = montarBotaoWhatsapp(item.cliente, mensagem);
  botao.style.marginLeft = "8px";
  linha.appendChild(botao);
  return linha;
}

if (qs("#js-semretornar-lista")) {
  document.addEventListener("DOMContentLoaded", () => {
    // Bolinha em cada aba (20/30/45/60/90) com pelo menos 1 cliente
    // novo, independente de qual aba está aberta agora.
    function atualizarBadgesAbasSemRetornar() {
      const faixasComNovidade = calcularFaixasSemRetornarComNovidade();
      qsa("#js-semretornar-filtro .segmented__item").forEach((item) => {
        const badge = item.querySelector(".notificacao-bolinha");
        if (badge) badge.classList.toggle("is-hidden", !faixasComNovidade[item.dataset.dias]);
      });
    }

    function renderizarSemRetornar(faixaDias) {
      // Calcula quem é novidade ANTES de marcar como visto — a marcação
      // abaixo zeraria o diff, e a bolinha por cliente precisa refletir
      // o estado de quando a pessoa abriu esta aba, não depois.
      const novosSet = new Set(calcularDiffNotificaveisClientes().clientesNovosSemRetornar);

      const linhas = obterClientes()
        .filter((c) => c.ativo)
        .map((c) => ({ cliente: c, info: ultimaVisitaInfo(c.id) }))
        .filter((r) => r.info.dias !== null && bucketDiasSemRetornar(r.info.dias) === faixaDias)
        .sort((a, b) => b.info.dias - a.info.dias);

      // Marca só os clientes DESSA faixa como vistos, não a lista
      // inteira — as outras 4 faixas continuam com bolinha até a
      // pessoa realmente clicar nelas.
      marcarSemRetornarVistos(linhas.map((l) => l.cliente.id), faixaDias);
      // Atualiza a bolinha do PRÓPRIO menu desta página também, não só
      // da próxima navegação (ver comentário em js/app.js).
      if (window.menuInferiorPronto) window.menuInferiorPronto.then(atualizarBadgeClientes);
      atualizarBadgesAbasSemRetornar();

      const container = qs("#js-semretornar-lista");
      const vazio = qs("#js-semretornar-vazio");
      container.innerHTML = "";
      if (linhas.length === 0) {
        container.classList.add("is-hidden");
        vazio.classList.remove("is-hidden");
      } else {
        container.classList.remove("is-hidden");
        vazio.classList.add("is-hidden");
        linhas.forEach((item, i) => container.appendChild(montarLinhaSemRetornar(item, i, novosSet.has(item.cliente.id))));
      }
    }

    qs("#js-semretornar-filtro").addEventListener("click", (evento) => {
      const item = evento.target.closest(".segmented__item");
      if (!item) return;
      renderizarSemRetornar(parseInt(item.dataset.dias, 10));
    });

    renderizarSemRetornar(30);

    qs("#js-btn-editar-semretornar").addEventListener("click", (evento) => {
      evento.preventDefault();
      const bucketsInsight = obterConfig().semRetornarBucketsInsight || [20, 30, 45];
      qsa(".chip", qs("#js-editar-semretornar-buckets")).forEach((chip) => {
        chip.classList.toggle("chip--ativo", bucketsInsight.includes(parseInt(chip.dataset.dias, 10)));
      });
      abrirModal("modal-editar-semretornar");
    });

    qs("#js-editar-semretornar-salvar").addEventListener("click", () => {
      const bucketsInsight = qsa(".chip--ativo", qs("#js-editar-semretornar-buckets")).map((chip) => parseInt(chip.dataset.dias, 10));
      const config = obterConfig();
      config.semRetornarBucketsInsight = bucketsInsight;
      salvarConfig(config);
      fecharModal("modal-editar-semretornar");
      mostrarSucesso();
    });
  });
}
