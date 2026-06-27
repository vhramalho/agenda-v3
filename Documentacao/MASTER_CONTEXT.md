# Agenda V3 — Master Context

> Documento oficial e definitivo do projeto. Sempre que houver conflito entre este documento e a memória de uma conversa específica, **este documento vence**. Atualizado apenas ao final de cada fase (ou etapa relevante), nunca a cada pequena alteração.

Última atualização: 2026-06-26 — Fase 3 concluída (todas as 11 etapas).

---

## 1. Visão geral do aplicativo

Agenda V3 é um app mobile-first de agendamento para profissionais autônomos com atendimentos marcados (barbeiros, cabeleireiras, manicures, designers de sobrancelha, maquiadoras, tatuadores, personal trainers, terapeutas, consultores). Conceito-guia: "uma agenda de papel no celular, só que moderna, rápida e organizada".

## 2. Objetivo do projeto

Substituir agendas de papel/WhatsApp/planilhas por um app simples, rápido e visualmente organizado, sem exigir conhecimento técnico do usuário final (o profissional autônomo). O app prioriza fricção mínima: poucos campos obrigatórios, fluxos curtos, nada que pareça "sistema corporativo".

## 3. Público-alvo

Profissionais autônomos com agenda de atendimentos marcados, sozinhos (sem equipe/funcionários — não há multi-usuário nem permissões, é um app de uso individual).

## 4. Arquitetura

- **Sem backend nas Fases 1–4.** Tudo client-side: HTML estático + CSS + JavaScript puro, sem framework, sem bundler, sem build step.
- **Persistência via `localStorage`** do navegador (Fase 3 em diante), 9 chaves prefixadas `agendaV3:`. Antes da Fase 3, tudo era estático/decorativo (Fases 1–2).
- **Backend real planejado apenas para a Fase 5** (login real, sincronização entre dispositivos). Login/Cadastro/Assinatura continuam decorativos até lá.
- Nenhuma dependência de pacote (`npm`, etc.) — abrir os `.html` direto ou via qualquer servidor estático funciona.

## 5. Stack utilizada

- HTML5 semântico, um arquivo por tela.
- CSS puro, dividido por responsabilidade (ver seção 7).
- JavaScript puro (ES6+), um arquivo por tela/funcionalidade, mais alguns "motores" genéricos reutilizáveis (chips, modais, calendário).
- Sem TypeScript, sem React/Vue/Angular, sem CSS-in-JS, sem Sass/Less.

## 6. Ambiente de desenvolvimento e testes

- Máquina Windows, sem Python/Node reais instalados (só stubs da Microsoft Store).
- Servidor local: `_static-server.ps1` (PowerShell `System.Net.HttpListener`), porta `8743`, escutando em `http://+:8743/` (prefixo wildcard — combinar com `127.0.0.1` no mesmo listener causa "Access denied"). Acessível também via LAN em `http://192.168.1.101:8743` (exigiu reserva de URL ACL com `user=Todos`, não `user=Everyone`, por causa do Windows em pt-BR).
- Testes de UI: cópia temporária da página (`_tN.html`) com um `<script>` injetado simulando cliques reais via `setTimeout`, screenshot via `msedge.exe --headless=new --screenshot` (com `--user-data-dir` fixo quando o teste depende de dados persistidos entre páginas/invocações), depois os arquivos temporários são apagados.
- Não há suíte de testes automatizados (unit/e2e) — a verificação é sempre visual, por screenshot.
- **A confirmar:** publicação em GitHub Pages (solicitada pelo usuário em 2026-06-25, ainda não executada nesta sessão).

## 7. Estrutura de pastas

