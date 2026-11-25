import os
import json
import zipfile

os.makedirs("projeto_ponto_gcm", exist_ok=True)

# 1. README_INSTRUCOES_CHATGPT.md
readme_content = """# Sistema de Produtividade e Controle de Ponto 12x36 — GCM Rio Verde (GO)

Este pacote contém toda a especificação lógica, schemas de IA, dados iniciais da equipe e o modelo oficial da folha de ponto em A4 para construção do aplicativo.

## Como usar no ChatGPT (Work / Projects / Canvas / Codex)
1. Faça o upload deste arquivo `.zip` (ou extraia e envie os arquivos no seu projeto).
2. Envie o comando abaixo para iniciar a construção:

> "Leia todos os arquivos anexados neste ZIP (`01_ESPECIFICACAO_LOGICA_COMPLETA.md`, `02_PROMPT_ANTONIETA_JSON.md`, `03_DADOS_EQUIPE_EXEMPLO.json` e `04_TEMPLATE_FOLHA_OFICIAL_A4.html`). Construa a aplicação web completa (React + Tailwind CSS, persistência em `localStorage`, pronta para rodar) respeitando rigorosamente todas as regras de negócio, a proibição de hora extra, a trava de geolocalização na Rua Marginal 471 (e entorno), o fluxo da assistente virtual Antonieta, o painel ADM/RH e o layout fiel de impressão A4."

## Conteúdo do Pacote
- `01_ESPECIFICACAO_LOGICA_COMPLETA.md`: Regras de negócio completas (escala 12x36, entrada antecipada, saída automática, dobra 24h, férias/atestado, geofencing, perfis Servidor/ADM e disparo WhatsApp).
- `02_PROMPT_ANTONIETA_JSON.md`: System prompt e contratos JSON para a assistente virtual **Antonieta** (Modo Servidor e Modo RH/ADM).
- `03_DADOS_EQUIPE_EXEMPLO.json`: Base inicial com 10 plantonistas, configurações do posto (Rua Marginal, 471) e parâmetros do RH.
- `04_TEMPLATE_FOLHA_OFICIAL_A4.html`: Modelo HTML/CSS `@media print` fiel à folha oficial da Prefeitura Municipal de Rio Verde para referência visual exata.
"""

