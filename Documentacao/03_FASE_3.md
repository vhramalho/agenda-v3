# Fase 3 — Dados Reais via localStorage

> **Fase concluída em 2026-06-26 (todas as 11 etapas).** Documento histórico — não reescrever, exceto para corrigir erros factuais.

## 1. Objetivo da fase

Substituir todo o conteúdo estático/fictício por dados reais, persistidos em `localStorage`, com CRUD completo em cada tela e todas as regras de negócio e cálculos (estatísticas, algoritmo de encaixe, etc.) implementados de verdade.

## 2. Escopo

Dividida em 11 etapas (plano do próprio desenvolvedor, não uma cópia literal de uma seção do documento mestre):

1. Fundação | 2. Serviços + Formas de pagamento | 3. Clientes | 4. Intervalos | 5. Configurações | 6. Agenda + Agendamentos | 7. Pendentes | 8. Relatório | 9. Ranking/Aniversariantes/Sem-retornar | 10. WhatsApp + Backup | 11. Onboarding.

Antes de iniciar, foi criado `docs/LOGICA_E_FLUXO_DE_DADOS.md`: especificação completa do modelo de dados e efeitos cruzados entre telas, com 11 perguntas embutidas — 10 resolvidas, 1 deliberadamente em espera (Pergunta 7, `mensagemEndereco`).

## 3. O que foi desenvolvido (Etapas 1–6)

### Etapa 1 — Fundação
- `js/storage.js`: ponto único de acesso às 9 chaves `agendaV3:*` (`gerarId`, `lerChave`/`salvarChave` genéricos + `obterX`/`salvarX` nomeados por entidade).
- `inicializarDadosFicticios()`: popula cada chave com dados fictícios plausíveis somente se ela ainda não existir.
- `js/tema.js` refatorado para delegar a `obterConfig`/`salvarConfig` de `storage.js` (mantendo `lerConfig()` como alias de compatibilidade).
- `<script src="js/storage.js">` adicionado em todas as páginas, sempre antes de `tema.js`.

### Etapa 2 — Serviços + Formas de pagamento
- `js/servicos.js`, `js/pagamentos.js`: CRUD completo, exclusão lógica (`ativo:false`).
- Cards "Mais realizado"/"Mais utilizada" calculados de verdade a partir de `agendamentos`.
- Modal novo: `modal-confirmar-exclusao-forma` (não existia, criado por consistência com Serviços).
- `seedAgendamentos` retroativamente corrigido para referenciar `formaPagamentoId` reais (antes `null`).

### Etapa 3 — Clientes
- `js/clientes.js` (lista), `js/cliente-detalhe.js` (perfil, lido via `?id=` na URL).
- CRUD completo + lixeira (lista separada `agendaV3:clientesLixeira`, não um campo de status).
- Estatísticas (visitas, faturado, última visita) sempre calculadas em tempo real, nunca salvas no Cliente.
- Prévias de Ranking (top 3), Aniversariantes (contagem do mês) e Sem-retornar (contagem) na própria tela Clientes, calculadas de verdade — mesmo as telas completas dessas seções ainda não estarem ligadas (isso é Etapa 9).
- Botão "Enviar mensagem no WhatsApp" monta link `wa.me` real.

### Etapa 4 — Intervalos
- `js/intervalos.js`: CRUD completo de bloqueios fixos. Exclusão é **física** (não lógica), pois nenhum agendamento referencia um bloqueio fixo por id.
- Criada `gerarGradeHorarios(horaInicio, horaFim, intervaloGrade)` + `somarMinutos(hora, minutos)` em `js/utils.js` — fonte única de verdade da grade de horários, reaproveitada depois pela Agenda.
- Cards "Total bloqueado"/"Média por dia" calculados de verdade.
- Mudança de ordem de scripts: `chips.js`/`modal.js` passaram a carregar antes de `intervalos.js` (necessário pois a grade de horários dos modais é reconstruída dinamicamente a cada abertura).

### Etapa 5 — Configurações
- 5 campos da seção "Agenda" (Primeiro/Último horário, Visualização, Tempo padrão, Compartilhamento) ligados de verdade a `agendaV3:config`, via modais com chips.
- Botões "Redefinir onboarding", "Limpar agenda", "Apagar todos os dados" (seção "Dados") também ligados — eram decorativos, não estavam no escopo formal da etapa mas foram incluídos por estarem na mesma tela e serem baixo risco (ação local com confirmação própria).