```
agenda-v3/
├── index.html                  (Agenda — tela principal)
├── clientes.html, cliente-detalhe.html
├── servicos.html, pagamentos.html, intervalos.html
├── configuracoes.html, whatsapp.html, backup.html, perfil.html, ajuda.html
├── relatorio.html, pendentes.html, pendentes-quem-deve.html,
│   pendentes-pagos.html, pendentes-devedores.html
├── ranking.html, aniversariantes.html, sem-retornar.html
├── mais.html                   (hub de navegação)
├── onboarding.html
├── login.html, cadastro.html, assinatura.html, assinatura-vencida.html
├── termos.html, privacidade.html
├── css/
│   ├── tokens.css              (design tokens: cores, espaçamento, tipografia)
│   ├── base.css, layout.css, components.css  (genéricos reutilizáveis)
│   ├── agenda.css, onboarding.css, auth.css   (específicos de telas pesadas)
├── js/
│   ├── utils.js                (qs/qsa, formatarMoeda, gerarGradeHorarios,
│   │                            hojeIso, iniciaisCliente, extrairValor, etc.)
│   ├── storage.js              (única porta de entrada pro localStorage)
│   ├── menu.js, app.js         (montagem de header/menu/bottom-nav)
│   ├── tema.js                 (tema escuro/claro + cor principal)
│   ├── chips.js, modal.js      (motores genéricos de chips e modais)
│   ├── calendario.js           (matemática de calendário reutilizada)
│   ├── acoes-simuladas.js      (toggle pago sim/não, mostrar senha)
│   ├── servicos.js, pagamentos.js, clientes.js, cliente-detalhe.js,
│   │   intervalos.js, configuracoes.js, agenda.js, pendentes.js,
│   │   relatorio.js, clientes-derivadas.js, whatsapp.js, backup.js,
│   │   onboarding.js           (lógica por tela, Fase 3 — completa)
│   └── seletor-horario.js      (não usado mais — substituído por chips de horário; mantido no repo, sem `<script>` apontando pra ele)
├── components/                 (menu.html, header.html, empty-state.html — fragmentos injetados via fetch)
├── referencias-visuais/        (24 imagens de referência visual do app, .PNG)
├── docs/
│   ├── AGENDA_V3_DOCUMENTO_MESTRE.txt   (documento original do produto)
│   └── LOGICA_E_FLUXO_DE_DADOS.md       (especificação de dados/lógica pré-Fase 3, com decisões resolvidas)
├── Documentacao/                (este protocolo — criado em 2026-06-25)
└── _static-server.ps1           (servidor local de desenvolvimento)
```

## 8. Design system oficial

Definido em `css/tokens.css`.

- **Tema padrão: escuro.** Tema claro existe e é selecionável (`<html data-theme="light">`), mas escuro é o default.
- **Cor principal padrão: roxo (`#7C3AED`)**, selecionável entre 7 opções via `<html data-accent="...">`: `roxo`, `azul`, `ciano`, `verde`, `rosa`, `vermelho`, `dourado`. As cores de estado (`--success`, `--warning`, `--danger`) são fixas e nunca seguem a cor principal escolhida — inclusive o tom "vermelho" da cor principal é deliberadamente diferente do `--danger`, pra nunca colidir visualmente com uma ação destrutiva.
- Tipografia: fonte do sistema (`-apple-system, "Segoe UI", Roboto...`), escala de `--text-xs` (12px) a `--text-xl` (28px).
- Espaçamento em escala de 4px (`--space-1` a `--space-8`).
- Raio de borda em 4 níveis (`--radius-sm` a `--radius-full`).
- Mobile-first; não há breakpoints para desktop documentados — o app é pensado pra ser usado no celular.
- **Convenção de UI (2026-06-26): setinha `>` (`.list-item__chevron`) indica "linha/card inteiro é tocável"**, substituindo botões de texto tipo "Receber" dentro de linhas de lista. Quando uma linha já leva o usuário pra algum lugar ao tocar em qualquer ponto dela, ela deve ser um único elemento clicável (`<a>`) com a setinha como indicador visual, em vez de um botão isolado dentro da linha. Aplicar esse padrão **pontualmente**, conforme cada tela for sendo revisada — não é pra sair trocando tudo de uma vez, só quando a tela em questão estiver sendo ajustada.

## 9. Convenções de código

- Nomes de funções, variáveis, ids e classes **em português** (`obterClientes`, `salvarAgendamentos`, `js-btn-novo-cliente`), exceto palavras-chave da linguagem e nomes de propriedades de bibliotecas/CSS padrão.
- IDs usados por JavaScript sempre prefixados `js-` (ex.: `js-lista-clientes`), pra distinguir de classes puramente visuais.
- Sem comentários explicando o quê o código faz — só comentários que expliquem um porquê não óbvio (uma regra de negócio, um workaround, uma decisão que poderia confundir quem ler depois).
- `js/storage.js` é a **única porta de entrada pro `localStorage`** — nenhuma outra tela ou script deve chamar `localStorage.getItem/setItem` diretamente.
- Exclusão de Cliente, Serviço e Forma de pagamento é sempre **lógica** (campo `ativo:false`), nunca física — preserva histórico em relatórios/rankings. Bloqueio fixo (Intervalos) é exceção: exclusão é física, pois nenhum agendamento referencia um bloqueio fixo por id.
- Funções utilitárias genéricas (formatação de moeda/data, geração de grade de horários, iniciais de avatar) vivem em `js/utils.js` e são compartilhadas entre todas as páginas que precisam — evitar duplicar a mesma função em dois arquivos de tela.
- Padrão de teste: copiar a página pra um arquivo temporário `_tN.html`, injetar `<script>` com cliques simulados via `setTimeout`, tirar screenshot headless, apagar os temporários ao final. Nunca deixar `_tN.html` no repositório.

