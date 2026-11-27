import { cnpjValido, formatarCnpj, limparCnpj } from "./cnpj";

describe("regras do CNPJ", () => {
  it("limpa pontuação e deixa maiúsculo", () => {
    expect(limparCnpj("12.abc.345/01de-35")).toBe("12ABC34501DE35");
  });

  it("aceita CNPJ numérico válido (Banco do Brasil)", () => {
    expect(cnpjValido("00.000.000/0001-91")).toBe(true);
  });

  it("aceita CNPJ alfanumérico válido (exemplo da Receita)", () => {
    expect(cnpjValido("12.ABC.345/01DE-35")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(cnpjValido("00.000.000/0001-92")).toBe(false);
  });

  it.each(["123", "12ABC34501DE3A", "11111111111111", "", null])("recusa %p", (entrada) => {
    expect(cnpjValido(entrada)).toBe(false);
  });

  it("formata para exibir", () => {
    expect(formatarCnpj("00000000000191")).toBe("00.000.000/0001-91");
  });
});
