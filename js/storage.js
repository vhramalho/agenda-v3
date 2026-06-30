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
   Dados fictícios iniciais (seed)
   Só gravam se a chave ainda não existir — nunca sobrescreve
   dados reais que o usuário já tenha criado. "Hoje" fictício
   usado nos exemplos é 2026-07-03 (a mesma data já usada nas
   telas estáticas da Agenda).
   ============================================================ */

function seedClientes() {
  const base = [
    ["Ivan Souza", "(32) 99999-9999", 15, 8, "2026-01-10"],
    ["Breno Ronzani", "(32) 99888-1111", 3, 3, "2025-11-02"],
    ["João Silva", "(32) 99777-2222", 12, 11, "2025-09-20"],
    ["Pedro Costa", "(32) 99666-3333", 25, 9, "2025-08-05"],
    ["Marcos Lima", "(32) 99555-4444", 19, 2, "2026-03-01"],
    ["Maria Lima", "(32) 98888-7777", 22, 7, "2026-02-14"],
    ["João Pedro", "", 30, 7, "2026-04-22"],
    ["Rafael Lima", "(32) 99444-5555", 8, 4, "2025-07-19"],
    ["Bruno Souza", "(32) 99333-6666", 14, 6, "2025-10-10"],
    ["Lucas Alves", "(32) 99222-7777", 5, 12, "2026-01-30"],
    ["Tiago Martins", "(32) 99111-8888", 27, 10, "2025-12-12"],
    ["Ana Paula", "(32) 99000-9999", 2, 1, "2026-05-02"],
    ["Marcos Silva", "(32) 98999-0000", 17, 5, "2026-06-01"],
    ["Rafael Silva", "(32) 98777-1234", 9, 9, "2025-06-18"],
    ["Felipe Santos", "(32) 98666-2345", 11, 10, "2025-05-25"],
    ["Juliana Carvalho", "(32) 98555-3456", 30, 1, "2025-04-14"],
    ["André Ferraz", "(32) 98444-4567", 6, 6, "2025-09-09"],
    ["Gabriel Rocha", "(32) 98333-5678", 21, 3, "2025-08-21"],
  ];
  return base.map(([nome, telefone, aniversarioDia, aniversarioMes, criadoEm]) => ({
    id: gerarId("cli"),
    nome,
    telefone,
    aniversarioDia,
    aniversarioMes,
    aniversarioAno: null,
    observacao: "",
    criadoEm,
    atualizadoEm: criadoEm,
    ativo: true,
  }));
}

function seedServicos() {
  const base = [
    ["Corte", 50],
    ["Barba", 40],
    ["Corte + Barba", 80],
    ["Sobrancelha", 25],
    ["Pigmentação", 120],
    ["Hidratação", 60],
    ["Luzes", 150],
  ];
  return base.map(([nome, valorOpcional]) => ({
    id: gerarId("srv"),
    nome,
    valorOpcional,
    ativo: true,
    criadoEm: "2026-01-01",
    atualizadoEm: "2026-01-01",
  }));
}

function seedFormasPagamento() {
  const base = [
    ["PIX", "pix", null],
    ["Dinheiro", "dinheiro", null],
    ["Cartão de crédito", "credito", 2.99],
    ["Cartão de débito", "debito", 1.49],
    ["Outras formas", "outras", null],
  ];
  return base.map(([nome, tipo, taxaPercentual]) => ({
    id: gerarId("pgto"),
    nome,
    tipo,
    taxaPercentual,
    ativo: true,
  }));
}

