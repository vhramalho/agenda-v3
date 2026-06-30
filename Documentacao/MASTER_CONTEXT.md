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
- **Sem bordas (definido em 2026-06-28):** `.card`, `.card--destaque`, `.card-metrica`, `.insight-card`, `.icon-btn`, `.segmented` e o separador entre `.list-item` não têm mais `border`. A distinção visual entre elementos vem só da diferença de cor de fundo (`--card` vs `--bg`) e do espaçamento — nunca mais de contorno. `.btn--secondary`/`.btn--ghost`/`.btn--danger` (que eram "outline", fundo transparente + borda colorida) ganharam um fundo levemente tintado (`--card-elevated` ou `--primary-soft`/`--danger-soft`) no lugar da borda, pra continuarem visíveis sem contorno.

### 8.1. Padrão de hierarquia visual das telas (definido em 2026-06-27)

**Regra de ouro: cada tela só tem UM protagonista visual** — ou é um card-resumo numérico, ou é uma lista/diretório, ou é uma lista de ranking/contagem de destino final. Insight (card pequeno tipo os do rodapé do Relatório/Pendentes) nunca é protagonista — é sempre o elemento mais discreto da tela e sempre fica por último (exceção documentada: Serviços/Formas de pagamento usam visual de card principal nesse lugar, ver arquétipo 3). Aniversariantes e Sem retornar tiveram seus cards de insight de topo **removidos** (2026-06-29) — hoje nenhuma das duas tem insight, a contagem já aparece no título ou some por completo.

**Dois tipos de cabeçalho:**
- **Tipo A** (`page-header-principal`: título à esquerda + botão de ação à direita, sem voltar) — usado só nas telas-raiz alcançadas direto pela barra inferior (Agenda, Clientes, Relatório, Pendentes) e na raiz do hub "Mais". Não tem botão de voltar porque o usuário não veio de lugar nenhum dentro do app.
- **Tipo B** (voltar + título centralizado) — usado em qualquer tela alcançada por navegação (tocou em algo pra chegar ali): Ranking, Aniversariantes, Sem retornar, Cliente-detalhe, as telas "ver todos" de Pendentes, `clientes-todos.html`, Configurações, WhatsApp, Perfil, etc.
- **Resolvido em 2026-06-27:** Serviços, Formas de pagamento e Intervalos foram migradas pro Tipo B, montando o cabeçalho manualmente em vez de usar o componente compartilhado da época.
- **Padronizado em 2026-06-29:** todas as telas Tipo B (eram 14 no componente compartilhado + 6 manuais) passaram a montar o cabeçalho do mesmo jeito manual, mesmo as que não têm botão de ação — `<header class="app-header" style="padding:0;margin-bottom:var(--space-5);">` com botão voltar (`onclick="voltarOuInicio()"`), `<h1 class="app-header__title">` com o título já escrito direto no HTML, e um terceiro slot: ação real (`icon-btn`/link "✎ Editar") quando a tela precisa, ou um `<div class="icon-btn" style="visibility:hidden">` invisível só pra manter o título centralizado quando não precisa. Motivo: toda vez que uma tela Tipo B ganhava uma ação (já tinha acontecido 6 vezes), era preciso "migrar" ela do componente compartilhado pro manual — agora só existe um jeito de montar esse cabeçalho. O componente `components/header.html` e a função `configurarBotaoVoltar()` (`js/menu.js`) foram **removidos** (eram só usados pelo mecanismo antigo); o fallback "se não tem histórico, vai pra `index.html`" virou a função global `voltarOuInicio()` em `js/menu.js`, usada no `onclick` de todos os botões voltar Tipo B. O atributo `data-titulo` no `<body>` também foi removido de todas as telas (não é mais lido por nenhum JS).

