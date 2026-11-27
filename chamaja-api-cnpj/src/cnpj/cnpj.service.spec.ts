import { ConfigService } from "@nestjs/config";
import { Configuracao, lerConfiguracao } from "../configuracao/configuracao";
import type { BrasilApiService } from "./brasil-api.service";
import { CnpjService, converterParaEmpresa } from "./cnpj.service";

describe("converterParaEmpresa", () => {
  it("traduz os campos do provedor para o formato do ChamaJá", () => {
    const empresa = converterParaEmpresa({
      cnpj: "00000000000191",
      razao_social: "BANCO DO BRASIL SA",
      descricao_situacao_cadastral: "ATIVA",
      opcao_pelo_mei: false,
      uf: "DF",
    });

    expect(empresa).toMatchObject({ razaoSocial: "BANCO DO BRASIL SA", ativa: true, mei: false, uf: "DF" });
    expect(Number.isNaN(Date.parse(empresa.consultadoEm))).toBe(false);
  });

  it("empresa baixada não é ativa, mesmo com a situação em minúsculas", () => {
    expect(converterParaEmpresa({ descricao_situacao_cadastral: "baixada" })).toMatchObject({
      situacao: "BAIXADA",
      ativa: false,
    });
  });

  it("campos que o provedor não mandou viram null, e MEI vira true ou false", () => {
    expect(converterParaEmpresa({ opcao_pelo_mei: 1 })).toMatchObject({
      razaoSocial: null,
      nomeFantasia: null,
      situacao: null,
      mei: true,
    });
  });
});

describe("CnpjService", () => {
  const buscarEmpresa = jest.fn();
  const brasilApiFalsa = { buscarEmpresa } as unknown as BrasilApiService;
  const configuracao = new ConfigService<Configuracao, true>(lerConfiguracao());

  beforeEach(() => buscarEmpresa.mockReset().mockResolvedValue({ cnpj: "00000000000191", razao_social: "BANCO" }));

  it("primeira consulta vai ao provedor, a segunda vem do cache", async () => {
    const servico = new CnpjService(brasilApiFalsa, configuracao);

    await expect(servico.consultar("00000000000191")).resolves.toMatchObject({ origem: "provedor" });
    await expect(servico.consultar("00000000000191")).resolves.toMatchObject({ origem: "cache" });
    expect(buscarEmpresa).toHaveBeenCalledTimes(1);
  });

  it("depois que o cache vence, consulta o provedor de novo", async () => {
    const servico = new CnpjService(brasilApiFalsa, new ConfigService({ ...lerConfiguracao(), minutosDeCache: 0 }));

    await servico.consultar("00000000000191");
    await expect(servico.consultar("00000000000191")).resolves.toMatchObject({ origem: "provedor" });
    expect(buscarEmpresa).toHaveBeenCalledTimes(2);
  });
});
