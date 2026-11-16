// Testes unitários do provedor: cada função testada sozinha, sem internet.
// O fetch (a função que acessa a internet) é trocado por um falso, que responde o que o teste mandar.
import { test, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { buscarNoProvedor, paraFormatoChamaJa, ErroConsulta } from "../src/provedor.js";

afterEach(() => mock.restoreAll()); // devolve o fetch verdadeiro depois de cada teste

// Faz o fetch responder com um status e um corpo.
function responder(status, corpo = {}) {
  mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } })
  );
}

// Confere se a função falhou com o status e o código esperados.
async function deveFalhar(status, codigo) {
  await assert.rejects(buscarNoProvedor("00000000000191"), (e) => {
    assert.ok(e instanceof ErroConsulta);
    assert.equal(e.status, status);
    assert.equal(e.codigo, codigo);
    return true;
  });
}

// ---------- paraFormatoChamaJa: traduz a resposta do provedor ----------

test("traduz os campos do provedor para o formato do ChamaJá", () => {
  const r = paraFormatoChamaJa({
    cnpj: "00000000000191", razao_social: "BANCO DO BRASIL SA", nome_fantasia: "DIRECAO GERAL",
    descricao_situacao_cadastral: "ATIVA", opcao_pelo_mei: false, data_inicio_atividade: "1966-08-01",
    cnae_fiscal_descricao: "Bancos", municipio: "BRASILIA", uf: "DF",
  });
  assert.equal(r.razaoSocial, "BANCO DO BRASIL SA");
  assert.equal(r.ativa, true);
  assert.equal(r.mei, false);
  assert.equal(r.uf, "DF");
  assert.ok(!Number.isNaN(Date.parse(r.consultadoEm)), "consultadoEm deve ser uma data válida");
});

test("empresa baixada não é ativa, mesmo com a situação em minúsculas", () => {
  const r = paraFormatoChamaJa({ cnpj: "1", descricao_situacao_cadastral: "baixada" });
  assert.equal(r.situacao, "BAIXADA");
  assert.equal(r.ativa, false);
});

test("campos que o provedor não mandou viram null, e MEI vira true ou false", () => {
  const r = paraFormatoChamaJa({ cnpj: "1", opcao_pelo_mei: 1 });
  assert.equal(r.razaoSocial, null);
  assert.equal(r.nomeFantasia, null);
  assert.equal(r.situacao, null);
  assert.equal(r.mei, true);
});

// ---------- buscarNoProvedor: o que fazer com cada resposta ----------

test("200: devolve os dados do provedor", async () => {
  responder(200, { cnpj: "00000000000191" });
  assert.deepEqual(await buscarNoProvedor("00000000000191"), { cnpj: "00000000000191" });
});

test("chama o endereço certo do provedor", async () => {
  responder(200, {});
  await buscarNoProvedor("00000000000191");
  const urlChamada = String(globalThis.fetch.mock.calls[0].arguments[0]);
  assert.ok(urlChamada.endsWith("/00000000000191"), urlChamada);
});

test("404 do provedor vira 404 cnpj_nao_encontrado", async () => {
  responder(404);
  await deveFalhar(404, "cnpj_nao_encontrado");
});

test("429 do provedor vira 429 limite_do_provedor", async () => {
  responder(429);
  await deveFalhar(429, "limite_do_provedor");
});

test("outro erro do provedor (503) vira 502 erro_no_provedor", async () => {
  responder(503);
  await deveFalhar(502, "erro_no_provedor");
});

test("provedor que demora vira 504 provedor_demorou", async () => {
  mock.method(globalThis, "fetch", async () => { throw new DOMException("tempo esgotado", "TimeoutError"); });
  await deveFalhar(504, "provedor_demorou");
});

test("provedor fora do ar vira 504 provedor_inacessivel", async () => {
  mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed"); });
  await deveFalhar(504, "provedor_inacessivel");
});
