# Lembretes e Web Push

## Comportamento implementado

Após entrar com a senha única, o app apresenta um convite próprio para receber avisos. Uma notificação nativa não pode pedir autorização antes de existir autorização: o convite aparece dentro do app, e o pedido do navegador acontece somente após um toque. O app guarda a escolha neste navegador; não volta a perguntar automaticamente depois de ativar, recusar ou bloquear. A opção pode ser alterada em Configurações.

As mensagens dentro do app não dependem de OneSignal: incluem convite leve em dias de força, cuidado e recuperação nos demais dias, alimentação ao meio-dia e incentivo ao registrar uma sessão. Sintomas, limitações e registro parcial recebem linguagem de cuidado, sem cobrança ou incentivo a compensar exercícios. O histórico e o perfil nunca são enviados para escolher o texto do push.

Com permissão do navegador, o app pode exibir um aviso local de boas-vindas, teste ou incentivo após a sessão. Os lembretes diários com o app fechado usam **OneSignal Web Push** e o workflow `reminders.yml`, não um `setTimeout` que promete funcionar com o app fechado.

## Configuração externa necessária

A integração não tem acesso à conta do OneSignal e o GitHub recusou gravação de secrets pelo token da integração (403). Não há chave privada no frontend nem no Git. Para ativar o envio real:

1. Crie um aplicativo **Web Push** no plano **Free** do [OneSignal](https://dashboard.onesignal.com/). Na configuração Web, use integração **Custom Code** para o site `https://web-uk.github.io/GForce/` (a origem é `https://web-uk.github.io`). Não ative prompts automáticos, sino ou mensagens automáticas de boas-vindas no painel.
2. O SDK é inicializado pelo código. O service worker público fica em `https://web-uk.github.io/GForce/push/OneSignalSDKWorker.js`, com escopo `/GForce/push/`. Esse escopo separado preserva o worker offline `/GForce/sw.js`.
3. Em **GitHub → Settings → Secrets and variables → Actions → Variables**, adicione `GFORCE_ONESIGNAL_APP_ID` com o App ID público. Opcional: `GFORCE_REMINDER_TIMEZONE`, como `America/Sao_Paulo`. O App ID não é uma chave privada.
4. Em **Secrets**, adicione `ONESIGNAL_REST_API_KEY` com a **App API Key** desse aplicativo OneSignal. Não use chave de organização e não cole a chave no chat, código ou arquivo público. Opcionalmente, adicione `GFORCE_TEST_PASSWORD` para testar a senha real também no endereço publicado. Esse secret não é necessário para publicar: o CI usa uma credencial fictícia em um build exclusivo de teste e depois recria e verifica o build de produção. Não há senha real em texto no código dos testes.
5. Execute novamente **Validate and deploy GForce** para publicar o App ID no frontend. No app instalado, entre e ative as notificações. Autorize o pedido do navegador; se o SDK ainda estiver preparando a conexão, toque em “Permitir neste aparelho” quando estiver pronto.
6. Em Actions, execute **GForce gentle reminders → Run workflow → test**. O envio deve retornar `accepted`. `no-subscribers` significa que nenhuma inscrição ativa com consentimento foi encontrada; não significa entrega. Use também o aviso de teste nas Configurações para verificar a permissão local.

O teste do aviso local, sozinho, não comprova que o agendador e o OneSignal estão conectados. Sem App ID/chave/inscrição, o app informa a pendência e o workflow não declara envio.

## Horários e preferências

O workflow roda aproximadamente uma vez por hora e envia somente na hora local correspondente a **9h (convite), 13h (alimentação) e 18h (recuperação)**, usando o fuso configurado. O padrão é explicitamente **America/Sao_Paulo**, mostrado na interface. Não se infere o fuso pessoal de uma condição de saúde. Para outro fuso, ajuste a variável e publique novamente.

Os horários são aproximados, não alarmes exatos. A agenda usa minuto 17 para reduzir concorrência no início da hora; filas do GitHub, internet, modo Foco e sistema operacional podem atrasar ou impedir entrega. TTL de uma hora evita convites muito atrasados. Não há acúmulo de lembretes perdidos. Idempotência por data e tema evita mensagens duplicadas em repetição da mesma execução.

A usuária pode desativar convites, alimentação, cuidado/recuperação e incentivo pós-sessão. Somente quatro preferências técnicas (`gforce_enabled`, `gforce_training`, `gforce_food`, `gforce_care`) são enviadas como tags, dentro do limite atual de seis tags no plano gratuito. Não se enviam nome, senha, objetivos, peso, medidas, dores, perfil nem sessões.

## iPhone e privacidade

Web Push no iPhone requer iOS/iPadOS 16.4 ou mais recente e app adicionado à Tela de Início. A permissão deve ser solicitada por interação da usuária. Safari e app instalado podem ter armazenamento e permissão independentes. Não há promessa de teste físico em iPhone.

O SDK externo só é carregado após consentimento ou para restaurar uma inscrição anteriormente autorizada. OneSignal processa identificadores técnicos, inscrição, informações de navegador e dados de entrega/abertura dos avisos, conforme sua política. Não usamos eventos de treino, aliases com nomes, e-mail, telefone, dados de saúde ou analytics próprios. Os avisos pós-sessão são locais e não enviam a conclusão ao OneSignal.

Desativar no app opta a inscrição para fora e revoga consentimento do SDK. Se não houver conexão para desativar no provedor, a interface pede uma nova tentativa ou bloqueio dos avisos nos ajustes do aparelho. Dados técnicos já mantidos pelo OneSignal podem exigir exclusão pelo painel do provedor. A exclusão de dados locais não apaga automaticamente dados do provedor.

## Custos e continuidade

Na consulta de 23/10/2026, o plano Free do OneSignal oferecia Web Push para até 10.000 inscritos por envio e seis tags; o uso pessoal fica dentro dessa proposta. Nenhum plano pago foi contratado. Condições e preços podem mudar. O workflow usa runner padrão em repositório público. GitHub pode atrasar, descartar ou desabilitar agendas, inclusive após inatividade prolongada do repositório; revise Actions se os avisos pararem. Isso não substitui lembretes essenciais ou alarmes médicos.

## Fontes técnicas consultadas em 23/10/2026

- [WebKit: Web Push no iOS/iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [OneSignal: configuração Web](https://documentation.onesignal.com/docs/en/web-sdk-setup)
- [OneSignal: service workers e escopos](https://documentation.onesignal.com/docs/en/onesignal-service-worker)
- [OneSignal: SDK, consentimento e opt-out](https://documentation.onesignal.com/docs/en/web-sdk-reference)
- [OneSignal: API de envio e idempotência](https://documentation.onesignal.com/reference/push-notification)
- [OneSignal: preços e limites atuais](https://onesignal.com/pricing)

## Credencial de teste e publicação

`GFORCE_TEST_BUILD=1` troca somente o módulo de verificador durante o build local/de CI, por uma fixture pública exclusiva dos testes. Não existe opção de senha de teste no app em execução. Depois dos testes de navegador, o workflow refaz o build com `GFORCE_TEST_BUILD=0` e executa `scripts/check-production-verifier.mjs`, exigindo o verificador real e recusando o de teste. Só esse artifact de produção é publicado.

A senha real foi testada localmente por variável de ambiente não gravada no Git. A checagem da URL publicada usa o secret opcional se ele estiver disponível. Sem ele, verifica que uma senha incorreta é rejeitada e usa uma fixture de acesso lembrado para conferir os demais fluxos. O relatório distingue esses caminhos, sem afirmar login real quando uma fixture foi usada.
