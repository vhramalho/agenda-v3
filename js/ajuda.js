/* ============================================================
   AGENDA V3 — Sistema de ajuda contextual
   Funções genéricas chamadas por qualquer tela informando só o seu
   identificador (ex. "agenda"). Nenhuma tela deve ter lógica própria
   de ajuda. Reaproveita o modal genérico (js/modal.js) e o toast
   (mostrarAviso, em js/utils.js) — nenhum sistema novo de UI.
   ============================================================ */

function montarChecklistAjuda(lista, progresso) {
  return lista.map((item) => {
    const feito = !!progresso[item.chave];
    const icone = feito
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
    return `<div class="list-item">
      <div class="icon-circle ${feito ? "icon-circle--green" : "icon-circle--gray"}">${icone}</div>
      <div class="list-item__body"><p class="list-item__title" style="${feito ? "text-decoration:line-through;color:var(--text-muted);" : ""}">${item.texto}</p></div>
    </div>`;
  }).join("");
}

function abrirIntroducao(tela) {
  const dados = AJUDA_DADOS[tela];
  if (!dados || !dados.introducao) return;
  const estado = obterAjuda();
  if (estado[tela].introVista) return;

  qs("#js-ajuda-titulo").textContent = dados.introducao.titulo;
  qs("#js-ajuda-corpo").innerHTML = `<p class="text-secondary">${dados.introducao.corpo}</p>`;
  abrirModal("modal-ajuda");

  estado[tela].introVista = true;
  salvarAjuda(estado);
}

function abrirAjuda(tela) {
  const dados = AJUDA_DADOS[tela];
  if (!dados) return;
  const estado = obterAjuda();

  let html = dados.secoes.map((secao) =>
    `<div style="margin-bottom:16px;"><p style="font-weight:700;margin-bottom:4px;">${secao.titulo}</p><p class="text-secondary">${secao.corpo}</p></div>`
  ).join("");

  if (dados.checklist.length) {
    html += `<p class="field__label" style="margin:8px 0;">Seu progresso</p>${montarChecklistAjuda(dados.checklist, estado[tela].checklist)}`;
  }

  qs("#js-ajuda-titulo").textContent = "Ajuda";
  qs("#js-ajuda-corpo").innerHTML = html;
  abrirModal("modal-ajuda");
}

function mostrarDica(tela, chave, elementoAncora) {
  const dados = AJUDA_DADOS[tela];
  if (!dados || !dados.dicas || !dados.dicas[chave] || !elementoAncora) return;
  const estado = obterAjuda();
  if (estado[tela].dicasVistas.includes(chave)) return;

  const rect = elementoAncora.getBoundingClientRect();
  const tooltip = document.createElement("div");
  tooltip.className = "ajuda-tooltip";
  tooltip.textContent = dados.dicas[chave];
  document.body.appendChild(tooltip);

  const largura = tooltip.getBoundingClientRect().width;
  const esquerda = Math.max(12, Math.min(rect.left + rect.width / 2 - largura / 2, window.innerWidth - largura - 12));
  tooltip.style.left = `${esquerda}px`;
  tooltip.style.top = `${rect.bottom + 8}px`;

  const remover = () => {
    tooltip.remove();
    document.removeEventListener("click", fecharAoTocarFora);
  };
  const fecharAoTocarFora = (evento) => {
    if (!tooltip.contains(evento.target)) remover();
  };
  setTimeout(() => document.addEventListener("click", fecharAoTocarFora), 50);
  setTimeout(remover, 5000);

  estado[tela].dicasVistas.push(chave);
  salvarAjuda(estado);
}

function concluirItem(tela, chave) {
  const estado = obterAjuda();
  if (estado[tela].checklist[chave]) return;
  estado[tela].checklist[chave] = true;
  salvarAjuda(estado);
}

function progressoChecklist(tela) {
  const dados = AJUDA_DADOS[tela];
  if (!dados || !dados.checklist.length) return { feitos: 0, total: 0 };
  const estado = obterAjuda();
  const feitos = dados.checklist.filter((item) => estado[tela].checklist[item.chave]).length;
  return { feitos, total: dados.checklist.length };
}
