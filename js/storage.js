/* ============================================================
   AGENDA V3 — Acesso centralizado ao localStorage (Fase 3)
   Todas as 9 chaves do app passam por aqui. Nenhuma outra tela
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
