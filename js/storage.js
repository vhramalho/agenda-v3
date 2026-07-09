/* ============================================================
   AGENDA V3 — Acesso centralizado ao localStorage (Fase 3)
   Todas as 15 chaves do app passam por aqui. Nenhuma outra tela
   ou script deve chamar localStorage.getItem/setItem direto —
   sempre por uma das funções abaixo, pra manter os dados
   consistentes e fáceis de mudar no futuro (ex.: trocar pra um
   backend de verdade na Fase 5).
   ============================================================ */

const CHAVES = {
  config: "agendaV3:config",
  clientes: "agendaV3:clientes",
  clientesLixeira: "agendaV3:clientesLixeira",
  servicos: "agendaV3:servicos",
  formasPagamento: "agendaV3:formasPagamento",
  agendamentos: "agendaV3:agendamentos",
  bloqueiosFixos: "agendaV3:bloqueiosFixos",
  whatsapp: "agendaV3:whatsapp",
  onboarding: "agendaV3:onboarding",
  extensoesGrade: "agendaV3:extensoesGrade",
  notasDiarias: "agendaV3:notasDiarias",
  tarefasDiarias: "agendaV3:tarefasDiarias",
  listasDiarias: "agendaV3:listasDiarias",
  produtos: "agendaV3:produtos",
  vendas: "agendaV3:vendas",
};