**Quatro arquétipos de página:**
1. **Resumo com card principal** (Pendentes, Relatório) — responde "qual é o número que importa agora". Ordem: card principal → lista(s) secundária(s) com "Ver todos" → insight(s) por último, pequenos. Sem busca.
2. **Diretório** (Clientes) — coleção de itens sem um "número único". Ordem (alterada em 2026-06-29): ranking/destaque → insights pequenos → lista compacta (até 5) com "Ver todos (N)" → fim. "Ver todos" sempre leva a uma página irmã dedicada, porque a coleção pode crescer sem limite. **Sem busca na tela-raiz** (removida em 2026-06-29 — busca textual só existe na página-destino `clientes-todos.html`, onde a lista completa precisa ser filtrável).
3. **Lista de cadastro simples** (Serviços, Formas de pagamento, Intervalos) — a lista é o próprio conteúdo, sem card numérico nem busca (raramente cresce o suficiente pra precisar). Ordem: lista no topo, sem cap nem "Ver todos" (mostra tudo) → card secundário (se houver) por último, nunca no topo. Filtros de seleção única (não busca textual) ficam acima da lista quando existem, usando o card de seleção (`.segmented`) — ex.: Intervalos por dia da semana. **Exceção definida em 2026-06-28:** em Serviços e Formas de pagamento, esse card secundário usa o visual de card principal (não de insight) — é proposital, mesmo ficando na posição de "último elemento".
4. **Página-destino "Ver todos" / filtro único** (Ranking, Aniversariantes, Sem retornar, as 3 páginas `pendentes-*`, `clientes-todos`) — fim da linha: pode ter card de contexto e navegação/filtro (mês, dias, métrica), mas nunca outro "Ver todos" nem insight.

Agenda (`index.html`) e o hub "Mais" ficam fora desse esquema: Agenda é uma grade de horários (produto principal do app, não é lista/card/insight); "Mais" é um menu de navegação (cards são atalhos, não dados).

**Tabela de referência (telas já avaliadas, 2026-06-27):**

