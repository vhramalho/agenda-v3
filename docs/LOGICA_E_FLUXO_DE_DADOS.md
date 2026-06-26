# Agenda V3 — Lógica e Fluxo de Dados (antes da Fase 3)

> **Como usar este documento:** revise com calma. Onde eu não tinha certeza de uma decisão, marquei com **❓ PERGUNTA**. Pode responder direto neste arquivo (abaixo da pergunta) ou me contar verbalmente — qualquer um dos dois funciona, eu releio antes de começar a Fase 3.
>
> Este documento descreve **como os dados vão se comportar** quando ligarmos o `localStorage` de verdade (Fase 3). Ele não muda nada do que já existe visualmente — é o "raio-X" da lógica por trás do que você já viu funcionando.

---

## 1. Visão geral: as 9 "tabelas" do app

Tudo fica no `localStorage` do navegador, em 9 chaves (já definidas no documento mestre, seção 11). Cada uma é uma "tabela":

| Chave | O que guarda |
|---|---|
| `agendaV3:config` | Configurações gerais (tema, cor, horários da agenda, etc.) |
| `agendaV3:clientes` | Clientes ativos |
| `agendaV3:clientesLixeira` | Clientes movidos para a lixeira |
| `agendaV3:servicos` | Serviços cadastrados |
| `agendaV3:formasPagamento` | Formas de pagamento cadastradas |
| `agendaV3:agendamentos` | Agendamentos, realizados, pendentes **e bloqueios pontuais** |
| `agendaV3:bloqueiosFixos` | Intervalos recorrentes (Almoço, Folga semanal...) |
| `agendaV3:whatsapp` | Número e modelos de mensagem |
| `agendaV3:onboarding` | Se o onboarding já foi concluído |

Tudo o que descrevo abaixo assume que cada uma dessas chaves guarda uma **lista de objetos em JSON** (exceto `config`, `whatsapp` e `onboarding`, que são um objeto único).

---

## 2. `agendaV3:config` — a chave que mais "irradia" pro resto do app

```
{
  tema: "escuro" | "claro",
  corPrincipal: "roxo" | "azul" | "ciano" | "verde" | "rosa" | "vermelho" | "dourado",
  horaInicio: "08:00",
  horaFim: "20:30",
  intervaloGrade: 30,           // em minutos
  tempoPadraoAtendimento: 60,   // em minutos
  modoCompartilhamento: "simples" | "estrategico",
  assinaturaStatus: "ativa" | "vencida" | "gratuito"
}
```

`tema` e `corPrincipal` **já leem e escrevem essa chave de verdade** desde a Fase 2 (`js/tema.js`). Os outros 6 campos ainda são só visuais.

### 2.1 De onde vem a "grade de horários" (já discutimos isso)

Toda tela que precisa saber "quais horários existem nesta agenda" vai chamar **uma única função**, algo como:

```js
gerarGradeHorarios(horaInicio, horaFim, intervaloGrade)
// → ["08:00", "08:30", "09:00", ..., "20:30"]
```

Essa função vai substituir os horários fixos que hoje são fictícios em:
- **Agenda** (`index.html`) — a lista de horários do dia.
- **Intervalos** — a grade de chips que criamos ontem (hoje fixa em 00:00–23:30/30min).
- **Compartilhar horários no WhatsApp** — para calcular quais horários estão livres.

### 2.2 ~~PERGUNTAS 1 e 2~~ — RESOLVIDAS (25/06/2026): modo simples vs. estratégico e o algoritmo de encaixe

`modoCompartilhamento` tem dois valores, e eles mudam o comportamento da própria Agenda, não só do WhatsApp:

- **`"simples"`** — não existe "encaixe". Todo horário livre é só "livre". O compartilhamento no WhatsApp lista todos os horários livres, sem filtro.
- **`"estrategico"`** — existe "encaixe". Usa `tempoPadraoAtendimento` pra calcular, dentro da grade fina (`intervaloGrade`), **quais horários livres são "recomendados" (livre) e quais são só "encaixe"** (livres, mas que fragmentariam a agenda se oferecidos a um cliente novo).

