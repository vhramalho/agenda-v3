/* ============================================================
   AGENDA V3 — Tela Vendas (vendas.html): venda avulsa + histórico,
   reaproveitando prepararNovaVenda/prepararEditarVenda de
   js/vendas.js. CRUD de produto mora em js/produtos.js (produtos.html).
   ============================================================ */

function montarLinhaVenda(venda, produtos, indice) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.style.cursor = "pointer";
  const avulsa = !venda.clienteId;
  const pago = venda.status === "paga";
  const nomesItens = (venda.itens || [])
    .map((item) => (produtos.find((p) => p.id === item.produtoId) || {}).nome || item.nomeProduto)
    .filter(Boolean)
    .join(", ");
  linha.innerHTML = `
    <div class="list-item__avatar ${avulsa ? "" : classeAvatarPorIndice(indice)}"></div>
    <div class="list-item__body">
      <p class="list-item__title"></p>
      <p class="list-item__subtitle"></p>
    </div>
    <div class="list-item__trailing">
      <p style="font-weight:700;"></p>
      <span class="badge ${pago ? "badge--sucesso" : "badge--alerta"}">${pago ? "Pago" : "Pendente"}</span>
    </div>
    <svg class="list-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
  `;
  const avatar = linha.querySelector(".list-item__avatar");
  if (avulsa) {
    avatar.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>`;
  } else {
    avatar.textContent = iniciaisCliente(venda.nomeCliente);
  }
  linha.querySelector(".list-item__title").textContent = avulsa ? "Venda avulsa" : venda.nomeCliente;
  linha.querySelector(".list-item__subtitle").textContent = `${nomesItens || "—"} · ${formatarDataCurta(venda.criadaEm.slice(0, 10))}`;
  linha.querySelector(".list-item__trailing p").textContent = formatarMoeda(venda.valorTotal || 0);
  linha.addEventListener("click", () => abrirEdicaoVenda(venda));
  return linha;
}

const LIMITE_HISTORICO_VENDAS = 10;
let historicoVendasExpandido = false;
let filtroVendasAtual = "todas";

function vendasFiltradas() {
  const vendas = obterVendas().slice().sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
  if (filtroVendasAtual === "avulsas") return vendas.filter((v) => !v.agendamentoId);
  if (filtroVendasAtual === "atendimento") return vendas.filter((v) => !!v.agendamentoId);
  return vendas;
}

function renderizarHistoricoVendas() {
  const vendas = vendasFiltradas();
  const produtos = obterProdutos();
  const container = qs("#js-lista-historico-vendas");
  const vazio = qs("#js-historico-vendas-vazio");
  const toggle = qs("#js-historico-vendas-toggle");
  container.innerHTML = "";

  if (vendas.length === 0) {
    container.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    toggle.classList.add("is-hidden");
    return;
  }

  container.classList.remove("is-hidden");
  vazio.classList.add("is-hidden");
  const visiveis = historicoVendasExpandido ? vendas : vendas.slice(0, LIMITE_HISTORICO_VENDAS);
  visiveis.forEach((venda, i) => container.appendChild(montarLinhaVenda(venda, produtos, i)));

  if (vendas.length > LIMITE_HISTORICO_VENDAS) {
    toggle.classList.remove("is-hidden");
    toggle.textContent = historicoVendasExpandido ? "Ver menos" : "Ver todas";
  } else {
    toggle.classList.add("is-hidden");
  }
}

/* Editar uma venda muda produto.estoque por delta (js/vendas.js) — por isso
   sempre re-renderiza o histórico junto. */
function abrirEdicaoVenda(venda) {
  prepararEditarVenda(
    venda,
    () => {
      fecharModal("modal-nova-venda");
      renderizarHistoricoVendas();
    },
    null,
    () => {
      removerVendaAnexada(venda.id);
      fecharModal("modal-nova-venda");
      renderizarHistoricoVendas();
    }
  );
  abrirModal("modal-nova-venda");
}

function abrirNovaVendaAvulsa() {
  prepararNovaVenda({ clienteId: null, nomeCliente: null, agendamentoId: null }, () => {
    fecharModal("modal-nova-venda");
    renderizarHistoricoVendas();
  });
  abrirModal("modal-nova-venda");
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarHistoricoVendas();
  iniciarTour("vendas");

  qs("#js-historico-vendas-toggle").addEventListener("click", () => {
    historicoVendasExpandido = !historicoVendasExpandido;
    renderizarHistoricoVendas();
  });

  qsa(".segmented__item", qs("#js-filtro-vendas")).forEach((item) => {
    item.addEventListener("click", () => {
      qsa(".segmented__item", qs("#js-filtro-vendas")).forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
      filtroVendasAtual = item.dataset.filtro;
      historicoVendasExpandido = false;
      renderizarHistoricoVendas();
    });
  });
});
