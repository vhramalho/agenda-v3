/* ============================================================
   AGENDA V3 — Ranking, Aniversariantes e Sem retornar (Fase 3,
   Etapa 9). Atende as 3 telas — cada bloco só roda se os
   elementos daquela tela existirem no documento.
   ============================================================ */

function isoDeDateLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diasAtras(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/* ---------- Ranking ---------- */

function estatisticasRanking(clienteId) {
  const limiteIso = isoDeDateLocal(diasAtras(365));
  const realizados = obterAgendamentos().filter(
    (a) => a.clienteId === clienteId && a.status && a.status.startsWith("realizado_") && a.data >= limiteIso
  );
  const visitas = realizados.length;
  const totalGasto = realizados.reduce((s, a) => s + (a.valorTotal || 0), 0);
  const ticket = visitas > 0 ? totalGasto / visitas : 0;
  return { visitas, totalGasto, ticket };
}

function valorPorMetrica(stats, metrica) {
  if (metrica === "visitas") return stats.visitas;
  if (metrica === "ticket") return stats.ticket;
  return stats.totalGasto;
}

function formatarValorMetrica(valor, metrica) {
  return metrica === "visitas" ? String(valor) : formatarMoeda(valor);
}

function montarPodioCard(item, indice, posicaoVisual) {
  const medalhas = ["🥈", "🥇", "🥉"];
  const card = document.createElement("div");
  card.className = "podio-card" + (posicaoVisual === 1 ? " podio-card--ouro" : "");
  const tamanho = posicaoVisual === 1 ? "width:56px;height:56px;font-size:var(--text-md);" : "";
  card.innerHTML = `
    <p class="podio-card__medalha">${medalhas[posicaoVisual]}</p>
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}" style="margin:0 auto;${tamanho}"></div>
    <p class="podio-card__nome"></p>
    <p class="podio-card__valor"></p>
    <p class="podio-card__visitas"></p>
  `;
  card.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.cliente.nome);
  card.querySelector(".podio-card__nome").textContent = item.cliente.nome;
  card.querySelector(".podio-card__valor").textContent = formatarMoeda(item.stats.totalGasto);
  card.querySelector(".podio-card__visitas").textContent = `${item.stats.visitas} visita${item.stats.visitas === 1 ? "" : "s"}`;
  return card;
}

