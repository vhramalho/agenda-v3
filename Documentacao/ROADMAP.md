# Agenda V3 — Roadmap

## Fases do projeto (definidas no documento mestre)

1. **Fase 1 — Estrutura e visual estático** — ✅ concluída (2026-06-24)
2. **Fase 2 — Interações, sem dados reais** — ✅ concluída (2026-06-25)
3. **Fase 3 — Dados reais via localStorage** — ✅ **concluída (2026-06-26, todas as 11 etapas)**
4. **Fase 4 — Refinamento geral** — ⬜ próxima (plano de etapas a definir)
5. **Fase 5 — Backend real (login, sincronização entre dispositivos)** — ⬜ não iniciada

## Fase 3 — Etapas (plano de 11 etapas) — concluída

| # | Etapa | Status |
|---|---|---|
| 1 | Fundação (`storage.js`, seed de dados fictícios) | ✅ concluída |
| 2 | Serviços + Formas de pagamento | ✅ concluída |
| 3 | Clientes (CRUD + lixeira) | ✅ concluída |
| 4 | Intervalos (bloqueios fixos) | ✅ concluída |
| 5 | Configurações (campos restantes da Agenda) | ✅ concluída |
| 6 | Agenda + Agendamentos | ✅ concluída |
| 7 | Pendentes | ✅ concluída |
| 8 | Relatório | ✅ concluída |
| 9 | Ranking / Aniversariantes / Sem-retornar | ✅ concluída |
| 10 | WhatsApp (mensagens) + Backup | ✅ concluída |
| 11 | Onboarding | ✅ concluída |

## Próximas fases (após Fase 3 completa)

- **Fase 4** — Refinamento geral: revisão de UX, performance, polimento visual, possíveis ajustes vindos do uso real durante a Fase 3.
- **Fase 5** — Backend real: login/cadastro funcionais, sincronização entre dispositivos, assinatura paga real. Login/Cadastro/Assinatura/Assinatura-vencida continuam decorativos até esta fase.

## Funcionalidades futuras (mencionadas, não comprometidas)

- Decisão de onde mora o botão de `mensagemEndereco` (Pergunta 7 do `docs/LOGICA_E_FLUXO_DE_DADOS.md`) — deliberadamente em espera.
- Publicação em GitHub + GitHub Pages — solicitada pelo usuário em 2026-06-25 (repositório público confirmado), execução pendente.

## Pendências em aberto (rastreadas, não bloqueantes)

- `mensagemEndereco`: onde mora o botão de enviar endereço — usuário disse "ainda vou definir" (2026-06-28). Continua deliberadamente em espera.
- Ideia parada do fluxo "Agendar cliente"/conceito de avulso (ver seção 24 do `MASTER_CONTEXT.md`) — usuário disse "vamos planejar ainda" (2026-06-28). Não implementar sem planejamento explícito.
- Usuário vai mandar um documento com perguntas pra formalizar a Fase 4 (refinamento geral) — ainda não recebido (2026-06-28).

## Decididas em 2026-06-28 (não mais pendentes)

- Critério de "sem retornar" confirmado (30 dias padrão, nunca-atendido excluído — corrigido no código) e inclusão de `realizado_pendente` no faturamento/Ranking confirmada como esperada.
- Backup: exportar e importar confirmados funcionando pelo usuário.
- `perfil.html` continua decorativo "por enquanto", aguardando o modelo de conta da Fase 5 — decisão confirmada, não é mais uma pendência a resolver agora.