| Tela | Arquétipo | Header | Card principal | Lista | Ver todos | Busca/nav | Insight |
|---|---|---|---|---|---|---|---|
| Agenda | sui generis | bespoke | não | grade do dia | — | carrossel de semana | não |
| Clientes | 2 | A | não | até 5, A-Z, no fim (2026-06-29) | → `clientes-todos.html`, rótulo "Todos os clientes (N)" desde 2026-06-29 | sem busca (removida 2026-06-29) | Aniversariantes/Sem retornar + Ranking, ambos antes da lista desde 2026-06-29 |
| Relatório | 1 | A | Faturamento + gráfico | não | — | abas período + prev/next, compacta (ajustado 2026-06-27) | Atendimentos, Ticket médio, Taxas como `.insight-card` no rodapé (ajustado 2026-06-27) |
| Pendentes | 1 | A | A receber | Quem deve + Pagos recentes | cada uma → página própria | não | Devedores |
| Mais | hub | A simplificado | não | menu de links | — | não | não |
| Serviços | 3 | B | não | todos, sem cap | não precisa | não | "Mais realizado" no fim, visual de card principal (2026-06-28) |
| Formas de pagamento | 3 | B | não | todos, sem cap | não precisa | não | "Mais utilizada" no fim, visual de card principal (2026-06-28) |
| Intervalos | 3 | B | não | lista (nome/dias/horário, 2026-06-28) | não precisa | segmented por dia (2026-06-28) | card de totais no fim |
| Ranking | 4 | B | não (pódio removido) | lista única, top 3 com destaque ouro/prata/bronze (2026-06-28) | — | abas por métrica + card de troca de ano (2026-06-29, substitui "últimos 12 meses") | é o próprio card de ranking |
| Ranking de serviços | 4 | B | não | lista única, top 3 com destaque (2026-06-28) | — | card de troca de ano (2026-06-29, antes era sem filtro de tempo) | é o próprio card de ranking |
| Aniversariantes | 4 | B | não | lista do mês, sem ícone de calendário 📅 nem de telefone 📞 na linha (removidos 2026-06-29) | — | card de botão (mês) | não (card insight do topo removido em 2026-06-29 — contagem já aparece no título "Aniversariantes (N)") |
| Sem retornar | 4 | B | não | lista filtrada por bucket exato de dias (2026-06-29) | — | segmented "+N dias" em duas linhas, 5 buckets (2026-06-29) | não (card de insight do topo removido em 2026-06-29); ganhou "✎ Editar" no header (2026-06-29) — esse foi o gatilho pra padronizar o header manual em todas as telas Tipo B (ver 8.1) |
| pendentes-quem-deve/pagos | removidas 2026-06-29 — listas agora expandem in-place em pendentes.html | | | | | | |
| pendentes-devedores | 4 | B | não | lista única, top 3 com destaque (2026-06-28) | — | card de troca de ano (2026-06-29, antes era fixo em 6 meses) | é o próprio card de ranking |
| (detalhe) cards de período (ano) | nas 3 páginas de ranking completas (Ranking, Ranking de serviços, pendentes-devedores), adicionado em 2026-06-29: filtra por ano calendário (seletor ◀ ano ▶) em vez de janela rolante (12 meses / sem filtro / 6 meses, respectivamente). **Padronizado em 2026-06-29:** os teasers correspondentes (Clientes "Ranking", Serviços "Mais realizados", Pendentes "Devedores") também passaram a usar o ano atual (`new Date().getFullYear()`) como filtro, em vez da janela rolante/sem filtro que tinham antes — agora teaser e página completa usam sempre o mesmo critério de tempo, só o teaser não tem o seletor (sempre mostra o ano corrente) | | | | | | |
| clientes-todos | 4 | B | não | lista completa | — | busca própria + segmented de ordenação (A-Z/Z-A/Novos/Antigos, 2026-06-29) | não |
| (detalhe) clientes-todos | — quando ordenado por Novos/Antigos, o subtítulo de cada linha troca de "última visita · X visitas" pra "desde mês/ano" (`cliente.criadoEm`, 2026-06-29) — só nessa tela, A-Z/Z-A mantêm o subtítulo padrão | | | | | | |
| (detalhe) Sem retornar — buckets exatos (2026-06-29) | a lógica deixou de ser cumulativa (`dias >= limite`) e passou a ser bucket exato via `bucketDiasSemRetornar(dias)` em `js/clientes-derivadas.js`: 20–29 dias → bucket 20, 30–44 → 30, 45–59 → 45, 60–89 → 60, 90+ → 90. Um cliente sumido a 35 dias entra **só** no filtro +30, não aparece mais em +20. O insight "Sem retornar" da tela `clientes.html` (`js/clientes.js`) usa a mesma função, mas agora a lista de buckets que contam é configurável (ver linha "Editar" abaixo) — o padrão de fábrica continua 20/30/45. | | | | | | |
| (detalhe) Sem retornar — "Editar" (2026-06-29) | botão "✎ Editar" no header abre um modal (`modal-editar-semretornar`) com um chip-group multi-seleção (um chip por bucket: +20/+30/+45/+60/+90). A seleção é salva em `obterConfig().semRetornarBucketsInsight` (array de inteiros, ex. `[20,30,45]`) via `salvarConfig()` — chave nova dentro de `agendaV3:config`, com fallback `\|\| [20,30,45]` em todo lugar que lê, então contas antigas sem essa chave continuam funcionando como antes. É essa lista que decide quais buckets contam no insight "Sem retornar" da tela `clientes.html` (substitui a regra fixa "exclui 60 e 90" criada antes nesse mesmo dia). | | | | | | |
| (detalhe) Sem retornar — linha da lista (2026-06-29) | ícone de calendário 📅 removido do subtítulo de cada linha; texto passou de "📅 dd/mm/aaaa · última visita" pra "última visita em dd/mm/aaaa" (`montarLinhaSemRetornar` em `js/clientes-derivadas.js`) | | | | | | |
| Cliente-detalhe | detalhe de item | bespoke (voltar+título+editar) | stats da pessoa | histórico de atendimentos | — | não | não |
| Configurações/WhatsApp/Perfil/Backup/Ajuda | menu/formulário | B | não | menu de opções ou campos | — | não | não |

**Como aplicar dali pra frente:** esse padrão já está em vigor — qualquer alteração visual nova deve seguir ele. Se o usuário pedir uma alteração visual pontual que destoe do padrão, alertar antes de implementar (é proposital ou vai gerar nova inconsistência?) em vez de simplesmente aplicar. Aplicação tela por tela, no mesmo ritmo de revisão já estabelecido — não é pra sair reformulando todas de uma vez.

### 8.2. Componentes visuais reutilizáveis (definido em 2026-06-27)

Tudo isso vive em CSS compartilhado (`css/components.css`/`css/layout.css`) — nenhuma página deve reinventar o estilo desses componentes com `style=` inline além do que for genuinamente específico daquela tela. São 9 componentes oficiais:

