/* ============================================================
   AGENDA V3 — Navegação do Onboarding
   Troca entre as 6 telas internas (boas-vindas + 5 passos), com
   transição em slide entre elas. Tema e cor aplicam de verdade e
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

  /* Horário início/fim viraram <select> (abrem o seletor giratório nativo
     no iOS) — populados aqui com a mesma grade de 30 em 30min usada em
     Intervalos/Agenda, em vez de duplicar a lista (auditoria pré-backend,
     correção do onboarding, 2026-08-10). */
  function popularSelectsHorario() {
    const opcoes = gerarGradeHorarios("00:00", "23:30", 30);
    const html = opcoes.map((h) => `<option value="${h}">${h}</option>`).join("");
    qs("#js-ob-hora-inicio").innerHTML = html;
    qs("#js-ob-hora-fim").innerHTML = html;
  }

  function carregarValoresIniciais() {
    const config = obterConfig();
    const whatsapp = obterWhatsapp();
    qs("#js-ob-profissional").value = config.nomeProfissional || "";
    qs("#js-ob-whatsapp").value = whatsapp.numero || "";
    qs("#js-ob-endereco").value = config.endereco || "";
    qs("#js-ob-hora-inicio").value = config.horaInicio || "08:00";
    qs("#js-ob-hora-fim").value = config.horaFim || "20:30";
    definirValorGrade(config.intervaloGrade || 30);

    const tema = config.tema || "escuro";
    qsa(".opcao-card[data-tema]").forEach((c) => c.classList.toggle("is-selecionada", c.dataset.tema === tema));
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
    config.endereco = qs("#js-ob-endereco").value.trim();
    salvarConfig(config);
    const whatsapp = obterWhatsapp();
    whatsapp.numero = qs("#js-ob-whatsapp").value.trim();
    salvarWhatsapp(whatsapp);
  }

  function salvarPasso3() {
    const config = obterConfig();
    const horaInicio = qs("#js-ob-hora-inicio").value;
    const horaFim = qs("#js-ob-hora-fim").value;
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
    const inicio = qs("#js-ob-hora-inicio").value || "08:00";
    const fim = qs("#js-ob-hora-fim").value || "20:30";
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

  ["js-ob-hora-inicio", "js-ob-hora-fim"].forEach((id) => {
    qs(`#${id}`).addEventListener("change", atualizarMockup);
  });
  qs("#js-ob-grade").addEventListener("click", (evento) => {
    if (!evento.target.closest(".chip")) return;
    atualizarMockup();
    vibrar();
  });

  /* ---------- Navegação entre passos (slide) ---------- */
  function mostrarPasso(indice, direcao) {
    const atualEl = passos[atual];
    const novoEl = passos[indice];
    const saiClasse = direcao === "tras" ? "saindo-dir" : "saindo-esq";
    const entraClasse = direcao === "tras" ? "entrando-esq" : "entrando-dir";

    atualEl.classList.add(saiClasse);
    setTimeout(() => {
      atualEl.classList.remove("is-active", saiClasse);
      novoEl.classList.add(entraClasse);
      novoEl.classList.add("is-active");
      void novoEl.offsetWidth;
      novoEl.classList.remove(entraClasse);
      pontos.forEach((p, i) => p.classList.toggle("is-active", i === indice));
      atual = indice;
      mockupWrap.classList.toggle("is-hidden", indice !== 2 && indice !== 3);
      if (indice === 2 || indice === 3) atualizarMockup();
      if (indice === 5) {
        completarComPadroes();
        salvarOnboarding({ concluido: true });
      }
    }, 200);
  }

  qsa("[data-ir-para]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const destino = Number(botao.dataset.irPara);
      mostrarPasso(destino, "frente");
    });
  });

  qsa("[data-proximo]").forEach((botao) => {
    botao.addEventListener("click", () => {
      vibrar();
      if (atual === 1) salvarPasso1();
      if (atual === 3) salvarPasso3();
      if (atual < passos.length - 1) mostrarPasso(atual + 1, "frente");
    });
  });

  qsa("[data-anterior]").forEach((botao) => {
    botao.addEventListener("click", () => {
      if (atual > 0) mostrarPasso(atual - 1, "tras");
    });
  });

  qsa(".opcao-card[data-tema]").forEach((card) => {
    card.addEventListener("click", () => {
      qsa(".opcao-card[data-tema]").forEach((c) => c.classList.remove("is-selecionada"));
      card.classList.add("is-selecionada");
      definirTema(card.dataset.tema);
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
  function chipCadastro(texto) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = texto;
    return chip;
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
    qs("#js-ob-lista-servicos").appendChild(chipCadastro(nome));
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
    qs("#js-ob-lista-produtos").appendChild(chipCadastro(nome));
  });

  // Bloqueios fixos (mesma lógica de js/intervalos.js, adaptada — grade calculada
  // com os horários/grade que o usuário acabou de escolher no passo 3)
  qs("#js-ob-btn-intervalo").addEventListener("click", () => {
    qs("#js-ob-intervalo-nome").value = "";
    qsa("#js-ob-intervalo-dias .chip").forEach((c) => c.classList.remove("chip--ativo"));
    const inicio = qs("#js-ob-hora-inicio").value || "08:00";
    const fim = qs("#js-ob-hora-fim").value || "20:30";
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
    qs("#js-ob-lista-intervalos").appendChild(chipCadastro(nome));
  });

  popularSelectsHorario();
  carregarValoresIniciais();
  atualizarMockup();
});