function gerarId(prefixo) {
  return `${prefixo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function lerChave(chave, valorPadrao) {
  try {
    const bruto = localStorage.getItem(chave);
    if (bruto === null) return valorPadrao;
    return JSON.parse(bruto);
  } catch (erro) {
    console.warn(`Falha ao ler ${chave} do localStorage:`, erro);
    return valorPadrao;
  }
}

function salvarChave(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

/* ---------- Atalhos nomeados por entidade ---------- */

function obterConfig() {
  return lerChave(CHAVES.config, {});
}
function salvarConfig(config) {
  salvarChave(CHAVES.config, config);
}

function obterClientes() {
  return lerChave(CHAVES.clientes, []);
}
function salvarClientes(lista) {
  salvarChave(CHAVES.clientes, lista);
}

function obterClientesLixeira() {
  return lerChave(CHAVES.clientesLixeira, []);
}
function salvarClientesLixeira(lista) {
  salvarChave(CHAVES.clientesLixeira, lista);
}

function obterServicos() {
  return lerChave(CHAVES.servicos, []);
}
function salvarServicos(lista) {
  salvarChave(CHAVES.servicos, lista);
}

function obterFormasPagamento() {
  return lerChave(CHAVES.formasPagamento, []);
}
function salvarFormasPagamento(lista) {
  salvarChave(CHAVES.formasPagamento, lista);
}

function obterAgendamentos() {
  return lerChave(CHAVES.agendamentos, []);
}
function salvarAgendamentos(lista) {
  salvarChave(CHAVES.agendamentos, lista);
}

function obterBloqueiosFixos() {
  return lerChave(CHAVES.bloqueiosFixos, []);
}
function salvarBloqueiosFixos(lista) {
  salvarChave(CHAVES.bloqueiosFixos, lista);
}

function obterWhatsapp() {
  return lerChave(CHAVES.whatsapp, {});
}
function salvarWhatsapp(config) {
  salvarChave(CHAVES.whatsapp, config);
}

function obterOnboarding() {
  return lerChave(CHAVES.onboarding, { concluido: false });
}
function salvarOnboarding(estado) {
  salvarChave(CHAVES.onboarding, estado);
}

/* Extensão pontual da grade de horários por dia — "+ Adicionar mais 1 hora"
   na Agenda (ver js/agenda.js). Mapa { [dataIso]: { antes: minutos, depois: minutos } },
   somado ao horaInicio/horaFim globais só na hora de montar a grade daquele
   dia específico — nunca altera agendaV3:config. */
function obterExtensoesGrade() {
  return lerChave(CHAVES.extensoesGrade, {});
}
function salvarExtensoesGrade(mapa) {
  salvarChave(CHAVES.extensoesGrade, mapa);
}

/* Agenda diário — Anotação/Tarefa/Lista por dia (ver Documentacao/MASTER_CONTEXT.md
   §24, "Em discussão 2026-07-06"). Toda leitura/gravação e a UI moram em
   js/agenda-diario.js — este arquivo só guarda o acesso ao localStorage.
   Formatos: notasDiarias { id, dataIso, texto } (no máx. 1 por dataIso);
   tarefasDiarias { id, dataIso, texto, feito }; listasDiarias { id, dataIso,
   nome, itens: [{ id, texto, feito }] }. */
function obterNotasDiarias() {
  return lerChave(CHAVES.notasDiarias, []);
}
function salvarNotasDiarias(lista) {
  salvarChave(CHAVES.notasDiarias, lista);
}

function obterTarefasDiarias() {
  return lerChave(CHAVES.tarefasDiarias, []);
}
function salvarTarefasDiarias(lista) {
  salvarChave(CHAVES.tarefasDiarias, lista);
}

function obterListasDiarias() {
  return lerChave(CHAVES.listasDiarias, []);
}
function salvarListasDiarias(lista) {
  salvarChave(CHAVES.listasDiarias, lista);
}

/* Vendas (produto + venda) — ver Documentacao/MASTER_CONTEXT.md.
   produto: { id, nome, precoVenda, precoCusto (null se não informado),
   estoque (number, sempre existe, editado à mão), diasParaAvisarParado
   (null = não avisar; senão 15/30/60/90 — prazo sem venda pra entrar no
   bloco "Parados" do Relatório), ativo, criadoEm, atualizadoEm }.
   Exclusão lógica (ativo:false), igual servico.
   venda: { id, clienteId (null se avulsa), nomeCliente (null ou "Avulso"),
   agendamentoId (null se avulsa), itens: [{ produtoId, nomeProduto,
   quantidade, precoUnitario }], subtotal (soma dos itens, sem desconto),
   desconto (subtotal - valorTotal, só quando positivo), gorjeta
   (valorTotal - subtotal, só quando positivo — nunca os dois ao mesmo
   tempo), valorTotal, status ("paga"|"pendente"), pagamentos (só quando
   paga, mesmo formato de agendamento.pagamentos), valorPendente (só
   quando pendente), excluidoDoRanking (opcional, mesmo padrão de
   agendamento.excluidoDoRanking — marca uma ocorrência pendente como "não
   conta" no ranking de devedores de vendas), criadaEm }.
   Pagamento da venda é sempre independente do pagamento do agendamento
   vinculado. Desconto/gorjeta são sempre derivados (nunca campos
   digitados à parte): pagou menos que o subtotal = desconto; pagou
   mais = gorjeta.
   Mesma mecânica de desconto/gorjeta existe em agendamento (ver
   js/agenda.js valorEsperadoServicos/aplicarDescontoGorjeta): a soma do
   valorOpcional dos serviços selecionados faz o papel do "subtotal" —
   sem nenhum serviço com valorOpcional preenchido, não há base de
   comparação e nem desconto nem gorjeta são gravados. */
function obterProdutos() {
  return lerChave(CHAVES.produtos, []);
}
function salvarProdutos(lista) {
  salvarChave(CHAVES.produtos, lista);
}

function obterVendas() {
  return lerChave(CHAVES.vendas, []);
}
function salvarVendas(lista) {
  salvarChave(CHAVES.vendas, lista);
}

/* ============================================================
   Valores padrão (seed) — só de configuração/mensagens, nunca
   registros fictícios (cliente/serviço/agendamento). Aplicados
   uma vez, na conclusão do Onboarding (js/onboarding.js), como
   valores de fábrica pros campos que o próprio Onboarding não
   perguntou — nunca sobrescrevem o que o usuário já definiu.
   ============================================================ */

function seedConfig() {
  return {
    tema: "escuro",
    corPrincipal: "roxo",
    horaInicio: "08:00",
    horaFim: "20:30",
    intervaloGrade: 30,
    tempoPadraoAtendimento: 60,
    assinaturaStatus: "gratuito",
    semRetornarBucketsInsight: [20, 30, 45],
  };
}

function seedWhatsapp() {
  return {
    numero: "(32) 99999-9999",
    mensagemHorarios: "{saudacao}! Tenho estes horários disponíveis para você:",
    mensagemLembrete: "{saudacao}, {nome}! Passando para lembrar do seu horário agendado para {dia} às {hora}, em {endereco}.",
    mensagemAniversario: "{saudacao}, {nome}! Feliz aniversário! Que seu dia seja incrível e cheio de conquistas!",
    mensagemEndereco: "{saudacao}, {nome}! Nosso endereço é: {endereco}. Veja no mapa: {mapa}",
  };
}

function seedFormasPagamento() {
  return [
    { id: gerarId("pgto"), nome: "Pix", tipo: "pix", taxaPercentual: null, ativo: true },
    { id: gerarId("pgto"), nome: "Dinheiro", tipo: "dinheiro", taxaPercentual: null, ativo: true },
    { id: gerarId("pgto"), nome: "Crédito", tipo: "credito", taxaPercentual: null, ativo: true },
    { id: gerarId("pgto"), nome: "Débito", tipo: "debito", taxaPercentual: null, ativo: true },
    { id: gerarId("pgto"), nome: "Outras", tipo: "outras", taxaPercentual: null, ativo: true },
  ];
}

function garantirFormasPagamentoPadrao() {
  if (obterFormasPagamento().length === 0) salvarFormasPagamento(seedFormasPagamento());
}