1. **Card principal** (`.card.card--destaque`): rótulo pequeno → valor grande → texto secundário, fundo em degradê, layout vertical. Uso: "A receber" (Pendentes), "Faturamento" (Relatório), e (desde 2026-06-28) "Mais realizado"/"Mais utilizada" no fim de Serviços/Formas de pagamento. **Não inclui** os cards promocionais (Ajuda, Backup, Assinatura, Assinatura vencida, plano no hub Mais) — esses continuam com seu visual próprio (ícone+texto+botão), são um tipo de card à parte, fora dos 9 padrões, e não devem ser forçados nesse molde.
2. **Lista** (`.card` + `.list-item`): avatar/ícone, título, subtítulo (texto secundário, ou especial vermelho/verde quando aplicável), **terceiro texto opcional** (`.list-item__terciario`, adicionado em 2026-06-28 — ex.: horário em Intervalos), conteúdo à direita (valor, ou nada) e setinha (`.list-item__chevron`) quando a linha leva a algum lugar. Mesmo visual em listas de dados (Clientes, Pendentes), listas de menu (hub Mais, Configurações, Perfil) e listas de cadastro (Intervalos). Listas de coleção (que podem crescer) mostram até 5 com "Ver todos"; listas de cadastro/menu (tamanho fixo, poucos itens) mostram tudo.
3. **Insight** (`.insight-card`): título pequeno (rótulo) → valor → comparação opcional, e setinha (`.list-item__chevron`) **fora** do bloco de texto, como elemento irmão, quando o card inteiro leva a outra página. Usado nos teasers de Aniversariantes/Sem retornar dentro de Clientes, no próprio card de topo de Sem retornar, e nos 3 indicadores do rodapé do Relatório e nos 2 totais de Intervalos. **Devedores deixou de ser insight em 2026-06-28** — virou card de ranking (item 6). **Aniversariantes perdeu o card de topo em 2026-06-29** (achava redundante com o título "Aniversariantes (N)" que já mostra a contagem) — o teaser dentro de Clientes não foi afetado, continua igual.
4. **Título com botão de ação** (Tipo A, `page-header-principal`): ver seção 8.1. Tamanho/peso do título igual ao da Agenda (`var(--text-md)`, 800) desde 2026-06-28 — antes era maior (`var(--text-xl)`). Botão de ação é `icon-btn`/`icon-btn--accent` (círculo, igual à Agenda), nunca `.fab` (Clientes foi a última a trocar).
5. **Título com botão de voltar e ação** (Tipo B, `app-header`): ver seção 8.1.
6. **Card de ranking**: card destacado com cabeçalho (ícone/texto, **sem setinha desde 2026-06-29** — o link "Ver ranking completo" no rodapé já deixa claro que o card inteiro leva a outra página, a setinha no cabeçalho ficava redundante), uma **lista top 3** (não mais pódio — trocado em 2026-06-28) com leve destaque ouro/prata/bronze na posição (`.ranking-posicao`/`.ranking-posicao--ouro/--prata/--bronze`), e "Ver ranking completo" no rodapé. As páginas de ranking completas (`ranking.html`, `ranking-servicos.html`, `pendentes-devedores.html`) usam a mesma lista (mesma função/CSS), só que sem o card-wrapper e mostrando todas as posições, não só o top 3. Usado em: Clientes (teaser pro Ranking), Pendentes (teaser "Devedores" pro Devedores), Serviços (link "Ver ranking" no card principal pro Ranking de serviços). **Não usar mais** `.podio`/`.podio-card` (removidos do CSS).
7. **Campo de busca** (`.input-icon` + `.input`): simples, usado em `clientes-todos.html` (removido da tela-raiz Clientes em 2026-06-29).
8. **Card de seleção** (`.segmented`/`.segmented__item`): abas de largura igual, sem rolagem, fundo único com pílula ativa. Usado em Relatório (Dia/Semana/Mês/Ano), Ranking (Faturamento/Visitas/Ticket médio), Sem retornar (20+/30+/45+/60+/90+ — rótulos abreviados), Intervalos (Todos + 7 dias da semana — rótulos abreviados, migrado de `.chip-scroll` em 2026-06-28) e (desde 2026-06-29) `clientes-todos.html` (A-Z/Z-A/Novos/Antigos, abaixo do campo de busca — ordena por nome ou por `criadoEm`). Não usar `.chip-scroll`/`.chip` pra filtros de seleção única — isso fica reservado pra outros usos (ex.: seleção de horários em modais).
9. **Card de troca (botão)**: desde 2026-06-28, reusa a **mesma classe `.segmented`** do card de seleção (mesmo fundo/cor), com texto central (`flex:1;text-align:center`) e botões `icon-btn` de anterior/próximo nas pontas — substituiu a versão anterior com caixa de borda e ícone (`.select-like`). Usado em Relatório (trocar período), Aniversariantes (trocar mês) e (desde 2026-06-29) Ranking, Ranking de serviços e pendentes-devedores (trocar ano — `#js-ano-anterior`/`#js-ano-label`/`#js-ano-proximo`, mesmo trio de IDs nas 3 telas).

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
- **Cliente em Novo Agendamento (simplificado em 2026-06-28):** nome digitado sem nenhum cliente correspondente → ao salvar, **cria o cliente automaticamente** (sem perguntar), com nome e o telefone que tiver sido preenchido em "+ Adicionar telefone" (opcional, aparece só quando não há cliente existente selecionado). Nome digitado batendo exatamente com cliente existente, sem selecionar a sugestão → única pergunta que resta: modal "Usar cliente existente / Criar novo cadastro". **Conceito de "avulso" (agendamento sem cliente cadastrado) foi removido** — todo agendamento sempre tem um cliente, mesmo que mínimo.

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
- **Finalizar atendimento / Editar realizado (ajustado em 2026-06-28):** observação do agendamento é herdada (preenchida no campo) mas o campo continua **fechado por padrão** (atrás de "+ Adicionar observação"), mesmo quando já existe texto — usuário pode abrir pra ver/editar. Serviços mostram **todos os chips sempre** (tentativa de mostrar só os selecionados com um lápis foi revertida — usuário achou estranho). Nome do cliente tem ícone de lápis — editar aqui **atualiza o cadastro do cliente de verdade** (nome do `Cliente`, não só o texto do agendamento), quando há `clienteId` vinculado. "Foi pago?"/"Situação do pagamento" usam chips pequenos, não mais botões grandes.
- **Quitar pendente**: botão "Receber" em Pendentes leva para `index.html?data=AAAA-MM-DD` — a Agenda abre exatamente naquele dia (implementado na Etapa 7).
- **Cliente novo digitado em Novo Agendamento (2026-06-28):** busca ao vivo sugere clientes existentes ao digitar; selecionou sugestão → vincula direto; não bate com nada → cria cliente automaticamente ao salvar (nome + telefone opcional); bate com nome exatamente igual sem selecionar a sugestão → modal "Usar existente / Criar novo cadastro".
- **Mover cliente pra lixeira**: remove de `clientes`, insere em `clientesLixeira` — agendamentos antigos não são apagados nem alterados.
- **Backup**: exportar baixa um `.json` com as 9 chaves; importar exige confirmação explícita e substitui tudo de uma vez (tudo ou nada, sem merge).

