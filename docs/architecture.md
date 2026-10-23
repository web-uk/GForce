# Arquitetura GForce

## Inspeção em 23/10/2026

Repositório `web-uk/GForce`, público, branch padrão `main`, commit inicial `05be80f`. Apenas README.md, checkout limpo, sem AGENTS.md. Nenhum arquivo ou trabalho alheio removido. GitHub CLI autenticado com permissão administrativa neste repositório. Pages inicialmente retornou 404 (site não configurado). Os comandos de rede precisam da permissão de rede do sandbox; nenhuma credencial é copiada para o projeto.

## Decisões

- React 19, TypeScript 5, Vite 7, versões estáveis resolvidas no package-lock.json; Node 22 no CI. `npm ci` reproduz a instalação. Sem backend, serviço de IA, analytics ou conta pública.
- UI mobile first em português, ícones Lucide, fontes do sistema (sem dependência de fontes externas), CSS com safe areas e redução de movimento. Navegação hash e base única `/GForce/`.
- `src/content` guarda instruções e programação; `src/lib/model.ts` contém validação Zod e regras puras; `storage.ts` é a fronteira IndexedDB; `auth.ts` isola o controle local; componentes isolam perfil, instruções e treino. App orquestra páginas e mudanças explícitas de estado.
- Uma pessoa por navegador. IndexedDB `gforce`, versão física 1, object store `records`, registro `personal`; documento versionado 1. Transações atômicas para o snapshot pessoal. Não há migração destrutiva: upgrades criam stores ausentes e preservam existentes. Uma versão futura deve adicionar migrador explícito e testes de fixtures antes de elevar versões. Versões de backup desconhecidas são recusadas, nunca apagadas automaticamente.
- LocalStorage contém a preferência de acesso lembrado e as preferências mínimas de notificações. O verificador compartilhado PBKDF2 SHA-256, com salt aleatório de 128 bits e 600.000 iterações, fica no bundle público, sem senha em texto. Web Crypto requer HTTPS ou localhost. Não se trata de autenticação remota ou criptografia. Reinicializar apaga dados somente após confirmação e não contorna a senha única.
- Backups usam lista permitida pelo schema Zod. Não incluem localStorage, senhas nem chaves. Restauração exige revisão do resumo e confirmação antes de trocar um snapshot. Dados renderizados como texto React, sem HTML importado.
- Datas de calendário são `YYYY-MM-DD` locais; aritmética usa meio-dia local, e não `toISOString().slice(0,10)`. Timestamps são usados para intervalos e instantes de backup.
- Conclusão tem chave única por `planId`; o schema e a operação de finalização recusam duplicação. O histórico permanece após reiniciar calendário. Uma sessão parcial ocupa seu item de plano, sem incentivo a compensar.
- Timer calcula tempo restante usando deadline em timestamp. Nunca avança etapas automaticamente. Ao ocultar a aba, pausa e persiste; ao reabrir/recarregar, restaura pausado. Wake Lock é oportunista. A voz é acionada apenas por interação, não é alarme de fundo.
- PWA Workbox gera precache de HTML, JS, CSS, ícones e manifest. Nada de cache de vídeos de terceiros. Novo service worker é ativado automaticamente na abertura/retorno seguro; sessões em andamento impedem a troca. IndexedDB não é limpo na atualização. Não há sincronização entre contextos de instalação.
- Plano introdutório: 28 atividades, duas sessões de força não consecutivas; terceira opcional, movimento leve, mobilidade e descanso. Uma série inicial por movimento. Repete a estrutura para aprendizagem, sem progressão por passagem de semana. Um ajuste acrescenta somente uma repetição após duas sessões completas toleradas e confirmação. Redução disponível a qualquer momento. Após pausa de pelo menos 14 dias, sugere retomada curta com até cinco repetições.
- Faixa etária e situação reprodutiva exigem seleção explícita. Dor/lesão, menoridade, gestação, recuperação de parto ou sintomas pélvicos suspendem o plano automático. Sem diagnóstico ou adaptação terapêutica. Após relato de dor em sessão, bloqueio conservador exige avaliação; esta versão não emite liberação clínica.

## Publicação

GitHub Actions valida lint, tipos, regras e fluxos Chromium em dois tamanhos, faz build e publica via OIDC no Pages. Pull requests validam sem deploy. Permissões mínimas por job. Não há PAT no workflow. Configuração de Pages usa `build_type: workflow` e preserva visibilidade e proteções existentes.

## Atualização: senha única e avisos (23/10/2026)

A pedido explícito da usuária, o modelo de senha pessoal foi substituído por senha única compartilhada. `access-verifier.json` contém somente verificador PBKDF2 com salt; a senha não é gravada em texto. O registro local de acesso v2 mantém somente a preferência `remember`. Migração preserva acessos lembrados e bloqueio manual do formato anterior, descarta o verificador pessoal antigo e não altera IndexedDB. A opção de pedir senha a cada abertura e a troca local de senha foram removidas. A proteção continua local e não torna o site privado.

