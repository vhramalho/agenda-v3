/* ============================================================
   AGENDA V3 — Tela Meu perfil (Fase 4)
   Por enquanto só o número do WhatsApp é real (mesma chave
   agendaV3:whatsapp usada em Onboarding e na tela WhatsApp);
   os demais campos da tela seguem decorativos até a Fase 5.
   ============================================================ */

function renderizarWhatsappPerfil() {
  const numero = obterWhatsapp().numero || "";
  qs("#js-perfil-whatsapp-numero").textContent = numero || "Nenhum número cadastrado";
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarWhatsappPerfil();

  qs("[data-abrir-modal='modal-editar-numero']").addEventListener("click", () => {
    qs("#js-numero-input").value = obterWhatsapp().numero || "";
  });

  qs("#js-numero-salvar").addEventListener("click", () => {
    const config = obterWhatsapp();
    config.numero = qs("#js-numero-input").value.trim();
    salvarWhatsapp(config);
    renderizarWhatsappPerfil();
    fecharModal("modal-editar-numero");
    mostrarSucesso();
  });
});
