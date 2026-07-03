# Agenda V3 — Refatoração: duração por agendamento e compartilhamento por blocos

> Documento de preparação. Nada aqui foi implementado ainda — é a análise da arquitetura atual, os pontos impactados e o plano por etapas, discutidos e fechados em conversa antes de qualquer código. Ver `Documentacao/MASTER_CONTEXT.md` seção 20 (o algoritmo de encaixe é um dos itens que não deve ser alterado sem autorização explícita — esta é essa autorização, registrada aqui).

## 1. Objetivo

Separar completamente três conceitos que hoje estão misturados numa única configuração (`modoCompartilhamento` + `tempoPadraoAtendimento` fixos, escolhidos uma vez em Configurações/Onboarding):

- **Grade da agenda** — só visualização, nunca muda.
- **Duração do atendimento** — passa a ser por agendamento, não mais um número fixo global.
- **Compartilhamento de horários** — a escolha de "quanto tempo quero oferecer" passa a acontecer no ato de compartilhar, não antes.

Motivação: o modelo atual (Simples/Estratégico como modo permanente) não reflete como profissionais reais trabalham — atendimentos variam de duração (personal trainer), a grade pode ser mais fina que o ritmo real (manicure), e um cliente específico pode precisar de mais tempo sem que isso exija reconfigurar o app inteiro (ver personas na seção 3).

## 2. Arquitetura atual (o que existe hoje)

### 2.1 Dados (`agendaV3:config`, `js/storage.js`)

```js
{
  ...
  intervaloGrade: 30,              // grade, minutos
  tempoPadraoAtendimento: 60,      // GLOBAL, usado só pelo algoritmo de encaixe
  modoCompartilhamento: "estrategico", // "simples" | "estrategico", GLOBAL
  ...
}
```

`seedConfig()` (`js/storage.js` linha ~264) define os valores de fábrica desses três campos, aplicados na conclusão do Onboarding via `completarComPadroes()` (`js/onboarding.js`).

### 2.2 Onboarding (`onboarding.html` + `js/onboarding.js`)

Passo 3 pergunta, num só passo: Primeiro/último horário, Visualização da grade (chip cicla 15→30→60), **Tempo padrão de atendimento** (chip cicla 15→30→45→60→90→120). `salvarPasso3()` grava os três em `agendaV3:config`.

### 2.3 Configurações (`configuracoes.html` + `js/configuracoes.js`)

Seção "Agenda" tem 5 linhas: Primeiro horário, Último horário, Visualização (`#js-grade-row`/`#js-grade-chips`, 11 opções desde a última rodada: 5 a 60 de 5 em 5), Tempo padrão de atendimento (`#js-tempo-padrao-row`/`#js-tempo-padrao-chips`, 11 opções: 15 a 120), Compartilhamento da agenda (`#js-modo-compartilhamento-row`/`#js-modo-compartilhamento-chips`, Simples/Estratégico).

### 2.4 O algoritmo de encaixe (`classificarGradeDoDia`, `js/agenda.js` linhas 58-118)

Já documentado em `Documentacao/MASTER_CONTEXT.md` seção 12. Resumo do mecanismo relevante pra este documento:

- Um "ponteiro de ritmo" começa em `horaInicio`.
- Ao encontrar um agendamento real, o ponteiro salta pra `hora_do_agendamento + tempoPadraoAtendimento` (linha 92) — **aqui está o ponto central**: hoje assume que todo agendamento dura o mesmo tempo fixo, porque não existe duração real gravada em lugar nenhum.
- Um horário livre só é "livre" (`tipo: "livre"`) se estiver exatamente no ponteiro E não colidir com o próximo compromisso (linhas 108-116, usando `config.tempoPadraoAtendimento` de novo pra calcular a janela). Caso contrário é "encaixe".
- Renderização (`montarSlotLivreOuEncaixe`, linhas 129-139): mostra o texto "Livre" ou "Encaixe" dentro do card (linha 137), com classes CSS diferentes (`agenda-slot--livre` / `agenda-slot--encaixe`, ver `css/agenda.css` linhas 213-249 — hoje já existe distinção visual de padding/borda tracejada/cor do título, mas SEMPRE junto com o texto).
- Compartilhar horários (linha 1077) filtra `tipo === "livre"` pra decidir o que oferecer no WhatsApp — ou seja, o "modo Estratégico" e o "Compartilhar" já são a mesma conta hoje, só que calculada permanentemente pra tela inteira, não sob demanda.
- Em modo `simples` (linha 82, `estrategico = config.modoCompartilhamento === "estrategico"`), o `if (!estrategico) return {hora, tipo:"livre"}` (linha 105) pula toda essa lógica — todo horário livre é sempre "livre".

### 2.5 Estrutura do Agendamento (`Documentacao/MASTER_CONTEXT.md` seção 14)

```
{id, data, hora, clienteId?, nomeCliente, servicosIds, observacao,
 status, realizadoEm?, valorTotal?, pago?, pagamentos?, valorPendente?, nomeBloqueio?}
```

