# Arquitetura GForce

## Inspeção em 23/10/2026

Repositório `web-uk/GForce`, público, branch padrão `main`, commit inicial `05be80f`. Apenas README.md, checkout limpo, sem AGENTS.md. Nenhum arquivo ou trabalho alheio removido. GitHub CLI autenticado com permissão administrativa neste repositório. Pages inicialmente retornou 404 (site não configurado). Os comandos de rede precisam da permissão de rede do sandbox; nenhuma credencial é copiada para o projeto.

## Decisões

- React 19, TypeScript 5, Vite 7, versões estáveis resolvidas no package-lock.json; Node 22 no CI. `npm ci` reproduz a instalação. Sem backend, serviço de IA, analytics ou conta pública.
- UI mobile first em português, ícones Lucide, fontes do sistema (sem dependência de fontes externas), CSS com safe areas e redução de movimento. Navegação hash e base única `/GForce/`.
- `src/content` guarda instruções e programação; `src/lib/model.ts` contém validação Zod e regras puras; `storage.ts` é a fronteira IndexedDB; `auth.ts` isola o controle local; componentes isolam perfil, instruções e treino. App orquestra páginas e mudanças explícitas de estado.
- Uma pessoa por navegador. IndexedDB `gforce`, versão física 1, object store `records`, registro `personal`; documento versionado 1. Transações atômicas para o snapshot pessoal. Não há migração destrutiva: upgrades criam stores ausentes e preservam existentes. Uma versão futura deve adicionar migrador explícito e testes de fixtures antes de elevar versões. Versões de backup desconhecidas são recusadas, nunca apagadas automaticamente.
- LocalStorage contém somente acesso: salt aleatório de 128 bits, PBKDF2 SHA-256, 600.000 iterações, resultado de 256 bits, preferências de exigir senha e lembrar acesso. Web Crypto requer HTTPS ou localhost. Não se trata de autenticação remota ou criptografia. Reinicialização recupera acesso apagando registros somente após confirmação.
- Backups usam lista permitida pelo schema Zod. Não incluem localStorage, senhas nem chaves. Restauração exige revisão do resumo e confirmação antes de trocar um snapshot. Dados renderizados como texto React, sem HTML importado.
- Datas de calendário são `YYYY-MM-DD` locais; aritmética usa meio-dia local, e não `toISOString().slice(0,10)`. Timestamps são usados para intervalos e instantes de backup.
- Conclusão tem chave única por `planId`; o schema e a operação de finalização recusam duplicação. O histórico permanece após reiniciar calendário. Uma sessão parcial ocupa seu item de plano, sem incentivo a compensar.
- Timer calcula tempo restante usando deadline em timestamp. Nunca avança etapas automaticamente. Ao ocultar a aba, pausa e persiste; ao reabrir/recarregar, restaura pausado. Wake Lock é oportunista. A voz é acionada apenas por interação, não é alarme de fundo.
- PWA Workbox gera precache de HTML, JS, CSS, ícones e manifest. Nada de cache de vídeos de terceiros. Novo service worker aguarda ação explícita e bloqueia atualização durante sessão. IndexedDB não é limpo na atualização. Não há sincronização entre contextos de instalação.
- Plano introdutório: 28 atividades, duas sessões de força não consecutivas; terceira opcional, movimento leve, mobilidade e descanso. Uma série inicial por movimento. Repete a estrutura para aprendizagem, sem progressão por passagem de semana. Um ajuste acrescenta somente uma repetição após duas sessões completas toleradas e confirmação. Redução disponível a qualquer momento. Após pausa de pelo menos 14 dias, sugere retomada curta com até cinco repetições.
- Faixa etária e situação reprodutiva exigem seleção explícita. Dor/lesão, menoridade, gestação, recuperação de parto ou sintomas pélvicos suspendem o plano automático. Sem diagnóstico ou adaptação terapêutica. Após relato de dor em sessão, bloqueio conservador exige avaliação; esta versão não emite liberação clínica.

## Publicação

GitHub Actions valida lint, tipos, regras e fluxos Chromium em dois tamanhos, faz build e publica via OIDC no Pages. Pull requests validam sem deploy. Permissões mínimas por job. Não há PAT no workflow. Configuração de Pages usa `build_type: workflow` e preserva visibilidade e proteções existentes.
