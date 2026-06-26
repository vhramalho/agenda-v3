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
  const hoje = new Date();
  const ehMesDeHoje = hoje.getFullYear() === ano && hoje.getMonth() === mes;
  const diaHoje = ehMesDeHoje ? hoje.getDate() : null;

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasMesAnterior = new Date(ano, mes, 0).getDate();

  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    container.appendChild(criarCelulaDia(diasMesAnterior - i, true));
  }
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const celula = criarCelulaDia(dia, false, aoSelecionar);
    if (dia === diaAtivo) celula.classList.add("cal-grid__day--ativo");
    else if (dia === diaHoje) celula.classList.add("cal-grid__day--hoje");
    container.appendChild(celula);
  }
  const totalCelulas = primeiroDiaSemana + diasNoMes;
  const restante = (7 - (totalCelulas % 7)) % 7;
  for (let dia = 1; dia <= restante; dia++) {
    container.appendChild(criarCelulaDia(dia, true));
  }

  const celulaAtiva = qs(".cal-grid__day--ativo", container);
  if (celulaAtiva) {
    const todasCelulas = qsa(".cal-grid__day", container);
    const indiceAtivo = todasCelulas.indexOf(celulaAtiva);
    const inicioSemana = indiceAtivo - (indiceAtivo % 7);
    for (let i = inicioSemana; i < inicioSemana + 7 && i < todasCelulas.length; i++) {
      if (todasCelulas[i] !== celulaAtiva) todasCelulas[i].classList.add("cal-grid__day--semana-ativa");
    }
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
    let selecionado = { ano: hoje.getFullYear(), mes: hoje.getMonth(), dia: hoje.getDate() };

    function diaAtivoNoGrid() {
      return (calAno === selecionado.ano && calMes === selecionado.mes) ? selecionado.dia : null;
    }

    function atualizarCalendario() {
      rotuloMes.textContent = `${MESES_NOME[calMes]} ${calAno}`;
      gerarGradeCalendario(gradeDias, calAno, calMes, diaAtivoNoGrid(), (celula) => {
        qsa(".cal-grid__day", gradeDias).forEach((d) => d.classList.remove("cal-grid__day--ativo"));
        celula.classList.add("cal-grid__day--ativo");
        selecionado = { ano: calAno, mes: calMes, dia: Number(celula.textContent) };
        if (typeof window.aoSelecionarDiaCalendarioAgenda === "function") {
          window.aoSelecionarDiaCalendarioAgenda(selecionado.ano, selecionado.mes, selecionado.dia);
        }
        setTimeout(() => fecharModal("modal-calendario"), 150);
      });
    }

    window.irParaMesCalendarioAgenda = (ano, mes, dia) => {
      calAno = ano;
      calMes = mes;
      selecionado = { ano, mes, dia };
      atualizarCalendario();
    };

    qs("#js-cal-anterior").addEventListener("click", () => {
      calMes--;
      if (calMes < 0) { calMes = 11; calAno--; }
      atualizarCalendario();
    });

    qs("#js-cal-proximo").addEventListener("click", () => {
      calMes++;
      if (calMes > 11) { calMes = 0; calAno++; }
      atualizarCalendario();
    });

    atualizarCalendario();
  }

  // Seletor de mês de Aniversariantes: ligado em js/clientes-derivadas.js
  // (precisa re-renderizar a lista a cada mudança de mês, não só o rótulo).
});
