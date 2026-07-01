/* ============================================================
   AGENDA V3 — Tela Cliente-detalhe (Fase 3)
   Lê o id do cliente pela URL (?id=...), mostra dados reais,
   permite editar e mover para a lixeira.
   ============================================================ */

const MESES_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function obterIdClienteDaUrl() {
  return new URLSearchParams(window.location.search).get("id");
}

function formatarAniversario(dia, mes) {
  if (!dia || !mes) return "Aniversário não cadastrado";
  return `${dia} de ${MESES_PT[mes - 1]}`;
}

function formatarClienteDesde(isoDate) {
  if (!isoDate) return "";
  const [ano, mes] = isoDate.split("-");
  return `Cliente desde ${MESES_PT[parseInt(mes, 10) - 1].slice(0, 3)}/${ano}`;
}

function extrairAniversarioCliente(texto) {
  const partes = (texto || "").split("/");
  if (partes.length < 2) return { dia: null, mes: null };
  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10);
  return { dia: isNaN(dia) ? null : dia, mes: isNaN(mes) ? null : mes };
}

let historicoExpandido = false;

function renderizarHistorico() {
  const id = obterIdClienteDaUrl();
  const servicos = obterServicos();
  const realizados = obterAgendamentos()
    .filter((a) => a.clienteId === id && a.status && a.status.startsWith("realizado_"))
    .sort((a, b) => (a.data + a.hora < b.data + b.hora ? 1 : -1));

  const historico = qs("#js-cliente-historico");
  const historicoVazio = qs("#js-cliente-historico-vazio");
  const toggle = qs("#js-cliente-historico-toggle");
  historico.innerHTML = "";

  if (realizados.length === 0) {
    historico.classList.add("is-hidden");
    historicoVazio.classList.remove("is-hidden");
    toggle.classList.add("is-hidden");
    return;
  }

  historico.classList.remove("is-hidden");
  historicoVazio.classList.add("is-hidden");

  (historicoExpandido ? realizados : realizados.slice(0, 5)).forEach((a) => {
    const nomesServicos = (a.servicosIds || [])
      .map((sid) => (servicos.find((s) => s.id === sid) || {}).nome)
      .filter(Boolean)
      .join(" + ");
    const linha = document.createElement("div");
    linha.className = "list-item";
    linha.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>
      <div class="list-item__body">
        <p class="list-item__title">${formatarDataCurta(a.data)} <span class="text-muted" style="font-weight:400;">${a.hora}</span></p>
        <p class="list-item__subtitle"></p>
      </div>
      <p class="text-success" style="font-weight:700;"></p>
    `;
    linha.querySelector(".list-item__subtitle").textContent = nomesServicos || "—";
    linha.querySelector(".text-success").textContent = formatarMoeda(a.valorTotal || 0);
    historico.appendChild(linha);
  });

  if (realizados.length > 5) {
    toggle.textContent = historicoExpandido ? "Ver menos" : `Ver todos (${realizados.length})`;
    toggle.classList.remove("is-hidden");
  } else {
    toggle.classList.add("is-hidden");
  }
}

function renderizarPagina() {
  const id = obterIdClienteDaUrl();
  const cliente = obterClientes().find((c) => c.id === id);
  if (!cliente) {
    window.location.href = "clientes.html";
    return;
  }

  qs("#js-cliente-avatar").textContent = iniciaisCliente(cliente.nome);
  qs("#js-cliente-nome").textContent = cliente.nome;
  qs("#js-cliente-desde").textContent = formatarClienteDesde(cliente.criadoEm);

  if (cliente.telefone) {
    qs("#js-cliente-telefone").textContent = cliente.telefone;
    qs("#js-cliente-telefone-linha").classList.remove("is-hidden");
  } else {
    qs("#js-cliente-telefone-linha").classList.add("is-hidden");
  }

  if (cliente.aniversarioDia && cliente.aniversarioMes) {
    qs("#js-cliente-aniversario").textContent = formatarAniversario(cliente.aniversarioDia, cliente.aniversarioMes);
    qs("#js-cliente-aniversario-linha").classList.remove("is-hidden");
  } else {
    qs("#js-cliente-aniversario-linha").classList.add("is-hidden");
  }

  const realizados = obterAgendamentos()
    .filter((a) => a.clienteId === cliente.id && a.status && a.status.startsWith("realizado_"))
    .sort((a, b) => (a.data + a.hora < b.data + b.hora ? 1 : -1));

  const visitas = realizados.length;
  const totalGasto = realizados.reduce((soma, a) => soma + (a.valorTotal || 0), 0);
  qs("#js-cliente-visitas").textContent = visitas;
  qs("#js-cliente-faturado").textContent = formatarMoeda(totalGasto);

  if (visitas > 0) {
    const diffMs = new Date() - new Date(`${realizados[0].data}T00:00:00`);
    const dias = Math.max(0, Math.floor(diffMs / 86400000));
    qs("#js-cliente-ultima-visita").textContent = dias === 0 ? "hoje" : `${dias} dia${dias === 1 ? "" : "s"}`;
  } else {
    qs("#js-cliente-ultima-visita").textContent = "—";
  }

  qs("#js-cliente-observacao").textContent = cliente.observacao || "Nenhuma observação registrada.";

  renderizarHistorico();

  const whatsapp = qs("#js-cliente-whatsapp");
  if (cliente.telefone) {
    const digitos = cliente.telefone.replace(/\D/g, "");
    whatsapp.href = `https://wa.me/55${digitos}`;
    whatsapp.classList.remove("is-hidden");
  } else {
    whatsapp.classList.add("is-hidden");
  }
}

function abrirEdicaoCliente() {
  const id = obterIdClienteDaUrl();
  const cliente = obterClientes().find((c) => c.id === id);
  if (!cliente) return;
  qs("#js-editar-cliente-nome").value = cliente.nome;
  qs("#js-editar-cliente-telefone").value = cliente.telefone || "";
  qs("#js-editar-cliente-aniversario").value =
    cliente.aniversarioDia && cliente.aniversarioMes
      ? `${String(cliente.aniversarioDia).padStart(2, "0")}/${String(cliente.aniversarioMes).padStart(2, "0")}`
      : "";
  qs("#js-editar-cliente-observacao").value = cliente.observacao || "";
  abrirModal("modal-editar-cliente");
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarPagina();

  qs("#js-btn-editar-cliente").addEventListener("click", abrirEdicaoCliente);

  qs("#js-editar-cliente-salvar").addEventListener("click", () => {
    const nome = qs("#js-editar-cliente-nome").value.trim();
    if (!nome) return;
    const id = obterIdClienteDaUrl();
    const lista = obterClientes();
    const cliente = lista.find((c) => c.id === id);
    if (!cliente) return;
    const { dia, mes } = extrairAniversarioCliente(qs("#js-editar-cliente-aniversario").value);
    cliente.nome = nome;
    cliente.telefone = qs("#js-editar-cliente-telefone").value.trim();
    cliente.aniversarioDia = dia;
    cliente.aniversarioMes = mes;
    cliente.observacao = qs("#js-editar-cliente-observacao").value.trim();
    cliente.atualizadoEm = hojeIso();
    salvarClientes(lista);
    fecharModal("modal-editar-cliente");
    mostrarSucesso();
    renderizarPagina();
  });

  qs("#js-cliente-historico-toggle").addEventListener("click", () => {
    historicoExpandido = !historicoExpandido;
    renderizarHistorico();
  });

  qs("#js-confirmar-mover-lixeira").addEventListener("click", () => {
    const id = obterIdClienteDaUrl();
    const lista = obterClientes();
    const indice = lista.findIndex((c) => c.id === id);
    if (indice === -1) return;
    const [cliente] = lista.splice(indice, 1);
    salvarClientes(lista);
    const lixeira = obterClientesLixeira();
    lixeira.push({ ...cliente, ativo: false, movidoParaLixeiraEm: hojeIso() });
    salvarClientesLixeira(lixeira);
    window.location.href = "clientes.html";
  });
});
