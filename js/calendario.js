/* ============================================================
   AGENDA V3 — Calendário e seletor de mês (Fase 2)
   Gera a grade real de dias do mês (matemática de calendário,
   não dado salvo) e permite navegar entre meses. Tocar num dia
   apenas seleciona e fecha o modal — não cria agendamento real
   ainda (isso é Fase 3).
   ============================================================ */

const MESES_NOME = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function criarCelulaDia(numero, foraDoMes, aoSelecionar) {
  const span = document.createElement("span");
  span.className = "cal-grid__day" + (foraDoMes ? " cal-grid__day--fora" : "");
  span.textContent = String(numero).padStart(2, "0");
  if (!foraDoMes && aoSelecionar) {
    span.addEventListener("click", () => aoSelecionar(span));
  }
  return span;
}

function gerarGradeCalendario(container, ano, mes, diaAtivo, aoSelecionar) {
  container.innerHTML = "";
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasMesAnterior = new Date(ano, mes, 0).getDate();

  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    container.appendChild(criarCelulaDia(diasMesAnterior - i, true));
  }
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const celula = criarCelulaDia(dia, false, aoSelecionar);
    if (dia === diaAtivo) celula.classList.add("cal-grid__day--ativo");
    container.appendChild(celula);
  }
  const totalCelulas = primeiroDiaSemana + diasNoMes;
  const restante = (7 - (totalCelulas % 7)) % 7;
  for (let dia = 1; dia <= restante; dia++) {
    container.appendChild(criarCelulaDia(dia, true));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ---------- Modal de calendário (Agenda) ----------
  const rotuloMes = qs("#js-cal-mes-label");
  const gradeDias = qs("#js-cal-dias");

  if (rotuloMes && gradeDias) {
    const hoje = new Date();
    let calAno = hoje.getFullYear();
    let calMes = hoje.getMonth();
    let calDiaAtivo = hoje.getDate();

    function atualizarCalendario() {
      rotuloMes.textContent = `${MESES_NOME[calMes]} ${calAno}`;
      gerarGradeCalendario(gradeDias, calAno, calMes, calDiaAtivo, (celula) => {
        qsa(".cal-grid__day", gradeDias).forEach((d) => d.classList.remove("cal-grid__day--ativo"));
        celula.classList.add("cal-grid__day--ativo");
        calDiaAtivo = Number(celula.textContent);
        if (typeof window.aoSelecionarDiaCalendarioAgenda === "function") {
          window.aoSelecionarDiaCalendarioAgenda(calAno, calMes, calDiaAtivo);
        }
        setTimeout(() => fecharModal("modal-calendario"), 150);
      });
    }

    window.irParaMesCalendarioAgenda = (ano, mes, dia) => {
      calAno = ano;
      calMes = mes;
      calDiaAtivo = dia;
      atualizarCalendario();
    };

    qs("#js-cal-anterior").addEventListener("click", () => {
      calMes--;
      if (calMes < 0) { calMes = 11; calAno--; }
      calDiaAtivo = null;
      atualizarCalendario();
    });

    qs("#js-cal-proximo").addEventListener("click", () => {
      calMes++;
      if (calMes > 11) { calMes = 0; calAno++; }
      calDiaAtivo = null;
      atualizarCalendario();
    });

    atualizarCalendario();
  }

  // Seletor de mês de Aniversariantes: ligado em js/clientes-derivadas.js
  // (precisa re-renderizar a lista a cada mudança de mês, não só o rótulo).
});