function seedBloqueiosFixos() {
  function horariosEntre(inicio, fim) {
    const lista = [];
    let [h, m] = inicio.split(":").map(Number);
    const [hf, mf] = fim.split(":").map(Number);
    while (h < hf || (h === hf && m < mf)) {
      lista.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += 30;
      if (m >= 60) { m = 0; h++; }
    }
    return lista;
  }
  return [
    { id: gerarId("blq"), nome: "Almoço", diasSemana: ["seg", "ter", "qua", "qui", "sex"], horariosBloqueados: horariosEntre("12:00", "13:00"), ativo: true },
    { id: gerarId("blq"), nome: "Café da tarde", diasSemana: ["seg", "ter", "qua", "qui", "sex"], horariosBloqueados: horariosEntre("17:00", "17:30"), ativo: true },
    { id: gerarId("blq"), nome: "Folga semanal", diasSemana: ["sab"], horariosBloqueados: horariosEntre("13:00", "20:00"), ativo: true },
    { id: gerarId("blq"), nome: "Domingo", diasSemana: ["dom"], horariosBloqueados: horariosEntre("08:00", "20:30"), ativo: true },
  ];
}

function seedAgendamentos(clientes, servicos, formasPagamento) {
  const idServico = (nome) => (servicos.find((s) => s.nome === nome) || {}).id;
  const idCliente = (nome) => (clientes.find((c) => c.nome === nome) || {}).id;
  const idForma = (nome) => (formasPagamento.find((f) => f.nome === nome) || {}).id;

  function ag(data, hora, nomeCliente, nomesServicos, status, extra) {
    return {
      id: gerarId("agd"),
      data,
      hora,
      clienteId: idCliente(nomeCliente) || null,
      nomeCliente,
      servicosIds: nomesServicos.map(idServico).filter(Boolean),
      observacao: "",
      status,
      ...extra,
    };
  }

  function pago(valor, nomeForma) {
    return [{ formaPagamentoId: idForma(nomeForma) || null, valor }];
  }

  const lista = [
    // Hoje fictício: 2026-07-03 (quinta) — mesmo dia já usado nas telas estáticas
    ag("2026-07-03", "09:00", "João Pedro", ["Corte"], "agendado"),
    ag("2026-07-03", "10:00", "Marcos Silva", ["Corte", "Barba"], "realizado_pago", {
      realizadoEm: "2026-07-03T10:15:00", valorTotal: 45, pago: true,
      pagamentos: pago(45, "PIX"),
    }),
    ag("2026-07-03", "14:00", "Lucas Alves", ["Barba"], "agendado"),
    ag("2026-07-03", "16:00", "Rafael Lima", ["Corte"], "agendado"),

    // Pendentes (datas passadas, ainda não pagos)
    ag("2026-06-11", "11:00", "Breno Ronzani", ["Sobrancelha"], "realizado_pendente", { realizadoEm: "2026-06-11T11:30:00", valorTotal: 35, pago: false, valorPendente: 35 }),
    ag("2026-06-17", "15:00", "Tiago Martins", ["Corte", "Barba"], "realizado_pendente", { realizadoEm: "2026-06-17T15:40:00", valorTotal: 50, pago: false, valorPendente: 50 }),
    ag("2026-06-19", "09:30", "João Silva", ["Corte"], "realizado_pendente", { realizadoEm: "2026-06-19T09:50:00", valorTotal: 10, pago: false, valorPendente: 10 }),
    ag("2026-06-22", "10:00", "Pedro Costa", ["Barba"], "realizado_pendente", { realizadoEm: "2026-06-22T10:20:00", valorTotal: 20, pago: false, valorPendente: 20 }),
    ag("2026-06-24", "13:00", "Marcos Lima", ["Corte"], "realizado_pendente", { realizadoEm: "2026-06-24T13:15:00", valorTotal: 25, pago: false, valorPendente: 25 }),

    // Pagos recentemente
    ag("2026-07-03", "08:30", "Breno Ronzani", ["Sobrancelha"], "realizado_pago", { realizadoEm: "2026-07-03T08:45:00", valorTotal: 10, pago: true, pagamentos: pago(10, "Dinheiro") }),
    ag("2026-07-02", "09:00", "João Silva", ["Corte"], "realizado_pago", { realizadoEm: "2026-07-02T09:20:00", valorTotal: 20, pago: true, pagamentos: pago(20, "PIX") }),
    ag("2026-06-21", "16:00", "Ana Paula", ["Corte", "Barba"], "realizado_pago", { realizadoEm: "2026-06-21T16:30:00", valorTotal: 45, pago: true, pagamentos: pago(45, "Dinheiro") }),
    ag("2026-06-19", "17:00", "Rafael Silva", ["Hidratação"], "realizado_pago", { realizadoEm: "2026-06-19T17:20:00", valorTotal: 30, pago: true, pagamentos: pago(30, "PIX") }),
    ag("2026-06-17", "10:30", "Felipe Santos", ["Sobrancelha"], "realizado_pago", { realizadoEm: "2026-06-17T10:45:00", valorTotal: 15, pago: true, pagamentos: pago(15, "Cartão de crédito") }),

    // Histórico do Ivan Souza (cliente-detalhe)
    ag("2026-06-20", "14:30", "Ivan Souza", ["Corte", "Barba"], "realizado_pago", { realizadoEm: "2026-06-20T14:50:00", valorTotal: 45, pago: true, pagamentos: pago(45, "PIX") }),
    ag("2026-06-15", "10:00", "Ivan Souza", ["Corte"], "realizado_pago", { realizadoEm: "2026-06-15T10:20:00", valorTotal: 25, pago: true, pagamentos: pago(25, "PIX") }),
    ag("2026-06-08", "15:30", "Ivan Souza", ["Corte", "Barba", "Sobrancelha"], "realizado_pago", { realizadoEm: "2026-06-08T15:55:00", valorTotal: 60, pago: true, pagamentos: pago(60, "Dinheiro") }),
    ag("2026-06-01", "11:00", "Ivan Souza", ["Corte"], "realizado_pago", { realizadoEm: "2026-06-01T11:20:00", valorTotal: 25, pago: true, pagamentos: pago(25, "PIX") }),
    ag("2026-05-25", "16:00", "Ivan Souza", ["Corte", "Barba"], "realizado_pago", { realizadoEm: "2026-05-25T16:25:00", valorTotal: 45, pago: true, pagamentos: pago(45, "Dinheiro") }),
  ];

  return lista;
}