## 10. Regras técnicas

- **Toda data "hoje" deve ser obtida com `hojeIso()`** (`js/utils.js`), nunca com `new Date().toISOString().slice(0,10)` — esse padrão converte para UTC e pode retornar o dia errado perto da meia-noite em fusos negativos (já causou bug real, corrigido na Etapa 6; ver `03_FASE_3.md`).
- A grade de horários da Agenda é **sempre** gerada por `gerarGradeHorarios(horaInicio, horaFim, intervaloGrade)` (`js/utils.js`) — nenhuma tela deve ter uma grade de horários hardcoded.
- Estatísticas de cliente (visitas, total gasto, última visita) **nunca são salvas no registro do Cliente** — são sempre calculadas em tempo real a partir de `agendaV3:agendamentos`.
- Script de uma tela que precisa de chips/modais dinâmicos deve carregar `js/chips.js` e `js/modal.js` **antes** do próprio script da tela, pois usa as funções globais `inicializarGrupoChips`, `abrirModal`, `fecharModal`.

## 11. Regras de negócio definitivas

- Serviço **não controla** duração do atendimento nem preenche preço automaticamente — o valor é digitado na hora de finalizar o atendimento.
- Pendente (`realizado_pendente`) conta no relatório/faturamento **no dia do atendimento**, não no dia em que foi efetivamente pago.
- Pagamento de um atendimento pode ser **dividido em várias formas** (`pagamentos: [{formaPagamentoId, valor}, ...]`), sem nenhuma validação de que a soma bate com `valorTotal` — fica livre.
- Bloqueio fixo (recorrente, ex. Almoço) nunca esconde um agendamento/realizado já confirmado no mesmo horário — o compromisso real sempre prevalece.
- Cliente movido pra lixeira desaparece de Ranking/Aniversariantes/Sem-retornar, mas continua aparecendo no Relatório (histórico).
- **Algoritmo de encaixe** (modo `estrategico` de `modoCompartilhamento`): documentado em detalhe na seção 12 — controla quais horários livres são "recomendados" (livre) vs. "encaixe" (livres, mas que fragmentariam a agenda se oferecidos a um cliente novo via WhatsApp). Ver `docs/LOGICA_E_FLUXO_DE_DADOS.md` §2.2 para o texto canônico.
- Nome digitado em Novo Agendamento sem nenhum cliente correspondente: nunca cria cliente automaticamente nem exige cadastro completo — pergunta via modal "Adicionar aos clientes?" (sim/avulso).

## 12. Algoritmo de encaixe (resumo técnico)

Implementado em `classificarGradeDoDia(iso)`, `js/agenda.js`.

1. Um "ponteiro de ritmo" começa em `horaInicio`.
2. Percorre a grade fina (`intervaloGrade`) em ordem cronológica.
3. Ao encontrar um compromisso real (agendado/realizado_*/bloqueado pontual): mostra esse status; o ponteiro salta para `hora_do_compromisso + tempoPadraoAtendimento`.
4. Ao encontrar um horário de bloqueio fixo: mostra "Bloqueado"; o ponteiro avança `+intervaloGrade` (cada slot do bloqueio fixo é listado individualmente, diferente de um agendamento que ocupa só uma entrada mas dura `tempoPadraoAtendimento`).
5. Horário livre: é **"encaixe"** a menos que (a) seja exatamente igual ao ponteiro atual E (b) sua janela `[horário, horário+tempoPadraoAtendimento)` não colida com o próximo compromisso confirmado — só então é **"livre"**, e o ponteiro avança `+tempoPadraoAtendimento`.
6. Em modo `simples`, não existe distinção — todo horário livre é "livre".
7. "Encaixe" continua 100% agendável manualmente — a distinção só importa pra quais horários entram na sugestão automática do Compartilhar WhatsApp.

## 13. Estrutura do localStorage

