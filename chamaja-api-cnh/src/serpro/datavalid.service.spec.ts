import { ConfigService } from "@nestjs/config";
import { pedidoExemplo, respostaTudoConfere } from "../../test/exemplos-serpro";
import { ErroDeApi } from "../comum/erro-de-api";
import { Configuracao, lerConfiguracao } from "../configuracao/configuracao";
import { DatavalidService, montarCorpo } from "./datavalid.service";
import { GccService } from "./gcc.service";
import { TokenSerproService } from "./token-serpro.service";

const ambienteDeTeste = {
  SERPRO_URL: "https://serpro.teste",
  SERPRO_TOKEN: "TOKEN-FIXO",
  RFB_ID_TEMPLATE: "TEMPLATE",
  SENATRAN_CNPJ_ANUENTE: "123",
  GCC_TOKEN: "TOKEN-GCC",
};

function criarServicos(ambiente: Record<string, string> = {}) {
  const configuracao = new ConfigService<Configuracao, true>(lerConfiguracao({ ...ambienteDeTeste, ...ambiente }));
  const tokenSerpro = new TokenSerproService(configuracao);
  const datavalid = new DatavalidService(configuracao, tokenSerpro, new GccService(configuracao));
  return { datavalid, tokenSerpro };
}

const respostaJson = (status: number, corpo: unknown = {}) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });

describe("montarCorpo", () => {
  it("monta o corpo no formato da v5, com o objeto privacidade", () => {
    const corpo = montarCorpo(
      { ...pedidoExemplo, cpf: "25774435016" },
      { token: "TOKEN-GCC", cnpjAnuente: "123" },
      "TEMPLATE",
    );

    expect(corpo.cpf).toBe("25774435016");
    expect(corpo.privacidade).toEqual({
      rfb: { id_template: "TEMPLATE" },
      senatran: { token: "TOKEN-GCC", cnpj_anuente: "123" },
    });
    expect(corpo.validacao.cnh).toMatchObject({
      numero_registro: "00000000",
      situacao: "EMITIDA",
      possui_impedimento: false,
      observacoes: "EAR",
    });
  });
});

describe("DatavalidService", () => {
  let fetchFalso: jest.SpyInstance;

  const esperarErro = async (promessa: Promise<unknown>, status: number, codigo: string) => {
    await expect(promessa).rejects.toBeInstanceOf(ErroDeApi);
    await expect(promessa).rejects.toMatchObject({ status, codigo });
  };

  beforeEach(() => {
    fetchFalso = jest.spyOn(global, "fetch");
  });

  afterEach(() => jest.restoreAllMocks());

  it("chama o endereço certo, com o token no cabeçalho", async () => {
    fetchFalso.mockResolvedValue(respostaJson(200, respostaTudoConfere));
    const { datavalid } = criarServicos();

    await expect(datavalid.validar(pedidoExemplo)).resolves.toEqual(respostaTudoConfere);

    const [url, opcoes] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://serpro.teste/v5/pessoa-fisica/validacao");
    expect(opcoes.method).toBe("POST");
    expect(opcoes.headers).toMatchObject({ Authorization: "Bearer TOKEN-FIXO" });
  });

  it("401 uma vez: renova o token e tenta de novo", async () => {
    fetchFalso.mockResolvedValueOnce(respostaJson(401)).mockResolvedValueOnce(respostaJson(200, respostaTudoConfere));
    const { datavalid } = criarServicos();

    await expect(datavalid.validar(pedidoExemplo)).resolves.toEqual(respostaTudoConfere);
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  it.each([
    [401, 502, "acesso_serpro_negado"],
    [403, 502, "acesso_serpro_negado"],
    [400, 502, "pedido_recusado_serpro"],
    [429, 429, "limite_serpro"],
    [503, 502, "erro_no_serpro"],
  ])("Serpro responde %i: a API devolve %i %s", async (statusDoSerpro, status, codigo) => {
    fetchFalso.mockImplementation(async () => respostaJson(statusDoSerpro));
    await esperarErro(criarServicos().datavalid.validar(pedidoExemplo), status, codigo);
  });

  it("demora vira 504 serpro_demorou", async () => {
    fetchFalso.mockRejectedValue(new DOMException("tempo", "TimeoutError"));
    await esperarErro(criarServicos().datavalid.validar(pedidoExemplo), 504, "serpro_demorou");
  });

  it("fora do ar vira 504 serpro_inacessivel", async () => {
    fetchFalso.mockRejectedValue(new TypeError("fetch failed"));
    await esperarErro(criarServicos().datavalid.validar(pedidoExemplo), 504, "serpro_inacessivel");
  });

  it("em produção sem GCC configurada, para antes de chamar o Serpro (503)", async () => {
    const { datavalid } = criarServicos({ SERPRO_MODO: "producao", GCC_TOKEN: "" });

    await esperarErro(datavalid.validar(pedidoExemplo), 503, "gcc_nao_configurada");
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});

describe("TokenSerproService", () => {
  let fetchFalso: jest.SpyInstance;
  const comChaves = { SERPRO_CONSUMER_KEY: "chave", SERPRO_CONSUMER_SECRET: "segredo" };

  beforeEach(() => {
    fetchFalso = jest.spyOn(global, "fetch");
  });

  afterEach(() => jest.restoreAllMocks());

  it("sem chave e segredo, usa o token fixo da demonstração", async () => {
    await expect(criarServicos().tokenSerpro.obter()).resolves.toBe("TOKEN-FIXO");
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("troca chave e segredo por token, e guarda para as próximas consultas", async () => {
    fetchFalso.mockResolvedValue(respostaJson(200, { access_token: "TOKEN-1H", expires_in: 3600 }));
    const { tokenSerpro } = criarServicos(comChaves);

    await expect(tokenSerpro.obter()).resolves.toBe("TOKEN-1H");
    await expect(tokenSerpro.obter()).resolves.toBe("TOKEN-1H");
    expect(fetchFalso).toHaveBeenCalledTimes(1);

    const [url, opcoes] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://gateway.apiserpro.serpro.gov.br/token");
    expect(opcoes.headers).toMatchObject({ Authorization: `Basic ${Buffer.from("chave:segredo").toString("base64")}` });
    expect(opcoes.body).toBe("grant_type=client_credentials");
  });

  it("credenciais recusadas viram 502 credenciais_serpro_recusadas", async () => {
    fetchFalso.mockResolvedValue(respostaJson(401));
    await expect(criarServicos(comChaves).tokenSerpro.obter()).rejects.toMatchObject({
      status: 502,
      codigo: "credenciais_serpro_recusadas",
    });
  });

  it.each([
    [new DOMException("tempo", "TimeoutError"), "serpro_demorou"],
    [new TypeError("fetch failed"), "serpro_inacessivel"],
  ])("falha ao pedir o token (%p) vira 504 %s", async (falha, codigo) => {
    fetchFalso.mockRejectedValue(falha);
    await expect(criarServicos(comChaves).tokenSerpro.obter()).rejects.toMatchObject({ status: 504, codigo });
  });
});
