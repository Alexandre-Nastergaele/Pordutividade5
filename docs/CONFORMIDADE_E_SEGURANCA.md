# Conformidade, legitimidade e limites

## Login não é ponto

A pedido do projeto, o login em dia escalado cria um evento interno `LOGIN_NAO_EQUIVALE_A_PONTO`, mas **não** cria marcação de jornada. A entrada e saída oficiais dependem de validação própria do backend. Nunca substitua isso por um `19:00` automático no campo de horas trabalhadas.

## Projeção não é presença

O calendário prevê a escala de 12×36, com entrada às 19h no dia D e saída 07h no D+1. A folha que mostra plantões futuros deve ser identificada como **PRÉVIA**, ainda que contenha horários preenchidos. Deve haver um procedimento do RH para conferir os eventos reais e validar ou corrigir mediante justificativa e auditoria.

## GPS e segurança

Geolocalização do navegador não comprova identidade ou presença por si só. Não é possível verificar com 100% de certeza se o GPS foi simulado. Configure zona e horários autorizados com o RH e TI, exija HTTPS e faça auditorias.

## Atestados médicos e dados pessoais

Não armazenar base64 de atestado em `localStorage`. O modo de demonstração desabilita anexos. No ambiente real, o armazenamento é privado e exige regras do Firebase Storage. Restrinja acesso a RH autorizado, implemente consentimento/informação adequada, ciclo de retenção e descarte de documentos sensíveis.

## Permuta e prazos

O solicitante informa a data original e a data nova, o colega aceita e o RH aprova. Nenhuma dessas ações pode alterar silenciosamente marcações anteriores. Alterações de férias e atestados exigem validação de RH; férias são restritas ao RH segundo os arquivos-fonte enviados.

## Hora extra

Os arquivos-fonte enviados proíbem horas extras para a função da unidade. Portanto, a coluna `EXTRA` da folha impressa existe por fidelidade ao formulário, mas permanece vazia. Para mudar essa regra, obtenha aprovação e documentação formal.

## Homologação institucional

Este é um código de aplicativo **pronto para testes**, mas não é um sistema homologado pela Prefeitura. Para que tenha legitimidade, a instituição deve aprovar o fluxo, identidade, segurança, registros, assinatura do responsável, conservação, LGPD, acessibilidade e integração com seus processos oficiais. O software não falsifica assinaturas nem atesta frequência não comprovada.

## Arquivos-fonte recebidos

Os dois JSONs foram incluídos como contratos de exemplo. O `.py` enviado está **interrompido dentro de uma string longa** e não possui o template HTML e a base de equipe que promete gerar; por isso o novo aplicativo foi desenvolvido independentemente e inclui modelos de folha anteriores sem dados pessoais, além dos contratos enviados.
