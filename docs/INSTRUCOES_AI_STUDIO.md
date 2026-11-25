# Importação no Google AI Studio — instruções diretas

## Preferência: importar o projeto pronto

**Forma mais confiável documentada pelo Google**: abra [Google AI Studio](https://aistudio.google.com/), selecione **Build** e procure o menu **+ / Add files > Import from GitHub**. Importe um repositório com o conteúdo **extraído** deste ZIP. Preserve `index.html`, `package.json`, `src/`, `public/`, `backend/`, `docs/`. Repositório privado recomendado.

**Se seu AI Studio tiver Upload ZIP no explorador da aba Code**, teste o upload deste ZIP diretamente. Algumas versões não importam ZIP automaticamente ou o agente pode ignorar o pacote; se isso acontecer, prefira a importação por GitHub. Evite anexar um arquivo ZIP ao chat sem conferir se os arquivos foram de fato importados.

## Primeira inicialização

1. Importar arquivos.
2. Conferir se o projeto tem `index.html` na raiz, `src/main.js` e `package.json`.
3. No terminal da ferramenta, executar `npm install` e `npm run dev` (se o Build iniciar automaticamente, observar erros de compilação).
4. Abrir **Preview**.
5. Entrar em **Servidor Exemplo**, conferir calendário; enviar permuta; entrar em **Colega Exemplo** e aceitar; entrar em **RH Exemplo** e aprovar.
6. Testar impressão PDF em computador. Em celular, o sistema abre responsivamente via link HTTPS publicado.

## Quando estiver pronto para dados reais

- Não publique como controle oficial no primeiro teste.
- Criar projeto Firebase **separado**, configurar `.env` somente no ambiente seguro e implantar funções e regras.
- Criar Auth e perfis (RH inicial por script administrativo).
- Hospedar aplicação via HTTPS com controle de acesso e política de dados da Prefeitura.
- Testar localizações, permissões e fluxo de RH com equipe-piloto.

## Fonte externa para confirmar o fluxo de importação

Documentação do Build Mode: https://ai.google.dev/gemini-api/docs/aistudio-build-mode

Repositório GitHub é o caminho indicado para importação. Upload ZIP depende da interface disponível e não deve ser prometido como universal.