**Algoritmo do modo estratégico** (validado contra exemplos reais, slot por slot — bate 100%):

1. Existe um "ponteiro de ritmo", que começa no `horaInicio` da agenda.
2. Percorre a grade fina (`intervaloGrade`) em ordem cronológica.
3. Se o horário já tem um compromisso real (`agendado` / `realizado_*` / `bloqueado`) → mostra esse status, **e o ponteiro do ritmo pula pro fim desse compromisso** (horário do compromisso + `tempoPadraoAtendimento`) — o ritmo reinicia a partir daí.
4. Se o horário está livre:
   - Se o intervalo `[horário, horário + tempoPadraoAtendimento)` bate em cima do **próximo** compromisso já confirmado (mesmo estando "no ritmo") → **encaixe**.
   - Se esse horário é exatamente o que o ponteiro do ritmo está esperando → **livre**, e o ponteiro avança `+ tempoPadraoAtendimento`.
   - Qualquer outro caso (fora do ritmo) → **encaixe**.

**Importante:** "encaixe" continua **100% tocável manualmente** na Agenda (abre o mesmo modal de horário livre, com Agendar/Bloquear) — a diferença só vale pra **quais horários entram na sugestão automática do WhatsApp** (modo estratégico só sugere os "livre", nunca os "encaixe", porque ofertar um encaixe pra um cliente novo cria buraco na agenda).

Essa mesma função (`gerarGradeHorarios` + o cálculo de livre/encaixe) é usada tanto pra desenhar a Agenda quanto pra montar a lista de horários sugeridos no Compartilhar WhatsApp.

---

## 3. Entidades e como elas se relacionam

### 3.1 Cliente
```
{
  id: "cli_xxx",
  nome, telefone, aniversarioDia, aniversarioMes, aniversarioAno?,
  observacao, criadoEm, atualizadoEm, ativo: true
}
```
- Quando movido pra lixeira: o registro **muda de** `agendaV3:clientes` **para** `agendaV3:clientesLixeira` (listas separadas). ✅ **RESOLVIDO (25/06).**
- **Visitas**, **total gasto**, **última visita** (mostrados em Detalhe do cliente, na lista de Clientes, no Ranking) **não são salvos no cliente** — são **calculados na hora**, somando os `agendamentos` com `status` realizado* daquele `clienteId`. Ou seja, o Cliente nunca fica "desatualizado".
- Um agendamento pode existir **sem** `clienteId` (campo `nomeCliente` livre, cliente "avulso" que não foi cadastrado). Isso é o que possibilita o modal "Usar existente ou criar novo".

### 3.2 Serviço
```
{ id: "srv_xxx", nome, valorOpcional?, ativo, criadoEm, atualizadoEm }
```
- Um agendamento guarda `servicosIds: ["srv_1", "srv_2"]` — **não** guarda o nome do serviço copiado.
- Exclusão de serviço é **lógica** (`ativo: false`, escondido das listas/seletores, mas continua existindo pra histórico funcionar). ✅ **RESOLVIDO (25/06) — opção (a).**

### 3.3 Forma de pagamento
```
{ id: "pgto_xxx", nome, tipo: "dinheiro"|"pix"|"credito"|"debito"|"outras", taxaPercentual?, ativo }
```
- Mesma lógica do serviço: exclusão lógica (`ativo:false`), não exclusão física, pelo mesmo motivo (histórico).

