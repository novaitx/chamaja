// Testes da API inteira, sem internet: o provedor é trocado por um "falso" (mock).
import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/server.js";

let servidor, base;
before(async () => {
  servidor = app.listen(0);
  await new Promise((r) => servidor.once("listening", r));
  base = `http://localhost:${servidor.address().port}`;
});
after(() => servidor.close());

const fetchReal = globalThis.fetch;
// Responde como a BrasilAPI responderia, só para chamadas ao provedor.
function provedorFalso(status, corpo) {
  return mock.method(globalThis, "fetch", async (url, opts) => {
    if (String(url).startsWith(base)) return fetchReal(url, opts);
    return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
  });
}

test("CNPJ inválido devolve 400 sem chamar o provedor", async () => {
  const r = await fetch(`${base}/cnpj/123`);
  assert.equal(r.status, 400);
  assert.equal((await r.json()).erro, "cnpj_invalido");
});

test("CNPJ encontrado devolve os campos do ChamaJá", async () => {
  const m = provedorFalso(200, {
    cnpj: "00000000000191", razao_social: "BANCO DO BRASIL SA", nome_fantasia: "DIRECAO GERAL",
    descricao_situacao_cadastral: "ATIVA", opcao_pelo_mei: false, data_inicio_atividade: "1966-08-01",
    cnae_fiscal_descricao: "Bancos múltiplos, com carteira comercial", municipio: "BRASILIA", uf: "DF",
  });
  const r = await fetch(`${base}/cnpj/00.000.000%2F0001-91`);
  const d = await r.json();
  m.mock.restore();
  assert.equal(r.status, 200);
  assert.equal(d.razaoSocial, "BANCO DO BRASIL SA");
  assert.equal(d.ativa, true);
  assert.equal(d.origem, "provedor");
});

test("segunda consulta do mesmo CNPJ vem do cache", async () => {
  const r = await fetch(`${base}/cnpj/00000000000191`);
  assert.equal((await r.json()).origem, "cache");
});

test("CNPJ que não existe devolve 404", async () => {
  const m = provedorFalso(404, { message: "CNPJ não encontrado" });
  const r = await fetch(`${base}/cnpj/11222333000181`);
  m.mock.restore();
  assert.equal(r.status, 404);
  assert.equal((await r.json()).erro, "cnpj_nao_encontrado");
});

test("resposta estranha do provedor devolve 500 erro_interno", async () => {
  const m = mock.method(globalThis, "fetch", async (url, opts) => {
    if (String(url).startsWith(base)) return fetchReal(url, opts);
    return new Response("isto não é JSON", { status: 200 });
  });
  const erroOriginal = console.error;
  console.error = () => {}; // esconde o erro esperado no terminal
  const r = await fetch(`${base}/cnpj/11444777000161`);
  console.error = erroOriginal;
  m.mock.restore();
  assert.equal(r.status, 500);
  assert.equal((await r.json()).erro, "erro_interno");
});
