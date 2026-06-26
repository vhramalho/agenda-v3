# Fase 1 — Estrutura e Visual Estático

> Documento histórico. Fase concluída — não reescrever, exceto para corrigir erros factuais. Reconstruído retroativamente em 2026-06-25, a partir do estado final do código e da memória de projeto disponível; pontos não confirmáveis estão marcados como "A confirmar".

## 1. Objetivo da fase

Criar a estrutura completa do app (pastas, telas, design system) e o visual estático de todas as telas e modais oficiais, sem nenhuma interação real — base visual fiel ao documento mestre e às imagens de referência, antes de qualquer lógica de JavaScript.

## 2. Escopo

- Estrutura de pastas oficial.
- Design system (`css/tokens.css`): tema escuro padrão, cor principal roxo padrão com 7 opções.
- Markup estático de todas as 23 telas oficiais + hub "Mais".
- Markup estático dos 20 modais originais (11 da Agenda + 9 de cadastro/gestão), embutidos ocultos nas páginas (`.modal-overlay.is-hidden`).
- Fora de escopo: qualquer abrir/fechar de modal real, qualquer leitura/escrita de dados, qualquer cálculo.

## 3. O que foi desenvolvido

- Estrutura de pastas completa (ver `MASTER_CONTEXT.md` seção 7).
- `css/tokens.css`, `css/base.css`, `css/layout.css`, `css/components.css` — sistema de design genérico reutilizável.
- `css/agenda.css`, `css/onboarding.css`, `css/auth.css` — estilos específicos das telas mais pesadas.
- Todas as 23 telas + `mais.html` com HTML estático, fiel às imagens em `referencias-visuais/`.
- Todos os modais visuais (sem função).
- Imagens de referência organizadas em `referencias-visuais/01-...` a `24-...`.
- Documento mestre limpo salvo em `docs/AGENDA_V3_DOCUMENTO_MESTRE.txt`.

## 4. Arquivos envolvidos

Todos os `.html` de tela, `css/tokens.css`, `css/base.css`, `css/layout.css`, `css/components.css`, `css/agenda.css`, `css/onboarding.css`, `css/auth.css`, `referencias-visuais/*.PNG`, `docs/AGENDA_V3_DOCUMENTO_MESTRE.txt`.

## 5. Estrutura criada

Ver `MASTER_CONTEXT.md` seção 7 (estrutura de pastas) e seção 8 (design system) — ambas definidas nesta fase e não alteradas desde então.

## 6. Fluxos implementados

Nenhum fluxo funcional — apenas a representação visual estática de cada tela/modal.

## 7. Regras de negócio

Nenhuma regra de negócio foi implementada nesta fase (puramente visual). As regras de negócio do documento mestre foram apenas lidas e usadas como referência pro markup (ex.: quais campos cada modal deveria ter).

## 8. Estrutura de dados

Nenhuma — não existe `localStorage` nem JavaScript de dados nesta fase.

## 9. Alterações importantes

- Definição do design system completo (cores, tipografia, espaçamento, raio) que permanece válido até hoje.
- Build order definido pelo desenvolvedor (não uma cópia literal da ordem do documento mestre): 1) design system + menu/header, 2) Serviços/Pagamentos/Intervalos + hub Mais, 3) cluster de Clientes, 4) Pendentes/Relatório, 5) Configurações/WhatsApp/Perfil/Backup/Ajuda, 6) Agenda (mais complexa, deixada por último entre as telas principais), 7) todos os 20 modais, 8) Onboarding, 9) Login/Cadastro/Assinatura/Termos/Privacidade.

## 10. Decisões tomadas

- Tema escuro como padrão, cor principal roxo como padrão (decisões do documento mestre, confirmadas no design system).
- CSS dividido por responsabilidade (genérico em `components.css`, específico de tela pesada em arquivo próprio).

## 11. Pendências deixadas para a próxima fase

- Toda a interatividade: abrir/fechar modal, chips selecionáveis, toggle de tema, calendário com matemática real.

## 12. Resumo técnico da fase

Fase puramente de estrutura e HTML/CSS estático. Nenhum `<script>` de lógica de tela existia ainda (apenas, possivelmente, stubs — **a confirmar** se algum JS minimamente funcional já existia antes da Fase 2, já que a documentação retroativa não tem acesso ao histórico exato de commits, pois não havia controle de versão nesta fase).

## 13. Resumo para continuidade por outra IA

Se você está assumindo o projeto a partir daqui: a Fase 1 entrega só a "casca" visual. Não assuma que nenhum botão faz algo — todos os modais existem no HTML mas começam com a classe `is-hidden` e nenhum JS os controla ainda. O design system em `css/tokens.css` é definitivo e não deve ser alterado sem necessidade forte. As imagens em `referencias-visuais/` são a fonte visual de verdade caso haja dúvida sobre como uma tela deveria parecer.
