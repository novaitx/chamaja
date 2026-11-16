# API de consulta de CNPJ do ChamaJá (versão de estudo)

Recebe um CNPJ, confere se é válido, consulta a Receita Federal por um provedor (BrasilAPI, para testes) e devolve só os campos que o ChamaJá usa.

## Rodar pela primeira vez
1. Instale o Node.js LTS (22 ou mais novo): https://nodejs.org
2. Abra esta pasta no VS Code (Arquivo > Abrir Pasta).
3. Abra o terminal do VS Code (Ctrl + ') e rode:
   - `npm install` (baixa o Express, uma vez só)
   - `npm test` (roda os testes automáticos; todos devem passar)
   - `npm run dev` (sobe a API; ela reinicia sozinha quando você salva um arquivo)
4. Abra no navegador: http://localhost:3000/cnpj/00000000000191
5. Documentação (Swagger): http://localhost:3000/docs. Clique numa rota, em **Try it out** e em **Execute** para testar pelo navegador. O contrato em JSON fica em http://localhost:3000/openapi.json.
6. Página de demonstração: http://localhost:3000
7. Para testar vários casos: instale a extensão REST Client (o VS Code sugere sozinho), abra `testes.http` e clique em "Send Request".
8. Para parar a API: Ctrl + C no terminal.

## Testes
- `npm test` roda os 25 testes automáticos, sem internet (o provedor é simulado).
- `npm run test:cobertura` mostra quanto do código os testes exercitam (hoje, 99% das linhas).
- Os testes são o que a pipeline de publicação deve rodar antes de colocar uma versão no ar: se algum falhar, a publicação para.

## Arquivos
| Arquivo | Para que serve |
|---|---|
| `src/server.js` | O servidor, a rota `GET /cnpj/:cnpj`, a página e o Swagger |
| `src/openapi.js` | A documentação no padrão OpenAPI 3 (Swagger) |
| `public/index.html` | Página de demonstração |
| `src/cnpj.js` | Limpa, valida e formata o CNPJ, numérico ou alfanumérico |
| `src/provedor.js` | Chama o provedor e converte a resposta para o formato do ChamaJá |
| `test/cnpj.test.js` | Testes unitários da validação do CNPJ |
| `test/provedor.test.js` | Testes unitários do provedor (tradução dos campos e cada tipo de erro) |
| `test/api.test.js` | Testes da API inteira, com o provedor simulado |
| `test/docs.test.js` | Testes do Swagger: a página abre e toda rota do código está documentada |
| `testes.http` | Testes manuais com a extensão REST Client |
| `.env.example` | Configurações; copie para `.env` se quiser mudar porta, provedor ou cache |
| `.vscode/launch.json` | Depuração: F5 sobe a API e para nos pontos de parada |

## Variáveis de ambiente (para a pipeline)
| Nome | Padrão | Para que serve |
|---|---|---|
| `PORT` | 3000 | Porta do servidor |
| `CNPJ_PROVEDOR_URL` | https://brasilapi.com.br/api/cnpj/v1 | Endereço do provedor |
| `CNPJ_TEMPO_LIMITE_MS` | 8000 | Tempo máximo de espera pelo provedor |
| `CNPJ_CACHE_MINUTOS` | 60 | Tempo que a resposta fica guardada |

Requisito: Node.js 22.9 ou mais novo. Comando para iniciar em produção: `npm start`.

## Respostas
| Situação | Código HTTP | `erro` |
|---|---|---|
| Encontrado | 200 | (sem erro; `origem` diz se veio do provedor ou do cache) |
| CNPJ inválido | 400 | `cnpj_invalido` |
| Não existe na Receita | 404 | `cnpj_nao_encontrado` |
| Muitas consultas seguidas | 429 | `limite_do_provedor` |
| Provedor com erro | 502 | `erro_no_provedor` |
| Provedor fora do ar ou lento | 504 | `provedor_inacessivel` ou `provedor_demorou` |
