# Privacidade

O GForce é um site público para uso pessoal. Não possui cadastro nem servidor que armazene seus registros. Nome opcional, respostas do perfil, limitações, peso/medidas opcionais, calendário, sessões, disposição e notas ficam no IndexedDB deste contexto do navegador.

Não coletamos analytics próprios e não enviamos registros de treino ou perfil para terceiros. Se você ativar Web Push, o OneSignal processará dados técnicos de navegador, inscrição e entrega/abertura dos avisos. O SDK só carrega após consentimento ou para restaurar uma inscrição autorizada; não enviamos nome, perfil, medidas ou sessões. Veja [notificações](notifications.md). GitHub Pages entrega os arquivos estáticos e está sujeito à política de privacidade do GitHub e seus logs de acesso. Ao abrir uma referência externa, você visita outro site; vídeos e imagens externos não são carregados automaticamente no GForce.

A senha é um controle de acesso local. O bundle público contém um verificador derivado com salt; o navegador guarda apenas a preferência de acesso lembrado. A senha única não aparece em texto no Git. Ela não criptografa os registros e não torna o site privado. Uma pessoa com acesso técnico ao navegador pode ler ou alterar dados locais. Não use como cofre médico.

“Bloquear agora” pede a senha única novamente. O acesso permanece lembrado ao reabrir neste contexto do navegador. A atualização migra a preferência antiga e preserva registros, sem obrigar nova senha. Outro aparelho, navegador ou instalação pode ter dados e preferência de acesso independentes. Não há sincronização silenciosa.

O backup JSON contém registros pessoais em texto, sem criptografia. Não inclui senha, verificador nem estado de desbloqueio. Guarde o arquivo de forma privada; nunca envie backups ao repositório. Exportar não garante que o arquivo foi guardado com segurança: confira o download.

Em Configurações, é possível exportar, restaurar com resumo e confirmação, ou excluir. A exclusão requer senha atual quando desbloqueada e a palavra APAGAR. Reinicializar apaga os dados e a lembrança de acesso, mas não altera nem contorna a senha única. Se esquecer a senha, solicite-a à responsável pelo app. A exclusão não alcança arquivos de backup já baixados ou dados em outros aparelhos.

Navegação privada, limpeza automática, falta de espaço e políticas do Safari podem apagar ou impedir persistência. Faça backup regularmente, principalmente antes de mudar de aparelho ou limpar o navegador. A data do último backup é um lembrete local, não prova de armazenamento externo.
