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
  ],
};

function inserirTokenNoTextarea(textarea, token) {
  const inicio = textarea.selectionStart ?? textarea.value.length;
  const fim = textarea.selectionEnd ?? textarea.value.length;
  const valor = textarea.value;
  textarea.value = valor.slice(0, inicio) + token + valor.slice(fim);
  const novaPosicao = inicio + token.length;
  textarea.focus();
  textarea.setSelectionRange(novaPosicao, novaPosicao);
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
  qsa(".js-msg-preview").forEach((el) => {
    el.textContent = config[el.dataset.campoPreview] || "";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarWhatsapp();

  qs("#js-whatsapp-testar").addEventListener("click", () => {
    const numero = obterWhatsapp().numero || "";
    const digitos = numero.replace(/\D/g, "");
    if (!digitos) return;
    window.open(`https://wa.me/55${digitos}`, "_blank");
  });

  qsa("[data-campo]").forEach((botao) => {
    botao.addEventListener("click", () => {
      campoMensagemAtual = botao.dataset.campo;
      qs("#js-mensagem-titulo").textContent = TITULOS_MENSAGEM[campoMensagemAtual] || "Editar mensagem";
      qs("#js-mensagem-texto").value = obterWhatsapp()[campoMensagemAtual] || "";
      renderizarChipsMensagem(campoMensagemAtual);
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
    salvarWhatsapp(config);
    renderizarWhatsapp();
    fecharModal("modal-confirmar-restaurar-mensagens");
    mostrarSucesso();
  });
});
