/* ============================================================
   AGENDA V3 — Conteúdo do sistema de ajuda contextual
   Uma entrada por tela. Cada tela pode ter um "tour" (sequência de
   passos mostrados na 1ª visita, um só de cada vez — ver js/ajuda.js)
   e/ou "dicas" avulsas (spotlight único, disparado por uma ação real
   do usuário, não pela primeira visita). Nada de texto longo: cada
   passo é uma legenda curta, o resto é gesto/spotlight visual.

   "mais" fica sempre vazia de propósito — o hub "Mais" e as telas
   que ele leva (incluindo produtos.html) não precisam de ajuda
   contextual (decisão do usuário, 2026-07-13: a explicação inicial
   do menu inferior já é suficiente).
   ============================================================ */

const AJUDA_DADOS = {
  agenda: {
    tour: [
      { tipo: "centro", titulo: "👋 Bem-vindo(a)!", legenda: "Vamos te mostrar o essencial da sua agenda." },
      { tipo: "gesto", alvo: () => document.querySelector("#js-agenda-lista"), legenda: "Arraste pra trocar de dia." },
      { tipo: "gesto", alvo: () => document.querySelector("#js-week-carousel-wrap"), legenda: "Arraste pra trocar de semana." },
      { tipo: "spot", alvo: () => document.querySelector("#js-agenda-mes-btn"), legenda: "Ou toque aqui pra ir direto numa data no calendário." },
      { tipo: "spot", alvo: () => document.querySelector('a[aria-label="Vender"]'), legenda: "Vendeu algo fora de um atendimento? Registre aqui." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-compartilhar-whatsapp"), legenda: "Compartilhe seus horários livres pelo WhatsApp." },
    ],
    dicas: {
      realizar: { legenda: "Toque aqui pra marcar como realizado." },
    },
  },
  relatorios: {
    tour: [
      { tipo: "centro", legenda: "Aqui você acompanha quanto você fez." },
      { tipo: "spot", alvo: () => document.querySelector("#js-periodo-tabs"), legenda: "Escolha qual período deseja ver." },
      { tipo: "spot", alvo: () => document.querySelector('[data-abrir-modal="modal-calendario"]'), legenda: "Ou selecione uma data direto no calendário." },
    ],
    dicas: {},
  },
  pendentes: {
    tour: [
      { tipo: "centro", legenda: "Acompanhe quanto você ainda tem a receber." },
    ],
    dicas: {
      receber: { legenda: "Toque aqui pra receber." },
    },
  },
  vendas: {
    tour: [
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-vendas-acao"), legenda: "Acompanhe suas vendas aqui e faça uma nova venda aqui." },
    ],
    dicas: {},
  },
  clientes: {
    tour: [
      { tipo: "centro", legenda: "Seus clientes são cadastrados automaticamente ao fazer um agendamento — você pode acompanhá-los aqui." },
    ],
    dicas: {},
  },
  mais: { tour: [], dicas: {} },
};