### 3.4 Agendamento — a entidade mais importante
```
{
  id: "agd_xxx",
  data: "2026-07-03",
  hora: "09:00",
  clienteId?: "cli_xxx",
  nomeCliente: "João Pedro",       // sempre preenchido, mesmo com clienteId
  servicosIds: ["srv_1"],
  observacao?: "",
  status: "agendado" | "realizado_pago" | "realizado_pendente" | "cancelado" | "bloqueado",

  // só existe quando status começa com "realizado_"
  realizadoEm?: "2026-07-03T10:15:00",
  valorTotal?: 45,
  pago?: true,
  pagamentos?: [ { formaPagamentoId: "pgto_pix", valor: 30 }, { formaPagamentoId: "pgto_dinheiro", valor: 15 } ],
  valorPendente?: 45,
  observacaoRealizado?: "",

  // só existe quando status é "bloqueado" E foi um bloqueio pontual (criado na própria Agenda)
  nomeBloqueio?: "Reunião"
}
```

**Isso já reflete a mudança que fizemos ontem**: `pagamentos` é uma lista (várias formas, cada uma com seu valor) — não é mais "uma forma só".

✅ **PERGUNTA 5 RESOLVIDA (25/06):** sem validação. O profissional digita o valor que quiser em cada forma — não precisa fechar com `valorTotal`, até porque o valor do serviço nunca controla o valor do atendimento (decisão já fechada no documento mestre). Fica livre.

✅ **PERGUNTA 6 RESOLVIDA (25/06):** a Agenda junta as duas fontes (bloqueios pontuais do dia + bloqueios fixos que caem naquele dia da semana). Quando há conflito entre um bloqueio fixo e um agendamento/realizado já confirmado no mesmo horário, **o agendamento/realizado sempre prevalece** — o bloqueio fixo nunca "esconde" um compromisso já marcado.

### 3.5 Bloqueio fixo
```
{ id: "blq_xxx", nome, diasSemana: ["seg","ter","qua","qui","sex"], horaInicio: "12:00", horaFim: "13:00", ativo }
```
- O botão "+ Adicionar horário" que existia antes (removido do modal de Intervalos) sugeria que um bloqueio fixo podia ter **múltiplos intervalos de horário** (ex.: Almoço de manhã E de tarde). Com a mudança pra chips de horário, isso já é resolvido naturalmente — você pode selecionar `12:00, 12:30, 13:00` e mais `18:00, 18:30` no mesmo bloqueio, sem precisar de um botão separado. Então o campo real seria `horariosBloqueados: ["12:00","12:30","13:00"]` em vez de só início/fim. **Isso já está coerente com a tela que construímos ontem.**

### 3.6 Config do WhatsApp
```
{ numero, mensagemHorarios, mensagemLembrete, mensagemAniversario, mensagemEndereco }
```
- `mensagemHorarios` → usada no modal "Compartilhar horários" da Agenda.
- `mensagemAniversario` → usada nos botões de WhatsApp da tela Aniversariantes.
- `mensagemEndereco` → 🟡 **PERGUNTA 7 EM ESPERA (25/06):** ainda não decidimos onde esse botão vai morar. Por enquanto deixamos quieto — o campo de configuração existe, mas nenhum botão usa ele ainda. Revisitar depois.
- `mensagemLembrete` → ✅ **PERGUNTA 8 RESOLVIDA (25/06):** manual, via um botão dentro do modal **"Horário agendado"** (e também ao editar um agendamento ainda não realizado) — o profissional decide na hora se quer lembrar o cliente. Precisamos adicionar esse botão (algo como "Enviar lembrete") em `modal-horario-agendado` e em `modal-novo-agendamento` quando estiver em modo de edição.

---

## 4. O que cada tela lê e o que ela afeta