Web Push é uma exceção autorizada nesta atualização à ausência inicial de serviço externo: OneSignal no plano Free, consentimento explícito, nenhuma transmissão de perfil ou histórico. O SDK só carrega após consentimento; service worker separado em `/GForce/push/` evita disputa com Workbox offline. O agendador GitHub Actions envia três temas em horários aproximados, com idempotência por dia/tema e quatro tags de preferência. Credenciais privadas ficam em secrets do Actions, nunca no bundle. O App ID público e o fuso ficam em variables de Actions e são usados no build. As mensagens de sessão são exibidas localmente sem enviar eventos de treino ao provedor. Detalhes e dependências externas em [notifications.md](notifications.md).

Backups de treino continuam sem senha, preferência de desbloqueio, consentimento de notificações ou inscrição de push: restaurar em outro contexto não ativa notificações silenciosamente.

O build de testes pode substituir o módulo de verificador por fixture via alias do Vite, selecionado somente no processo de build. O workflow refaz depois o artifact de produção e verifica conteúdo dos hashes para impedir publicação da credencial de teste. Sem o secret opcional de senha real, o smoke público valida rejeição de senha incorreta e semeia acesso lembrado para testar funções locais; o relatório identifica explicitamente essa fixture.

## Histórico: update focal de acesso e organização dos testes (fluxo manual substituído abaixo)

A tela de acesso foi isolada em `components/Gate.tsx`, com boas-vindas, incentivo e um único campo para a senha já definida. O verificador e a persistência de acesso não foram alterados. `AppUpdate` centraliza a atualização explícita antes e depois do login, com o mesmo bloqueio quando há treino em andamento; registra o listener de `controllerchange` antes de solicitar ativação. O registro do service worker usa `updateViaCache: none` para consultar versões novas sem reutilizar o cache HTTP do script. Não ativa versões nem recarrega treinos automaticamente. Uma instalação que ainda executa o HTML/JavaScript anterior pode precisar ser fechada e recarregada para receber a nova versão; não se apagam caches de dados ou registros para isso.

Os testes de navegador foram separados por área em arquivos independentes, preservando os cenários anteriores. `scripts/test-area.mjs` permite selecionar uma ou mais áreas e evita repetir builds entre elas. Testes de regressão locais podem ficar restritos ao impacto do update; o CI de publicação mantém a validação completa. Não há mudança de esquema, conteúdo de treino ou funcionamento das notificações neste update.

## Update focal — convite de notificações e ajuste no iPhone

O convite após o login contém a decisão de ativar ou recusar e desaparece imediatamente após a escolha, sem transformar a página Hoje num painel de preferências. Informações sobre provedor, horários, suporte no iPhone, conexão e diagnóstico de permissão ficam na instância de `Notifications` em Configurações. Consentimento, inscrição, agendador e persistência das escolhas não mudaram.

Campos editáveis usam fonte mínima de 16px, inclusive seletores de datas no celular, para prevenir o zoom de foco do Safari em campos pequenos. `text-size-adjust: 100%` evita inflação automática do texto; o viewport continua permitindo ampliação manual por acessibilidade. O texto do cartão diário pode encolher e quebrar palavras dentro do flex container. Não há bloqueio de zoom, escala forçada por JavaScript ou ocultação de overflow para mascarar conteúdo cortado. Suíte `layout` verifica fonte dos campos e largura das páginas após login.

## Atualização automática na abertura

`lib/app-updates.ts` substitui o aviso e o botão de atualização, removendo `AppUpdate` e o evento React `gforce-update`. O service worker continua sem `skipWaiting` global: a aplicação solicita ativação automaticamente somente numa abertura/retorno visível e seguro. Consulta e registro usam `updateViaCache: none`. Uma versão já baixada é aplicada primeiro; a instalação recém-detectada pode ser aplicada numa janela inicial de até três segundos. A interface abre imediatamente e não fica aguardando rede. Uma instalação tardia espera a próxima abertura.

IndexedDB é consultado antes da ativação e novamente antes da recarga. Sessões persistidas, inclusive pausadas, impedem troca/recarga. Eventos input/change protegem formulários não salvos; transação de gravação concluída emite `gforce-data-saved` para permitir a próxima abertura segura. Falha de leitura conserva a versão atual. Se surgir uma sessão durante a ativação, a recarga é adiada; próximo retorno seguro completa a troca. Não se recarrega ao terminar um treino na tela atual. Não há migração de esquema nem limpeza de dados.

Os eventos visibilitychange e pageshow cobrem retorno de uma janela mantida em memória, além da inicialização em uma abertura nova. O bootstrap respeita a condição de estar visível. No teste, uma URL de worker identifica uma versão sintética e permanece igual nas reaberturas para não simular uma segunda versão acidentalmente; um contador de documentos prova que ocorreu recarga automática real. Testes protegem acesso lembrado/bloqueado, histórico, offline, sessão ativa e falhas de armazenamento. Instalações que ainda executam o JavaScript anterior precisam receber esta versão uma vez (último botão antigo ou fechar todas as janelas); não é possível reescrever retroativamente um documento já carregado sem substituí-lo.