### Etapa 6 — Agenda + Agendamentos (maior etapa do plano)
- `js/agenda.js`: navegação real por dia/semana/calendário; **algoritmo de encaixe** implementado (`classificarGradeDoDia`); CRUD completo de agendamentos; realizar atendimento com pagamento dividido em múltiplas formas; editar/excluir realizado; bloqueio pontual (criado na própria Agenda) vs. bloqueio fixo (informativo, linka pra Intervalos); busca de cliente ao vivo (substituindo o antigo modal "Usar existente"); modal novo `modal-adicionar-cliente-novo` ("Adicionar aos clientes?"); botão "Enviar lembrete"; Compartilhar horários via WhatsApp usando o mesmo algoritmo de encaixe pra filtrar quais horários sugerir.
- Dois bugs reais encontrados e corrigidos (ver seção 9).

### Etapa 7 — Pendentes
- `js/pendentes.js`: atende as 4 telas (`pendentes.html` resumo + 3 "ver todos") condicionalmente, por existência de elemento no documento.
- "Quem deve", "Pagos recentemente" e "Clientes que mais ficam devendo" calculados de verdade a partir de `agendamentos`.
- Botão "Receber" agora leva para `index.html?data=AAAA-MM-DD` — `js/agenda.js` ganhou leitura do parâmetro `data` da URL pra abrir naquele dia exato (resolve a Pergunta 9 do documento de lógica, que ainda estava pendente).
- "Clientes que mais ficam devendo" só pode contar pendências **atuais** (não há histórico de "já foi pendente e foi pago" no modelo de dados) — simplificação sinalizada ao usuário.

### Etapa 8 — Relatório
- `js/relatorio.js` reescrito: todos os números (Faturamento, Atendimentos, Ticket médio, Recebimentos por forma + gráfico de pizza real, Taxas do cartão) calculados de verdade por período (Dia/Semana/Mês/Ano), com comparação percentual vs. período anterior.
- Distinção importante: "Faturamento" conta `realizado_pago` + `realizado_pendente` (regra já fechada: pendente conta no dia do atendimento); "Recebimentos" só conta `realizado_pago`, porque é dinheiro que de fato entrou numa forma de pagamento conhecida — por isso "Total recebido" pode ser menor que "Faturamento".
- Simplificação assumida: o gráfico de linha/área (sparkline semanal) sempre mostra a semana que contém a data de referência, independente da aba selecionada (Dia/Semana/Mês/Ano) — refazer os eixos do gráfico pra cada granularidade não compensava o esforço nesta etapa.
- Bug corrigido durante o teste: um seletor CSS (`:not([style])`) usado para achar o nome da forma de pagamento dentro de uma linha não combinava com nenhum elemento (todos tinham `style`) — corrigido usando classes dedicadas (`.js-nome-forma` etc.) em vez de seletor por ausência de atributo.

### Etapa 9 — Ranking / Aniversariantes / Sem retornar
- `js/clientes-derivadas.js`: atende as 3 telas condicionalmente.
- Ranking: 3 métricas (Faturamento/Visitas/Ticket médio) via abas segmentadas, pódio top-3 + tabela do 4º lugar em diante, considerando só atendimentos dos últimos 12 meses (como o texto de rodapé da tela já prometia).
- Aniversariantes: navegação real de mês (substituiu a lógica de rótulo-only que vivia em `calendario.js`), lista filtrada por `aniversarioMes`, botão WhatsApp real com `mensagemAniversario`.
- Sem retornar: filtro por chips (20/30/45/60/90+ dias) real, lista ordenada por dias sem retorno (clientes nunca atendidos aparecem primeiro). Botão WhatsApp aqui não tem mensagem-modelo própria (não existe campo pra isso em `agendaV3:whatsapp`) — abre o chat vazio, sem texto pré-preenchido.

### Etapa 10 — WhatsApp (mensagens) + Backup
- `js/whatsapp.js`: número e as 4 mensagens (Horários/Lembrete/Aniversário/Endereço) ligados de verdade a `agendaV3:whatsapp`, com modal de edição reutilizado para as 4 mensagens e "Restaurar mensagens padrão" (com confirmação) voltando aos textos originais do seed — sem alterar o número.
- `js/backup.js`: "Gerar e baixar backup" exporta as 9 chaves `agendaV3:*` num arquivo `.json` real (via `Blob` + link de download); "Selecionar arquivo de backup" lê o arquivo, mostra confirmação explícita ("isso vai substituir TODOS os dados"), e só então sobrescreve as 9 chaves e recarrega o app. "Último backup" é guardado numa chave auxiliar (`agendaV3:ultimoBackup`) fora das 9 chaves de domínio — é só metadado de UI, não dado do negócio, então não faz parte do conjunto exportado/importado.

