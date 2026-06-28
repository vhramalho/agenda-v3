# Fase 4 — Auditoria, Validação e Refinamento do Produto

> **Fase em andamento desde 2026-06-26 (informal) — formalizada em 2026-06-28.** Baseado em um documento inicial elaborado pelo usuário (com ChatGPT) e adaptado por decisão do Claude para o tamanho real da equipe (1 product owner não-técnico + 1 assistente de IA), cortando processo de auditoria pensado para times grandes.

## 1. Objetivo

A Fase 4 é a etapa final antes do Backend (Fase 5). Ela **não cria funcionalidade nova** — revisa, valida e refina o que já existe das Fases 1–3, até o produto ter:

- Fluxos bem definidos e consistentes.
- Interface visual padronizada (ver seção 8 do `MASTER_CONTEXT.md`).
- Regras de negócio documentadas (não só "na cabeça do desenvolvedor").
- Nenhum bug crítico conhecido.

Toda alteração nesta fase precisa resolver um problema identificado — nunca "porque parece melhor".

## 2. O que esta fase NÃO faz

Não inventa funcionalidade nova, não altera regra de negócio sem necessidade, e não toca em Backend/Login/Banco de dados/API/Assinatura — isso é Fase 5.

Se uma ideia nova surgir durante a Fase 4 (ex.: a ideia parada do conceito de "avulso" no fluxo de Agendar), ela é **registrada como pendência** no `MASTER_CONTEXT.md`, não implementada na hora.

## 3. Como achar o problema real (antes de qualquer solução)

Sempre perguntar "qual problema eu realmente estou tentando resolver?" antes de mexer em qualquer coisa. O sintoma relatado quase nunca é o problema de raiz:

| Sintoma relatado | Problema real provável |
|---|---|
| "O card está muito grande" | A hierarquia visual da tela está errada |
| "A fonte está grande" | A tela está exigindo rolagem desnecessária |
| "Está feio" | O padrão visual (seção 8 do `MASTER_CONTEXT.md`) não está sendo seguido |

Esse filtro vale tanto pra pedidos do usuário quanto pra sugestões do Claude.

## 4. Quando pesquisar referência

Sempre que houver dúvida sobre fluxo ou comportamento esperado, pesquisar como apps consolidados resolvem **antes** de inventar uma solução nova. Lista reduzida, focada na categoria real da Agenda V3 (agenda de profissional autônomo):

- **Booksy / Fresha** — mesma categoria (agenda de barbeiro/salão); referência mais direta que existe.
- **Google Calendar / Apple Calendar** — navegação de data, período, visualização de compromissos.
- **Mercado Pago** — UI de pagamento/recebimento, pendências, recebimentos.

Adaptar a solução encontrada pra realidade da Agenda V3 — nunca copiar sem entender o porquê.

## 5. Papel do Claude nesta fase

Quando o usuário perguntar "o que você sugere?", "como seria melhor?", "como os outros apps fazem?" — o Claude responde **nesta ordem**:

1. Explica claramente o problema (usando o filtro da seção 3).
2. Diz como os apps de referência (seção 4) resolvem esse mesmo problema, se relevante.
3. Mostra vantagens e desvantagens da(s) opção(ões).
4. Diz qual solução se adapta melhor à Agenda V3 e por quê.
5. Só depois disso, sugere a implementação.

Evitar soluções totalmente inéditas quando já existe um padrão consolidado pra aquele tipo de problema.

## 6. Checklist por tela

Uma tela só é considerada "fechada" nesta fase quando responde SIM pra tudo:

- [ ] **Fluxo simples** — poucos cliques, sem etapa desnecessária.
- [ ] **Hierarquia visual clara** — o usuário identifica de imediato o elemento mais importante da tela.
- [ ] **Padrão visual respeitado** — segue os arquétipos e componentes da seção 8 do `MASTER_CONTEXT.md`, sem estilo inventado pontualmente.
- [ ] **Regra de negócio documentada** — nada que dependa de "só o desenvolvedor sabe"; está escrito no `MASTER_CONTEXT.md`.
- [ ] **Sem bug conhecido.**
- [ ] **Testada** (headless e/ou no celular pelo usuário) e comitada.

## 7. Ordem de revisão das telas

Mesma ordem que já vínhamos seguindo informalmente, por ser a navegação real do app: barra inferior (Agenda → Relatório → Pendentes → Clientes) → hub "Mais" → sub-páginas do hub → telas de destino (Ranking, Aniversariantes, Sem retornar, etc.). Dentro de cada tela, o usuário lista os problemas observados no uso real; não é uma varredura preventiva tela por tela sem motivo.

## 8. Critérios para encerrar a Fase 4

A Fase 5 só começa quando:

- [ ] Todas as telas da seção 7 passaram pelo checklist da seção 6 ao menos uma vez.
- [ ] As pendências abertas no `MASTER_CONTEXT.md`/`ROADMAP.md` foram resolvidas ou conscientemente adiadas para a Fase 5 (não esquecidas).
- [ ] O produto foi usado em ambiente real (celular, GitHub Pages) por tempo suficiente sem bug crítico novo surgindo.
- [ ] Usuário confirma explicitamente que está satisfeito pra seguir pra Backend.

## 9. O que foi cortado do documento original (e por quê)

O documento que deu origem a este (elaborado pelo usuário com ChatGPT) tinha 17 seções, incluindo 6 auditorias separadas (Produto, Regras de negócio, UX, UI, Técnica, Usuário) e dois checklists distintos (por tela e por funcionalidade). Isso é processo de consultoria pensado pra times com PM/UX/UI/Dev separados — pra uma equipe de 1 product owner não-técnico + 1 assistente de IA, rodar 6 auditorias formais antes de tocar em qualquer tela travaria o andamento. As 6 auditorias foram fundidas no checklist único da seção 6; a auditoria técnica (código duplicado, organização de pastas) foi removida do que o usuário precisa verificar — é responsabilidade do Claude manter por hábito, não um gate formal da fase.
