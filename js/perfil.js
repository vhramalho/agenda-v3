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

// Upload de foto de perfil desativado (2026-07-12) — não usa em lugar nenhum
// do app. Comentado, não removido; ver também perfil.html (botões/input de
// foto) e os 3 listeners abaixo (editar/trocar/remover foto).
function renderizarAvatarPerfil(config) {
  const avatar = qs("#js-perfil-avatar");
  // const botaoRemover = qs("#js-perfil-remover-foto");
  // if (config.fotoPerfil) {
  //   avatar.innerHTML = "";
  //   const img = document.createElement("img");
  //   img.src = config.fotoPerfil;
  //   img.alt = "Foto de perfil";
  //   avatar.appendChild(img);
  //   botaoRemover.classList.remove("is-hidden");
  // } else {
  //   avatar.textContent = config.nomeProfissional ? iniciaisCliente(config.nomeProfissional) : "?";
  //   botaoRemover.classList.add("is-hidden");
  // }
  avatar.textContent = config.nomeProfissional ? iniciaisCliente(config.nomeProfissional) : "?";
}

function renderizarNegocioPerfil() {
  const config = obterConfig();
  const estabelecimento = config.nomeEstabelecimento || "";
  const profissional = config.nomeProfissional || "";
  const endereco = config.endereco || "";
  const linkMapa = config.linkMapa || "";

  qs("#js-perfil-estabelecimento").textContent = estabelecimento || "Nenhum nome cadastrado";
  qs("#js-perfil-profissional").textContent = profissional || "Nenhum nome cadastrado";
  qs("#js-perfil-endereco").textContent = endereco || "Nenhum endereço cadastrado";
  qs("#js-perfil-link-mapa").textContent = linkMapa || "Gerado automaticamente pelo endereço";

  qs("#js-perfil-estabelecimento-topo").textContent = estabelecimento || "Nenhum nome cadastrado";
  qs("#js-perfil-profissional-topo").textContent = profissional || "Nenhum nome cadastrado";
  renderizarAvatarPerfil(config);
}

// function redimensionarImagem(arquivo, tamanhoMax) {
//   return new Promise((resolve, reject) => {
//     const leitor = new FileReader();
//     leitor.onload = (e) => {
//       const img = new Image();
//       img.onload = () => {
//         const escala = Math.min(1, tamanhoMax / Math.max(img.width, img.height));
//         const largura = Math.round(img.width * escala);
//         const altura = Math.round(img.height * escala);
//         const canvas = document.createElement("canvas");
//         canvas.width = largura;
//         canvas.height = altura;
//         canvas.getContext("2d").drawImage(img, 0, 0, largura, altura);
//         resolve(canvas.toDataURL("image/jpeg", 0.85));
//       };
//       img.onerror = () => reject(new Error("Não foi possível ler a imagem"));
//       img.src = e.target.result;
//     };
//     leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
//     leitor.readAsDataURL(arquivo);
//   });
// }

document.addEventListener("DOMContentLoaded", () => {
  renderizarWhatsappPerfil();
  renderizarNegocioPerfil();

  // qs("#js-perfil-editar-foto").addEventListener("click", () => {
  //   qs("#js-perfil-foto-input").click();
  // });

  // qs("#js-perfil-foto-input").addEventListener("change", async (evento) => {
  //   const arquivo = evento.target.files[0];
  //   evento.target.value = "";
  //   if (!arquivo) return;
  //   try {
  //     const dataUri = await redimensionarImagem(arquivo, 300);
  //     const config = obterConfig();
  //     config.fotoPerfil = dataUri;
  //     salvarConfig(config);
  //     renderizarAvatarPerfil(config);
  //     mostrarSucesso();
  //   } catch (erro) {
  //     mostrarAviso("Não foi possível carregar essa foto");
  //   }
  // });

  // qs("#js-perfil-remover-foto").addEventListener("click", () => {
  //   const config = obterConfig();
  //   delete config.fotoPerfil;
  //   salvarConfig(config);
  //   renderizarAvatarPerfil(config);
  //   mostrarSucesso();
  // });

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

  qs("[data-abrir-modal='modal-editar-link-mapa']").addEventListener("click", () => {
    qs("#js-link-mapa-input").value = obterConfig().linkMapa || "";
  });

  qs("#js-link-mapa-salvar").addEventListener("click", () => {
    const config = obterConfig();
    config.linkMapa = qs("#js-link-mapa-input").value.trim();
    salvarConfig(config);
    renderizarNegocioPerfil();
    fecharModal("modal-editar-link-mapa");
    mostrarSucesso();
  });
});