9 chaves, todas prefixadas `agendaV3:`, cada uma com um par `obterX()`/`salvarX()` em `js/storage.js`:

| Chave | Conteúdo |
|---|---|
| `agendaV3:config` | tema, corPrincipal, horaInicio, horaFim, intervaloGrade, tempoPadraoAtendimento, modoCompartilhamento, assinaturaStatus |
| `agendaV3:clientes` | lista de clientes ativos |
| `agendaV3:clientesLixeira` | lista de clientes movidos pra lixeira |
| `agendaV3:servicos` | lista de serviços (exclusão lógica) |
| `agendaV3:formasPagamento` | lista de formas de pagamento (exclusão lógica) |
| `agendaV3:agendamentos` | agendamentos, realizados, pendentes E bloqueios pontuais (status `bloqueado`) |
| `agendaV3:bloqueiosFixos` | intervalos recorrentes (exclusão física) |
| `agendaV3:whatsapp` | número e modelos de mensagem |
| `agendaV3:onboarding` | se o onboarding já foi concluído |

`inicializarDadosFicticios()` (`js/storage.js`) popula cada chave com dados fictícios **somente se ela ainda não existir** — nunca sobrescreve dados reais do usuário.

## 14. Estrutura dos dados (entidades)

Ver `docs/LOGICA_E_FLUXO_DE_DADOS.md` seção 3 para os esquemas completos. Resumo:

- **Cliente**: `{id, nome, telefone, aniversarioDia, aniversarioMes, aniversarioAno, observacao, criadoEm, atualizadoEm, ativo}`
- **Serviço**: `{id, nome, valorOpcional, ativo, criadoEm, atualizadoEm}`
- **Forma de pagamento**: `{id, nome, tipo: "dinheiro"|"pix"|"credito"|"debito"|"outras", taxaPercentual, ativo}`
- **Agendamento** (a entidade mais importante): `{id, data, hora, clienteId?, nomeCliente, servicosIds, observacao, status: "agendado"|"realizado_pago"|"realizado_pendente"|"cancelado"|"bloqueado", realizadoEm?, valorTotal?, pago?, pagamentos?, valorPendente?, nomeBloqueio?}`
- **Bloqueio fixo**: `{id, nome, diasSemana: ["seg",...], horariosBloqueados: ["12:00","12:30",...], ativo}`
- **Config do WhatsApp**: `{numero, mensagemHorarios, mensagemLembrete, mensagemAniversario, mensagemEndereco}`
- **Config geral** ganhou 3 campos extras na Etapa 11 (Onboarding): `nomeEstabelecimento`, `nomeProfissional`, `endereco` — guardados dentro da própria chave `agendaV3:config`, não é uma chave nova. Ver seção 19 sobre o porquê desses campos não viverem num "perfil/conta" formal ainda.
- **Metadado de UI fora do modelo de 9 chaves**: `agendaV3:ultimoBackup` (string ISO da última exportação) — não é dado de domínio, não entra no arquivo exportado/importado, é só pra mostrar "Último backup: ..." na tela.

## 15. Fluxos principais

- **Realizar atendimento**: Agendado → toca → "Realizado" → preenche serviços/pagamento → o **mesmo registro** muda de status pra `realizado_pago`/`realizado_pendente` (nunca cria um novo registro).
- **Quitar pendente**: botão "Receber" em Pendentes leva para `index.html?data=AAAA-MM-DD` — a Agenda abre exatamente naquele dia (implementado na Etapa 7).
- **Cliente novo digitado em Novo Agendamento**: bate com cliente existente → vincula direto (se nome exatamente igual) ou mostra sugestão via busca ao vivo; não bate com nada → modal "Adicionar aos clientes?" (sim cria registro só com nome / avulso não cria).
- **Mover cliente pra lixeira**: remove de `clientes`, insere em `clientesLixeira` — agendamentos antigos não são apagados nem alterados.
- **Backup**: exportar baixa um `.json` com as 9 chaves; importar exige confirmação explícita e substitui tudo de uma vez (tudo ou nada, sem merge).

## 16. Telas existentes (23 telas oficiais + hub "Mais")

Todas em `docs/AGENDA_V3_DOCUMENTO_MESTRE.txt` seção 6. Lista: Agenda (`index.html`), Clientes, Cliente-detalhe, Relatório, Pendentes (+ 3 telas "ver todos" criadas como extensão formalizada: `pendentes-quem-deve.html`, `pendentes-pagos.html`, `pendentes-devedores.html`), Serviços, Formas de pagamento, Intervalos, Mais (hub), Configurações, Assinatura, Onboarding, WhatsApp, Perfil, Ranking, Aniversariantes, Sem retornar, Login, Cadastro, Assinatura vencida, Backup, Ajuda, Termos, Privacidade.

