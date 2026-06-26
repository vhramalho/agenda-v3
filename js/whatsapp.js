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

function renderizarWhatsapp() {
  const config = obterWhatsapp();
  qs("#js-whatsapp-numero").textContent = config.numero || "Nenhum número cadastrado";
  qsa(".js-msg-preview").forEach((el) => {
    el.textContent = config[el.dataset.campoPreview] || "";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarWhatsapp();

  qs("#js-whatsapp-testar").addEventListener("click", (evento) => {
    evento.stopPropagation();
    const numero = obterWhatsapp().numero || "";
    const digitos = numero.replace(/\D/g, "");
    if (!digitos) return;
    window.open(`https://wa.me/55${digitos}`, "_blank");
  });

  qs("#js-whatsapp-numero-row").addEventListener("click", () => {
    qs("#js-numero-input").value = obterWhatsapp().numero || "";
    abrirModal("modal-editar-numero");
  });

  qs("#js-numero-salvar").addEventListener("click", () => {
    const config = obterWhatsapp();
    config.numero = qs("#js-numero-input").value.trim();
    salvarWhatsapp(config);
    renderizarWhatsapp();
    fecharModal("modal-editar-numero");
  });

  qsa("[data-campo]").forEach((botao) => {
    botao.addEventListener("click", () => {
      campoMensagemAtual = botao.dataset.campo;
      qs("#js-mensagem-titulo").textContent = TITULOS_MENSAGEM[campoMensagemAtual] || "Editar mensagem";
      qs("#js-mensagem-texto").value = obterWhatsapp()[campoMensagemAtual] || "";
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
  });
});
