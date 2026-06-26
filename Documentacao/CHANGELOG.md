# Agenda V3 — Changelog

> Registro cronológico de mudanças relevantes. Pequenas alterações visuais não são listadas aqui — para isso, ver os documentos de cada fase.

## Fase 1 — Estrutura e visual estático

- **2026-06-24** — Estrutura de pastas oficial criada; design system (`tokens.css`) definido (tema escuro padrão, roxo padrão, 7 cores principais selecionáveis).
- **2026-06-24** — Todas as 23 telas oficiais + hub "Mais" criadas com markup estático, todos os 20 modais originais (11 Agenda + 9 cadastro/gestão) embutidos ocultos nas páginas.
- **2026-06-24** — Fase 1 concluída.

## Fase 2 — Interações sem dados reais

- **2026-06-24/25** — Tema/cor principal ligados de verdade (única funcionalidade já "real" da Fase 2, via `js/tema.js`).
- Chips e modais genéricos (`js/chips.js`, `js/modal.js`) — motor declarativo via atributos `data-chips`, `data-abrir-modal`, `data-fechar-modal`, `data-trocar-modal`.
- Calendário com matemática real de mês (`js/calendario.js`), ações simuladas (`js/acoes-simuladas.js`).
- Revisão do usuário (review manual no celular) gerou ajustes: payment forms multi-select com campo de valor por forma, `modal-horario-realizado` adicionado, calendário centralizado, WhatsApp share simplificado, 3 telas novas "ver todos" de Pendentes formalizadas, seletor de horário de Intervalos trocado de dropdown pra chips.
- **2026-06-25** — Fase 2 concluída.

## Fase 3 — Dados reais via localStorage (em andamento)

- **2026-06-25** — Documento `docs/LOGICA_E_FLUXO_DE_DADOS.md` criado e todas as 11 perguntas embutidas respondidas (10 resolvidas, 1 deliberadamente em espera — `mensagemEndereco`). Algoritmo de encaixe especificado e validado manualmente contra exemplos do usuário.
- **2026-06-25 — Etapa 1 (Fundação)**: `js/storage.js` criado — acesso centralizado às 9 chaves `agendaV3:*`, seed de dados fictícios condicional (nunca sobrescreve dados reais).
- **2026-06-25 — Etapa 2 (Serviços + Formas de pagamento)**: CRUD real, exclusão lógica, cards "Mais realizado"/"Mais utilizada" calculados de verdade.
- **2026-06-25 — Etapa 3 (Clientes)**: CRUD real + lixeira, busca, prévias de Ranking/Aniversariantes/Sem-retornar calculadas de verdade na tela Clientes.
- **2026-06-25 — Etapa 4 (Intervalos)**: CRUD real de bloqueios fixos; criada `gerarGradeHorarios()` (fonte única de verdade da grade de horários, `js/utils.js`).
- **2026-06-25 — Etapa 5 (Configurações)**: campos de horário/grade/tempo padrão/modo de compartilhamento reais; "Limpar agenda"/"Apagar todos os dados"/"Redefinir onboarding" funcionais.
- **2026-06-25 — Etapa 6 (Agenda + Agendamentos)**: maior etapa do plano. `js/agenda.js` criado — navegação real por dia, algoritmo de encaixe implementado, CRUD completo de agendamentos, realizar atendimento com pagamento dividido, bloqueio pontual vs. fixo, busca de cliente ao vivo, modal novo "Adicionar aos clientes?" (substitui o antigo "Usar existente"), botão "Enviar lembrete", Compartilhar horários via WhatsApp.
  - **Bug corrigido**: bloqueios fixos não avançavam o ponteiro de ritmo do algoritmo de encaixe (tudo após o primeiro bloqueio do dia virava "encaixe" permanentemente).
  - **Bug corrigido (retroativo às Etapas 2 e 3 também)**: uso de `new Date().toISOString().slice(0,10)` para obter "hoje" causava data errada perto da meia-noite em fuso negativo (UTC vs. local). Substituído por `hojeIso()` em todos os arquivos afetados.
- **2026-06-25** — Protocolo oficial de documentação (`/Documentacao`) instituído.

- **2026-06-26 — Etapa 7 (Pendentes)**: dados reais nas 4 telas; "Receber" passou a levar a Agenda direto pra data exata do pendente (`index.html?data=...`).
- **2026-06-26 — Etapa 8 (Relatório)**: todos os números reais por período, com comparação vs. período anterior e gráfico de recebimentos por forma real.
- **2026-06-26 — Etapa 9 (Ranking/Aniversariantes/Sem-retornar)**: as 3 telas completas com dados reais (antes só a prévia em Clientes era real).
- **2026-06-26 — Etapa 10 (WhatsApp + Backup)**: número e as 4 mensagens editáveis de verdade; exportar/importar backup real das 9 chaves (com confirmação antes de substituir tudo).
- **2026-06-26 — Etapa 11 (Onboarding)**: Passo 1 e Passo 3 salvam de verdade; chegar ao final marca o onboarding como concluído.
- **2026-06-26 — Fase 3 concluída.** Todas as 11 etapas do plano de dados reais finalizadas.
