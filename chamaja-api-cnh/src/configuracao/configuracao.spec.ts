import { lerConfiguracao, validarAmbiente, variaveisFaltando } from "./configuracao";

const demonstracaoCompleta = {
  SERPRO_URL: "https://serpro.teste",
  SERPRO_TOKEN: "TOKEN",
  RFB_ID_TEMPLATE: "TEMPLATE",
  SENATRAN_CNPJ_ANUENTE: "123",
  GCC_TOKEN: "GCC",
};

describe("configuração", () => {
  it("demonstração completa não acusa falta", () => {
    expect(variaveisFaltando(lerConfiguracao(demonstracaoCompleta))).toEqual([]);
  });

  it("produção sem chave e segredo acusa a falta", () => {
    const producao = lerConfiguracao({ ...demonstracaoCompleta, SERPRO_MODO: "producao" });
    expect(variaveisFaltando(producao)).toContain("SERPRO_CONSUMER_KEY e SERPRO_CONSUMER_SECRET");
  });

  it("demonstração sem token da GCC acusa a falta", () => {
    expect(variaveisFaltando(lerConfiguracao({ ...demonstracaoCompleta, GCC_TOKEN: "" }))).toContain("GCC_TOKEN");
  });

  it("sem nada configurado, a API não sobe e diz o que falta", () => {
    expect(() => validarAmbiente({})).toThrow(
      /SERPRO_URL, RFB_ID_TEMPLATE, SENATRAN_CNPJ_ANUENTE, SERPRO_TOKEN, GCC_TOKEN/,
    );
  });

  it("regras da LM09 têm valores padrão e aceitam ajuste pelo ambiente", () => {
    expect(lerConfiguracao({}).regras).toEqual({
      nomeMinimo: 0.85,
      earMinimo: 0.8,
      exigirEar: true,
      categoriasCarro: ["B", "AB", "C", "AC", "D", "AD", "E", "AE"],
    });
    expect(lerConfiguracao({ REGRA_EXIGIR_EAR: "nao", REGRA_CATEGORIAS_CARRO: "B, C" }).regras).toMatchObject({
      exigirEar: false,
      categoriasCarro: ["B", "C"],
    });
  });
});
