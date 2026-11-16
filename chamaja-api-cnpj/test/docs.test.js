// Testes da documentação: garantem que o Swagger está no ar e não ficou desatualizado.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/server.js";
import { openapi } from "../src/openapi.js";

let servidor, base;
before(async () => {
  servidor = app.listen(0);
  await new Promise((r) => servidor.once("listening", r));
  base = `http://localhost:${servidor.address().port}`;
});
after(() => servidor.close());

test("a página /docs abre", async () => {
  const r = await fetch(`${base}/docs/`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /swagger-ui/i);
});

test("/openapi.json entrega o contrato da API", async () => {
  const r = await fetch(`${base}/openapi.json`);
  const doc = await r.json();
  assert.equal(r.status, 200);
  assert.equal(doc.openapi, "3.0.3");
  assert.ok(doc.paths["/cnpj/{cnpj}"]);
  assert.ok(doc.paths["/saude"]);
});

test("toda rota do código está documentada", () => {
  // Lê as rotas que o Express conhece e compara com as do Swagger.
  const rotasNoCodigo = app._router.stack
    .filter((camada) => camada.route)
    .map((camada) => camada.route.path.replace(/:(\w+)/g, "{$1}"))
    .filter((rota) => rota !== "/openapi.json");
  for (const rota of rotasNoCodigo) {
    assert.ok(openapi.paths[rota], `A rota ${rota} existe no código, mas não está no Swagger`);
  }
});

test("todo erro documentado tem o código e a mensagem", () => {
  for (const [nome, resposta] of Object.entries(openapi.components.responses)) {
    const exemplo = resposta.content["application/json"].example;
    assert.ok(exemplo.erro && exemplo.mensagem, `Resposta ${nome} sem exemplo completo`);
  }
});
