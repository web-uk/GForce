# Auditoria de entrega

Data: 23/10/2026. Inspeção inicial e decisões em [architecture.md](architecture.md).

## Validações executadas

- ESLint: passou.
- TypeScript estrito: passou.
- Build Vite/PWA: passou; assets com `/GForce/`, manifest e service worker gerados, oito entradas de precache.
- Auditoria das dependências de produção (`npm audit --omit=dev`): zero vulnerabilidades reportadas.
- Vitest: nove testes passaram, cobrindo calendário, datas locais, indicação de avaliação, deduplicação, progressão, backup e coerência das durações.
- Playwright Chromium: **16 testes passaram** (8 fluxos em dois tamanhos) na rodada inicial e no CI. A suíte final acrescenta a regressão de retomada após pausa, totalizando **18 execuções**; o resultado do commit entregue consta no workflow e nos artifacts.
- Auditoria axe WCAG A/AA e inspeção de rolagem horizontal incluídas nos testes de navegação.
- Inspeção visual de capturas reais do navegador em 390 × 844 e 1440 × 900. Corrigidos contraste do rodapé, marca de quebra de linha aparecendo como texto e preservação da etapa ao ocultar a aba.

## Cobertura dos fluxos de navegador

Criação e confirmação de senha, senha incorreta, desbloqueio, bloqueio manual, troca de senha, exigir senha ao abrir, perfil, indicadores de avaliação, início, pausa, avanço, persistência ao recarregar, conclusão sem duplicação, registro parcial, intervalo entre sessões, reagendamento recusado em dias consecutivos, refeições persistentes, pesquisa, referência visual, teclado, ausência de rolagem horizontal, exportação, backup inválido/incompatível, resumo e cancelamento, restauração válida e conteúdo importado como texto, progressão confirmada, redução e exclusão confirmada.

A PWA é testada pelo build de produção sob `/GForce/`: reload offline, atualização do service worker mantendo registros, atualização aguardando término da sessão e timer por timestamps sem avançar etapas silenciosamente. A troca de versão do worker usa URL de script com query de teste na mesma origem e escopo; não acessa dados externos.

Evidências visuais: [Hoje desktop](evidence/hoje-1440x900.png), [Hoje celular](evidence/hoje-390x844.png), [Semana](evidence/semana-390x844.png), [Biblioteca](evidence/exercicios-390x844.png). As capturas e dados de teste usam apenas exemplos sintéticos. Testes aguardam confirmação visual de gravação antes de recarregar; interromper uma gravação antes do commit da transação não equivale a persistência confirmada.

## Limitações reais

- **Não houve teste em iPhone físico nem instalação real no Safari.** Teste móvel é emulação Chromium. WebKit foi baixado, mas faltam bibliotecas nativas neste ambiente; não foi executado. Manifest, ícones, escopo, service worker e comportamento offline foram verificados no Chromium. Instalação e diferenças de dados entre contextos são explicadas na interface.
- **Não houve revisão clínica individual ou revisão profissional da programação.** Biblioteca é conteúdo educativo adaptado, com fontes. Usuárias que precisam de avaliação não recebem programa automático.
- Abertura dos braços sem elástico é familiarização, não equivale à resistência externa de uma puxada. Não há progressão automática de peso ou tratamento de sintomas por substituição.
- Demonstrações são links para seções verificadas nas fontes externas. Sem conexão, permanecem os textos. Disponibilidade futura e mudanças de conteúdo externo não são controladas pelo projeto.
- Voz e Wake Lock dependem de suporte e permissão; não há garantia com app fechado. Nenhum estágio do treino avança automaticamente.
- Controle de acesso local não protege contra acesso técnico ao navegador e não criptografa registros. IndexedDB pode ser limpo pelo navegador. Backup é local e não criptografado. Não há sincronização ou recuperação remota.
- Uso pessoal, uma aba de edição por vez. Não há coordenação de gravações concorrentes entre várias abas; mantenha apenas uma sessão aberta para evitar sobrescrever snapshots.
- Workbox depende de pacotes transitivos que emitem avisos de depreciação; avisos de anotação PURE do Zod são removidos pelo Rollup sem erro de build. Não há falhas conhecidas de validação bloqueadoras após a rodada final.

## Publicação

