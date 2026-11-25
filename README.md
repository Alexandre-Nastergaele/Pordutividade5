# PONTO 153 — Portal de Escalas e Folhas de Ponto • Rio Verde/GO

**Projeto web responsivo**, preparado para importação no Google AI Studio Build e instalação externa.

## 1. O que funciona AGORA, sem chaves

O projeto inicia em **DEMONSTRAÇÃO** se você não informar variáveis Firebase. Permite:

- Entrar como **Servidor Exemplo**, **Colega Exemplo** ou **RH Exemplo** (troca de perfil de teste, SEM autenticação real).
- Calendário mensal 12×36 19:00–07:00, inclusive na passagem de mês e ano.
- Visualização em celular, tablet e computador; menus adequados a cada tamanho.
- Solicitar permuta, atestado, dobra 24h ou correção; férias restritas ao RH.
- Aceite do colega, análise de RH, justificativa e notificação dentro do sistema.
- Histórico e registros de mudanças em `localStorage` somente no navegador em que você testar.
- Gestão de servidores de teste e prazos de entrega.
- Folha de ponto A4 para imprimir/salvar em PDF, com brasão e linhas ímpares cinza.
- Antonieta: triagem guiada, por texto e microfone quando o navegador permitir. A versão local **não chama um modelo de IA**.
- Cópia local dos testes em JSON.

### Como testar no computador

1. Extraia o ZIP.
2. Abra terminal **dentro desta pasta**, execute `npm install` e `npm run dev`.
3. Abra o endereço que o terminal mostrar (normalmente `http://localhost:5173`).
4. Entre em DEMONSTRAÇÃO como servidor, abra **Minha escala**, selecione um dia, solicite uma permuta, troque para a conta de colega e aceite, depois entre no RH para aprovar.
5. Em **Folha de ponto**, use **Imprimir ou salvar em PDF**.

> **ATENÇÃO:** o modo DEMONSTRAÇÃO não cria usuários reais, não sincroniza dispositivos, não garante segurança e não constitui controle de frequência oficial. NÃO insira documentos médicos ou dados reais sensíveis no modo de teste.

## 2. Como usar no Google AI Studio

Leia `PROMPT_PARA_GOOGLE_AI_STUDIO.txt` e `docs/INSTRUCOES_AI_STUDIO.md`.

No Build Mode, **importe o projeto do GitHub**, conforme o caminho oficialmente documentado pelo Google; em ambientes que oferecem **Upload ZIP** no explorador de arquivos, tente o ZIP diretamente. Se não houver importação de ZIP, extraia e publique o código num repositório privado no GitHub (sem `.env` ou dados reais), depois use **Import from GitHub**.

**Não cole 30 arquivos no chat**: importe o projeto existente. Solicite ao assistente do AI Studio para manter os diretórios e não reconstruir o sistema do zero.

## 3. Produção: serviços que precisam ser configurados

Para login/senha verdadeiros, notificações entre aparelhos, banco persistente e decisões seguras do RH:

- Firebase Authentication (e-mail/senha) e contas dos servidores.
- Cloud Firestore + regras `backend/rules/firestore.rules`.
- Cloud Functions de `backend/functions/`.
- Firebase Storage + regras `backend/rules/storage.rules` para atestados.
- App Check, monitoramento e política institucional para o ambiente definitivo.
- Opcional: extensão **Trigger Email**, configurada com um serviço de e-mail, e `sendEmailNotifications=true`.
- Coordenadas **verificadas e autorizadas** do posto para registro de ponto real. O projeto NÃO inventa coordenadas.

Leia `docs/FIREBASE_PASSO_A_PASSO.md` para os comandos e a ordem correta.

## 4. Regra de negócio: NÃO usar hora extra

Os arquivos enviados estabelecem que **atendentes plantonistas NÃO têm hora extra**. Por isso, a coluna **EXTRA** é preservada na impressão, porém sempre vazia. As dobras de 24h são fluxos sujeitos a análise do RH. Caso o regulamento institucional determine outro procedimento, a mudança requer aprovação formal e revisão do código, não simples remoção da trava.

## 5. Legitimidade da folha

O software **não foi homologado pela Prefeitura**, e nenhum PDF gerado automaticamente prova, sozinho, a jornada efetiva. A aplicação identifica explicitamente a prévia. Um acesso à conta é evidência de login, mas não equivale a ponto batido. **Marcação real** exige validação; **folha oficial** exige conferência de RH, autenticação, trilha de auditoria e regras locais aprovadas. Veja `docs/CONFORMIDADE_E_SEGURANCA.md`.

## 6. Organização de pastas

```text
PONTO_153_RIO_VERDE_MEGA_v1/
├── index.html, package.json, .env.example
├── src/
│   ├── main.js                 UI responsiva e ações
│   ├── styles.css              Tela + impressão A4
│   ├── core.js                 Escala, datas e validação
│   ├── demo.js                 Fluxos completos locais de TESTE
│   ├── firebaseClient.js       Login e banco reais (após configurar)
│   └── print.js                Folha A4 com brasão
├── public/brasao-rio-verde.png
├── backend/
│   ├── functions/index.js      Transações e notificações seguras
│   ├── rules/                  Firestore e Storage
│   ├── scripts/                Cadastro inicial de RH
│   └── apps-script/            Extensão opcional do Google Docs
├── tests/                      Testes do motor de escala e fluxos
└── docs/                       Instruções, modelo Word, amostra PDF e fontes
```

## 7. Fontes fornecidas

- `docs/referencias/permuta_exemplo_enviado.json` — estrutura do contrato de permuta enviado por você, com nomes sanitizados para não expor pessoas no pacote.
- `docs/referencias/ferias_esquema_enviado.json` — contrato de ações de RH enviado por você.
- `docs/referencias/especificacao_original_incompleta.py` — fonte enviada, **truncada na definição de `antonieta_content`**: não executa e não contém o arquivo de template prometido. Foi mantida como referência histórica, **não é executada**.
- `docs/modelos/` — documentos sem dados pessoais que criamos anteriormente.

Não há senhas, tokens, chaves privadas ou dados de servidor real nos cadastros iniciais de demonstração.
