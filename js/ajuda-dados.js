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

   "produtos" e "mais" (2026-08-06), e as 15 telas adicionadas em seguida
   (2026-08-07 — servicos, pagamentos, intervalos, whatsapp, configuracoes,
   perfil, backup, assinatura, cliente-detalhe, aniversariantes,
   sem-retornar, ranking, clientes-todos, clientes-lixeira,
   pendentes-devedores) têm tour, mas SÓ sob demanda — nenhuma delas chama
   iniciarTour() no carregamento, só o botão "?" chama reiniciarTour().
   Decisão de 13/07 (menu inferior já explica o suficiente pra não precisar
   de tour automático) continua valendo pra todas essas; o "?" é só uma
   rede de segurança pra quem ficar em dúvida.
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
  servicos: {
    tour: [
      { tipo: "centro", legenda: "Aqui ficam os serviços que você oferece — o que aparece na hora de marcar um atendimento." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-novo-servico"), legenda: "Toque aqui pra cadastrar um serviço novo." },
    ],
    dicas: {},
  },
  pagamentos: {
    tour: [
      { tipo: "centro", legenda: "Aqui você organiza as formas de pagamento que aceita." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-nova-forma"), legenda: "Toque aqui pra adicionar uma forma nova." },
    ],
    dicas: {},
  },
  intervalos: {
    tour: [
      { tipo: "centro", legenda: "Aqui você bloqueia horários pra não aparecerem livres na agenda — folga, almoço, hora extra." },
      { tipo: "spot", alvo: () => document.querySelector("#js-filtro-dia"), legenda: "Filtra por dia da semana pra achar um intervalo específico." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-novo-intervalo"), legenda: "Toque aqui pra criar um bloqueio novo." },
    ],
    dicas: {},
  },
  whatsapp: {
    tour: [
      { tipo: "centro", legenda: "Aqui você personaliza as mensagens automáticas que o app manda pelo WhatsApp." },
      { tipo: "spot", alvo: () => document.querySelector('[data-campo="mensagemHorarios"]'), legenda: "Toque em qualquer mensagem pra mudar o texto que seus clientes recebem." },
    ],
    dicas: {},
  },
  configuracoes: {
    tour: [
      { tipo: "centro", legenda: "Aqui ficam os ajustes do seu app — tema, cores, horários da agenda e mais." },
      { tipo: "spot", alvo: () => document.querySelector("#js-tema-row"), legenda: "Troque entre modo claro e escuro por aqui." },
      { tipo: "spot", alvo: () => document.querySelector("#js-cor-row"), legenda: "E escolha a cor que combina com o seu negócio." },
    ],
    dicas: {},
  },
  perfil: {
    tour: [
      { tipo: "centro", legenda: "Aqui ficam os dados do seu negócio — nome, profissional, endereço e contato." },
      { tipo: "spot", alvo: () => document.querySelector('[data-abrir-modal="modal-editar-estabelecimento"]'), legenda: "Toque em qualquer campo pra editar." },
    ],
    dicas: {},
  },
  backup: {
    tour: [
      { tipo: "centro", legenda: "Aqui você guarda uma cópia de segurança de tudo — clientes, agenda, vendas." },
      { tipo: "spot", alvo: () => document.querySelector("#js-backup-exportar"), legenda: "Toque aqui pra baixar seu backup." },
      { tipo: "spot", alvo: () => document.querySelector("#js-backup-importar-btn"), legenda: "E aqui, pra restaurar um backup salvo." },
    ],
    dicas: {},
  },
  assinatura: {
    tour: [
      { tipo: "centro", legenda: "Aqui você vê os detalhes do plano Pro e pode assinar quando quiser." },
    ],
    dicas: {},
  },
  "cliente-detalhe": {
    tour: [
      { tipo: "centro", legenda: "Aqui você vê todo o histórico deste cliente — atendimentos, compras e contato, tudo num lugar só." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-editar-cliente"), legenda: "Toque em \"Editar\" pra atualizar os dados ou mover pra lixeira." },
    ],
    dicas: {},
  },
  aniversariantes: {
    tour: [
      { tipo: "centro", legenda: "Aqui você vê quem faz aniversário no mês — uma boa desculpa pra mandar um oi 🎉" },
      { tipo: "spot", alvo: () => document.querySelector("#js-aniv-lista"), legenda: "Toque num cliente pra chamar no WhatsApp direto." },
    ],
    dicas: {},
  },
  "sem-retornar": {
    tour: [
      { tipo: "centro", legenda: "Aqui você vê quem já demorou pra voltar — pra dar aquele empurrãozinho." },
      { tipo: "spot", alvo: () => document.querySelector("#js-semretornar-filtro"), legenda: "Filtra por quanto tempo já faz que o cliente não aparece." },
    ],
    dicas: {},
  },
  ranking: {
    tour: [
      { tipo: "centro", legenda: "Aqui você vê quem mais fatura, mais visita ou tem o maior ticket médio com você." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-filtrar"), legenda: "Troque o período do ranking por aqui." },
    ],
    dicas: {},
  },
  "clientes-todos": {
    tour: [
      { tipo: "centro", legenda: "Aqui está a lista completa dos seus clientes." },
      { tipo: "spot", alvo: () => document.querySelector("#js-busca-cliente-todos"), legenda: "Busca rápida por nome." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-novo-cliente"), legenda: "Toque aqui pra cadastrar um cliente novo." },
    ],
    dicas: {},
  },
  "clientes-lixeira": {
    tour: [
      { tipo: "centro", legenda: "Clientes que você remove ficam guardados aqui — o histórico deles continua salvo, nada se perde na hora." },
      { tipo: "spot", alvo: () => document.querySelector("#js-lixeira-lista"), legenda: "Toque num cliente pra restaurar ou excluir de vez." },
    ],
    dicas: {},
  },
  "pendentes-devedores": {
    tour: [
      { tipo: "centro", legenda: "Aqui está o ranking de quem mais fica te devendo." },
      { tipo: "spot", alvo: () => document.querySelector("#js-devedores-tabs"), legenda: "Troque entre atendimentos e vendas por aqui." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-filtrar"), legenda: "E filtra o período que quiser ver." },
    ],
    dicas: {},
  },
};