## 16. Telas existentes (23 telas oficiais + hub "Mais")

Todas em `docs/AGENDA_V3_DOCUMENTO_MESTRE.txt` seção 6. Lista: Agenda (`index.html`), Clientes, Cliente-detalhe, Relatório, Pendentes (+ 1 tela "ver todos" ainda existente: `pendentes-devedores.html`; `pendentes-quem-deve.html` e `pendentes-pagos.html` removidas em 2026-06-29), Serviços, Formas de pagamento, Intervalos, Mais (hub), Configurações, Assinatura, Onboarding, WhatsApp, Perfil, Ranking, Aniversariantes, Sem retornar, Login, Cadastro, Assinatura vencida, Backup, Ajuda, Termos, Privacidade.

**Tela extra criada na revisão pós-publicação (2026-06-27):** `clientes-todos.html` — diretório completo de clientes com busca própria, sem limite de 5; é o destino do "Ver todos" da lista resumida em `clientes.html` (mesmo padrão das telas "ver todos" do Pendentes).

## 17. Funcionalidades existentes (real, ligado a dados — não apenas visual)

- Tema escuro/claro + cor principal (Fase 2).
- Chips e modais genéricos (Fase 2).
- Calendário com matemática real de mês (Fase 2, ajustado na Etapa 6 pra usar a data real do sistema).
- Serviços: CRUD completo + exclusão lógica (Etapa 2).
- Formas de pagamento: CRUD completo + exclusão lógica (Etapa 2).
- Clientes: CRUD completo + lixeira + busca + prévias de Ranking/Aniversariantes/Sem-retornar (Etapa 3).
- Intervalos (bloqueios fixos): CRUD completo, grade de horários real, totais calculados (Etapa 4).
- Configurações: horários/grade/tempo padrão/modo de compartilhamento reais; Limpar agenda / Apagar todos os dados / Redefinir onboarding funcionais (Etapa 5).
- Agenda completa (Etapa 6): navegação real por dia/semana/calendário, algoritmo de encaixe, CRUD de agendamentos, realizar atendimento com pagamento dividido, editar/excluir realizado, bloqueio pontual vs. fixo, busca de cliente ao vivo, botão "Enviar lembrete", Compartilhar horários via WhatsApp.
- **Gesto de arrastar (ajustado em 2026-06-29):** `adicionarGestoSwipe()` (`js/agenda.js`) tem um callback de progresso opcional com 2 parâmetros — `(deltaX, comprometido)`. `comprometido=true` é passado no instante em que o dedo solta E o arraste vai resultar em troca (passou do limiar de 60px) — força a transição visual a completar 100% imediatamente, sem voltar ao estado original antes de trocar. Usado por `aplicarProgressoCarrossel` (troca de dia, esmaece a cor do dia ativo pro vizinho) e `aplicarProgressoSemana` (troca de semana, desliza a semana seguinte/anterior por uma segunda faixa de chips posicionada de forma absoluta sobre `#js-week-carousel-wrap`, escondida quando não está em uso).
- Pendentes: as 4 telas com dados reais, "Receber" leva à data exata do pendente na Agenda (Etapa 7). **Ajustado em 2026-06-29:** `pendentes-quem-deve.html` e `pendentes-pagos.html` removidos — as listas agora expandem na própria `pendentes.html`. "Quem deve" mostra 5 por padrão; se houver mais, o título vira "Quem deve (N)" e aparece "Ver todos"/"Ver menos". "Pagos recentemente" usa só os 5 últimos (`.slice(0,5)`), mostra 2 por padrão, "Ver todos"/"Ver menos" quando há mais de 2.
- Relatório: todos os números reais por período (Dia/Semana/Mês/Ano), com comparação vs. período anterior (Etapa 8).
- **Gráfico de faturamento do Relatório (corrigido em 2026-06-29):** antes sempre mostrava a semana atual (Dom-Sáb) independente da aba selecionada — agora `calcularPontosGrafico()` (`js/relatorio.js`) calcula de verdade por período: Dia = gráfico oculto (removido 2026-06-29); Semana = um ponto por dia; Mês = um ponto por dia do mês; Ano = um ponto por mês.
- **Textos de variação do Relatório (ajustado em 2026-06-29):** `formatarComparacao()` aceita parâmetro `tipo`: `"valor"` (faturamento, ticket médio, taxas) exibe `▲R$X,XX (Y%) vs período anterior` sem casas decimais no %; `"contagem"` (atendimentos) exibe `▲N vs período anterior`. "Sem variação vs … anterior" ficou no mesmo tamanho (`--text-2xs`) que os textos verde/vermelho — era `--text-xs` antes (CSS `insight-card__comparacao`).
- **Calendário do Relatório (sincronizado em 2026-06-29):** ao abrir o modal de calendário, chama `window.irParaMesCalendarioAgenda` com o `refData` atual — o calendário abre já no mês/dia do período visualizado, com o dia ativo destacado, a semana inteira marcada e o dia de hoje distinguível. Ao selecionar um dia, `window.aoSelecionarDiaCalendarioAgenda` (definido em `relatorio.js`) atualiza `refData` e recalcula o relatório. Reutiliza toda a infraestrutura visual de `calendario.js` sem nenhuma mudança de CSS ou HTML.
- **Layout e visual do Relatório (ajustado em 2026-06-29):** ordem das seções: Faturamento → 3 insight-cards (Atendimentos/Ticket médio/Taxas) → Recebimentos (antes os insights eram por último). Card de período agora tem duas linhas: principal (ex: "29 de junho" ou "28 jun – 04 jul") e secundária (dia da semana para Dia; "domingo à sábado" para Semana; vazia para Mês/Ano). Título "Recebimentos" e valores por forma de pagamento usam `text-secondary` (sem negrito); texto "Total recebido" removido (redundante). Cores das formas de pagamento agora são fixas: dinheiro `#22C55E`, pix `#3B82F6`, crédito `#EC4899`, débito `#EAB308`, outras `#94A3B8`. Variações mostram só diferença de valor (`▲R$X,XX vs período anterior`) ou unidade (`▲N vs …`) — sem porcentagem.
- Ranking (3 métricas), Aniversariantes (navegação de mês real) e Sem retornar (filtro por dias real) como telas completas (Etapa 9).
- WhatsApp: número e as 4 mensagens editáveis de verdade, com "Restaurar padrão" (Etapa 10).
- Backup: exportar baixa um `.json` real das 9 chaves; importar substitui tudo com confirmação (Etapa 10).
- Onboarding: Passo 1 (estabelecimento/profissional/WhatsApp/endereço) e Passo 3 (horários/grade/tempo padrão) salvam de verdade; chegar ao passo final marca `agendaV3:onboarding` como concluído (Etapa 11).
- **Fase 3 está 100% concluída (todas as 11 etapas).**

