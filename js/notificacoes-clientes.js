/* ============================================================
   AGENDA V3 — Notificações de Clientes (Sem retornar / Aniversariantes)
   Bolinha de novidade (padrão Instagram) no ícone "Clientes" do menu
   inferior + nos cards "Sem retornar"/"Aniversariantes" de
   clientes.html. Carregado em TODA página (mesmo padrão de
   storage.js/menu.js) porque o ícone do menu precisa saber se há
   novidade em qualquer tela, não só em clientes.html.

   Modelo: guarda, por cliente, a última faixa de "sem retornar"
   (20/30/45/60/90 — conjunto completo de sem-retornar.html, não o
   subconjunto configurável que só afeta a contagem do card) ou o
   último "ano-mês" de aniversário que a pessoa JÁ VIU de verdade
   (abrindo a lista cheia, não só passando pela página Clientes). Um
   cliente conta como "novidade" quando a faixa/mês atual é mais
   recente que a última vista — assim, se o cliente avança de 20 pra
   30 dias, ou o mês vira e ele volta a fazer aniversário, a bolinha
   acende de novo (2026-08-21).
   ============================================================ */

function bucketDiasSemRetornar(dias) {
  if (dias >= 90) return 90;
  if (dias >= 60) return 60;
  if (dias >= 45) return 45;
  if (dias >= 30) return 30;
  if (dias >= 20) return 20;
  return null;
}

/* Um único passo sobre todos os agendamentos, não um filter+reduce por
   cliente — a checagem da bolinha roda em TODA navegação do app (via
   js/app.js), então precisa ser barata mesmo com muitos clientes. */
function mapaUltimaVisitaPorCliente() {
  const mapa = {};
  obterAgendamentos().forEach((a) => {
    if (!a.clienteId || !a.status || !a.status.startsWith("realizado_")) return;
    if (!mapa[a.clienteId] || a.data > mapa[a.clienteId]) mapa[a.clienteId] = a.data;
  });
  return mapa;
}

function ultimaVisitaInfo(clienteId) {
  const data = mapaUltimaVisitaPorCliente()[clienteId] || null;
  if (!data) return { dias: null, data: null };
  const dias = Math.max(0, Math.floor((new Date() - new Date(`${data}T00:00:00`)) / 86400000));
  return { dias, data };
}

function calcularEstadoNotificaveisClientes() {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const chaveMesAtual = `${hoje.getFullYear()}-${mesAtual}`;
  const mapaVisitas = mapaUltimaVisitaPorCliente();

  const semRetornar = {};
  const aniversariantes = {};
  obterClientes().filter((c) => c.ativo).forEach((c) => {
    const dataVisita = mapaVisitas[c.id];
    if (dataVisita) {
      const dias = Math.max(0, Math.floor((hoje - new Date(`${dataVisita}T00:00:00`)) / 86400000));
      const bucket = bucketDiasSemRetornar(dias);
      if (bucket) semRetornar[c.id] = bucket;
    }
    if (c.aniversarioMes === mesAtual) aniversariantes[c.id] = chaveMesAtual;
  });
  return { semRetornar, aniversariantes };
}

function obterNotificacoesClientes() {
  return lerChave(CHAVES.notificacoesClientes, null);
}

function salvarNotificacoesClientes(dados) {
  salvarChave(CHAVES.notificacoesClientes, dados);
}

/* Primeira execução (chave nunca criada): grava o estado ATUAL como já
   visto, sem acender bolinha nenhuma — senão, no dia em que essa
   feature entra no ar, todo cliente que já estava parado ou já fazia
   aniversário este mês viraria "novidade" de uma vez, ruído sobre
   dado antigo em vez de uma notificação de verdade. */
function garantirNotificacoesClientes() {
  if (obterNotificacoesClientes() !== null) return;
  salvarNotificacoesClientes(calcularEstadoNotificaveisClientes());
}

/* Base de tudo que precisa saber "quem é novidade agora, antes de
   marcar como visto" — usada tanto pro resumo (bolinha do menu/cards)
   quanto pro detalhe (bolinha por faixa/por cliente em
   sem-retornar.html/aniversariantes.html). Sempre chamar ANTES de
   marcarSemRetornarVistos/marcarAniversariantesVistos — depois de
   marcar, o diff fica vazio (é exatamente o objetivo da marcação). */
function calcularDiffNotificaveisClientes() {
  garantirNotificacoesClientes();
  const vistos = obterNotificacoesClientes();
  const estadoAtual = calcularEstadoNotificaveisClientes();
  const clientesNovosSemRetornar = Object.entries(estadoAtual.semRetornar)
    .filter(([id, bucket]) => (vistos.semRetornar[id] || 0) < bucket)
    .map(([id]) => id);
  const clientesNovosAniversariantes = Object.entries(estadoAtual.aniversariantes)
    .filter(([id, chave]) => vistos.aniversariantes[id] !== chave)
    .map(([id]) => id);
  return { clientesNovosSemRetornar, clientesNovosAniversariantes, estadoAtual };
}

/* Usado pelo ícone "Clientes" do menu inferior (toda página) e pelos 2
   cards de clientes.html: existe algo que o estado atual tem e o mapa
   de "visto" ainda não reflete? */
function calcularNotificacoesClientesPendentes() {
  const diff = calcularDiffNotificaveisClientes();
  return {
    semRetornar: diff.clientesNovosSemRetornar.length > 0,
    aniversariantes: diff.clientesNovosAniversariantes.length > 0,
  };
}

/* Usado pelas 5 abas (20/30/45/60/90) de sem-retornar.html: em quais
   faixas existe pelo menos um cliente novo, independente de qual aba
   está aberta agora? Chamar ANTES de marcarSemRetornarVistos. */
function calcularFaixasSemRetornarComNovidade() {
  const diff = calcularDiffNotificaveisClientes();
  const faixas = {};
  diff.clientesNovosSemRetornar.forEach((id) => {
    faixas[diff.estadoAtual.semRetornar[id]] = true;
  });
  return faixas;
}

/* Chamado por sem-retornar.html toda vez que uma faixa é exibida (no
   load, ou ao trocar de aba) — marca só os clientes DESSA faixa como
   vistos, não a lista inteira, pra bolinha só sumir das faixas que a
   pessoa realmente abriu. */
function marcarSemRetornarVistos(clienteIds, bucket) {
  const dados = obterNotificacoesClientes() || { semRetornar: {}, aniversariantes: {} };
  clienteIds.forEach((id) => { dados.semRetornar[id] = bucket; });
  salvarNotificacoesClientes(dados);
}

/* Chamado por aniversariantes.html toda vez que o mês ATUAL é exibido
   (navegar pra outros meses não marca nada como visto). */
function marcarAniversariantesVistos(clienteIds, chaveAnoMes) {
  const dados = obterNotificacoesClientes() || { semRetornar: {}, aniversariantes: {} };
  clienteIds.forEach((id) => { dados.aniversariantes[id] = chaveAnoMes; });
  salvarNotificacoesClientes(dados);
}
