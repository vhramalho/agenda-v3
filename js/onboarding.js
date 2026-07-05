/* ============================================================
   AGENDA V3 — Navegação do Onboarding
   Troca entre as 6 telas internas (boas-vindas + 5 passos).
   Tema e cor principal já aplicam de verdade (Fase 2, via
   tema.js). Os demais campos (nome, horários etc.) ainda não
   salvam dados reais — isso é Fase 3 (agendaV3:onboarding).
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const passos = qsa(".onboarding-step");
  const pontos = qsa(".onboarding-dot");
  let atual = 0;

  function carregarValoresIniciais() {
    const config = obterConfig();
    const whatsapp = obterWhatsapp();
    qs("#js-ob-estabelecimento").value = config.nomeEstabelecimento || "";
    qs("#js-ob-profissional").value = config.nomeProfissional || "";
    qs("#js-ob-whatsapp").value = whatsapp.numero || "";
    qs("#js-ob-endereco").value = config.endereco || "";
    qs("#js-ob-hora-inicio").value = config.horaInicio || "08:00";
    qs("#js-ob-hora-fim").value = config.horaFim || "20:30";
    definirValorCiclo(qs("#js-ob-grade"), config.intervaloGrade || 30);
    definirValorCiclo(qs("#js-ob-tempo-padrao"), config.tempoPadraoAtendimento || 60);

    const tema = config.tema || "escuro";
    qsa(".opcao-card[data-tema]").forEach((c) => c.classList.toggle("is-selecionada", c.dataset.tema === tema));
    const cor = config.corPrincipal || "roxo";
    qsa(".cor-swatch[data-cor]").forEach((c) => c.classList.toggle("is-selecionada", c.dataset.cor === cor));
  }

  function definirValorCiclo(botao, valor) {
    botao.dataset.valor = valor;
    botao.querySelector("span").textContent = `${valor} minutos`;
  }

  function salvarPasso1() {
    const config = obterConfig();
    config.nomeEstabelecimento = qs("#js-ob-estabelecimento").value.trim();
    config.nomeProfissional = qs("#js-ob-profissional").value.trim();
    config.endereco = qs("#js-ob-endereco").value.trim();
    salvarConfig(config);
    const whatsapp = obterWhatsapp();
    whatsapp.numero = qs("#js-ob-whatsapp").value.trim();
    salvarWhatsapp(whatsapp);
  }

  function salvarPasso3() {
    const config = obterConfig();
    const horaInicio = qs("#js-ob-hora-inicio").value.trim();
    const horaFim = qs("#js-ob-hora-fim").value.trim();
    if (horaInicio) config.horaInicio = horaInicio;
    if (horaFim) config.horaFim = horaFim;
    config.intervaloGrade = parseInt(qs("#js-ob-grade").dataset.valor, 10);
    config.tempoPadraoAtendimento = parseInt(qs("#js-ob-tempo-padrao").dataset.valor, 10);
    salvarConfig(config);
  }

  function completarComPadroes() {
    const padraoConfig = seedConfig();
    const config = obterConfig();
    Object.keys(padraoConfig).forEach((chave) => {
      if (config[chave] === undefined) config[chave] = padraoConfig[chave];
    });
    salvarConfig(config);

    const padraoWhatsapp = seedWhatsapp();
    const whatsapp = obterWhatsapp();
    Object.keys(padraoWhatsapp).forEach((chave) => {
      if (whatsapp[chave] === undefined) whatsapp[chave] = padraoWhatsapp[chave];
    });
    salvarWhatsapp(whatsapp);

    garantirFormasPagamentoPadrao();
  }

  function mostrarPasso(indice) {
    passos.forEach((p, i) => p.classList.toggle("is-active", i === indice));
    pontos.forEach((p, i) => p.classList.toggle("is-active", i === indice));
    atual = indice;
    if (indice === 5) {
      completarComPadroes();
      salvarOnboarding({ concluido: true });
    }
  }

  qs("#js-ob-grade").addEventListener("click", () => {
    const opcoes = [15, 30, 60];
    const atualIndice = opcoes.indexOf(parseInt(qs("#js-ob-grade").dataset.valor, 10));
    definirValorCiclo(qs("#js-ob-grade"), opcoes[(atualIndice + 1) % opcoes.length]);
  });

  qs("#js-ob-tempo-padrao").addEventListener("click", () => {
    const opcoes = [15, 30, 45, 60, 90, 120];
    const atualIndice = opcoes.indexOf(parseInt(qs("#js-ob-tempo-padrao").dataset.valor, 10));
    definirValorCiclo(qs("#js-ob-tempo-padrao"), opcoes[(atualIndice + 1) % opcoes.length]);
  });

  qsa("[data-ir-para]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const destino = Number(botao.dataset.irPara);
      mostrarPasso(destino);
    });
  });

  qsa("[data-proximo]").forEach((botao) => {
    botao.addEventListener("click", () => {
      if (atual === 1) salvarPasso1();
      if (atual === 3) salvarPasso3();
      if (atual < passos.length - 1) mostrarPasso(atual + 1);
    });
  });

  qsa("[data-anterior]").forEach((botao) => {
    botao.addEventListener("click", () => {
      if (atual > 0) mostrarPasso(atual - 1);
    });
  });

  qsa(".opcao-card[data-tema]").forEach((card) => {
    card.addEventListener("click", () => {
      qsa(".opcao-card[data-tema]").forEach((c) => c.classList.remove("is-selecionada"));
      card.classList.add("is-selecionada");
      definirTema(card.dataset.tema);
    });
  });

  qsa(".cor-swatch[data-cor]").forEach((swatch) => {
    swatch.addEventListener("click", () => {
      qsa(".cor-swatch[data-cor]").forEach((c) => c.classList.remove("is-selecionada"));
      swatch.classList.add("is-selecionada");
      definirCorPrincipal(swatch.dataset.cor);
    });
  });

  carregarValoresIniciais();
  mostrarPasso(0);
});
