/* ============================================================
   AGENDA V3 — Tela Meu perfil (Fase 4)
   WhatsApp, nome do estabelecimento, nome do profissional e
   endereço são reais (agendaV3:whatsapp / agendaV3:config,
   mesmos campos que o Onboarding já preenche). Os demais campos
   da tela (e-mail, senha, plano) seguem decorativos até a Fase 5.
   ============================================================ */

function renderizarWhatsappPerfil() {
  const numero = obterWhatsapp().numero || "";
  qs("#js-perfil-whatsapp-numero").textContent = numero || "Nenhum número cadastrado";
}

function renderizarNegocioPerfil() {
  const config = obterConfig();
  const estabelecimento = config.nomeEstabelecimento || "";
  const profissional = config.nomeProfissional || "";
  const endereco = config.endereco || "";

  qs("#js-perfil-estabelecimento").textContent = estabelecimento || "Nenhum nome cadastrado";
  qs("#js-perfil-profissional").textContent = profissional || "Nenhum nome cadastrado";
  qs("#js-perfil-endereco").textContent = endereco || "Nenhum endereço cadastrado";

  qs("#js-perfil-estabelecimento-topo").textContent = estabelecimento || "Nenhum nome cadastrado";
  qs("#js-perfil-profissional-topo").textContent = profissional || "Nenhum nome cadastrado";
  qs("#js-perfil-avatar").textContent = profissional ? iniciaisCliente(profissional) : "?";
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarWhatsappPerfil();
  renderizarNegocioPerfil();

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

  qs("[data-abrir-modal='modal-editar-estabelecimento']").addEventListener("click", () => {
    qs("#js-estabelecimento-input").value = obterConfig().nomeEstabelecimento || "";
  });

  qs("#js-estabelecimento-salvar").addEventListener("click", () => {
    const config = obterConfig();
    config.nomeEstabelecimento = qs("#js-estabelecimento-input").value.trim();
    salvarConfig(config);
    renderizarNegocioPerfil();
    fecharModal("modal-editar-estabelecimento");
    mostrarSucesso();
  });

  qs("[data-abrir-modal='modal-editar-profissional']").addEventListener("click", () => {
    qs("#js-profissional-input").value = obterConfig().nomeProfissional || "";
  });

  qs("#js-profissional-salvar").addEventListener("click", () => {
    const config = obterConfig();
    config.nomeProfissional = qs("#js-profissional-input").value.trim();
    salvarConfig(config);
    renderizarNegocioPerfil();
    fecharModal("modal-editar-profissional");
    mostrarSucesso();
  });

  qs("[data-abrir-modal='modal-editar-endereco-perfil']").addEventListener("click", () => {
    qs("#js-endereco-perfil-input").value = obterConfig().endereco || "";
  });

  qs("#js-endereco-perfil-salvar").addEventListener("click", () => {
    const config = obterConfig();
    config.endereco = qs("#js-endereco-perfil-input").value.trim();
    salvarConfig(config);
    renderizarNegocioPerfil();
    fecharModal("modal-editar-endereco-perfil");
    mostrarSucesso();
  });
});
