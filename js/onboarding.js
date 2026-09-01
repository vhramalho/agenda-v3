/* ============================================================
   AGENDA V3 — Navegação do Onboarding
   Troca entre as 6 telas internas (boas-vindas + 5 passos), instantânea
   (sem slide por ora). Tema e cor aplicam de verdade e
   ao vivo (via js/tema.js) num mini-mockup da agenda, visível nos
   passos Aparência/Agenda. O passo "Cadastros" reaproveita os
   modais reais de Serviços/Produtos/Formas de pagamento/
   Intervalos (markup duplicado, mesmo padrão do #modal-nova-venda
   em index.html/vendas.html) num fluxo de "cadastrar e continuar".
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const passos = qsa(".onboarding-step");
  const pontos = qsa(".onboarding-dot");
  const mockupWrap = qs("#mockup-wrap");
  let atual = 0;

  function vibrar() {
    if (navigator.vibrate) navigator.vibrate(10);
  }

  /* Horário início/fim usam o dropdown-picker genérico (js/chips.js) —
     populados aqui com a mesma grade de 30 em 30min usada em
     Intervalos/Agenda, em vez de duplicar a lista. Eram <select> nativo
     até 2026-09-01 (troca pedida pelo usuário pra ficar no mesmo padrão
     visual do "+" de duração de Compartilhar horários — o <select> nativo
     tinha sido escolha deliberada em 2026-08-10 pra eliminar um bug de
     digitação livre, mas o dropdown-picker é só-toque, sem input de
     texto, então não reabre aquele risco). */
  function valorDropdown(id) {
    return qs(`#${id} .dropdown-picker__valor`).textContent.trim();
  }
  function definirValorDropdown(id, valor) {
    const wrapper = qs(`#${id}`);
    qs(".dropdown-picker__valor", wrapper).textContent = valor;
    qsa(".time-select__option", wrapper).forEach((o) => o.classList.toggle("is-ativo", o.dataset.valor === valor));
  }
  function popularSelectsHorario() {
    const opcoes = gerarGradeHorarios("00:00", "23:30", 30);
    ["js-ob-hora-inicio", "js-ob-hora-fim"].forEach((id) => {
      const wrapper = qs(`#${id}`);
      montarOpcoesDropdownPicker(qs(".dropdown-picker__menu", wrapper), opcoes, valorDropdown(id));
      inicializarDropdownPicker(wrapper, (valor) => {
        definirValorDropdown(id, valor);
        atualizarMockup();
      });
    });
  }

  function carregarValoresIniciais() {
    const config = obterConfig();
    const whatsapp = obterWhatsapp();
    qs("#js-ob-profissional").value = config.nomeProfissional || "";
    qs("#js-ob-whatsapp").value = whatsapp.numero || "";
    definirValorDropdown("js-ob-hora-inicio", config.horaInicio || "08:00");
    definirValorDropdown("js-ob-hora-fim", config.horaFim || "20:30");
    definirValorGrade(config.intervaloGrade || 30);

    const tema = config.tema || "escuro";
    qsa(".chip[data-tema]").forEach((c) => c.classList.toggle("chip--ativo", c.dataset.tema === tema));
    const cor = config.corPrincipal || "roxo";
    qsa(".cor-swatch[data-cor]").forEach((c) => c.classList.toggle("is-selecionada", c.dataset.cor === cor));
  }

  /* Visualização da grade virou chips reais (era um botão único que ciclava
     valor a cada toque) — mesmo padrão de seleção única já usado no resto
     do app (js/chips.js). */
  function definirValorGrade(valor) {
    qsa("#js-ob-grade .chip").forEach((c) => c.classList.toggle("chip--ativo", parseInt(c.dataset.valor, 10) === valor));
  }

  function obterValorGrade() {
    const ativo = qs("#js-ob-grade .chip--ativo");
    return ativo ? parseInt(ativo.dataset.valor, 10) : 30;
  }

  function salvarPasso1() {
    const config = obterConfig();
    config.nomeProfissional = qs("#js-ob-profissional").value.trim();
    salvarConfig(config);
    const whatsapp = obterWhatsapp();
    whatsapp.numero = qs("#js-ob-whatsapp").value.trim();
    salvarWhatsapp(whatsapp);
  }

  function salvarPasso3() {
    const config = obterConfig();
    const horaInicio = valorDropdown("js-ob-hora-inicio");
    const horaFim = valorDropdown("js-ob-hora-fim");
    const horaValida = (v) => /^\d{2}:\d{2}$/.test(v);
    if (horaValida(horaInicio)) config.horaInicio = horaInicio;
    if (horaValida(horaFim)) config.horaFim = horaFim;
    config.intervaloGrade = obterValorGrade();
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

  /* ---------- Mini-mockup: prévia ao vivo da agenda (passos Aparência/Agenda) ---------- */
  function atualizarMockup() {
    const inicio = valorDropdown("js-ob-hora-inicio") || "08:00";
    const fim = valorDropdown("js-ob-hora-fim") || "20:30";
    const grade = obterValorGrade();
    const horarios = gerarGradeHorarios(inicio, fim, grade);
    const container = qs("#mockup-grade");
    container.innerHTML = "";
    horarios.slice(0, 24).forEach((hora, i) => {
      const linha = document.createElement("div");
      linha.className = "mockup__linha";
      linha.style.animationDelay = `${i * 12}ms`;
      const ocupado = i === 1 || i === 4;
      linha.innerHTML = `<span class="mockup__hora">${hora}</span><span class="mockup__slot${ocupado ? " mockup__slot--ocupado" : ""}">${ocupado ? "Cliente" : ""}</span>`;
      container.appendChild(linha);
    });
    qs("#mockup-data").textContent = `${inicio} – ${fim}`;
  }

  qs("#js-ob-grade").addEventListener("click", (evento) => {
    if (!evento.target.closest(".chip")) return;
    atualizarMockup();
    vibrar();
  });

  /* Move o mockup (elemento único, reaproveitado pelos passos 2 e 3) pra
     dentro do conteúdo do passo que está ficando ativo, logo depois do
     subtítulo — evita ele "flutuar" fixo no topo da página, acima de
     Voltar/Pular, que é como ficava antes (Victor, 2026-08-10). Nos
     outros passos ele fica escondido (is-hidden) onde quer que esteja,
     não precisa reposicionar. */
  function moveMockupParaPassoAtivo(passoEl) {
    const subtitulo = passoEl.querySelector(".onboarding-subtitulo");
    if (subtitulo) subtitulo.insertAdjacentElement("afterend", mockupWrap);
  }

  /* ---------- Navegação entre passos ---------- */
  /* Troca instantânea, sem slide (removido por ora — causava estranheza,
     ver [[feedback-agenda-v3-animacao-forwards-bug]]; revisitar mais pra
     frente se fizer sentido). */
  function mostrarPasso(indice) {
    passos[atual].classList.remove("is-active");
    passos[indice].classList.add("is-active");
    pontos.forEach((p, i) => p.classList.toggle("is-active", i === indice));
    atual = indice;
    mockupWrap.classList.toggle("is-hidden", indice !== 2 && indice !== 3);
    if (indice === 2 || indice === 3) {
      moveMockupParaPassoAtivo(passos[indice]);
      atualizarMockup();
    }
    /* Marca concluído já ao chegar no Passo 4 (Cadastros), não só no
       Passo 5 final -- por essa altura perfil/tema/horários já foram
       salvos (o essencial que o gate de onboarding.concluido protege em
       js/app.js), e o card "Mensagens WhatsApp" desse passo precisa
       poder navegar pra whatsapp.html sem cair no redirecionamento de
       volta pro onboarding do zero (Victor, 2026-08-17). */
    if (indice === 4 || indice === 5) {
      completarComPadroes();
      salvarOnboarding({ concluido: true });
    }
  }

  qsa("[data-ir-para]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const destino = Number(botao.dataset.irPara);
      mostrarPasso(destino);
    });
  });

  qsa("[data-proximo]").forEach((botao) => {
    botao.addEventListener("click", () => {
      vibrar();
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

  qsa(".chip[data-tema]").forEach((chip) => {
    chip.addEventListener("click", () => {
      qsa(".chip[data-tema]").forEach((c) => c.classList.remove("chip--ativo"));
      chip.classList.add("chip--ativo");
      definirTema(chip.dataset.tema);
      vibrar();
    });
  });

  qsa(".cor-swatch[data-cor]").forEach((swatch) => {
    swatch.addEventListener("click", () => {
      qsa(".cor-swatch[data-cor]").forEach((c) => c.classList.remove("is-selecionada"));
      swatch.classList.add("is-selecionada");
      definirCorPrincipal(swatch.dataset.cor);
      vibrar();
    });
  });

  /* ---------- Cadastro rápido (passo 4) — reaproveita os modais reais ---------- */
  /* Nada de chip por item cadastrado (crescia "bagunçado" conforme a
     pessoa ia cadastrando) — só texto de status abaixo do subtítulo do
     card (Victor, 2026-08-17). */
  function atualizarContador(idContador, quantidade) {
    const el = qs(`#${idContador}`);
    if (!el) return;
    el.textContent = quantidade === 0 ? "Nenhum cadastrado ainda" : quantidade === 1 ? "1 cadastrado" : `${quantidade} cadastrados`;
  }

  /* Reabrindo o onboarding (ex.: fechou e voltou sem terminar), os
     cadastros já salvos não refletiam no contador. Preenche do zero a
     partir do localStorage (Victor, 2026-08-17). */
  function popularCadastrosExistentes() {
    atualizarContador("js-ob-contador-servicos", obterServicos().filter((s) => s.ativo).length);
    atualizarContador("js-ob-contador-produtos", obterProdutos().filter((p) => p.ativo).length);
    atualizarContador("js-ob-contador-intervalos", obterBloqueiosFixos().filter((i) => i.ativo).length);
  }

  // Serviços (mesma lógica de js/servicos.js, adaptada)
  qs("#js-ob-btn-servico").addEventListener("click", () => {
    qs("#js-ob-servico-nome").value = "";
    qs("#js-ob-servico-valor").value = "";
    abrirModal("modal-ob-novo-servico");
  });
  qs("#js-ob-servico-salvar").addEventListener("click", () => {
    const nome = qs("#js-ob-servico-nome").value.trim();
    if (!nome) return;
    const hoje = hojeIso();
    const lista = obterServicos();
    lista.push({ id: gerarId("srv"), nome, valorOpcional: extrairValor(qs("#js-ob-servico-valor").value), ativo: true, criadoEm: hoje, atualizadoEm: hoje });
    salvarServicos(lista);
    fecharModal("modal-ob-novo-servico");
    mostrarSucesso();
    atualizarContador("js-ob-contador-servicos", lista.filter((s) => s.ativo).length);
  });

  // Produtos (mesma lógica de js/produtos.js, adaptada)
  qs("#js-ob-btn-produto").addEventListener("click", () => {
    qs("#js-ob-produto-nome").value = "";
    qs("#js-ob-produto-preco-venda").value = "";
    qs("#js-ob-produto-preco-custo").value = "";
    qs("#js-ob-produto-estoque").value = "";
    abrirModal("modal-ob-novo-produto");
  });
  qs("#js-ob-produto-salvar").addEventListener("click", () => {
    const nome = qs("#js-ob-produto-nome").value.trim();
    const precoVenda = extrairValor(qs("#js-ob-produto-preco-venda").value);
    const estoque = parseInt(qs("#js-ob-produto-estoque").value, 10);
    if (!nome || precoVenda == null || isNaN(estoque)) return;
    const hoje = hojeIso();
    const lista = obterProdutos();
    lista.push({
      id: gerarId("prod"), nome, precoVenda,
      precoCusto: extrairValor(qs("#js-ob-produto-preco-custo").value),
      estoque, diasParaAvisarParado: null, ativo: true, criadoEm: hoje, atualizadoEm: hoje,
    });
    salvarProdutos(lista);
    fecharModal("modal-ob-novo-produto");
    mostrarSucesso();
    atualizarContador("js-ob-contador-produtos", lista.filter((p) => p.ativo).length);
  });

  // Bloqueios fixos (mesma lógica de js/intervalos.js, adaptada — grade calculada
  // com os horários/grade que o usuário acabou de escolher no passo 3)
  qs("#js-ob-btn-intervalo").addEventListener("click", () => {
    qs("#js-ob-intervalo-nome").value = "";
    qsa("#js-ob-intervalo-dias .chip").forEach((c) => c.classList.remove("chip--ativo"));
    const inicio = valorDropdown("js-ob-hora-inicio") || "08:00";
    const fim = valorDropdown("js-ob-hora-fim") || "20:30";
    const grade = obterValorGrade();
    const container = qs("#js-ob-intervalo-horarios");
    container.innerHTML = "";
    gerarGradeHorarios(inicio, fim, grade).forEach((hora) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.dataset.hora = hora;
      chip.textContent = hora;
      container.appendChild(chip);
    });
    inicializarGrupoChips(container, true);
    abrirModal("modal-ob-novo-intervalo");
  });
  qs("#js-ob-intervalo-salvar").addEventListener("click", () => {
    const nome = qs("#js-ob-intervalo-nome").value.trim();
    const dias = qsa("#js-ob-intervalo-dias .chip--ativo").map((c) => c.dataset.dia);
    const horarios = qsa("#js-ob-intervalo-horarios .chip--ativo").map((c) => c.dataset.hora);
    if (!nome || dias.length === 0 || horarios.length === 0) return;
    const lista = obterBloqueiosFixos();
    lista.push({ id: gerarId("blq"), nome, diasSemana: dias, horariosBloqueados: horarios, ativo: true });
    salvarBloqueiosFixos(lista);
    fecharModal("modal-ob-novo-intervalo");
    mostrarSucesso();
    atualizarContador("js-ob-contador-intervalos", lista.filter((i) => i.ativo).length);
  });

  popularSelectsHorario();
  carregarValoresIniciais();
  atualizarMockup();
  garantirFormasPagamentoPadrao();
  popularCadastrosExistentes();

  /* ---------- Retomar num passo específico (?passo=N) — usado ao voltar
     de whatsapp.html?voltarOnboarding=N sem perder o lugar no fluxo
     (Victor, 2026-08-17). Sem transição, só posiciona direto. ---------- */
  const passoUrl = parseInt(new URLSearchParams(location.search).get("passo"), 10);
  if (!isNaN(passoUrl) && passoUrl > 0 && passoUrl < passos.length) {
    mostrarPasso(passoUrl);
  }
});
