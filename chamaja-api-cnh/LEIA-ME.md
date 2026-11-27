# API de validação de CNH (ChamaJá)

Confere a CNH do motorista na base oficial (Senatran e Receita Federal) pelo Serpro Datavalid v5 e decide se ela atende às regras da LM09: emitida, sem impedimento, com EAR, dentro da validade e de categoria para carro.

O Serpro não devolve os dados da CNH. Ele compara o que mandamos com a base oficial e responde campo a campo (true/false ou semelhança de 0 a 1). A decisão fica com o ChamaJá, em `src/cnh/regras-de-aprovacao.ts`.

Feita em NestJS.

## Rodando

Precisa do Node.js 20 ou mais novo.

```
npm install
npm test
npm run dev
```

Depois é só abrir http://localhost:3000/docs. Em **POST /cnh/validar**, clique em **Try it out** e **Execute**: o exemplo já vem com a pessoa fictícia do Serpro.

Fora de produção, a API carrega o `.env` (se existir) e depois o `.env.demonstracao`, com os valores públicos da demonstração do Serpro (publicados no Guia rápido do Datavalid, os mesmos para todo mundo, só com dados fictícios). O que estiver no `.env` vale mais. Não use dados de pessoas reais nos testes (LGPD).

## Produção

```
npm ci
npm test
npm run build
npm run start:prod
```

Com `NODE_ENV=production`, nenhum arquivo `.env` é lido: tudo vem do ambiente da pipeline. Se faltar alguma variável obrigatória, a API não sobe e avisa qual está faltando. O modelo está em `.env.example`.

São segredos da pipeline, nunca do repositório:
- `SERPRO_CONSUMER_KEY` e `SERPRO_CONSUMER_SECRET` (Área do Cliente Serpro)
- `RFB_ID_TEMPLATE` (template registrado na Receita)
- `GCC_TOKEN` (ou a integração com a GCC)
- `SENATRAN_CNPJ_ANUENTE`

## Estrutura

| Caminho | O que faz |
|---|---|
| `src/main.ts` | Sobe a aplicação |
| `src/app.module.ts` | Módulo principal e leitura do ambiente |
| `src/configurar-app.ts` | Validação dos pedidos, filtro de erros e Swagger |
| `src/configuracao/configuracao.ts` | Configurações e checagem do que falta |
| `src/cnh/cnh.controller.ts` | Rota `POST /cnh/validar` |
| `src/cnh/cnh.service.ts` | Junta Serpro, regras e log da consulta |
| `src/cnh/regras-de-aprovacao.ts` | Regras da LM09 |
| `src/cnh/dto/` | DTO de entrada (validado com class-validator) e de saída |
| `src/serpro/datavalid.service.ts` | Chamada ao Datavalid v5 |
| `src/serpro/token-serpro.service.ts` | Token de acesso ao Serpro |
| `src/serpro/gcc.service.ts` | Token da GCC (Portaria Senatran 139/2025) |
| `src/comum/` | Erro padrão, filtro de exceções, CPF e datas |
| `test/` | Testes de ponta a ponta e exemplos do Serpro (sem internet) |

## Respostas

| Situação | HTTP | `erro` |
|---|---|---|
| Consulta feita (ver `aprovada` e `motivos`) | 200 | |
| Dados inválidos ou JSON quebrado | 400 | `dados_invalidos`, `json_invalido` |
| Muitas consultas | 429 | `limite_serpro` |
| Serpro recusou ou deu erro | 502 | `acesso_serpro_negado`, `pedido_recusado_serpro`, `credenciais_serpro_recusadas`, `erro_no_serpro` |
| GCC não configurada em produção | 503 | `gcc_nao_configurada` |
| Serpro fora do ar ou lento | 504 | `serpro_inacessivel`, `serpro_demorou` |

## Pendências para produção (Novaitx)

1. Credenciamento na SENATRAN.
2. Contrato com o Serpro e com uma GCC.
3. Registro do Template de Tratamento de Dados na Receita.
4. Chamada da GCC escolhida em `src/serpro/gcc.service.ts`.
5. Regras em aberto da LM09 (o que conta como impedida, nota mínima do nome).