## 17. Funcionalidades existentes (real, ligado a dados — não apenas visual)

- Tema escuro/claro + cor principal (Fase 2).
- Chips e modais genéricos (Fase 2).
- Calendário com matemática real de mês (Fase 2, ajustado na Etapa 6 pra usar a data real do sistema).
- Serviços: CRUD completo + exclusão lógica (Etapa 2).
- Formas de pagamento: CRUD completo + exclusão lógica (Etapa 2).
- Clientes: CRUD completo + lixeira + busca + prévias de Ranking/Aniversariantes/Sem-retornar (Etapa 3).
- Intervalos (bloqueios fixos): CRUD completo, grade de horários real, totais calculados (Etapa 4).
- Configurações: horários/grade/tempo padrão/modo de compartilhamento reais; Limpar agenda / Apagar todos os dados / Redefinir onboarding funcionais (Etapa 5).
- Agenda completa (Etapa 6): navegação real por dia/semana/calendário, algoritmo de encaixe, CRUD de agendamentos, realizar atendimento com pagamento dividido, editar/excluir realizado, bloqueio pontual vs. fixo, busca de cliente ao vivo, modal "Adicionar aos clientes?", botão "Enviar lembrete", Compartilhar horários via WhatsApp.
- Pendentes: as 4 telas com dados reais, "Receber" leva à data exata do pendente na Agenda (Etapa 7).
- Relatório: todos os números reais por período (Dia/Semana/Mês/Ano), com comparação vs. período anterior (Etapa 8).
- Ranking (3 métricas), Aniversariantes (navegação de mês real) e Sem retornar (filtro por dias real) como telas completas (Etapa 9).
- WhatsApp: número e as 4 mensagens editáveis de verdade, com "Restaurar padrão" (Etapa 10).
- Backup: exportar baixa um `.json` real das 9 chaves; importar substitui tudo com confirmação (Etapa 10).
- Onboarding: Passo 1 (estabelecimento/profissional/WhatsApp/endereço) e Passo 3 (horários/grade/tempo padrão) salvam de verdade; chegar ao passo final marca `agendaV3:onboarding` como concluído (Etapa 11).
- **Fase 3 está 100% concluída (todas as 11 etapas).**

## 18. Funcionalidades planejadas (não implementadas ainda)

- `mensagemEndereco`: onde mora o botão de enviar endereço — decisão **deliberadamente em espera**, ver `docs/LOGICA_E_FLUXO_DE_DADOS.md` Pergunta 7.
- `perfil.html` continua decorativo (nome/e-mail/senha/plano estáticos) — é conceitualmente "conta logada", fica pra Fase 5.
- Fase 4 (refinamento geral) e Fase 5 (backend real, login real, sincronização) — ainda não iniciadas, sem plano de etapas definido.
- Publicar o projeto no GitHub + GitHub Pages — solicitado pelo usuário, repositório público confirmado, execução ainda pendente.

## 19. Decisões definitivas (não voltar atrás sem confirmação explícita)

Todas as 10 perguntas resolvidas em `docs/LOGICA_E_FLUXO_DE_DADOS.md` seção 7, mais:
- Modal "Usar existente ou criar novo" (Fase 1/2) foi **substituído** por busca ao vivo + modal "Adicionar aos clientes?" — decisão tomada na Etapa 6, já implementada.
- "Sem retornar" (cálculo): cliente sem nenhum atendimento OU sem atendimento há mais de 30 dias — limiar escolhido pelo desenvolvedor, sem confirmação explícita do usuário ainda. **A confirmar.**
- "Faturados"/Ranking somam valor de atendimentos `realizado_pendente` também, não só `realizado_pago` — interpretação do desenvolvedor, **a confirmar** com o usuário se for sentido diferente do esperado.
- `nomeEstabelecimento`/`nomeProfissional`/`endereco` (coletados no Onboarding) vivem dentro de `agendaV3:config`, não numa chave/entidade de "perfil" própria — decisão de baixo risco pra não criar uma 10ª chave antes da Fase 5 desenhar o modelo de conta de verdade.

## 20. Itens que não devem ser alterados sem nova autorização