function seedConfig() {
  return {
    tema: "escuro",
    corPrincipal: "roxo",
    horaInicio: "08:00",
    horaFim: "20:30",
    intervaloGrade: 30,
    tempoPadraoAtendimento: 60,
    modoCompartilhamento: "estrategico",
    assinaturaStatus: "gratuito",
    semRetornarBucketsInsight: [20, 30, 45],
  };
}

function seedWhatsapp() {
  return {
    numero: "(32) 99999-9999",
    mensagemHorarios: "Olá! Tenho estes horários disponíveis para você:",
    mensagemLembrete: "Olá, passando para lembrar do seu horário agendado para amanhã às {hora}.",
    mensagemAniversario: "Feliz aniversário! Que seu dia seja incrível e cheio de conquistas!",
    mensagemEndereco: "Nosso endereço é: {endereco_completo}",
  };
}

function inicializarDadosFicticios() {
  if (localStorage.getItem(CHAVES.servicos) === null) {
    salvarServicos(seedServicos());
  }
  if (localStorage.getItem(CHAVES.formasPagamento) === null) {
    salvarFormasPagamento(seedFormasPagamento());
  }
  if (localStorage.getItem(CHAVES.clientes) === null) {
    salvarClientes(seedClientes());
  }
  if (localStorage.getItem(CHAVES.clientesLixeira) === null) {
    salvarClientesLixeira([]);
  }
  if (localStorage.getItem(CHAVES.bloqueiosFixos) === null) {
    salvarBloqueiosFixos(seedBloqueiosFixos());
  }
  if (localStorage.getItem(CHAVES.agendamentos) === null) {
    salvarAgendamentos(seedAgendamentos(obterClientes(), obterServicos(), obterFormasPagamento()));
  }
  if (localStorage.getItem(CHAVES.config) === null) {
    salvarConfig(seedConfig());
  }
  if (localStorage.getItem(CHAVES.whatsapp) === null) {
    salvarWhatsapp(seedWhatsapp());
  }
  if (localStorage.getItem(CHAVES.onboarding) === null) {
    salvarOnboarding({ concluido: true });
  }
}

inicializarDadosFicticios();
