import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configurarApp, criarDocumentacao } from "../src/configurar-app";

describe("API de CNPJ (ponta a ponta)", () => {
  let app: NestExpressApplication;
  let fetchFalso: jest.SpyInstance;

  const provedorResponde = (status: number, corpo: unknown) =>
    fetchFalso.mockResolvedValueOnce(
      new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } }),
    );

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication<NestExpressApplication>({ logger: false });
    configurarApp(app);
    await app.init();
  });

  beforeEach(() => {
    fetchFalso = jest.spyOn(global, "fetch");
  });

  afterEach(() => jest.restoreAllMocks());
  afterAll(() => app.close());

  it("CNPJ inválido devolve 400 sem chamar o provedor", async () => {
    const resposta = await request(app.getHttpServer()).get("/cnpj/123");

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe("cnpj_invalido");
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("CNPJ encontrado devolve os campos do ChamaJá", async () => {
    provedorResponde(200, {
      cnpj: "00000000000191",
      razao_social: "BANCO DO BRASIL SA",
      nome_fantasia: "DIRECAO GERAL",
      descricao_situacao_cadastral: "ATIVA",
      opcao_pelo_mei: false,
      data_inicio_atividade: "1966-08-01",
      cnae_fiscal_descricao: "Bancos múltiplos, com carteira comercial",
      municipio: "BRASILIA",
      uf: "DF",
    });

    const resposta = await request(app.getHttpServer()).get("/cnpj/00.000.000%2F0001-91");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ razaoSocial: "BANCO DO BRASIL SA", ativa: true, origem: "provedor" });
  });

  it("segunda consulta do mesmo CNPJ vem do cache", async () => {
    const resposta = await request(app.getHttpServer()).get("/cnpj/00000000000191");

    expect(resposta.body.origem).toBe("cache");
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("CNPJ que não existe devolve 404", async () => {
    provedorResponde(404, { message: "CNPJ não encontrado" });
    const resposta = await request(app.getHttpServer()).get("/cnpj/11222333000181");

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe("cnpj_nao_encontrado");
  });

  it("resposta estranha do provedor devolve 500 erro_interno", async () => {
    fetchFalso.mockResolvedValueOnce(new Response("isto não é JSON", { status: 200 }));
    const resposta = await request(app.getHttpServer()).get("/cnpj/11444777000161");

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: "erro_interno", mensagem: "Erro inesperado na API." });
  });

  it("rota que não existe volta no mesmo formato de erro", async () => {
    const resposta = await request(app.getHttpServer()).get("/nada");

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe("rota_nao_encontrada");
  });

  it("/saude responde", async () => {
    await request(app.getHttpServer()).get("/saude").expect(200, { ok: true });
  });

  it("a página /docs abre e o /openapi.json traz o contrato", async () => {
    const pagina = await request(app.getHttpServer()).get("/docs");
    expect(pagina.text).toMatch(/swagger-ui/i);

    const contrato = await request(app.getHttpServer()).get("/openapi.json");
    expect(contrato.body.paths).toHaveProperty(["/cnpj/{cnpj}"]);
    expect(contrato.body.paths).toHaveProperty(["/saude"]);
  });

  it("toda rota do código está documentada", () => {
    const servidor = app.getHttpAdapter().getInstance();
    const camadas: Array<{ route?: { path: string } }> = (servidor.router ?? servidor._router).stack;
    const documentadas = Object.keys(criarDocumentacao(app).paths);

    const rotasDoCodigo = camadas
      .filter(
        (camada) => camada.route && !camada.route.path.startsWith("/docs") && camada.route.path !== "/openapi.json",
      )
      .map((camada) => camada.route!.path.replace(/:(\w+)/g, "{$1}"));

    expect(rotasDoCodigo.length).toBeGreaterThan(0);
    for (const rota of rotasDoCodigo) {
      expect(documentadas).toContain(rota);
    }
  });

  it("todo erro documentado tem o código e a mensagem", () => {
    const respostas = criarDocumentacao(app).paths["/cnpj/{cnpj}"].get!.responses as Record<string, any>;

    for (const [status, resposta] of Object.entries(respostas)) {
      if (status === "200") continue;
      const exemplo = resposta.content["application/json"].example;
      expect(exemplo).toEqual({ erro: expect.any(String), mensagem: expect.any(String) });
    }
  });
});
