import { ConfigService } from "@nestjs/config";
import { ErroDeApi } from "../comum/erro-de-api";
import { Configuracao, lerConfiguracao } from "../configuracao/configuracao";
import { BrasilApiService } from "./brasil-api.service";

describe("BrasilApiService", () => {
  const servico = new BrasilApiService(new ConfigService<Configuracao, true>(lerConfiguracao()));
  let fetchFalso: jest.SpyInstance;

  const provedorResponde = (status: number, corpo: unknown = {}) =>
    fetchFalso.mockResolvedValue(
      new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } }),
    );

  const esperarErro = async (status: number, codigo: string) => {
    const promessa = servico.buscarEmpresa("00000000000191");
    await expect(promessa).rejects.toBeInstanceOf(ErroDeApi);
    await expect(promessa).rejects.toMatchObject({ codigo, status });
  };

  beforeEach(() => {
    fetchFalso = jest.spyOn(global, "fetch");
  });

  afterEach(() => jest.restoreAllMocks());

  it("200: devolve os dados do provedor", async () => {
    provedorResponde(200, { cnpj: "00000000000191" });
    await expect(servico.buscarEmpresa("00000000000191")).resolves.toEqual({ cnpj: "00000000000191" });
  });

  it("chama o endereço certo, se identificando", async () => {
    provedorResponde(200);
    await servico.buscarEmpresa("00000000000191");

    const [url, opcoes] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://brasilapi.com.br/api/cnpj/v1/00000000000191");
    expect(opcoes.headers).toMatchObject({ "User-Agent": expect.stringContaining("ChamaJa") });
  });

  it("404 vira cnpj_nao_encontrado", async () => {
    provedorResponde(404);
    await esperarErro(404, "cnpj_nao_encontrado");
  });

  it("429 vira limite_do_provedor", async () => {
    provedorResponde(429);
    await esperarErro(429, "limite_do_provedor");
  });

  it("503 vira 502 erro_no_provedor", async () => {
    provedorResponde(503);
    await esperarErro(502, "erro_no_provedor");
  });

  it("demora vira 504 provedor_demorou", async () => {
    fetchFalso.mockRejectedValue(new DOMException("tempo esgotado", "TimeoutError"));
    await esperarErro(504, "provedor_demorou");
  });

  it("fora do ar vira 504 provedor_inacessivel", async () => {
    fetchFalso.mockRejectedValue(new TypeError("fetch failed"));
    await esperarErro(504, "provedor_inacessivel");
  });
});
