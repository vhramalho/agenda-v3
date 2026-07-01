/* ============================================================
   AGENDA V3 — Tela Configurações
   Liga os toques em "Tema" e "Cor principal" às funções já
   existentes em tema.js (Fase 2: alternar tema / cor principal).
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const linhaTema = qs("#js-tema-row");
  const valorTema = qs("#js-tema-valor");
  const linhaCor = qs("#js-cor-row");
  const valorCor = qs("#js-cor-valor");
  const pontoCor = qs("#js-cor-ponto");
  const chevronCor = qs("#js-cor-chevron");
  const painelCor = qs("#js-cor-picker");
  const containerSwatches = qs("#js-cor-swatches");

  function atualizarTextos() {
    const config = lerConfig();
    valorTema.textContent = nomeDoTema(config.tema || "escuro");
    valorCor.textContent = nomeDaCor(config.corPrincipal || "roxo");
    pontoCor.style.background = "var(--primary)";
    qsa(".cor-swatch", containerSwatches).forEach((sw) => {
      sw.classList.toggle("is-selecionada", sw.dataset.cor === (config.corPrincipal || "roxo"));
    });
  }

  CORES_PRINCIPAIS.forEach((cor) => {
    const swatch = document.createElement("span");
    swatch.className = "cor-swatch";
    swatch.dataset.cor = cor.id;
    swatch.style.background = cor.hex;
    swatch.setAttribute("aria-label", cor.nome);
    swatch.addEventListener("click", () => {
      definirCorPrincipal(cor.id);
      atualizarTextos();
    });
    containerSwatches.appendChild(swatch);
  });

  linhaTema.addEventListener("click", () => {
    const atual = lerConfig().tema === "claro" ? "claro" : "escuro";
    definirTema(atual === "claro" ? "escuro" : "claro");
    atualizarTextos();
  });

  linhaCor.addEventListener("click", () => {
    painelCor.classList.toggle("is-hidden");
    chevronCor.style.transform = painelCor.classList.contains("is-hidden") ? "" : "rotate(90deg)";
  });

  atualizarTextos();

  /* ---------- Agenda: horários, grade, tempo padrão, modo de compartilhamento ---------- */

  const GRADE_BASE_HORARIOS = gerarGradeHorarios("00:00", "23:30", 30);

  function montarChipsHorario(containerId, valorAtual) {
    const container = qs(`#${containerId}`);
    container.innerHTML = "";
    GRADE_BASE_HORARIOS.forEach((hora) => {
      const chip = document.createElement("span");
      chip.className = "chip" + (hora === valorAtual ? " chip--ativo" : "");
      chip.dataset.valor = hora;
      chip.textContent = hora;
      container.appendChild(chip);
    });
    inicializarGrupoChips(container, false);
  }

  function marcarChipValor(containerId, valor) {
    qsa(".chip", qs(`#${containerId}`)).forEach((chip) => {
      chip.classList.toggle("chip--ativo", chip.dataset.valor === String(valor));
    });
  }

  function valorSelecionado(containerId) {
    const ativo = qs(`#${containerId} .chip--ativo`);
    return ativo ? ativo.dataset.valor : null;
  }

  function atualizarTextosAgenda() {
    const config = obterConfig();
    qs("#js-primeiro-horario-valor").textContent = config.horaInicio;
    qs("#js-ultimo-horario-valor").textContent = config.horaFim;
    qs("#js-grade-valor").textContent = `${config.intervaloGrade} minutos`;
    qs("#js-tempo-padrao-valor").textContent = `${config.tempoPadraoAtendimento} minutos`;
    qs("#js-modo-compartilhamento-valor").textContent = config.modoCompartilhamento === "simples" ? "Simples" : "Estratégico";
  }

  qs("#js-primeiro-horario-row").addEventListener("click", () => {
    montarChipsHorario("js-primeiro-horario-chips", obterConfig().horaInicio);
    abrirModal("modal-primeiro-horario");
  });
  qs("#js-primeiro-horario-salvar").addEventListener("click", () => {
    const novoValor = valorSelecionado("js-primeiro-horario-chips");
    const config = obterConfig();
    if (!novoValor || novoValor >= config.horaFim) return;
    config.horaInicio = novoValor;
    salvarConfig(config);
    atualizarTextosAgenda();
    fecharModal("modal-primeiro-horario");
  });

  qs("#js-ultimo-horario-row").addEventListener("click", () => {
    montarChipsHorario("js-ultimo-horario-chips", obterConfig().horaFim);
    abrirModal("modal-ultimo-horario");
  });
  qs("#js-ultimo-horario-salvar").addEventListener("click", () => {
    const novoValor = valorSelecionado("js-ultimo-horario-chips");
    const config = obterConfig();
    if (!novoValor || novoValor <= config.horaInicio) return;
    config.horaFim = novoValor;
    salvarConfig(config);
    atualizarTextosAgenda();
    fecharModal("modal-ultimo-horario");
  });

  qs("#js-grade-row").addEventListener("click", () => {
    marcarChipValor("js-grade-chips", obterConfig().intervaloGrade);
    abrirModal("modal-grade");
  });
  qs("#js-grade-salvar").addEventListener("click", () => {
    const novoValor = valorSelecionado("js-grade-chips");
    if (!novoValor) return;
    const config = obterConfig();
    config.intervaloGrade = parseInt(novoValor, 10);
    salvarConfig(config);
    atualizarTextosAgenda();
    fecharModal("modal-grade");
  });

  qs("#js-tempo-padrao-row").addEventListener("click", () => {
    marcarChipValor("js-tempo-padrao-chips", obterConfig().tempoPadraoAtendimento);
    abrirModal("modal-tempo-padrao");
  });
  qs("#js-tempo-padrao-salvar").addEventListener("click", () => {
    const novoValor = valorSelecionado("js-tempo-padrao-chips");
    if (!novoValor) return;
    const config = obterConfig();
    config.tempoPadraoAtendimento = parseInt(novoValor, 10);
    salvarConfig(config);
    atualizarTextosAgenda();
    fecharModal("modal-tempo-padrao");
  });

  qs("#js-modo-compartilhamento-row").addEventListener("click", () => {
    marcarChipValor("js-modo-compartilhamento-chips", obterConfig().modoCompartilhamento);
    abrirModal("modal-modo-compartilhamento");
  });
  qs("#js-modo-compartilhamento-salvar").addEventListener("click", () => {
    const novoValor = valorSelecionado("js-modo-compartilhamento-chips");
    if (!novoValor) return;
    const config = obterConfig();
    config.modoCompartilhamento = novoValor;
    salvarConfig(config);
    atualizarTextosAgenda();
    fecharModal("modal-modo-compartilhamento");
  });

  atualizarTextosAgenda();

  /* ---------- Dados: redefinir onboarding, limpar agenda, apagar tudo ---------- */

  qs("#js-redefinir-onboarding").addEventListener("click", () => {
    salvarOnboarding({ concluido: false });
    window.location.href = "onboarding.html";
  });

  qs("#js-confirmar-limpar-agenda").addEventListener("click", () => {
    salvarAgendamentos([]);
    fecharModal("modal-confirmar-limpar-agenda");
  });

  qs("[data-abrir-modal='modal-confirmar-apagar-dados']").addEventListener("click", () => {
    qs("#js-apagar-dados-confirmacao").value = "";
    qs("#js-confirmar-apagar-dados").disabled = true;
  });

  qs("#js-apagar-dados-confirmacao").addEventListener("input", (evento) => {
    qs("#js-confirmar-apagar-dados").disabled = evento.target.value.trim().toLowerCase() !== "resetar";
  });

  qs("#js-confirmar-apagar-dados").addEventListener("click", () => {
    Object.values(CHAVES).forEach((chave) => localStorage.removeItem(chave));
    window.location.href = "onboarding.html";
  });
});