| Tela | Lê de | Escreve em | Afeta (indiretamente) |
|---|---|---|---|
| **Agenda** (`index.html`) | `agendamentos`, `bloqueiosFixos`, `config` | `agendamentos` (criar/editar/excluir/realizar) | Pendentes, Relatório, Ranking, Cliente-detalhe (toda vez que algo é "realizado") |
| **Clientes** | `clientes` | `clientes` (novo) | Ranking, Aniversariantes, Sem retornar (todas derivam da mesma lista) |
| **Cliente-detalhe** | `clientes`, `agendamentos` (filtrado por clienteId) | `clientes` (editar/lixeira) | Clientes (lista volta a refletir a mudança) |
| **Ranking** | `clientes` + `agendamentos` (agregado) | — (só leitura) | — |
| **Aniversariantes** | `clientes` (filtrado por mês) | — | — |
| **Sem retornar** | `clientes` + `agendamentos` (última visita calculada) | — | — |
| **Relatório** | `agendamentos` (filtrado por período) | — | — |
| **Pendentes** | `agendamentos` (status realizado_pendente) | `agendamentos` (ao marcar como pago, via Agenda) | Relatório (pendentes do período) |
| **Serviços** | `servicos` | `servicos` | Modais que mostram chips de serviço (Novo agendamento, Finalizar atendimento, Editar realizado) |
| **Formas de pagamento** | `formasPagamento` | `formasPagamento` | Modais de pagamento (Finalizar atendimento, Editar realizado, Nova/Editar forma) |
| **Intervalos** | `bloqueiosFixos`, `config` (grade de horários) | `bloqueiosFixos` | Agenda (quais horários aparecem bloqueados) |
| **WhatsApp** (config) | `whatsapp` | `whatsapp` | Modal Compartilhar horários, botões de WhatsApp em vários lugares |
| **Configurações** | `config` | `config` | Praticamente todo o app (tema, cor, grade de horários) |
| **Backup** | todas as chaves `agendaV3:*` | todas (na importação) | Tudo |
| **Onboarding** | `onboarding`, escreve em várias | `config`, `whatsapp`, `onboarding`, e opcionalmente `servicos`/`formasPagamento`/`bloqueiosFixos` | Tudo (é a primeira configuração) |

---

## 5. Fluxos que merecem atenção especial (porque várias telas dependem deles)

### 5.1 "Realizar" um atendimento
1. Usuário toca num agendamento → modal "Horário agendado" → "Realizado".
2. Modal "Finalizar atendimento": confirma cliente/serviços, marca se foi pago.
3. Ao salvar: o **mesmo registro** de `agendamentos` (não um novo!) tem seu `status` trocado de `"agendado"` para `"realizado_pago"` ou `"realizado_pendente"`, e ganha os campos `realizadoEm`, `valorTotal`, `pagamentos`/`valorPendente`.
4. **Efeito cascata:** Relatório do dia muda, Ranking do cliente muda, "última visita" do cliente muda, e se pendente, aparece em Pendentes.

### 5.2 Quitar um pendente
1. Usuário vai em Pendentes → toca "Receber" → vai pra Agenda **na data exata do agendamento pendente** (ex.: pendente de 11/06 abre a Agenda em 11/06, não em "hoje"). ✅ **PERGUNTA 9 RESOLVIDA (25/06)** — hoje o botão leva pra `index.html` fixo; isso precisa mudar pra levar a data como parâmetro.
2. Usuário abre o realizado pendente → "Editar realizado" → muda status pra pago, preenche `pagamentos`.
3. **O agendamento não muda de data nem de dono** — ele continua "pertencendo" ao dia original pro Relatório, só o status muda. Pendentes deixa de listá-lo.

### 5.3 Cliente "novo" digitado dentro de Novo Agendamento
1. Usuário digita um nome no campo "Nome do cliente" dentro do modal Novo agendamento.
2. Se o nome bater com um cliente já existente → modal "Usar existente ou criar novo".
   - "Usar existente" → agendamento recebe `clienteId` do cliente encontrado.
   - "Criar novo" → cria um registro novo em `clientes` E referencia esse novo `clienteId`.
