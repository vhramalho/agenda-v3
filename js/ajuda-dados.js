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

   "produtos" (2026-08-06) e as 15 telas adicionadas em seguida (2026-08-07
   — servicos, pagamentos, intervalos, whatsapp, configuracoes, perfil,
   backup, assinatura, cliente-detalhe, aniversariantes, sem-retornar,
   ranking, clientes-todos, clientes-lixeira, pendentes-devedores) têm
   tour, mas SÓ sob demanda — nenhuma delas chama iniciarTour() no
   carregamento, só o botão "?" chama reiniciarTour(). Decisão de 13/07
   (menu inferior já explica o suficiente pra não precisar de tour
   automático) continua valendo pra todas essas; o "?" é só uma rede de
   segurança pra quem ficar em dúvida.

   "mais" NÃO tem entrada aqui (removida em 2026-08-10, a pedido do
   usuário) — o botão "?" também foi removido de mais.html, é a única
   tela sem ajuda contextual nenhuma, de propósito.
   ============================================================ */

const AJUDA_DADOS = {
  agenda: {
    tour: [
      { tipo: "centro", titulo: "👋 Bem-vindo(a)!", legenda: "Vamos mostrar o essencial da sua agenda!" },
      { tipo: "spot", alvo: () => document.querySelector("#js-agenda-lista"), legenda: "Toque em um horário para marcar um cliente ou bloquear o horário." },
      { tipo: "gesto", alvo: () => document.querySelector("#js-agenda-lista-wrap"), legenda: "Deslize para os lados para trocar o dia." },
      { tipo: "gesto", alvo: () => document.querySelector("#js-week-carousel-wrap"), legenda: "E aqui, deslize pra trocar a semana." },
      { tipo: "spot", alvo: () => document.querySelector("#js-agenda-mes-btn"), legenda: "Se quiser pode escolher uma data específica abrindo o calendário. 📅" },
      { tipo: "spot", alvo: () => document.querySelector('[aria-label="Vender"]'), legenda: "Se quiser vender algo fora de um agendamento clique aqui. 🛍️" },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-compartilhar-whatsapp"), legenda: "Compartilhe seus horários disponíveis no WhatsApp 📲" },
    ],
    dicas: {
      realizar: { legenda: "Muito bem, esse foi seu 2º agendamento. Toque no horário marcado novamente para desmarcar, editar ou marcar como Realizado ✅", celebrar: true },
    },
  },
  relatorios: {
    tour: [
      { tipo: "centro", legenda: "Acompanhe quanto você fez com atendimentos." },
      { tipo: "spot", alvo: () => document.querySelector("#js-periodo-tabs"), legenda: "Troque o período pra ver dia, semana, mês ou ano." },
      { tipo: "spot", alvo: () => document.querySelector('[data-abrir-modal="modal-calendario"]'), legenda: "Ou pule direto pra uma data no calendário." },
      { tipo: "spot", alvo: () => document.querySelector('[aria-label="Ir para a Agenda"]'), legenda: "Toque aqui para voltar à sua agenda." },
    ],
    dicas: {},
  },
  pendentes: {
    tour: [
      { tipo: "centro", legenda: "Acompanhe o que você ainda tem a receber e quem te deve." },
      { tipo: "spot", alvo: () => document.querySelector('a[href="pendentes-devedores.html"]'), legenda: "Veja os clientes que mais ficam devendo." },
    ],
    dicas: {
      receber: { legenda: "Se você tiver recebido, é só clicar em uma pendência e registrar o pagamento." },
    },
  },
  vendas: {
    tour: [
      { tipo: "centro", legenda: "Acompanhe quanto você fez com vendas. Pra registrar uma venda avulsa, use o botão \"Vender\" lá na Agenda." },
      { tipo: "spot", alvo: () => document.querySelector("#js-periodo-tabs"), legenda: "Troque o período pra ver dia, semana, mês ou ano." },
      { tipo: "spot", alvo: () => document.querySelector("#js-vendas-btn-calendario"), legenda: "Ou pule direto pra uma data no calendário." },
    ],
    dicas: {},
  },
  clientes: {
    tour: [
      { tipo: "centro", legenda: "Seus clientes são cadastrados automaticamente ao agendar alguém novo — você pode acompanhá-los aqui." },
    ],
    dicas: {},
  },
  produtos: {
    tour: [
      { tipo: "centro", legenda: "Cadastre e organize os produtos que você vende." },
      { tipo: "spot", alvo: () => document.querySelector("#js-produtos-insight"), legenda: "Veja quanto você tem parado em estoque e quanto pode lucrar vendendo tudo." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-novo-produto"), legenda: "Toque aqui pra cadastrar um produto novo." },
    ],
    dicas: {},
  },
  servicos: {
    tour: [
      { tipo: "centro", legenda: "Organize os serviços que você oferece — são eles que aparecem na hora de marcar um atendimento." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-novo-servico"), legenda: "Toque aqui pra cadastrar um serviço novo." },
    ],
    dicas: {},
  },
  pagamentos: {
    tour: [
      { tipo: "centro", legenda: "Organize as formas de pagamento que você aceita." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-nova-forma"), legenda: "Toque aqui pra adicionar uma forma nova." },
    ],
    dicas: {},
  },
  intervalos: {
    tour: [
      { tipo: "centro", legenda: "Aqui você bloqueia horários para não disponibilizar na agenda. Horários de almoço, folgas etc." },
      { tipo: "spot", alvo: () => document.querySelector("#js-filtro-dia"), legenda: "Filtra por dia da semana pra achar um intervalo específico." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-novo-intervalo"), legenda: "Toque aqui pra criar um bloqueio novo." },
    ],
    dicas: {},
  },
  whatsapp: {
    tour: [
      { tipo: "centro", legenda: "Personalize as mensagens pré-definidas que você pode enviar no WhatsApp." },
      { tipo: "spot", alvo: () => document.querySelector('[data-campo="mensagemHorarios"]'), legenda: "Toque em qualquer mensagem pra mudar o texto que seus clientes recebem." },
    ],
    dicas: {},
  },
  configuracoes: {
    tour: [
      { tipo: "centro", legenda: "Ajuste o app do seu jeito — tema, cores, horários da agenda e mais." },
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
      { tipo: "centro", legenda: "Guarde uma cópia de segurança de tudo — clientes, agenda, vendas." },
      { tipo: "spot", alvo: () => document.querySelector("#js-backup-exportar"), legenda: "Toque aqui pra baixar seu backup." },
      { tipo: "spot", alvo: () => document.querySelector("#js-backup-importar-btn"), legenda: "E aqui, pra restaurar um backup salvo." },
    ],
    dicas: {},
  },
  assinatura: {
    tour: [
      { tipo: "centro", legenda: "Veja os detalhes do plano Pro e assine quando quiser." },
    ],
    dicas: {},
  },
  "cliente-detalhe": {
    tour: [
      { tipo: "centro", legenda: "Veja todo o histórico deste cliente — atendimentos, compras e contato, tudo num lugar só." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-editar-cliente"), legenda: "Toque em \"Editar\" pra atualizar os dados ou mover pra lixeira." },
    ],
    dicas: {},
  },
  aniversariantes: {
    tour: [
      { tipo: "centro", legenda: "Acompanhe clientes que fazem aniversário no mês 🎉" },
      { tipo: "spot", alvo: () => document.querySelector("#js-aniv-lista"), legenda: "Toque num cliente pra chamar no WhatsApp direto." },
    ],
    dicas: {},
  },
  "sem-retornar": {
    tour: [
      { tipo: "centro", legenda: "Veja quem já demorou pra voltar." },
      { tipo: "spot", alvo: () => document.querySelector("#js-semretornar-filtro"), legenda: "Filtra por quanto tempo já faz que o cliente não aparece." },
    ],
    dicas: {},
  },
  ranking: {
    tour: [
      { tipo: "centro", legenda: "Veja quem mais fatura, mais visita ou tem o maior ticket médio com você." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-filtrar"), legenda: "Troque o período do ranking por aqui." },
    ],
    dicas: {},
  },
  "clientes-todos": {
    tour: [
      { tipo: "centro", legenda: "Esta é a lista completa dos seus clientes." },
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
      { tipo: "centro", legenda: "Este é o ranking de quem mais fica te devendo." },
      { tipo: "spot", alvo: () => document.querySelector("#js-devedores-tabs"), legenda: "Troque entre atendimentos e vendas por aqui." },
      { tipo: "spot", alvo: () => document.querySelector("#js-btn-filtrar"), legenda: "E filtra o período que quiser ver." },
    ],
    dicas: {},
  },
};
