/* ============================================================
   AGENDA V3 — Conteúdo do sistema de ajuda contextual
   Uma entrada por tela. Cada tela pode ter um "tour" (sequência de
   passos mostrados na 1ª visita, um só de cada vez — ver js/ajuda.js)
   e/ou "dicas" avulsas (spotlight único, disparado por uma ação real
   do usuário, não pela primeira visita). Nada de texto longo: cada
   passo é uma legenda curta, o resto é gesto/spotlight visual.

   Uma dica pode ter `celebrar: true` — usada por mostrarDicaSpotlight
   (js/ajuda.js) pra aplicar uma entrada "bounce" (tour-legenda--celebra,
   css/components.css) em vez da entrada padrão, reservada pra dicas que
   marcam um marco real de progresso (não toda dica precisa disso).

   "produtos" e "mais" (2026-08-06) têm tour, mas SÓ sob demanda — as
   duas telas não chamam iniciarTour() no carregamento, só o botão "?"
   chama reiniciarTour(). Decisão de 13/07 (menu inferior já explica o
   suficiente pra não precisar de tour automático) continua valendo pra
   essas duas; o "?" é só uma rede de segurança pra quem ficar em dúvida.
   ============================================================ */

const AJUDA_DADOS = {
  agenda: {
    tour: [
      { tipo: "centro", titulo: "👋 Oi, tudo bem?", legenda: "Vamos conhecer sua agenda em poucos toques." },
      { tipo: "gesto", alvo: () => document.querySelector("#js-agenda-lista-wrap"), legenda: "Desliza pro lado pra ver outro dia 👉" },
      { tipo: "gesto", alvo: () => document.querySelector("#js-week-carousel-wrap"), legenda: "E aqui, desliza pra pular de semana." },
      { tipo: "spot", alvo: () => document.querySelector("#js-agenda-mes-btn"), legenda: "Quer ir direto numa data? Toque aqui no calendário." },
      { tipo: "spot", alvo: () => document.querySelector('[aria-label="Vender"]'), legenda: "Vendeu algo sem ser num atendimento? Registra por aqui 🛍️" },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-compartilhar-whatsapp"), legenda: "Bora avisar no WhatsApp que sua agenda tá livre?" },
    ],
    dicas: {
      realizar: { legenda: "Boa, já é o seu 2º agendamento! Toque aqui quando atender pra marcar como feito ✅", celebrar: true },
    },
  },
  relatorios: {
    tour: [
      { tipo: "centro", legenda: "Aqui você acompanha tudo o que já atendeu e faturou." },
      { tipo: "spot", alvo: () => document.querySelector("#js-periodo-tabs"), legenda: "Troque o período pra ver dia, semana, mês ou ano." },
      { tipo: "spot", alvo: () => document.querySelector('[data-abrir-modal="modal-calendario"]'), legenda: "Ou pule direto pra uma data no calendário." },
    ],
    dicas: {},
  },
  pendentes: {
    tour: [
      { tipo: "centro", legenda: "Aqui você não perde de vista quem ainda te deve." },
      { tipo: "spot", alvo: () => document.querySelector('a[href="pendentes-devedores.html"]'), legenda: "E aqui, o ranking de quem mais fica devendo." },
    ],
    dicas: {
      receber: { legenda: "Recebeu? Toque na pendência pra dar baixa ✅" },
    },
  },
  vendas: {
    tour: [
      { tipo: "centro", legenda: "Aqui você acompanha tudo o que vendeu. Pra registrar uma venda avulsa, usa o botão \"Vender\" lá na Agenda." },
      { tipo: "spot", alvo: () => document.querySelector("#js-periodo-tabs"), legenda: "Troque o período pra ver dia, semana, mês ou ano." },
      { tipo: "spot", alvo: () => document.querySelector("#js-vendas-btn-calendario"), legenda: "Ou pule direto pra uma data no calendário." },
    ],
    dicas: {},
  },
  clientes: {
    tour: [
      { tipo: "centro", legenda: "Seus clientes entram aqui sozinhos, sempre que você agenda alguém novo." },
    ],
    dicas: {},
  },
  produtos: {
    tour: [
      { tipo: "centro", legenda: "Aqui você cadastra e organiza os produtos que vende." },
      { tipo: "spot", alvo: () => document.querySelector("#js-produtos-insight"), legenda: "Aqui você vê quanto tem parado em estoque e o quanto pode lucrar vendendo tudo." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-novo-produto"), legenda: "Toque aqui pra cadastrar um produto novo." },
    ],
    dicas: {},
  },
  mais: {
    tour: [
      { tipo: "centro", legenda: "Aqui ficam as configurações e as telas extras do app — backup, assinatura, perfil e mais." },
    ],
    dicas: {},
  },
};