3. Se não bater com nenhum nome existente: ✅ **PERGUNTA 10 RESOLVIDA (25/06)**. O usuário perguntou minha opinião entre criar automaticamente vs. perguntar. Minha recomendação, que ficou definida: **nem um nem o outro extremo** — em vez de criar automaticamente (o que poluiria a lista de clientes com nomes digitados errado, clientes avulsos de uma vez só, etc.) ou exigir o cadastro completo (telefone, aniversário...), mostramos um modal pequeno e rápido: **"[Nome] ainda não está na sua lista de clientes. Adicionar?"** com duas opções — "Adicionar aos clientes" (cria o registro em `clientes`, sem exigir mais nenhum campo, só o nome) ou "Não, é avulso" (salva só em `nomeCliente`, sem `clienteId`). Isso mantém a lista de clientes limpa (só quem o profissional realmente quer acompanhar) sem adicionar fricção de formulário — é só um toque. Reaproveita o mesmo padrão visual do modal "Usar existente ou criar novo" que já existe, só que para o caso de nome **sem nenhuma correspondência**.

### 5.4 Exclusão de cliente vs. histórico
- Mover cliente pra lixeira **não** apaga os agendamentos dele. O histórico em Relatório, Ranking (passado) continua existindo com `nomeCliente`/`clienteId` apontando pra um cliente que está na lixeira.
- ✅ **PERGUNTA 11 RESOLVIDA (25/06):** confirmado — cliente na lixeira desaparece de Ranking/Aniversariantes/Sem retornar (telas "ativas"), mas continua aparecendo no Relatório (histórico).

### 5.5 Backup
- Exportar: junta as 9 chaves citadas na seção 1 num único arquivo `.json` com data/hora.
- Importar: substitui as 9 chaves de uma vez (com a confirmação que já existe na tela). Não faz merge — é tudo ou nada, como o aviso na tela já diz.

---

## 6. Coisas que **não** vão mudar na Fase 3 (ficam pra depois)

Pra deixar claro o que está fora do escopo agora, mesmo que pareça relacionado:

- **Login/Cadastro** continuam decorativos — o documento já definiu isso como Fase 5 (backend real). Você consegue usar o app inteiro sem "estar logado".
- **Assinatura/Assinatura vencida** continuam decorativos — não vão de fato bloquear nenhuma função ainda.
- **Notificações automáticas** (lembrete enviado sozinho, por exemplo) não entram — qualquer envio de mensagem continua sendo o usuário tocando um botão e o WhatsApp abrindo manualmente.

---

## 7. Lista única de tudo que perguntei (pra responder rapidinho)

**Status: 10 de 11 resolvidas (25/06/2026). Só falta a #7, que ficou em espera de propósito.**

1. ✅ `tempoPadraoAtendimento` e encaixe — ver seção 2.2.
2. ✅ `modoCompartilhamento` (simples/estratégico) — ver seção 2.2.
3. ✅ Cliente na lixeira: lista separada (`clientesLixeira`).
4. ✅ Serviço/forma de pagamento excluídos: exclusão lógica (ficam ocultos, mas existem pro histórico).
5. ✅ Soma dos pagamentos múltiplos: sem validação, fica livre.
6. ✅ Bloqueio pontual + fixo: Agenda junta os dois; agendamento/realizado sempre vence o bloqueio fixo.
7. 🟡 **Em espera** — `mensagemEndereco`: onde mora o botão de enviar endereço. Decidir depois.
8. ✅ `mensagemLembrete`: botão manual dentro do modal "Horário agendado" / edição de agendamento não realizado.
9. ✅ Botão "Receber" abre a Agenda na data exata do pendente.
10. ✅ Nome novo sem correspondência: modal rápido "Adicionar aos clientes?" (sim/avulso), sem exigir cadastro completo.
11. ✅ Cliente na lixeira some de Ranking/Aniversariantes/Sem retornar, mas continua no Relatório.

---

*Documento gerado em 25/06/2026, antes do início da Fase 3. Baseado no estado real do código (24 telas + 1 hub "Mais" + 23 modais) nesta data.*
