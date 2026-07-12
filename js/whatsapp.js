/* ============================================================
   AGENDA V3 — Tela WhatsApp (Fase 3, Etapa 10)
   Número e as 4 mensagens ligados de verdade a agendaV3:whatsapp.
   ============================================================ */

let campoMensagemAtual = null;

const TITULOS_MENSAGEM = {
  mensagemHorarios: "Horários disponíveis",
  mensagemLembrete: "Lembrete de horário",
  mensagemAniversario: "Aniversário",
  mensagemEndereco: "Endereço",
  mensagemSemRetornar: "Sem retornar",
};

const PLACEHOLDERS_MENSAGEM = {
  mensagemHorarios: [{ token: "{saudacao}", label: "Saudação" }],
  mensagemLembrete: [
    { token: "{saudacao}", label: "Saudação" },
    { token: "{nome}", label: "Nome" },
    { token: "{dia}", label: "Dia" },
    { token: "{hora}", label: "Hora" },
    { token: "{endereco}", label: "Endereço" },
  ],
  mensagemAniversario: [
    { token: "{saudacao}", label: "Saudação" },
    { token: "{nome}", label: "Nome" },
  ],
  mensagemEndereco: [
    { token: "{saudacao}", label: "Saudação" },
    { token: "{nome}", label: "Nome" },
    { token: "{endereco}", label: "Endereço" },
    { token: "{mapa}", label: "Mapa" },
  ],
  mensagemSemRetornar: [
    { token: "{saudacao}", label: "Saudação" },
    { token: "{nome}", label: "Nome" },
    { token: "{dias}", label: "Dias sem vir" },
  ],
};

function dadosExemploPreview() {
  const config = obterConfig();
  const endereco = config.endereco || "Rua Exemplo, 123";
  return {
    nome: "Maria",
    hora: "14:00",
    dia: "amanhã",
    dias: "30",
    endereco,
    mapa: gerarLinkMapa(endereco, config.linkMapa) || "(link do mapa)",
  };
}

/* Só a mensagem de introdução é editável aqui — a lista de horários em si
   é gerada na hora (js/agenda.js, montarMensagemHorarios), com os dias e
   horários reais do período escolhido em "Compartilhar horários". Pra dar
   uma ideia de como a mensagem completa fica, a prévia de mensagemHorarios
   acrescenta um exemplo ilustrativo de 2 dias, no mesmo formato usado de
   verdade (formatarDataWhatsapp: "Dia da semana DD/MM" + um horário por
   linha) — são só dados de exemplo, não vêm da agenda real. */
const EXEMPLO_LISTA_HORARIOS = "\n\nDomingo 12/07\n09:00\n09:30\n10:00\n10:30\n\nSegunda-feira 13/07\n09:00\n14:00\n15:30";

function atualizarPreviewMensagem() {
  const preview = qs("#js-mensagem-preview");
  if (!preview) return;
  let texto = substituirPlaceholders(qs("#js-mensagem-texto").value, dadosExemploPreview());
  if (campoMensagemAtual === "mensagemHorarios") texto += EXEMPLO_LISTA_HORARIOS;
  preview.textContent = texto;
}

function inserirTokenNoTextarea(textarea, token) {
  const inicio = textarea.selectionStart ?? textarea.value.length;
  const fim = textarea.selectionEnd ?? textarea.value.length;
  const valor = textarea.value;
  textarea.value = valor.slice(0, inicio) + token + valor.slice(fim);
  const novaPosicao = inicio + token.length;
  textarea.focus();
  textarea.setSelectionRange(novaPosicao, novaPosicao);
  atualizarPreviewMensagem();
}

function renderizarChipsMensagem(campo) {
  const container = qs("#js-mensagem-chips");
  const textarea = qs("#js-mensagem-texto");
  container.innerHTML = "";
  (PLACEHOLDERS_MENSAGEM[campo] || []).forEach((item) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = `+ ${item.label}`;
    chip.addEventListener("click", () => inserirTokenNoTextarea(textarea, item.token));
    container.appendChild(chip);
  });
}

function renderizarWhatsapp() {
  const config = obterWhatsapp();
  qs("#js-whatsapp-numero").textContent = config.numero || "Nenhum número cadastrado";
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarWhatsapp();

  qs("#js-whatsapp-testar").addEventListener("click", () => {
    const numero = obterWhatsapp().numero || "";
    const digitos = numero.replace(/\D/g, "");
    if (!digitos) return;
    window.open(`https://wa.me/55${digitos}`, "_blank");
  });

  qs("#js-mensagem-texto").addEventListener("input", atualizarPreviewMensagem);

  qsa("[data-campo]").forEach((botao) => {
    botao.addEventListener("click", () => {
      campoMensagemAtual = botao.dataset.campo;
      qs("#js-mensagem-titulo").textContent = TITULOS_MENSAGEM[campoMensagemAtual] || "Editar mensagem";
      qs("#js-mensagem-texto").value = obterWhatsapp()[campoMensagemAtual] || "";
      renderizarChipsMensagem(campoMensagemAtual);
      atualizarPreviewMensagem();
      abrirModal("modal-editar-mensagem");
    });
  });

  qs("#js-mensagem-salvar").addEventListener("click", () => {
    if (!campoMensagemAtual) return;
    const config = obterWhatsapp();
    config[campoMensagemAtual] = qs("#js-mensagem-texto").value.trim();
    salvarWhatsapp(config);
    renderizarWhatsapp();
    fecharModal("modal-editar-mensagem");
    mostrarSucesso();
  });

  qs("#js-confirmar-restaurar-mensagens").addEventListener("click", () => {
    const padrao = seedWhatsapp();
    const config = obterWhatsapp();
    config.mensagemHorarios = padrao.mensagemHorarios;
    config.mensagemLembrete = padrao.mensagemLembrete;
    config.mensagemAniversario = padrao.mensagemAniversario;
    config.mensagemEndereco = padrao.mensagemEndereco;
    config.mensagemSemRetornar = padrao.mensagemSemRetornar;
    salvarWhatsapp(config);
    renderizarWhatsapp();
    fecharModal("modal-confirmar-restaurar-mensagens");
    mostrarSucesso();
  });
});
