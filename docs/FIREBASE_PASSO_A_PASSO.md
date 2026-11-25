# Implantação segura no Firebase — guia para administrador

**Pré-condição:** autorização institucional e ambiente de produção adequado. Os passos abaixo são exemplos técnicos, não substituem a validação do RH/TI.

## 1. Criar o projeto

1. Acessar https://console.firebase.google.com e criar um projeto.
2. Ativar **Authentication > Sign-in method > E-mail/senha**.
3. Ativar **Cloud Firestore** com regras restritivas e **Cloud Storage**.
4. Ativar **Cloud Functions** (pode exigir faturamento habilitado).
5. Criar um App Web, copiar apenas os identificadores públicos Firebase para `.env` na pasta da aplicação, a partir de `.env.example`. `VITE_` é visível no navegador: **NUNCA coloque chaves de serviço nesse arquivo**.

## 2. Instalar a ferramenta de implantação

```bash
npm install -g firebase-tools
firebase login
cd backend
firebase init  # vincule ao projeto já criado, não sobrescreva os arquivos incluídos
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,storage,functions
```

Se preferir, use `firebase use --add` na pasta `backend/` para selecionar seu projeto antes do deploy. Arquivos disponíveis: `backend/firebase.json`, `backend/rules/firestore.rules`, `backend/rules/storage.rules` e `backend/functions/index.js`.

## 3. Criar RH inicial (sem senha exposta)

1. No console **Authentication**, crie uma conta real para o responsável do RH. Copie o **UID**.
2. Num computador administrativo com credenciais seguras de aplicativo (ADC), execute o script administrativo **uma única vez**:

```bash
cd backend/functions
# Dependências já instaladas com npm install
FIRST_RH_UID="<UID-REAL-DO-RH>" FIRST_RH_NAME="Responsável do RH" \
node ../scripts/bootstrap-rh.mjs
```

Se o ambiente não oferecer ADC, o administrador deve configurar um método seguro de autenticação para o SDK Admin, sem incluir arquivos de chave JSON no ZIP, GitHub, Google AI Studio ou frontend.

3. O script cria o perfil RH no Firestore e o documento de configurações; não inventa coordenadas.
4. O RH poderá cadastrar servidores no painel. O sistema cria a conta Auth e devolve um **link único de definição de senha** para entrega ao servidor por canal seguro.

## 4. GPS do posto de trabalho

O endereço descritivo recebido nos materiais é **Rua Marginal, 471 – Residencial Recanto do Bosque, Rio Verde–GO**. Ele **não contém coordenadas verificadas**. Somente após vistoria/validação administrativa, configurar `gpsLat`, `gpsLng` e `gpsRadius` em `settings/general` pelo ambiente administrativo seguro. As opções de raio da especificação são **200m, 400m ou 600m**.

Sem coordenadas válidas, a função `recordPunch` impede a marcação. O login funciona, mas **não marca presença**. O ponto usa hora do servidor, não a hora fornecida pelo cliente. GPS de navegador pode ser adulterado; não é prova absoluta.

## 5. Notificações

Ao registrar uma solicitação, uma notificação **em tempo real no painel** é gravada no Firestore para o `rhUid` do servidor. O colega também recebe pedido de aceite da permuta, e o servidor é notificado da decisão.

Para **e-mail**, instale e configure a extensão Firebase **Trigger Email**, vinculada à coleção `mail` e a um remetente SMTP aprovado. Depois, configure `settings/general.sendEmailNotifications = true`. A função `queueMailForNotification` colocará mensagens na fila `mail` (o envio só ocorre se a extensão estiver configurada).

Como opção de integração com serviços corporativos, defina `RH_NOTIFICATION_WEBHOOK` e `RH_WEBHOOK_TOKEN` **apenas no ambiente das Cloud Functions** (jamais como `VITE_`), com controle de destino, para receber notificações dos protocolos. É integração opcional; configure por administrador.

## 6. Google Docs e folha editável

O sistema já oferece impressão / PDF local A4. Para gerar **Google Docs editável** diretamente no Drive, utilize a extensão opcional `backend/apps-script/Code.gs` no Apps Script de uma conta autorizada do RH, configurando IDs do brasão e pasta de destino. Essa extensão **não está ligada automaticamente à interface web**; para integração automática real, acrescente chamada servidor-servidor autenticada e aprovação de RH.

Não publique um Apps Script que aceite JSON livre por URL sem autenticação, pois isso permitiria falsificação de documentos.

## 7. Testes de segurança obrigatórios antes da operação oficial

- Duas contas de servidor distintas: uma não pode ler dados privados da outra nem aprovar pedidos.
- RH de outra lotação: não pode ver dados, aprovar ou fechar mês.
- Permuta: só é aplicada após o aceite do colega e decisão do RH; cenário concorrente deve ser testado.
- Atestados: anexo acessível somente ao titular e aos autorizados.
- Sem GPS/cadastro/âncora: marcação de ponto bloqueada.
- Revisão de logs e regras com Firebase Emulator Suite.
- Ativar App Check antes da operação; revisar limites e custos de Functions/Firestore.
- Política de retenção, backups, disponibilidade, LGPD e assinatura homologadas pela Prefeitura.