### Etapa 11 — Onboarding
- `js/onboarding.js` estendido: Passo 1 (nome do estabelecimento, nome do profissional, endereço, WhatsApp) agora salva de verdade — `numero` vai pra `agendaV3:whatsapp`, os outros três pra `agendaV3:config` como `nomeEstabelecimento`/`nomeProfissional`/`endereco` (campos novos dentro da chave `config` já existente — não é uma chave nova, só enriquece uma já prevista). Passo 3 (horários/grade/tempo padrão) também salva de verdade, com "Visualização"/"Tempo padrão" virando botões cíclicos (toque para alternar entre as opções) em vez de `<select>` decorativos.
- Ao chegar no Passo 5 ("Tudo pronto"), seja navegando normalmente ou clicando em "Pular" de qualquer passo, `agendaV3:onboarding` é marcado como `{concluido:true}` de verdade.
- Passo 4 (Organização) virou links reais para `intervalos.html`/`pagamentos.html`/`servicos.html`.
- **Decisão sinalizada ao usuário:** `nomeEstabelecimento`/`nomeProfissional` (e o resto da "conta" — e-mail, senha, plano) não têm um lar formal no modelo de 9 chaves porque pertencem ao conceito de "perfil/conta logada", que o documento mestre explicitamente deixou pra Fase 5 (backend real). Optei por guardá-los em `config` (que já é o "balde" de configurações gerais) em vez de criar uma 10ª chave ou deixá-los sem persistir — é uma decisão de baixo risco (não muda a estrutura, só acrescenta 3 campos), mas vale revisar quando a Fase 5 desenhar o modelo de conta de verdade. `perfil.html` continua mostrando dados estáticos (não foi tocado) e não reflete ainda esses campos do onboarding.

## 4. Arquivos envolvidos

`js/storage.js`, `js/utils.js`, `js/servicos.js`, `js/pagamentos.js`, `js/clientes.js`, `js/cliente-detalhe.js`, `js/intervalos.js`, `js/configuracoes.js`, `js/agenda.js`, `js/calendario.js` (ajustado), `js/pendentes.js`, `js/relatorio.js`, `js/clientes-derivadas.js`, `js/whatsapp.js`, `js/backup.js`, `js/onboarding.js` (ajustado), e todos os HTML correspondentes.

## 5. Estrutura criada

As 9 chaves `agendaV3:*` (ver `MASTER_CONTEXT.md` seção 13) e os esquemas de cada entidade (seção 14) — definidos no planejamento pré-fase e implementados etapa por etapa sem alteração de estrutura.

## 6. Fluxos implementados

Ver `MASTER_CONTEXT.md` seção 17 (lista completa por etapa).

## 7. Regras de negócio

Todas as regras listadas em `MASTER_CONTEXT.md` seção 11 já estão implementadas (exclusão lógica vs. física, pendente conta no dia do atendimento, pagamento dividido sem validação de soma, bloqueio fixo nunca esconde compromisso real, cliente na lixeira some das telas "ativas" mas continua no Relatório, algoritmo de encaixe).

## 8. Estrutura de dados

Sem alterações em relação ao especificado em `docs/LOGICA_E_FLUXO_DE_DADOS.md` — a implementação seguiu o esquema já decidido antes de começar a fase.

## 9. Alterações importantes / bugs encontrados e corrigidos

- **Ícones genéricos**: Serviços usa um ícone genérico único para todos (não há campo `icone` no modelo de dados) — simplificação deliberada, sinalizada ao usuário. Formas de pagamento mantêm ícone por `tipo` (enum fixo de 5 valores, então o mapa de ícones escala bem).
- **Bug do ponteiro de ritmo**: bloqueios fixos não avançavam o ponteiro do algoritmo de encaixe — corrigido fazendo cada slot bloqueado-fixo avançar `+intervaloGrade` (diferente de um agendamento, que avança `+tempoPadraoAtendimento` a partir de uma única entrada).
- **Bug de fuso horário** (encontrado na Etapa 6, mas já existia desde a Etapa 2/3): `new Date().toISOString().slice(0,10)` converte para UTC e pode retornar "o dia seguinte" perto da meia-noite em fusos negativos. Corrigido com `hojeIso()` (`js/utils.js`, usa getters locais) em todos os arquivos afetados (`agenda.js`, `clientes.js`, `cliente-detalhe.js`, `servicos.js`).
- **Modal "Usar existente" substituído**: a busca de cliente ao vivo (dropdown de sugestões enquanto digita) tornou o modal estático `modal-usar-existente` do Fase 1/2 desnecessário — removido do HTML da Agenda; o novo `modal-adicionar-cliente-novo` cobre o caso de nome sem nenhuma correspondência (Pergunta 10 do documento de lógica).