## 18. Funcionalidades planejadas (não implementadas ainda)

- `mensagemEndereco`: onde mora o botão de enviar endereço — decisão **deliberadamente em espera**, ver `docs/LOGICA_E_FLUXO_DE_DADOS.md` Pergunta 7.
- `perfil.html` continua decorativo (nome/e-mail/senha/plano estáticos) — é conceitualmente "conta logada", fica pra Fase 5.
- Fase 5 (backend real, login real, sincronização) — ainda não iniciada.
- **Adicionar horário extra na Agenda, só naquele dia (registrado em 2026-06-29, não implementar ainda):** botão discreto acima do primeiro horário do dia e abaixo do último (ex.: agenda configurada 9:00–17:30 → botão "+ adicionar mais 1 hora" em cima do 9:00 e embaixo do 17:30). Ao tocar, libera mais 1 hora de horários pra agendar **só naquele dia específico** (não altera `horaInicio`/`horaFim` da configuração geral). A quantidade de novos slots liberados depende do `intervaloGrade` (15/20/30/40min etc.) — sempre o equivalente a 1 hora cheia, não um slot fixo. No exemplo dado pelo usuário (grade que termina em 17:30), tocar no botão de cima libera o 8:00, e no de baixo libera o 18:30.

## 19. Decisões definitivas (não voltar atrás sem confirmação explícita)