Não existe campo de duração. Confirmado também: nenhum lugar do app deriva duração a partir de `servicosIds` (regra fechada desde a Fase 1 — "serviço não controla duração do atendimento").

## 3. Quatro exemplos reais (personas usadas na discussão)

| Pessoa | Grade | Duração do atendimento | Onde o modelo atual falha |
|---|---|---|---|
| Ricardo, barbeiro tradicional | 30min | sempre 60min | Nenhuma — é o caso que o modelo atual já atende bem, por coincidência de os números baterem. |
| Fernanda, manicure | 15min | 45min | Grade fina por escolha própria, mas hoje o app tende a tratar grade e ritmo como a mesma decisão. |
| Rafael, personal trainer | 30min | varia 30-90min por aluno | É obrigado a fixar um "tempo padrão" que não existe na prática. |
| Camila, esteticista | 20min | 60min, exceto 1 cliente que demora mais | O modo Estratégico é tudo ou nada — hoje ela edita a mensagem manualmente pra essa exceção. |

## 4. Nova arquitetura (decidida)

### 4.1 `agendaV3:config` — só 3 campos de agenda, todos independentes

```js
{
  ...
  horaInicio: "08:00",
  horaFim: "20:30",
  intervaloGrade: 30,        // só visualização, como hoje
  duracaoSugerida: 60,       // NOVO nome, substitui tempoPadraoAtendimento;
                             // opcional (pode ser null/"varia"); só um valor de
                             // pré-preenchimento, nunca usado por nenhum algoritmo
  ...
  // modoCompartilhamento REMOVIDO — não existe mais como config permanente
}
```

### 4.2 `Agendamento` ganha duração própria

```js
{ ..., duracaoMinutos?: 60 }
```

- Preenchida ao criar o agendamento (`modal-novo-agendamento`), pré-sugerida com `config.duracaoSugerida` se existir, sempre editável, **nunca obrigatória**.
- Sem duração definida: o agendamento não empurra o ponteiro de ritmo (equivalente a hoje, mas por ausência de dado, não por modo).

### 4.3 Onboarding — Passo 3 dividido em 3 perguntas simples, sem menção a "modo"

1. Horário de funcionamento (início/fim) — sem mudança.
2. Visualização da grade — lista enxuta: **15/20/30/40/45/50/60** (reduz as 11 opções atuais de Configurações também, nos dois lugares).
3. "Em média, quanto tempo costuma durar um atendimento?" — **20/30/40/45/50/60/90/120 + "Não tenho um tempo definido"** (reduz as 11 opções atuais de tempo padrão, nos dois lugares. Ganha a opção de não definir, que hoje não existe).

Restante do Onboarding sem mudança.

### 4.4 Configurações — seção Agenda

Remove as linhas "Tempo padrão de atendimento" e "Compartilhamento da agenda". Mantém Primeiro horário, Último horário, Visualização. Adiciona (ou reaproveita o lugar de tempo padrão) uma linha "Duração sugerida de atendimento" — mesma pergunta do Onboarding passo 3, editável depois.

### 4.5 Algoritmo de ritmo — passa a rodar só sob demanda, no Compartilhar

`classificarGradeDoDia` muda de propósito: a Agenda (dia a dia) usa uma versão **sem** distinção de ritmo — todo horário sem compromisso mostra só o horário, sem texto "Livre"/"Encaixe" (ver 4.7). O cálculo de ritmo (ponteiro, ponteiro reinicia em `agendamento.duracaoMinutos`, sem fallback pra tempo padrão nenhum) roda **só quando o usuário toca em "Compartilhar horários"**, parametrizado pela duração escolhida naquele momento — não mais pela config global.

**Regra dos blocos (mecanismo confirmado, ver seção 5 da conversa original):** ao gerar os horários candidatos pra um bloco de duração D, o ponteiro:
- Começa em `horaInicio`.
- Ao passar por um agendamento real com `duracaoMinutos` definida, salta pro primeiro horário da grade **igual ou posterior** a `hora_do_agendamento + duracaoMinutos` (arredonda pra cima até a grade, não pra baixo).
- Ao passar por um agendamento sem duração definida, ou por um bloqueio, comporta-se como hoje (avança por `intervaloGrade` ou não bloqueia o ritmo, a definir na etapa de implementação com um exemplo dedicado se necessário).
- Cada bloco oferecido tem exatamente `D` minutos, sem sobreposição, sem horário redundante dentro do mesmo bloco (exemplo já validado: grade 30, compartilhar 60, agenda vazia → 09:00, 10:00, 11:00, **nunca** 09:00, 09:30, 10:00, 10:30).

### 4.6 Modal "Compartilhar horários" (`index.html` + `js/agenda.js`)

Ganha um novo campo: "Quanto tempo você quer disponibilizar?" — chips de múltiplos da grade escolhida, gerados pela fórmula da seção 6. Ao enviar, o app calcula os blocos (seção 4.5) e monta a mensagem — sem menção a "Simples"/"Estratégico"/"Encaixe" em lugar nenhum do texto.

### 4.7 Visualização da Agenda — 4 tipos, sem texto nos livres

