# Fase 2 — Interações (sem dados reais)

> Documento histórico. Fase concluída — não reescrever, exceto para corrigir erros factuais. Reconstruído retroativamente em 2026-06-25.

## 1. Objetivo da fase

Tornar a navegação e os modais realmente interativos (abrir/fechar, selecionar chips, alternar tema/cor, navegar no calendário), sem ainda ligar nenhum dado real a `localStorage`.

## 2. Escopo

- Tema escuro/claro e cor principal funcionais de verdade (única excessão "real" da fase — usa `localStorage` desde já, via uma chave própria anterior ao `storage.js` centralizado).
- Motor genérico de chips selecionáveis (single/multi).
- Motor genérico de abrir/fechar modal via atributos declarativos.
- Calendário com matemática real de mês (sem salvar nada).
- Ações simuladas dentro de modais (toggle "Foi pago?", mostrar/ocultar senha).
- Revisão manual do usuário no celular e correção dos problemas encontrados.

## 3. O que foi desenvolvido

- `js/tema.js`: lê/grava tema e cor principal (nesta fase, ainda em uma chave própria — centralização em `storage.js` só ocorre na Fase 3, Etapa 1).
- `js/chips.js`: `inicializarGrupoChips(container, multiplo)` — qualquer container com `data-chips="single"|"multi"` se torna um grupo de chips selecionáveis. `inicializarSegmentado()` para abas `.segmented`.
- `js/modal.js`: `abrirModal(id)`, `fecharModal(origem)`, atributos `data-abrir-modal`, `data-fechar-modal`, `data-trocar-modal`; clique fora do cartão fecha o modal.
- `js/calendario.js`: `gerarGradeCalendario()` — matemática real de mês (sem depender de nenhuma lib de data), usada tanto no modal de calendário da Agenda quanto no seletor de mês de Aniversariantes/Relatório.
- `js/acoes-simuladas.js`: toggle visual "Foi pago? Sim/Não" (mostra/esconde campos), mostrar/ocultar senha, criação dinâmica de linha de valor por forma de pagamento selecionada (chips multi).
- Todos os 20 modais originais ligados via os atributos declarativos do `modal.js`.

## 4. Arquivos envolvidos

`js/tema.js`, `js/chips.js`, `js/modal.js`, `js/calendario.js`, `js/acoes-simuladas.js`, e os atributos `data-*` adicionados em praticamente todas as telas com modal.

## 5. Estrutura criada

Padrão declarativo de atributos (`data-abrir-modal`, `data-fechar-modal`, `data-trocar-modal`, `data-chips`) que se tornou a convenção usada em todas as fases seguintes.

## 6. Fluxos implementados

- Abrir/fechar/trocar de modal em qualquer tela.
- Seleção de chips (single ou multi) em qualquer formulário.
- Alternar tema e cor principal a partir de Configurações e do Onboarding.
- Navegar entre meses no calendário e no seletor de mês de Aniversariantes.
- Alternar "Foi pago? Sim/Não" dentro dos modais de finalizar atendimento / editar realizado, mostrando/escondendo os campos certos.

## 7. Regras de negócio

Nenhuma regra de negócio de dados ainda (a fase é sobre interação de UI, não sobre dados reais) — mas a fase já expôs decisões de produto que tiveram que ser corrigidas após revisão manual (ver seção 9).

## 8. Estrutura de dados

Nenhum dado de domínio (cliente, agendamento, etc.) ainda. Apenas tema/cor já gravados em `localStorage` numa chave própria, anterior ao padrão de 9 chaves `agendaV3:*` que só foi formalizado na Fase 3.

## 9. Alterações importantes (vindas de revisão manual do usuário)

Após uma primeira rodada de revisão no celular, o usuário encontrou e pediu correção de:
- Pagamento: formulário de "uma forma só com um campo de valor" → trocado para chips multi-select, cada forma ativa ganha sua própria linha de valor.
- `modal-horario-realizado` (opções Editar/Excluir realizado) estava faltando — adicionado, junto com `modal-confirmar-exclusao-realizado`.
- Modal de calendário aparecia como bottom sheet → trocado para modal centralizado (`.modal-overlay--centro`/`.modal-sheet--centro`).
- Modal "Compartilhar horários" do WhatsApp estava poluído (mostrava horários disponíveis e preview de mensagem) → simplificado; chips de dia redesenhados (estilo "Seg 31" compacto).
- Relatório não tinha modal de calendário nem navegação de período → ambos criados.
- Botões "Receber" em Pendentes eram links mortos (`href="#"`) → corrigidos para apontar pra `index.html` (ainda genérico nesta fase; a correção pra apontar a data exata é trabalho da Fase 3, Etapa 7).
- Três telas novas de "ver todos" em Pendentes (`pendentes-quem-deve.html`, `pendentes-pagos.html`, `pendentes-devedores.html`) — fora do escopo original do documento mestre, formalizadas com confirmação explícita do usuário ("Criar telas novas agora").
- Seletor de horário de Intervalos (texto livre tipo "12:00"/"13:00") → trocado por uma grade de chips de horário no estilo do app (depois, na Fase 3 Etapa 4, essa grade passou a ser gerada dinamicamente por `gerarGradeHorarios`).

## 10. Decisões tomadas

- Padrão de atributos declarativos (`data-*`) para modais e chips, reaproveitado em todas as fases seguintes.
- `js/seletor-horario.js` (dropdown de horário) ficou obsoleto após a troca pra chips, mas o arquivo foi mantido no repositório sem nenhuma tela referenciando-o mais.

## 11. Pendências deixadas para a próxima fase

- Toda a Fase 3: nenhum dado real ainda existia. `js/storage.js` centralizado, as 9 chaves `agendaV3:*`, e toda a lógica de negócio (CRUD, cálculos, algoritmo de encaixe) ficaram inteiramente para a Fase 3.

## 12. Resumo técnico da fase

Fase 2 entrega os "motores genéricos" (chips, modal, calendário) que todas as telas de dados reais da Fase 3 reaproveitam. Nenhuma chamada a `localStorage` para dados de domínio existia ainda — só tema/cor.

## 13. Resumo para continuidade por outra IA

Se você está assumindo o projeto a partir daqui: os motores `js/chips.js` e `js/modal.js` são genéricos e reutilizáveis — ao criar uma tela nova, prefira os atributos declarativos (`data-abrir-modal`, `data-chips`) antes de escrever JS específico. Tome cuidado com a ordem dos `<script>` nas páginas: `chips.js` e `modal.js` precisam carregar **antes** de qualquer script de tela que dependa de `inicializarGrupoChips`, `abrirModal` ou `fecharModal` — isso já causou retrabalho em etapas posteriores quando a ordem estava errada (ver `03_FASE_3.md`, Etapa 4).
