# Auditoria de entrega

Data: 23/10/2026. Inspeção inicial e decisões em [architecture.md](architecture.md).

## Validações executadas

- ESLint: passou.
- TypeScript estrito: passou.
- Build Vite/PWA: passou; assets com `/GForce/`, manifest e service worker gerados, oito entradas de precache.
- Auditoria das dependências de produção (`npm audit --omit=dev`): zero vulnerabilidades reportadas.
- Vitest: nove testes passaram, cobrindo calendário, datas locais, indicação de avaliação, deduplicação, progressão, backup e coerência das durações.
- Playwright Chromium: **16 testes passaram** (8 fluxos em dois tamanhos), em aproximadamente 35 segundos.
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

A ausência de teste físico em iPhone e de revisão clínica permanece. O ambiente local indisponível não afetou o código, os commits nem as evidências já enviados ao repositório.
