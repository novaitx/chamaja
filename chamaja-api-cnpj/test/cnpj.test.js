// Testes automáticos das regras do CNPJ. Rode com:  npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { limparCnpj, cnpjValido, formatarCnpj } from "../src/cnpj.js";

test("limpa pontuação e deixa maiúsculo", () => {
  assert.equal(limparCnpj("12.abc.345/01de-35"), "12ABC34501DE35");
});

test("aceita CNPJ numérico válido (Banco do Brasil)", () => {
  assert.equal(cnpjValido("00.000.000/0001-91"), true);
});

test("aceita CNPJ alfanumérico válido (exemplo da Receita)", () => {
  assert.equal(cnpjValido("12.ABC.345/01DE-35"), true);
});

test("recusa dígito verificador errado", () => {
  assert.equal(cnpjValido("00.000.000/0001-92"), false);
});

test("recusa tamanho errado, letra no dígito verificador e números repetidos", () => {
  assert.equal(cnpjValido("123"), false);
  assert.equal(cnpjValido("12ABC34501DE3A"), false);
  assert.equal(cnpjValido("11111111111111"), false);
});

test("formata para exibir", () => {
  assert.equal(formatarCnpj("00000000000191"), "00.000.000/0001-91");
});
