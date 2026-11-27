import { cpfValido, dataValida, mascararCpf } from "./documentos";

describe("documentos", () => {
  it("CPF da pessoa de exemplo do Serpro é válido", () => {
    expect(cpfValido("257.744.350-16")).toBe(true);
  });

  it.each(["257.744.350-17", "11111111111", "123", undefined])("recusa o CPF %p", (cpf) => {
    expect(cpfValido(cpf)).toBe(false);
  });

  it("datas: aceita AAAA-MM-DD real, recusa formato errado e dia inexistente", () => {
    expect(dataValida("2000-04-03")).toBe(true);
    expect(dataValida("03/04/2000")).toBe(false);
    expect(dataValida("2025-02-31")).toBe(false);
    expect(dataValida(20000403)).toBe(false);
  });

  it("o log nunca mostra o CPF inteiro", () => {
    expect(mascararCpf("25774435016")).toBe("***.744.350-**");
    expect(mascararCpf("123")).toBe("***");
  });
});
