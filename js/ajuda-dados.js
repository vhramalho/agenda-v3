/* ============================================================
   AGENDA V3 — Conteúdo do sistema de ajuda contextual
   Uma entrada por tela. Só "agenda" tem conteúdo real nesta etapa;
   as demais ficam com a forma pronta e vazia, prontas para receber
   texto em rodadas futuras (ver js/ajuda.js).
   ============================================================ */

const AJUDA_DADOS = {
  agenda: {
    introducao: {
      titulo: "Bem-vindo à Agenda!",
      corpo: "Aqui você vê seus horários dia a dia. Toque num horário livre para agendar, deslize para o lado pra trocar de dia, e use o ícone de calendário no topo pra pular direto pra outra data.",
    },
    secoes: [
      { titulo: "Criar um agendamento", corpo: "Toque num horário livre da lista e escolha \"Agendar cliente\". Você pode digitar o nome de um cliente já cadastrado ou de alguém novo." },
      { titulo: "Marcar como realizado", corpo: "Toque num horário agendado e escolha \"Realizar atendimento\" para registrar o pagamento e concluir." },
      { titulo: "Bloquear um horário", corpo: "Toque num horário livre e escolha \"Bloquear\" para reservar aquele espaço sem vincular a um cliente (ex.: almoço, compromisso pessoal)." },
      { titulo: "Compartilhar horários", corpo: "Use o ícone de WhatsApp no topo para enviar aos seus clientes os horários livres dos dias que você escolher." },
    ],
    checklist: [
      { chave: "novoAgendamento", texto: "Criar seu primeiro agendamento" },
      { chave: "calendario", texto: "Abrir o calendário para trocar de mês" },
      { chave: "compartilhar", texto: "Compartilhar horários pelo WhatsApp" },
    ],
    dicas: {
      calendario: "Toque aqui para pular direto para outro mês.",
    },
  },
  vendas: { introducao: null, secoes: [], checklist: [], dicas: {} },
  relatorios: { introducao: null, secoes: [], checklist: [], dicas: {} },
  pendentes: { introducao: null, secoes: [], checklist: [], dicas: {} },
  clientes: { introducao: null, secoes: [], checklist: [], dicas: {} },
  mais: { introducao: null, secoes: [], checklist: [], dicas: {} },
};
