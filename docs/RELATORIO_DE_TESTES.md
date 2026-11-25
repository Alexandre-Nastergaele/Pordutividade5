# Testes realizados no pacote

## Automatizados (Node.js)

`npm test` / `node --test tests/*.test.js`: **12 testes**, incluindo:
- datas de novembro e dezembro de 2026;
- alternância 12×36 atravessando meses;
- entrada 19h e saída 07h em dias distintos;
- coluna extra sempre vazia;
- sobreposição de férias;
- validação de pedidos de permuta;
- GPS Haversine no núcleo de cálculo;
- criação de permuta, aceite do colega e aprovação do RH;
- solicitação de atestado sem alteração até a aprovação;
- notificações internas e definição de prazo;
- persistência JSON de testes;
- bloqueio de alterações em mês fechado até reabertura justificada pelo RH.

## Inspeção de impressão

Amostra A4 dezembro de 2026 gerada a partir de `src/print.js` e `src/styles.css`, renderizada com WeasyPrint. Resultado: **1 página A4** com 31 dias, brasão, linhas alternadas e assinaturas, disponível em `docs/preview_folha_demo.pdf` e `docs/preview_folha_demo.png`.

## Ainda exigem testes no ambiente de destino

- Importação/execução real no Google AI Studio, com os serviços de rede e npm próprios da plataforma.
- Firebase Authentication, Cloud Functions e regras Firestore/Storage (requerem projeto real).
- Teste de e-mail com extensão Trigger Email e autorização de notificações web, se ativados.
- GPS físico e precisão no endereço do posto.
- Fluxos de homologação jurídica e de segurança da informação da Prefeitura.

**O navegador automatizado deste ambiente bloqueou abertura de URLs locais**, portanto não declaramos teste completo de interação visual pelo Chromium. Os módulos JS foram verificados sintaticamente e os fluxos de negócio foram executados pelos testes acima.
