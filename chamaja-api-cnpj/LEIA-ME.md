# API de consulta de CNPJ (ChamaJá)

Recebe um CNPJ, confere se é válido (numérico ou alfanumérico), consulta a Receita Federal pelo provedor e devolve só os campos que o ChamaJá usa. Cada consulta fica em cache por 60 minutos.

Feita em NestJS. Provedor atual: BrasilAPI, para testes. O definitivo ainda vai ser escolhido (MOB-81, integração 5). Trocar de provedor mexe só em `src/cnpj/brasil-api.service.ts`.

## Rodando

Precisa do Node.js 20 ou mais novo.

```
npm install
npm test
npm run dev
```

Depois é só abrir http://localhost:3000/docs (Swagger) ou http://localhost:3000 (página de teste).

## Produção

```
npm ci
npm test
npm run build
npm run start:prod
```

Com `NODE_ENV=production`, o arquivo `.env` é ignorado e tudo vem do ambiente.

## Variáveis de ambiente

| Nome | Padrão |
|---|---|
| `PORT` | 3000 |
| `CNPJ_PROVEDOR_URL` | https://brasilapi.com.br/api/cnpj/v1 |
| `CNPJ_TEMPO_LIMITE_MS` | 8000 |
| `CNPJ_CACHE_MINUTOS` | 60 |

## Estrutura

| Caminho | O que faz |
|---|---|
| `src/main.ts` | Sobe a aplicação |
| `src/app.module.ts` | Módulo principal e configuração |
| `src/configurar-app.ts` | Filtro de erros, arquivos estáticos e Swagger |
| `src/cnpj/cnpj.controller.ts` | Rota `GET /cnpj/:cnpj` |
| `src/cnpj/cnpj.pipe.ts` | Limpa e valida o CNPJ antes de chegar no controller |
| `src/cnpj/cnpj.service.ts` | Cache e conversão para o formato do ChamaJá |
| `src/cnpj/brasil-api.service.ts` | Chamada à BrasilAPI |
| `src/cnpj/cnpj.ts` | Regras do CNPJ (dígitos verificadores, formatação) |
| `src/comum/` | Erro padrão da API e filtro de exceções |
| `test/` | Testes de ponta a ponta (sem internet) |

## Respostas

| Situação | HTTP | `erro` |
|---|---|---|
| Encontrado | 200 | |
| CNPJ inválido | 400 | `cnpj_invalido` |
| Não existe na Receita | 404 | `cnpj_nao_encontrado` |
| Muitas consultas seguidas | 429 | `limite_do_provedor` |
| Provedor com erro | 502 | `erro_no_provedor` |
| Provedor fora do ar ou lento | 504 | `provedor_inacessivel` ou `provedor_demorou` |
