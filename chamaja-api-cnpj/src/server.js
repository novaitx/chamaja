// Servidor da API. Rode com:  npm run dev
// e abra no navegador:        http://localhost:3000/cnpj/00000000000191
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { limparCnpj, cnpjValido } from "./cnpj.js";
import { buscarNoProvedor, paraFormatoChamaJa, ErroConsulta } from "./provedor.js";
import swaggerUi from "swagger-ui-express";
import { openapi } from "./openapi.js";

export const app = express();

// Documentação (Swagger): a página /docs para pessoas e o /openapi.json para ferramentas.
app.get("/openapi.json", (req, res) => res.json(openapi));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: "ChamaJá · API de CNPJ" }));

// Entrega os arquivos da pasta "public" (a página HTML) no mesmo endereço da API.
const pastaPublica = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
app.use(express.static(pastaPublica));

// Guarda as consultas por um tempo, para não chamar o provedor toda hora
// (o app consulta o CNPJ do motorista a cada abertura, LM78).
const cache = new Map();
const CACHE_MS = Number(process.env.CNPJ_CACHE_MINUTOS || 60) * 60 * 1000;

// Rota de saúde: serve só para saber se a API está no ar.
app.get("/saude", (req, res) => res.json({ ok: true }));

// Rota principal: GET /cnpj/:cnpj
app.get("/cnpj/:cnpj", async (req, res) => {
  const cnpj = limparCnpj(req.params.cnpj);

  // 1. Valida antes de gastar uma consulta no provedor.
  if (!cnpjValido(cnpj)) {
    return res.status(400).json({ erro: "cnpj_invalido", mensagem: "CNPJ inválido. Confira os números e letras." });
  }

  // 2. Se consultou há pouco, devolve o que está guardado.
  const guardado = cache.get(cnpj);
  if (guardado && Date.now() - guardado.em < CACHE_MS) {
    return res.json({ ...guardado.dados, origem: "cache" });
  }

  // 3. Consulta o provedor e devolve no formato do ChamaJá.
  try {
    const dados = paraFormatoChamaJa(await buscarNoProvedor(cnpj));
    cache.set(cnpj, { em: Date.now(), dados });
    return res.json({ ...dados, origem: "provedor" });
  } catch (e) {
    if (e instanceof ErroConsulta) {
      return res.status(e.status).json({ erro: e.codigo, mensagem: e.message });
    }
    console.error(e);
    return res.status(500).json({ erro: "erro_interno", mensagem: "Erro inesperado na API." });
  }
});

// Só sobe o servidor quando este arquivo é executado direto (não nos testes).
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const porta = Number(process.env.PORT || 3000);
  app.listen(porta, () => console.log(`API de CNPJ no ar em http://localhost:${porta}`));
}
