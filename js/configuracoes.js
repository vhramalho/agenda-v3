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
  }

  /* Primeiro/Último horário viraram dropdown-picker inline (2026-09-01,
     js/chips.js) — escolha aplica na hora, sem passo de "Salvar". Validação
     cruzada (início não pode passar do fim e vice-versa) agora acontece no
     próprio clique da opção: `aoSelecionar` retorna `false` pra rejeitar e
     manter o menu aberto, com um aviso explicando por quê. */
  ["js-primeiro-horario-row", "js-ultimo-horario-row"].forEach((id) => {
    const wrapper = qs(`#${id}`);
    const campo = id === "js-primeiro-horario-row" ? "horaInicio" : "horaFim";
    montarOpcoesDropdownPicker(qs(".dropdown-picker__menu", wrapper), GRADE_BASE_HORARIOS, obterConfig()[campo]);
    inicializarDropdownPicker(wrapper, (valor) => {
      const config = obterConfig();
      if (campo === "horaInicio" && valor >= config.horaFim) {
        mostrarAviso("Primeiro horário precisa ser antes do último");
        return false;
      }
      if (campo === "horaFim" && valor <= config.horaInicio) {
        mostrarAviso("Último horário precisa ser depois do primeiro");
        return false;
      }
      config[campo] = valor;
      salvarConfig(config);
      atualizarTextosAgenda();
      qsa(".time-select__option", wrapper).forEach((o) => o.classList.toggle("is-ativo", o.dataset.valor === valor));
    });
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