# 2. 01_ESPECIFICACAO_LOGICA_COMPLETA.md
spec_content = """# Especificação Lógica Completa — Sistema de Ponto 12x36 (GCM Rio Verde - GO)

## Regra Geral Obrigatória (Sem Hora Extra)
- Os Atendentes Plantonistas **NÃO possuem hora extra**.
- O sistema não deve calcular, solicitar ou preencher horas extras em nenhum momento.
- A coluna `EXTRA` existe exclusivamente para manter a fidelidade visual do formulário oficial impresso da Prefeitura e deve permanecer **sempre vazia**.

---

## 1. Gestão Mensal, Prazo de Entrega e Motor de Escala 12x36
- **Uma Folha por Mês:** Seletor de competência (`MM/AAAA`) mantendo uma folha independente para cada mês, com histórico salvo no `localStorage`.
- **Prazo de Entrega Configurável por Mês:** Cada folha mensal possui o parâmetro **"Prazo de entrega da folha até o dia X"** (ex.: dia 17, caso solicitado pela Prefeitura). Quando ativo, exibe um banner de alerta no topo do painel de todos os servidores.
- **Regime Noturno (19:00 às 07:00):** Um único plantão cruza a meia-noite e ocupa duas linhas consecutivas na tabela:
  - **Dia D (`1º Período`):** `19:00`
  - **Dia D+1 (`2º Período`):** `07:00`
- **Alternância Mensal:** Alternância entre meses de dias pares e meses de dias ímpares (com configuração da data inicial do ciclo por servidor).
- **Folha Pré-preenchida (Gestão por Exceção):** Como a Prefeitura fecha o pagamento antes do fim do mês, o mês inteiro já nasce projetado logicamente na escala 12x36.
- **Status Internos (visíveis apenas na tela, NUNCA na impressão):**
  - `Projetado`: dias futuros preenchidos pela lógica da escala.
  - `Confirmado`: plantões com batida de entrada efetuada.
  - `Alterado/Pendente`: solicitações aguardando decisão do RH.
  - `Abonado`: dias cobertos por `FÉRIAS` ou `ATESTADO`.

---

## 2. Batida de Ponto (Geolocalização, Entrada Antecipada e Dobra 24h)

### 2.1. Trava de Localização (Cerca Virtual / Geofencing)
- O servidor só pode bater o ponto se sua localização atual via GPS (`navigator.geolocation`) constar no endereço oficial do posto ou nas proximidades:
  - **Endereço:** Rua Marginal, 471 – Residencial Recanto do Bosque, Rio Verde – GO, CEP 75912-001.
- **Cálculo de Distância:** Utilizar a **fórmula de Haversine** com **raio padrão de 400 metros** (configurável pelo ADM entre `200m`, `400m` ou `600m`).
- **Dentro da área:** Libera a batida e grava coordenadas exatas + distância aproximada (em metros) no log de auditoria do Painel ADM.
- **Fora da área ou GPS bloqueado:** Impede a batida e exibe alerta claro informando a distância atual até o posto.
- **Modo Teste:** Incluir chave discreta *"Simular GPS na Rua Marginal (Modo Teste)"* para permitir testes de desenvolvimento fora do endereço.

### 2.2. Entrada Manual com Janela Antecipada
- No dia do plantão noturno, o botão **"Bater Entrada"** fica liberado a partir das **`17:00`** (permitindo que o servidor bata normalmente se chegar às `18:00`, `18:15`, `18:45`, etc.).
- **Normalização Oficial:** Independentemente de bater às `18:00` ou `18:55`, o sistema registra **`19:00`** no `1º Período` da folha oficial e exibe um aviso na tela confirmando o horário real do clique.
- **Auditoria Interna (RH):** O horário exato do clique (ex.: `18:00:12`) e a validação de GPS ficam gravados no histórico interno do ADM como *"Entrada Antecipada"*.
- **Trava Anti-Erro:** Antes das `17:00`, o botão do plantão noturno fica bloqueado, exceto se o servidor selecionar **Dobra 24h (Dia + Noite)**.

### 2.3. Saída Automática (Ciclo 12h)
- Assim que a entrada é confirmada, o sistema agenda e computa automaticamente a saída às **`07:00`** no `2º Período` do dia seguinte, contabilizando **12 horas trabalhadas**.

### 2.4. Plantão Estendido / Dobra (24 horas — Sem Hora Extra)
A dobra de 24 horas utiliza exclusivamente as colunas `1º Período` e `2º Período` (mantendo `EXTRA` vazia):

| Cenário | Dia | 1º Período | 2º Período | EXTRA | Cálculo no Sistema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Noite + Dia (19:00 -> 19:00)** | Dia D | `19:00` | `________` | *(vazio)* | Inicia ciclo contínuo de 24h |
| | Dia D+1 | `________` | `19:00` | *(vazio)* | Fecha **24h** (substitui 07:00 por 19:00) |
| **Dia + Noite (07:00 -> 07:00)** | Dia D | `07:00` | `________` | *(vazio)* | Inicia ciclo contínuo de 24h |
| | Dia D+1 | `________` | `07:00` | *(vazio)* | Fecha **24h** (saída automática padrão) |

- **Métricas de Produtividade:** Cards exibindo horas trabalhadas no mês, adicional noturno, plantões cumpridos (12h e 24h) e faltas.

---

## 3. Regras de Férias e Atestado (Exclusivo no 1º Período)
- Tanto **Férias** quanto **Atestado** são gravados **exclusivamente na coluna `1º Período`** (`FÉRIAS` ou `ATESTADO`), mantendo `2º Período` como `________` e sem contabilizar falta.
- **Férias (Restrito ao RH):** O servidor NÃO pode lançar férias. Apenas o **ADM (RH)** pode acionar a Antonieta informando o servidor, a data de início e a data de término. Durante o período, o botão de bater ponto fica bloqueado e a escala 12x36 retoma automaticamente no dia seguinte ao término.
- **Atestado:** Pode ser solicitado pelo servidor via Antonieta (com upload de foto/PDF em base64 salvo localmente para visualização do ADM), ficando `Pendente` até aprovação do RH, ou lançado diretamente pelo ADM.
- **Regra da Virada de Turno:** Se o servidor entrou às `19:00` no dia anterior ao início das férias/atestado, o sistema fecha normalmente o plantão às `07:00` no `2º Período` do dia seguinte e estampa `FÉRIAS` ou `ATESTADO` no `1º Período`.

---

## 4. Assistente Virtual "Antonieta", E-mail ADM e Disparo WhatsApp
- Chat com suporte a digitação e entrada por voz (`SpeechRecognition`), retornando JSON estruturado.
- **Modo Servidor:**
  - Interpreta pedidos de `PERMUTA`, `ATESTADO` e `DOBRA_24H`.
  - Exemplo: *"Oi Antonieta, eu fiz uma permuta dia 11 de noite então vou trabalhar só no dia 12 de noite no lugar do Carlos Alberto que vai trabalhar para mim dia 11, então altera minha ficha."*
  - Gera número de protocolo, marca como `Pendente`, envia para a fila do Painel ADM e disponibiliza disparo formatado para o **e-mail ADM cadastrado** (`mailto:` + suporte a webhook).
- **Modo ADM (RH):**
  1. **Lançar Férias** (informando servidor, início e fim).
  2. **Definir Prazo da Folha e Disparar Avisos para Todos os Funcionários:**
     - Exemplo: *"Antonieta, define o prazo de entrega da folha de novembro até o dia 17 e avisa todos os funcionários."*
     - Atualiza o prazo da folha do mês, fixa o banner no painel de todos os servidores e abre a **Central de Disparo WhatsApp** com dois modos integrados:
       - **Modo 100% Automático (API):** Se o ADM configurar a **WhatsApp Business Cloud API (Meta)** (`Phone Number ID` + `Access Token`) ou uma **URL de Webhook** (Evolution API / Z-API / n8n), dispara automaticamente via `POST` para os ~10 telefones cadastrados com log de entrega em tempo real.
       - **Modo Imediato Grátis (`wa.me` — Plano B):** Caso nenhuma API esteja configurada, lista os servidores com botão individual **"Enviar WhatsApp"** (`https://wa.me/55...`) com texto personalizado pronto, marcando como `Enviado ✓` após o clique.

---

## 5. Separação de Perfis: Servidor vs. Painel ADM (RH)
- Alternador de perfil no topo (`Perfil Servidor` / `Perfil ADM - RH`) e seletor de servidor ativo.
- **Perfil Servidor:** Visualiza apenas sua própria folha mensal, banner de prazo, botão de bater ponto/dobra 24h com status do GPS, chat com a Antonieta, status dos protocolos e botão de impressão.
- **Perfil Administrador (RH):**
  - **Visão Global de Escalas:** Acesso às folhas mensais de todos os servidores cadastrados.
  - **Fila de Solicitações:** Pedidos de permutas, atestados (com anexo) e dobras 24h, com botões **Deferir** (atualiza a folha oficial; em permutas, altera os dois servidores simultaneamente) e **Indeferir** (mantém a escala original e exige motivo breve enviado ao servidor).
  - **Central Antonieta (RH):** Lançar férias, definir prazo mensal e disparar avisos WhatsApp.
  - **Configurações:** E-mail oficial do ADM, número do WhatsApp do RH, credenciais da API/Webhook do WhatsApp, raio de GPS e CRUD de servidores e telefones.

---

## 6. Impressão Padronizada (Folha Oficial A4 — Contingência)
- Botão permanente **"Imprimir Ficha Padronizada"** sempre disponível.
- **Montagem:** Dias passados/atuais mostram batidas reais e alterações deferidas; dias futuros do mês são preenchidos automaticamente pela projeção lógica 12x36.
- **CSS `@media print`:** Oculta menus, botões, banners, cores e etiquetas de status (`Projetado`/`Confirmado`). Imprime exatamente 1 página A4 Retrato seguindo o arquivo `04_TEMPLATE_FOLHA_OFICIAL_A4.html`.
"""

# 3. 02_PROMPT_ANTONIETA_JSON.md
antonieta_content = """# Prompt e Contratos JSON da Assistente Virtual "Antonieta"

## System Prompt Base
```text
Você é a Antonieta, assistente virtual oficial do Sistema de Controle de Ponto 12x36 dos Atendentes Plantonistas da Guarda Civil Municipal (GCM) de Rio Verde - GO.

Regras estritas:
1. Os atendentes NÃO possuem hora extra. Se o usuário mencionar hora extra, informe educadamente que o regime não contabiliza horas extras e pergunte se trata de uma DOBRA_24H ou PERMUTA.
2. No Modo SERVIDOR, você pode registrar apenas: PERMUTA, ATESTADO e DOBRA_24H. Você NUNCA pode lançar FÉRIAS no modo servidor (informe que apenas o RH pode lançar férias).
3. No Modo ADM (RH), você pode executar: FERIAS, DEFINIR_PRAZO_E_AVISAR e ATESTADO_DIRETO.
4. Sempre retorne um objeto JSON válido seguindo o schema correspondente ao modo ativo, acompanhado de uma resposta curta, clara e cordial em português do Brasil.