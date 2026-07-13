/* ============================================================
   AGENDA V3 — Conteúdo do sistema de ajuda contextual
   Uma entrada por tela. Cada tela pode ter um "tour" (sequência de
   passos mostrados na 1ª visita, um só de cada vez — ver js/ajuda.js)
   e/ou "dicas" avulsas (spotlight único, disparado por uma ação real
   do usuário, não pela primeira visita). Nada de texto longo: cada
   passo é uma legenda curta, o resto é gesto/spotlight visual.
   Só "agenda" tem conteúdo real nesta etapa; as outras telas ficam
   com a forma vazia pronta.
   ============================================================ */

const AJUDA_DADOS = {
  agenda: {
    tour: [
      { tipo: "centro", titulo: "👋 Bem-vindo(a)!", legenda: "Vamos te mostrar o essencial da sua agenda." },
      { tipo: "spot", alvo: () => document.querySelector(".agenda-slot--livre"), legenda: "Toque num horário livre pra agendar ou bloquear." },
      { tipo: "gesto", alvo: () => document.querySelector("#js-agenda-lista"), legenda: "Arraste pra trocar de dia." },
      { tipo: "gesto", alvo: () => document.querySelector("#js-week-carousel-wrap"), legenda: "Arraste pra trocar de semana." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-compartilhar-whatsapp"), legenda: "Compartilhe seus horários livres pelo WhatsApp." },
    ],
    dicas: {
      realizar: { legenda: "Toque aqui pra marcar como realizado." },
    },
  },
  vendas: { tour: [], dicas: {} },
  relatorios: { tour: [], dicas: {} },
  pendentes: { tour: [], dicas: {} },
  clientes: { tour: [], dicas: {} },
  mais: { tour: [], dicas: {} },
};