Todas as 10 perguntas resolvidas em `docs/LOGICA_E_FLUXO_DE_DADOS.md` seção 7, mais:
- Modal "Usar existente ou criar novo" (Fase 1/2) foi substituído por busca ao vivo (Etapa 6) e depois simplificado de novo em 2026-06-28: cliente novo cadastra automaticamente ao salvar, sem nenhuma pergunta — ver seção 11 e 15. O modal "Adicionar aos clientes?" e o conceito de "avulso" foram **removidos**.
- **"Sem retornar" (confirmado em 2026-06-28, lógica de bucket trocada em 2026-06-29):** cliente com atendimento anterior E última visita dentro de uma faixa exata de dias (20–29/30–44/45–59/60–89/90+, ver tabela em 8.1). Cliente **nunca atendido NÃO entra** nessa lista — corrigido em 2026-06-28 (antes incluía por engano; era `dias === null || dias >= limite`). Em 2026-06-29 o filtro deixou de ser cumulativo (`dias >= limite`) e passou a usar `bucketDiasSemRetornar(dias)` pra bucket exato — ver detalhe em 8.1.
- **"Faturados"/Ranking somam `realizado_pendente` também (confirmado em 2026-06-28):** comportamento já implementado, usuário confirmou que é o esperado. Não é mais "a confirmar".
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
- **Fase 4** (auditoria, validação e refinamento): 🔶 **formalizada em 2026-06-28** — ver `Documentacao/04_FASE_4.md`. Processo e checklist definidos; execução (percorrer as telas) em andamento.
- **Fase 5** (backend): não iniciada.

## 22. Fase atual

