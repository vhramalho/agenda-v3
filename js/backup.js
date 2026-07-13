/* ============================================================
   SWIPO — Tela Backup (Fase 3, Etapa 10)
   Exporta/importa as 9 chaves agendaV3:* num único arquivo .json.
   Tudo ou nada — não faz merge, só substitui tudo na importação
   (com confirmação explícita, igual o aviso na tela já dizia).
   ============================================================ */

const CHAVE_ULTIMO_BACKUP = "agendaV3:ultimoBackup";
let arquivoBackupPendente = null;

function renderizarUltimoBackup() {
  const iso = localStorage.getItem(CHAVE_ULTIMO_BACKUP);
  const badge = qs("#js-backup-badge");
  if (!iso) {
    qs("#js-backup-ultimo").textContent = "Nenhum backup ainda";
    badge.classList.add("is-hidden");
    return;
  }
  const data = new Date(iso);
  const hojeStr = hojeIso();
  const dataStr = dataParaIsoLocal(data);
  const prefixo = dataStr === hojeStr ? "Hoje" : formatarDataCurta(dataStr);
  qs("#js-backup-ultimo").textContent = `${prefixo}, ${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`;
  badge.classList.remove("is-hidden");
}

function dataParaIsoLocal(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarUltimoBackup();

  qs("#js-backup-exportar").addEventListener("click", () => {
    const dados = {};
    Object.entries(CHAVES).forEach(([nome, chave]) => {
      dados[nome] = lerChave(chave, null);
    });
    const conteudo = JSON.stringify({ geradoEm: new Date().toISOString(), dados }, null, 2);
    const blob = new Blob([conteudo], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agenda-v3-backup-${hojeIso()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    localStorage.setItem(CHAVE_ULTIMO_BACKUP, new Date().toISOString());
    renderizarUltimoBackup();
    mostrarSucesso();
  });

  qs("#js-backup-importar-btn").addEventListener("click", () => {
    qs("#js-backup-importar-arquivo").click();
  });

  qs("#js-backup-importar-arquivo").addEventListener("change", (evento) => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const json = JSON.parse(leitor.result);
        if (!json.dados) throw new Error("formato inválido");
        arquivoBackupPendente = json.dados;
        abrirModal("modal-confirmar-importar-backup");
      } catch (erro) {
        alert("Não foi possível ler esse arquivo. Verifique se é um backup válido do Swipo.");
      }
    };
    leitor.readAsText(arquivo);
  });

  qs("#js-confirmar-importar-backup").addEventListener("click", () => {
    if (!arquivoBackupPendente) return;
    Object.entries(CHAVES).forEach(([nome, chave]) => {
      if (arquivoBackupPendente[nome] !== undefined && arquivoBackupPendente[nome] !== null) {
        salvarChave(chave, arquivoBackupPendente[nome]);
      }
    });
    arquivoBackupPendente = null;
    fecharModal("modal-confirmar-importar-backup");
    window.location.href = "configuracoes.html";
  });
});
