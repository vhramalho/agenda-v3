/* ============================================================
   AGENDA V3 — Verificação de versão do aplicativo (Fase 4)
   Compara a versão carregada com version.json no servidor
   (fetch sem cache) para avisar quando há uma atualização.
   Ao commitar mudanças relevantes, atualizar em conjunto:
   este BUILD_VERSAO, o "build" de version.json, e o ?v= das
   tags <link>/<script> nas páginas .html.
   ============================================================ */

const VERSAO_APP = "1.0.0";
const BUILD_VERSAO = "20260701a";

document.addEventListener("DOMContentLoaded", () => {
  const botao = qs("#js-btn-versao");
  if (!botao) return;

  qs("#js-versao-numero").textContent = VERSAO_APP;

  botao.addEventListener("click", async () => {
    const mensagem = qs("#js-versao-mensagem");
    const botaoAtualizar = qs("#js-versao-atualizar");
    mensagem.textContent = "Verificando...";
    botaoAtualizar.classList.add("is-hidden");
    abrirModal("modal-versao");

    try {
      const resposta = await fetch(`version.json?_=${Date.now()}`, { cache: "no-store" });
      const dados = await resposta.json();
      if (dados.build && dados.build !== BUILD_VERSAO) {
        mensagem.textContent = `Nova versão disponível (${dados.versao || "?"})! Toque em "Atualizar agora" para buscar as últimas novidades.`;
        botaoAtualizar.classList.remove("is-hidden");
      } else {
        mensagem.textContent = `Você já está na versão mais recente (${VERSAO_APP}).`;
      }
    } catch (erro) {
      mensagem.textContent = "Não foi possível verificar agora. Confira sua conexão com a internet.";
    }
  });

  qs("#js-versao-atualizar").addEventListener("click", () => {
    location.href = location.pathname + "?atualizado=" + Date.now();
  });
});
