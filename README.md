# GForce

Aplicativo pessoal em português brasileiro para iniciar uma rotina de força em casa, com cuidado, registro local e uso offline. React + TypeScript + Vite. Sem conta, backend, API paga ou telemetria.

**Endereço do Pages:** https://web-uk.github.io/GForce/ — a disponibilidade depende do último workflow de deploy concluído com sucesso.

## Começar

1. Na primeira abertura deste navegador, crie e confirme uma senha pessoal de pelo menos oito caracteres. Não há e-mail nem senha compartilhada.
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
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
npm run preview -- --port 4173
```

Playwright inicia o preview automaticamente quando necessário. Os projetos Chromium usam **390 × 844** (emulação móvel) e **1440 × 900**. Não equivalem a teste físico em iPhone. Capturas e traces ficam em `test-results/` e nos artifacts do workflow, fora do Git. Evidências selecionadas sem dados pessoais estão em `docs/evidence/`.

## Funcionalidades

- Controle local de acesso com PBKDF2/Web Crypto, bloqueio, troca de senha e senha a cada abertura opcional.
- Perfil editável, planejamento de quatro semanas, duas sessões de força não consecutivas e terceira opcional.
- Treino guiado com preparo, instruções, repetições, descanso, alternativas fáceis, voz/volume opcionais, pausa, retomada e registro parcial.
- Biblioteca pesquisável, filtros e referências por movimento; histórico real, disposição, esforço e resistência informados.
- Progressão conservadora confirmada, manutenção, redução e retomada após interrupção.
- Refeições e lista de compras editáveis, sem prescrição de dieta ou estimativa de calorias queimadas.
- IndexedDB versionado, backup JSON validado com resumo antes de restaurar e exclusão confirmada.
- Manifest, ícones, service worker, instruções offline, atualização explícita fora do treino e base `/GForce/` com hash routing.

## Backup, senha e iPhone

Em **Configurações → Exportar dados / backup JSON**, salve o arquivo em local privado. Ele contém registros pessoais **sem criptografia**, mas não senha ou verificador. Para transferir conscientemente a outro navegador ou instalação, crie a senha naquele contexto e importe o arquivo; revise o resumo e confirme a substituição. Não há sincronização automática. Confira se o arquivo foi realmente baixado.

“Bloquear agora” exige a senha para voltar. “Exigir senha a cada abertura” começa desativado. Alterar senha exige a atual e confirmação da nova. Senha esquecida só é recuperada por reinicialização local com perda dos dados sem backup.

No iPhone, abra o endereço no **Safari → Compartilhar → Adicionar à Tela de Início**. A instalação não é automática. Os dados podem ser independentes entre Safari, PWA e outros aparelhos. Primeira abertura requer internet; fontes e vídeos externos continuam exigindo conexão. Não há garantia de voz, alarmes ou notificações com o aplicativo fechado.

## Publicação

O workflow `.github/workflows/pages.yml` valida lint, tipos, testes unitários, build e fluxos do navegador antes de publicar. Pull requests apenas validam. Push na `main` ou execução manual publica o artifact em Pages com OIDC.

Em GitHub **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. Não altere a visibilidade e não contorne proteções de branch. O job `deploy` retorna a URL real. Confirme a execução e abra o endereço após publicar. O token local de integração não conseguiu habilitar Pages (403); a configuração foi feita pela proprietária durante a entrega.

## Documentação

- [Arquitetura e decisões](docs/architecture.md)
- [Fontes, programação e situação da revisão](docs/content-sources.md)
- [Privacidade e armazenamento](docs/privacy.md)
- [Auditoria, evidências e limitações](docs/audit.md)

Não coloque dados reais de saúde, backups, fotos pessoais ou segredos neste repositório. O bloqueio é um controle neste aparelho: **não torna o site privado nem criptografa os registros**.