Repositório público e branch `main` preservados. Branch sem proteção detectada; nenhuma proteção foi alterada. A tentativa de habilitar Pages pelo token da integração recebeu `403 Resource not accessible by integration`; a usuária confirmou a seleção de GitHub Actions em Settings → Pages. Consulta posterior confirmou `build_type: workflow` e URL `https://web-uk.github.io/GForce/`.

O [primeiro workflow](https://github.com/web-uk/GForce/actions/runs/40028612358) concluiu **validate e deploy com sucesso** em 23/10/2026 às 21:43 UTC, publicando o commit `d47a77dc354d63af6cecc1edd2e54d2ac3a5dc9a` no Pages. A configuração retornou a URL real **https://web-uk.github.io/GForce/**.

A abertura externa no navegador local encontrou erro de confiança da CA do proxy (`ERR_CERT_AUTHORITY_INVALID`); não foi desativada a verificação TLS. Em seguida, o ambiente local ficou indisponível. Para concluir a checagem independente, o workflow inclui o job **verify-published**, que abre a URL real com Chromium no runner do GitHub, verifica HTTP 200, título, assets sem erros, criação de senha e perfil sintético, início e persistência do treino, manifest e reload offline. As capturas de 390 × 844 e 1440 × 900 e o `report.json` são publicados como artifact **published-browser-evidence**. O estado final desse job é verificável na aba Actions, sem confundir testes locais com teste do endereço publicado.

Na revisão final, a redução de repetições após pausa de pelo menos 14 dias passou a persistir como nível de referência, impedindo retorno automático ao nível anterior na sessão seguinte. Um teste restaura um histórico sintético de 12 repetições, retoma com 5 e confirma que 5 permanece após encerrar e recarregar, sem proposta de aumento após registro parcial.

A ausência de teste físico em iPhone e de revisão clínica permanece. O ambiente local indisponível não afetou o código, os commits nem as evidências já enviados ao repositório.

## Atualização de senha e notificações (23/10/2026)

A senha pessoal foi substituída pela senha única confirmada pela usuária; somente o verificador derivado foi adicionado ao código. A migração preserva a lembrança de acesso e os registros existentes, remove a exigência a cada abertura e mantém bloqueio manual. A senha real usada em testes locais vem do ambiente, sem texto no Git. O CI usa uma fixture de credencial em build exclusivo de teste; em seguida recria e verifica o artifact de produção, rejeitando a presença do verificador de teste.

Implementados convite opcional após login, escolha persistida sem perguntas repetidas, mensagens diárias contextuais e incentivo após registro completo ou parcial. OneSignal usa worker em escopo separado, carrega apenas após consentimento e recebe somente dados técnicos e preferências. O script de envio tem testes para fuso local, temas, não acumular horários perdidos, idempotência, ausência de configuração/destinatários e recusa do provedor.

Lint, tipos, build e **20 testes unitários** passaram localmente nesta atualização. **22 testes de navegador passaram** nos dois tamanhos com build de teste, incluindo SDK/inscrição simulados. **Quatro verificações adicionais passaram no build de produção**, usando a senha real fora do Git: acesso, bloqueio, persistência, backup/exclusão e consentimento de avisos nos dois tamanhos. Fluxos atualizados validam senha única, migração, lembrança de acesso, permissão de avisos simulada, recusa e preferências. O resultado consolidado do navegador e da publicação acompanha o commit entregue em Actions. Permissão e SDK simulados não equivalem à recepção real de um Web Push.

**Dependência externa:** a conta OneSignal, App ID, chave privada e inscrição real não são fornecidos pelo repositório. O token da integração recebeu 403 para secrets e variables de Actions; a usuária foi orientada a adicionar `ONESIGNAL_REST_API_KEY` e `GFORCE_ONESIGNAL_APP_ID`. `GFORCE_TEST_PASSWORD` tornou-se opcional após separar os builds de teste e produção, removendo esse impedimento de publicação. Não se afirma que lembretes diários externos foram entregues antes de uma execução retornar `accepted` e da recepção no aparelho ser confirmada. O app distingue permissão local salva de Web Push conectado.

Não houve teste físico em iPhone. Os horários dependem do provedor, navegador, modo Foco e agenda do GitHub; são convites aproximados, não alarmes garantidos.

O build de produção contém dez entradas de precache e passou pela checagem explícita do verificador real e ausência da fixture. A busca nos arquivos do projeto não encontrou a senha real em texto. Capturas do convite após login foram inspecionadas visualmente em 390 × 844 e 1440 × 900.