`montarSlotLivreOuEncaixe` deixa de escrever "Livre" ou "Encaixe" (remove a linha `<p class="agenda-slot__titulo">${...}</p>` do texto, mantém só o horário). A distinção entre os dois tipos continua existindo, só que **puramente visual** — reaproveita o que já existe em `css/agenda.css` (`.agenda-slot--encaixe` já tem padding menor e borda tracejada; ajustar pra reforçar isso com opacidade, sem depender de texto). Ambos continuam 100% clicáveis, abrindo o mesmo modal de agendar.

Os outros três tipos (Agendado, Realizado, Bloqueado) não mudam em nada.

## 5. Todos os pontos impactados (levantamento no código)

| Arquivo | O que muda |
|---|---|
| `js/storage.js` | `seedConfig()`: remove `modoCompartilhamento`, renomeia `tempoPadraoAtendimento` → `duracaoSugerida` (opcional). |
| `js/agenda.js` | `classificarGradeDoDia` (linhas 58-118): remove a lógica de `estrategico`/ponteiro da versão usada pela Agenda; nova função (ou parâmetro) pro cálculo sob-demanda usado só no Compartilhar, usando `agendamento.duracaoMinutos`. `montarSlotLivreOuEncaixe` (129-139): remove texto. Handler de `js-whatsapp-enviar` (~1042-1053): novo campo de duração + nova lógica de blocos. Modal `modal-novo-agendamento`: novo campo de duração. |
| `js/onboarding.js` | Passo 3 reformulado (3 perguntas, sem "modo"); `completarComPadroes()` ajustado pros novos nomes de campo. |
| `onboarding.html` | Passo 3: remove chip de tempo padrão antigo, adiciona a pergunta de duração média com opção "não defino"; listas de grade enxutas. |
| `configuracoes.html` | Remove linhas/modais de "Tempo padrão" e "Compartilhamento da agenda"; adiciona/renomeia pra "Duração sugerida"; lista de grade volta a ser enxuta (desfaz a expansão pra 11 opções). |
| `js/configuracoes.js` | Remove handlers de `modoCompartilhamento`; ajusta handler de tempo padrão pro novo nome/opção "não defino". |
| `css/agenda.css` | Reforça distinção visual de `.agenda-slot--encaixe` (tamanho/opacidade) já que o texto sai. |
| `index.html` | Modal `modal-compartilhar-whatsapp`: novo campo de duração (chips). |
| `Documentacao/MASTER_CONTEXT.md` | Seção 12 (algoritmo de encaixe), 13/14 (estrutura de dados), 17 (funcionalidades) — todas citam o modelo atual, precisam reescrever após implementar. |

## 6. Regras de negócio fechadas nesta conversa

1. **Fórmula das opções de duração no Compartilhar** (múltiplos da grade escolhida): gerar múltiplos de 1× em diante até que **ambas** as condições sejam satisfeitas — total ≥ 120 minutos **e** pelo menos 3 opções geradas. Para no primeiro múltiplo em que as duas se cumprem. Validada contra os 7 exemplos originais (grades 15/20/30/40/45/50/60) — bate exatamente com todos.
2. **Listas enxutas nos dois lugares** (Onboarding e Configurações): grade 15/20/30/40/45/50/60; duração sugerida 20/30/40/45/50/60/90/120 + "Não tenho um tempo definido". Desfaz a expansão feita numa rodada anterior (5/10/25/35 na grade; 15/35/75 no tempo padrão) — decisão consciente, motivo: menos opção, menos o usuário se perde.
3. **Duração por agendamento nunca é obrigatória.** Sem duração definida, o agendamento não força um "próximo horário" específico no cálculo de blocos.
4. **"Encaixe" nunca aparece como palavra na interface** — nem "Livre" também. Diferença só visual (tamanho/opacidade), ambos clicáveis normalmente.
5. **Sem toggle de "modo antigo" na interface.** Segurança fica só no histórico do Git (reversível via commit anterior), não um botão de alternância mantido no código.

## 7. Plano de implementação por etapas (proposto, aguardando validação)

1. **Dados**: migrar `agendaV3:config` (remover `modoCompartilhamento`, renomear campo), adicionar `duracaoMinutos` ao modelo de Agendamento, atualizar `seedConfig()`.
2. **Onboarding**: reformular Passo 3 (3 perguntas, listas enxutas, opção "não defino").
3. **Configurações**: remover linhas/modais antigos, ajustar "Duração sugerida".
4. **Novo/editar agendamento**: campo de duração no modal, pré-preenchido pela sugestão.
5. **Agenda (visual)**: remover texto Livre/Encaixe, reforçar distinção visual, simplificar `classificarGradeDoDia` pra uso diário (sem ritmo).
6. **Compartilhar horários**: novo campo de duração (chips calculados pela fórmula), novo cálculo de blocos (ponteiro por `duracaoMinutos` real de cada agendamento), nova mensagem.
7. **Documentação**: atualizar `MASTER_CONTEXT.md` (seções 12, 13, 14, 17, 19, 20) e `CHANGELOG.md` ao final.

Cada etapa testada isoladamente (screenshot/headless) antes de passar pra próxima, como já é o padrão do projeto.
