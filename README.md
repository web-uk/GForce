# GForce

Aplicativo pessoal em português brasileiro para iniciar uma rotina de força em casa, com cuidado, registro local e uso offline. React + TypeScript + Vite. Sem cadastro público ou API paga. Registros pessoais continuam locais; Web Push opcional usa OneSignal após consentimento.

**Endereço do Pages:** https://web-uk.github.io/GForce/ — a disponibilidade depende do último workflow de deploy concluído com sucesso.

## Começar

1. Na primeira abertura deste navegador, digite a senha única de acesso configurada. O acesso fica lembrado; não há criação de senha, e-mail ou novo pedido ao reabrir, salvo bloqueio manual ou limpeza dos dados.
2. Preencha o perfil, inclusive faixa etária, disponibilidade e respostas de segurança. Peso e medidas são opcionais.
3. Em Hoje, inicie uma sessão essencial ou curta. Em Minha semana, escolha novas datas preservando dias sem força entre sessões. Descanso faz parte do plano.
4. No treino, confirme a disposição, use instruções e referências visuais, pause e avance no seu ritmo. Ao terminar, registre dificuldade e eventuais sintomas. É possível encerrar com registro parcial.

Perfil com indicação de avaliação individual não recebe treino automático. Conteúdo educativo geral; não é prescrição clínica, avaliação ou promessa de resultado. Demonstrações visuais externas exigem internet. Textos e funções locais ficam disponíveis offline após o carregamento completo.

## Rodar e verificar

Node **22.12+** (CI Node 22) e npm.

```sh
npm ci
npm run dev
```

Abra a URL local com `/GForce/`. Para testar a PWA, use o build de produção:

```sh
npm run lint
npm run typecheck
npm test
GFORCE_TEST_BUILD=1 npm run build
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
node scripts/check-production-verifier.mjs
npm run preview -- --port 4173
```

Playwright inicia o preview automaticamente quando necessário. Os projetos Chromium usam **390 × 844** (emulação móvel) e **1440 × 900**. Não equivalem a teste físico em iPhone. Capturas e traces ficam em `test-results/` e nos artifacts do workflow, fora do Git. Evidências selecionadas sem dados pessoais estão em `docs/evidence/`.

## Funcionalidades

- Controle local com senha única, verificador PBKDF2/Web Crypto, acesso lembrado e bloqueio manual, preservando acessos e registros existentes.
- Perfil editável, planejamento de quatro semanas, duas sessões de força não consecutivas e terceira opcional.
- Treino guiado com preparo, instruções, repetições, descanso, alternativas fáceis, voz/volume opcionais, pausa, retomada e registro parcial.
- Biblioteca pesquisável, filtros e referências por movimento; histórico real, disposição, esforço e resistência informados.
- Progressão conservadora confirmada, manutenção, redução e retomada após interrupção.
- Refeições e lista de compras editáveis, sem prescrição de dieta ou estimativa de calorias queimadas.
- IndexedDB versionado, backup JSON validado com resumo antes de restaurar e exclusão confirmada.
- Manifest, ícones, service worker, instruções offline, atualização explícita fora do treino e base `/GForce/` com hash routing.

## Backup, senha e iPhone

Em **Configurações → Exportar dados / backup JSON**, salve o arquivo em local privado. Ele contém registros pessoais **sem criptografia**, mas não senha ou verificador. Para transferir conscientemente a outro navegador ou instalação, crie a senha naquele contexto e importe o arquivo; revise o resumo e confirme a substituição. Não há sincronização automática. Confira se o arquivo foi realmente baixado.

“Bloquear agora” exige a mesma senha única para voltar. A senha não aparece no Git em texto e não é alterada nas configurações. Reinicializar apaga registros e a preferência de acesso deste navegador, mas não altera nem contorna a senha única.

No iPhone, abra o endereço no **Safari → Compartilhar → Adicionar à Tela de Início**. A instalação não é automática. Os dados podem ser independentes entre Safari, PWA e outros aparelhos. Primeira abertura requer internet; fontes e vídeos externos continuam exigindo conexão. Voz e alarmes locais não são garantidos com o app fechado. Lembretes Web Push dependem de consentimento, configuração do OneSignal, agenda no GitHub e suporte do aparelho.

## Publicação

O workflow `.github/workflows/pages.yml` valida lint, tipos, testes unitários e fluxos do navegador em build com credencial fictícia, depois refaz o build de produção e verifica que o verificador de teste não foi incluído antes de publicar. Pull requests apenas validam. Push na `main` ou execução manual publica o artifact em Pages com OIDC.

Em GitHub **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. Não altere a visibilidade e não contorne proteções de branch. O job `deploy` retorna a URL real. Confirme a execução e abra o endereço após publicar. O token local de integração não conseguiu habilitar Pages (403); a configuração foi feita pela proprietária durante a entrega.

## Notificações opcionais

Após o login, aceite ou recuse o convite uma vez neste navegador. As mensagens do dia e após as sessões funcionam dentro do app. Para avisos mesmo com o app fechado, siga [a configuração do OneSignal e dos secrets no GitHub](docs/notifications.md). Não há promessa de envio real antes de configurar App ID, chave privada e inscrição do aparelho.

## Documentação

- [Arquitetura e decisões](docs/architecture.md)
- [Fontes, programação e situação da revisão](docs/content-sources.md)
- [Privacidade e armazenamento](docs/privacy.md)
- [Web Push, configuração, horários e limites](docs/notifications.md)
- [Auditoria, evidências e limitações](docs/audit.md)

Não coloque dados reais de saúde, backups, fotos pessoais ou segredos neste repositório. O bloqueio é um controle neste aparelho: **não torna o site privado nem criptografa os registros**.

## Verificações por área

Para updates pontuais, execute lint e tipos e selecione somente as áreas alteradas e relacionadas:

```sh
npm run lint
npm run typecheck
npm run test:area -- access pwa
```

Áreas independentes: `access`, `profile`, `workout`, `calendar`, `progress`, `data`, `library`, `nutrition`, `notifications`, `pwa` e `accessibility`. É possível combinar várias no mesmo comando, compartilhando um único build de teste. O executor seleciona os testes unitários relacionados, roda os respectivos arquivos Playwright nos dois tamanhos e recompõe o build de produção ao final, verificando a ausência da credencial fictícia. Requer Chromium do Playwright instalado; não instala navegadores a cada execução. `npm test` e `npm run test:e2e` continuam disponíveis para a regressão completa de publicação no CI.

Se uma instalação antiga ainda mostrar “Criar senha”, feche e reabra o app com internet e recarregue o endereço no Safari. Não limpe os dados do site. Nas versões atuais, o botão **Atualizar agora** também aparece antes do login quando uma atualização estiver disponível; ele preserva os registros e fica indisponível enquanto houver sessão em andamento.