function montarLinhaRanking(item, indice, posicao, metrica) {
  const linha = document.createElement("a");
  linha.href = `cliente-detalhe.html?id=${item.cliente.id}`;
  linha.className = "list-item";
  linha.style.textDecoration = "none";
  linha.style.color = "inherit";
  linha.innerHTML = `
    <span style="width:24px;color:var(--text-secondary);font-weight:700;">${posicao}º</span>
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body"><p class="list-item__title"></p></div>
    <span class="text-primary-accent" style="font-weight:700;width:88px;"></span>
    <span class="text-secondary" style="width:30px;text-align:right;"></span>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.cliente.nome);
  linha.querySelector(".list-item__title").textContent = item.cliente.nome;
  linha.querySelector(".text-primary-accent").textContent = formatarValorMetrica(valorPorMetrica(item.stats, metrica), metrica);
  linha.querySelector(".text-secondary").textContent = metrica === "visitas" ? formatarMoeda(item.stats.totalGasto) : item.stats.visitas;
  return linha;
}

function renderizarRanking(metrica) {
  const rotulos = { faturamento: "Faturamento", visitas: "Visitas", ticket: "Ticket médio" };
  qs("#js-ranking-coluna").textContent = `${rotulos[metrica]} ▾`;
  qs("#js-ranking-coluna-secundaria").textContent = metrica === "visitas" ? "Faturamento" : "Visitas";

  const linhas = obterClientes()
    .filter((c) => c.ativo)
    .map((c) => ({ cliente: c, stats: estatisticasRanking(c.id) }))
    .filter((r) => r.stats.visitas > 0)
    .sort((a, b) => valorPorMetrica(b.stats, metrica) - valorPorMetrica(a.stats, metrica));

  const podio = qs("#js-ranking-podio");
  const tabela = qs("#js-ranking-tabela");
  const vazio = qs("#js-ranking-vazio");
  podio.innerHTML = "";
  tabela.innerHTML = "";

  if (linhas.length === 0) {
    podio.classList.add("is-hidden");
    tabela.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    return;
  }
  podio.classList.remove("is-hidden");
  tabela.classList.remove("is-hidden");
  vazio.classList.add("is-hidden");

  const top3 = linhas.slice(0, 3);
  [top3[1], top3[0], top3[2]].forEach((item, posicaoVisual) => {
    if (!item) return;
    const indiceOriginal = top3.indexOf(item);
    podio.appendChild(montarPodioCard(item, indiceOriginal, posicaoVisual));
  });

  linhas.slice(3).forEach((item, i) => tabela.appendChild(montarLinhaRanking(item, i + 3, i + 4, metrica)));
}

if (qs("#js-ranking-podio")) {
  document.addEventListener("DOMContentLoaded", () => {
    renderizarRanking("faturamento");
    qsa(".segmented__item[data-metrica]").forEach((item) => {
      item.addEventListener("click", () => {
        qsa(".segmented__item").forEach((i) => i.classList.remove("is-active"));
        item.classList.add("is-active");
        renderizarRanking(item.dataset.metrica);
      });
    });
  });
}

/* ---------- Aniversariantes ---------- */

function montarLinhaAniversariante(cliente, indice) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="text-primary-accent js-aniv-data" style="font-size:var(--text-sm);"></p>
      <p class="js-aniv-telefone" style="font-size:var(--text-sm);"></p>
    </div>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(cliente.nome);
  linha.querySelector(".list-item__title").textContent = cliente.nome;
  linha.querySelector(".js-aniv-data").textContent = `📅 ${cliente.aniversarioDia} de ${MESES_NOME[(cliente.aniversarioMes || 1) - 1].toLowerCase()}`;

  if (cliente.telefone) {
    const tel = linha.querySelector(".js-aniv-telefone");
    tel.className = "text-secondary js-aniv-telefone";
    tel.textContent = `📞 ${cliente.telefone}`;
    const botao = document.createElement("a");
    botao.className = "icon-btn icon-btn--accent";
    botao.setAttribute("aria-label", "WhatsApp");
    botao.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
    const mensagem = obterWhatsapp().mensagemAniversario || "";
    const digitos = cliente.telefone.replace(/\D/g, "");
    botao.href = `https://wa.me/55${digitos}?text=${encodeURIComponent(mensagem)}`;
    botao.target = "_blank";
    botao.rel = "noopener";
    linha.appendChild(botao);
  } else {
    const tel = linha.querySelector(".js-aniv-telefone");
    tel.className = "text-muted js-aniv-telefone";
    tel.textContent = "Sem telefone cadastrado";
    const desabilitado = document.createElement("span");
    desabilitado.className = "icon-btn";
    desabilitado.style.background = "var(--card-elevated)";
    desabilitado.style.color = "var(--text-muted)";
    desabilitado.setAttribute("aria-hidden", "true");
    desabilitado.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14"/></svg>';
    linha.appendChild(desabilitado);
  }
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

      qs("#js-aniv-contagem-numero").textContent = lista.length;
      qs("#js-aniv-contagem-mes").textContent = `em ${MESES_NOME[anivMes].toLowerCase()}`;
      qs("#js-aniv-titulo").textContent = `Aniversariantes (${lista.length})`;

      const container = qs("#js-aniv-lista");
      const vazio = qs("#js-aniv-vazio");
      container.innerHTML = "";
      if (lista.length === 0) {
        container.classList.add("is-hidden");
        vazio.classList.remove("is-hidden");
      } else {
        container.classList.remove("is-hidden");
        vazio.classList.add("is-hidden");
        lista.forEach((c, i) => container.appendChild(montarLinhaAniversariante(c, i)));
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

/* ---------- Sem retornar ---------- */

function ultimaVisitaInfo(clienteId) {
  const realizados = obterAgendamentos().filter((a) => a.clienteId === clienteId && a.status && a.status.startsWith("realizado_"));
  if (realizados.length === 0) return { dias: null, data: null };
  const maisRecente = realizados.reduce((max, a) => (a.data > max ? a.data : max), realizados[0].data);
  const dias = Math.max(0, Math.floor((new Date() - new Date(`${maisRecente}T00:00:00`)) / 86400000));
  return { dias, data: maisRecente };
}

function montarLinhaSemRetornar(item, indice) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.innerHTML = `
    <div class="list-item__avatar ${classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle js-sr-data"></p>
    </div>
    <p class="text-primary-accent js-sr-dias" style="font-weight:700;white-space:nowrap;"></p>
  `;
  linha.querySelector(".list-item__avatar").textContent = iniciaisCliente(item.cliente.nome);
  linha.querySelector(".list-item__title").textContent = item.cliente.nome;
  linha.querySelector(".js-sr-data").textContent = item.info.data ? `📅 ${formatarDataCurta(item.info.data)} · última visita` : "Nunca atendido";
  linha.querySelector(".js-sr-dias").textContent = item.info.dias === null ? "—" : `${item.info.dias} dias`;

  if (item.cliente.telefone) {
    const botao = document.createElement("a");
    botao.className = "icon-btn icon-btn--accent";
    botao.style.marginLeft = "8px";
    botao.setAttribute("aria-label", "WhatsApp");
    botao.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
    botao.href = `https://wa.me/55${item.cliente.telefone.replace(/\D/g, "")}`;
    botao.target = "_blank";
    botao.rel = "noopener";
    linha.appendChild(botao);
  } else {
    const desabilitado = document.createElement("span");
    desabilitado.className = "icon-btn";
    desabilitado.style.marginLeft = "8px";
    desabilitado.style.background = "var(--card-elevated)";
    desabilitado.style.color = "var(--text-muted)";
    desabilitado.setAttribute("aria-hidden", "true");
    desabilitado.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14"/></svg>';
    linha.appendChild(desabilitado);
  }
  return linha;
}

if (qs("#js-semretornar-lista")) {
  document.addEventListener("DOMContentLoaded", () => {
    function renderizarSemRetornar(limiteDias) {
      const linhas = obterClientes()
        .filter((c) => c.ativo)
        .map((c) => ({ cliente: c, info: ultimaVisitaInfo(c.id) }))
        .filter((r) => r.info.dias === null || r.info.dias >= limiteDias)
        .sort((a, b) => (b.info.dias === null ? Infinity : b.info.dias) - (a.info.dias === null ? Infinity : a.info.dias));

      qs("#js-semretornar-contagem").textContent = linhas.length;

      const container = qs("#js-semretornar-lista");
      const vazio = qs("#js-semretornar-vazio");
      container.innerHTML = "";
      if (linhas.length === 0) {
        container.classList.add("is-hidden");
        vazio.classList.remove("is-hidden");
      } else {
        container.classList.remove("is-hidden");
        vazio.classList.add("is-hidden");
        linhas.forEach((item, i) => container.appendChild(montarLinhaSemRetornar(item, i)));
      }
    }

    qs("#js-semretornar-filtro").addEventListener("click", (evento) => {
      const chip = evento.target.closest(".chip");
      if (!chip) return;
      renderizarSemRetornar(parseInt(chip.dataset.dias, 10));
    });

    renderizarSemRetornar(30);
  });
}