- O algoritmo de encaixe (seção 12) — validado manualmente pelo usuário contra exemplos reais antes da implementação.
- O prefixo `agendaV3:` e os nomes das 9 chaves do localStorage.
- A regra de exclusão lógica para Cliente/Serviço/Forma de pagamento.
- O tema escuro como padrão e o roxo como cor principal padrão.

## 21. Estado atual do projeto

- **Fase 1** (estrutura e visual estático): ✅ concluída.
- **Fase 2** (interações, sem dados reais): ✅ concluída.
- **Fase 3** (dados reais via localStorage): ✅ **concluída (todas as 11 etapas)**.
- **Fase 4** (refinamento): 🔶 em andamento de forma informal — usuário está testando o app publicado (GitHub Pages) e mandando rodadas de ajustes de UX/bugs, cada rodada termina em commit. Sem plano de etapas formal ainda, é ajuste reativo ao uso real.
- **Fase 5** (backend): não iniciada.

## 22. Fase atual

**Fase 4 informal** — rodadas de revisão de UX e correção de bugs encontrados pelo usuário testando no celular via GitHub Pages (https://vhramalho.github.io/agenda-v3/). Publicado no GitHub em https://github.com/vhramalho/agenda-v3.

**Página Agenda (`index.html`) considerada ajustada por enquanto** (2026-06-26, 5 rodadas de revisão concluídas) — usuário disse "todos ajustes na página de agenda feitos. No decorrer do uso, se aparecer mais a gente ajusta." Não é uma fase formalmente "fechada", só uma pausa — pode voltar a receber ajustes se surgir algo no uso real.

## 23. Próxima etapa

Usuário vai escolher outra tela do app para a próxima rodada de revisão (a definir). Mesmo padrão de trabalho: ele lista os problemas, conversamos para alinhar entendimento antes de codar, eu implemento, testo via screenshot headless, e comitamos — depois ele testa de novo no celular e manda a próxima rodada.

## 24. Pendências

- Publicar o projeto no GitHub + GitHub Pages — ✅ feito em 2026-06-26 (repo público https://github.com/vhramalho/agenda-v3, Pages ativado pelo usuário via Settings > Pages, branch main).
- Validar com o usuário as duas interpretações marcadas como "a confirmar" na seção 19.
- Decidir onde mora o botão de `mensagemEndereco` (Pergunta 7, deliberadamente em espera).
- Testar em tela a importação real de um arquivo de backup (só a exportação foi confirmada por screenshot).
- **Chips de serviços/formas de pagamento nos modais de Agendar e Finalizar atendimento continuam "desorganizados" visualmente** (CSS `.chip-group` ajudou mas não resolveu de verdade) — usuário pediu explicitamente para deixar para uma modificação futura, "pra não estragar o funcionamento". Não tocar nisso sem pedido explícito.
- **Modais com campos de texto estão ocupando quase a tela inteira quando o teclado abre no celular** — usuário observou isso en passant (2026-06-26) e pediu para anotar como possível ajuste futuro, sem decisão tomada ainda. Possíveis caminhos a explorar quando for revisitar: reduzir o espaçamento vertical entre campos nos modais, ou tornar o modal scrollável com altura máxima quando o teclado está aberto. Não implementar sem o usuário pedir.
- **Zoom automático do navegador desativado em 2026-06-26** (`maximum-scale=1.0, user-scalable=no` no viewport de todas as telas + `font-size:16px` em `.input/.textarea/.select`) — decisão deliberada pra parecer mais "nativo", trocando a possibilidade de zoom por pinça/duplo-toque. Usuário confirmou que topa essa troca; se no futuro for necessário, considerar implementar um controle de "tamanho do texto" dentro do próprio app como alternativa ao zoom do navegador.
- **Fluxo de "Agendar cliente" ficou mais lento depois das correções de nome duplicado/cliente preso** (2026-06-26) — usuário sentiu o fluxo mais pesado mesmo com os bugs corrigidos. Ideias em aberto, **nenhuma decisão tomada ainda**, usuário vai pensar e trazer depois: (a) talvez eliminar o conceito de "avulso" (cliente não cadastrado) do app; (b) talvez colocar "Avulso" como uma opção dentro do próprio dropdown de sugestões (junto com "+ Cadastrar novo"), eliminando a necessidade do modal "Adicionar aos clientes?" pro caso de nome sem nenhuma correspondência; (c) outra solução ainda não pensada. Não implementar nenhuma dessas opções sem o usuário decidir e confirmar explicitamente.