**Fase 4 formal** — processo definido em `Documentacao/04_FASE_4.md`: achar o problema real antes da solução, pesquisar referência (Booksy/Fresha/Google e Apple Calendar/Mercado Pago) quando houver dúvida de fluxo, Claude age como analista antes de implementar, checklist único por tela. App publicado e testável em https://vhramalho.github.io/agenda-v3/ (repo https://github.com/vhramalho/agenda-v3).

**Página Agenda (`index.html`) encerrada nesta rodada da Fase 4** (2026-06-29) — passou pelo checklist da seção 6 de `04_FASE_4.md`: padronização visual (sessões anteriores), simplificação do fluxo de cliente nos modais, animação de troca de dia/semana corrigida, botões redundantes de Cancelar/Fechar removidos. Usuário confirmou "acho que encerramos a página de agenda". Única pendência registrada pra depois: a funcionalidade de "adicionar horário extra só no dia" (seção 18). Não é definitivo — pode voltar a receber ajustes se surgir algo no uso real, mas não é mais o foco ativo.

## 23. Próxima etapa

Percorrer as telas que ainda não passaram pelo checklist da Fase 4 (seção 6 de `04_FASE_4.md`), na ordem da seção 7 desse documento. Mesmo padrão de trabalho de sempre: usuário lista o que observa no uso real, Claude aplica o filtro "qual é o problema real" antes de propor solução, e só implementa depois de alinhar entendimento.

## 24. Pendências

- Publicar o projeto no GitHub + GitHub Pages — ✅ feito em 2026-06-26 (repo público https://github.com/vhramalho/agenda-v3, Pages ativado pelo usuário via Settings > Pages, branch main).
- Decidir onde mora o botão de `mensagemEndereco` (Pergunta 7) — usuário disse "ainda vou definir" (2026-06-28), continua em espera.
- **Resolvidas em 2026-06-28:** critério de "sem retornar" confirmado e corrigido no código; `realizado_pendente` no faturamento/Ranking confirmado como esperado; backup (exportar/importar) confirmado funcionando pelo usuário; `perfil.html` decorativo confirmado como aceitável até a Fase 5; fluxo de "Agendar cliente" simplificado (cliente novo cadastra sozinho, telefone/observação escondidos atrás de "+", conceito de "avulso" removido — ver seções 11/15/19).
- **Resolvido em 2026-06-28: chips de `.chip-group` desorganizados.** Causa raiz: o container usava `flex-wrap` com cada chip largo conforme o texto, então linhas com textos de tamanhos diferentes (ex.: "Pix" vs. "Cartão de crédito") ficavam com colunas desalinhadas. Trocado pra `display:grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr))` — todo chip ocupa a largura da coluna do grid, alinhando linhas independente do tamanho do texto. Afeta todos os usos de `.chip-group` (Serviços e Formas de pagamento em Novo agendamento/Finalizar atendimento/Editar realizado).
- **`js/acoes-simuladas.js` não é código morto da Fase 2** — ainda controla de verdade o toggle "Foi pago? Sim/Não" do modal Finalizar atendimento (`closest(".btn-row")` + toggle de `[data-campo-pago]`). Atualizado em 2026-06-28 pra alternar `chip--ativo` em vez de `btn--primary`/`btn--secondary`, já que esses botões viraram chips. Não remover esse arquivo sem migrar essa lógica pra `agenda.js` primeiro.
- **Modais com campos de texto ocupando quase a tela inteira quando o teclado abre no celular** — usuário observou isso en passant (2026-06-26). O modal de Novo agendamento ficou bem mais curto depois da simplificação de 2026-06-28 (telefone/observação escondidos, avulso removido), o que deve ajudar bastante, mas isso **não foi testado/confirmado no celular ainda** — não marcar como resolvido sem confirmação do usuário.
- **Zoom automático do navegador desativado em 2026-06-26** (`maximum-scale=1.0, user-scalable=no` no viewport de todas as telas + `font-size:16px` em `.input/.textarea/.select`) — decisão deliberada pra parecer mais "nativo", trocando a possibilidade de zoom por pinça/duplo-toque. Usuário confirmou que topa essa troca; se no futuro for necessário, considerar implementar um controle de "tamanho do texto" dentro do próprio app como alternativa ao zoom do navegador.