## 10. Decisões tomadas

- "Sem retornar" (cálculo da prévia): cliente sem nenhum atendimento OU sem atendimento há mais de 30 dias — limiar escolhido pelo desenvolvedor, **a confirmar** com o usuário.
- "Faturados"/Ranking somam também `realizado_pendente`, não só `realizado_pago` — interpretação do desenvolvedor, **a confirmar**.
- Exclusão de bloqueio fixo é física (não lógica) — decisão técnica justificada por não haver referência de histórico a preservar.
- Nome digitado sem correspondência exata, mas com correspondência aproximada: a busca ao vivo já sugere o nome enquanto o usuário digita, então o "vincular automaticamente se igual" só ocorre em correspondência exata (case-insensitive); qualquer outra coisa cai no modal "Adicionar aos clientes?".

## 11. Pendências deixadas para a Fase 4

- Decisão de onde mora o botão de `mensagemEndereco` (Pergunta 7, em espera desde antes da Fase 3 — segue em espera).
- Validar com o usuário as duas interpretações marcadas como "a confirmar" no `MASTER_CONTEXT.md` (limiar de 30 dias em "sem retornar"; `realizado_pendente` contar em "faturados"/Ranking).
- Testar em tela a importação real de um arquivo de backup (Etapa 10) — só a exportação foi confirmada por screenshot; a importação foi revisada por código mas não testada com um arquivo real no navegador headless.
- `perfil.html` não reflete os campos coletados no Onboarding (`nomeEstabelecimento`/`nomeProfissional`) — continua com dados estáticos, já que é uma tela conceitualmente ligada à "conta logada" (Fase 5).
- Publicar o projeto no GitHub + GitHub Pages (solicitado pelo usuário em 2026-06-25, repositório público confirmado, execução ainda pendente).
- Revisitar a Pergunta 7 e considerar se `mensagemEndereco` deveria ganhar um botão real em algum lugar agora que o resto do app está com dados reais.

## 12. Resumo técnico da fase (até aqui)

A fase segue o padrão: cada tela ganha um arquivo `js/<tela>.js` próprio que lê/escreve via as funções de `storage.js`, nunca chamando `localStorage` direto. Funções utilitárias genéricas (formatação, geração de grade de horários, cálculo de "hoje") centralizadas em `js/utils.js` pra evitar duplicação entre telas. O algoritmo de encaixe (Etapa 6) é o ponto mais complexo da fase e já alimenta tanto a Agenda quanto o cálculo de horários sugeridos no Compartilhar WhatsApp — qualquer mudança nesse algoritmo deve ser cuidadosamente revalidada contra `docs/LOGICA_E_FLUXO_DE_DADOS.md` §2.2.

## 13. Resumo para continuidade por outra IA

Se você está assumindo o projeto a partir daqui (Fase 3 inteira concluída, Fase 4 — refinamento geral — é a próxima):
- Leia `docs/LOGICA_E_FLUXO_DE_DADOS.md` por completo antes de tocar em qualquer lógica de dados — ele tem o modelo de dados exato e as decisões de negócio já fechadas.
- `js/storage.js` é a única porta pro `localStorage` — nunca chame `localStorage.getItem/setItem` direto numa tela nova (única excessão: `agendaV3:ultimoBackup` em `js/backup.js`, que é metadado de UI, não dado de domínio, e é acessado direto de propósito).
- Sempre que precisar de "a data de hoje" como string `YYYY-MM-DD`, use `hojeIso()` (`js/utils.js`) — **nunca** `new Date().toISOString().slice(0,10)` (bug de fuso horário já corrigido uma vez, não reintroduzir).
- A Fase 4 (refinamento) não tem um plano de etapas formal ainda — será definida quando chegar a hora, provavelmente revisão de UX/performance/polimento visual e ajustes vindos do uso real desta Fase 3.
- Padrão de teste estabelecido: copiar a tela pra `_tN.html`, injetar `<script>` com cliques simulados via `setTimeout`, screenshot via `msedge.exe --headless=new`, com `--user-data-dir` fixo se o teste depender de dado persistido entre páginas/invocações. Apagar os temporários ao final.
- O protocolo de documentação (`Documentacao/`, ver `feedback_agenda_v3_documentacao_protocolo` na memória) exige atualizar `MASTER_CONTEXT.md`/`CHANGELOG.md`/`ROADMAP.md` e o documento da fase só ao final de cada fase — não a cada pequena mudança.
