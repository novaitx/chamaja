import { Logger } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configurarApp, criarDocumentacao } from "../src/configurar-app";
import { pedidoExemplo, respostaCom, respostaTudoConfere } from "./exemplos-serpro";

describe("API de CNH (ponta a ponta)", () => {
  let app: NestExpressApplication;
  let fetchFalso: jest.SpyInstance;
  let logFalso: jest.SpyInstance;

  const serproResponde = (status: number, corpo: unknown) =>
    fetchFalso.mockResolvedValue(
      new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } }),
    );

  const enviarPedido = (corpo: unknown) =>
    request(app.getHttpServer())
      .post("/cnh/validar")
      .send(corpo as object);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication<NestExpressApplication>({ logger: false });
    configurarApp(app);
    await app.init();
  });

  beforeEach(() => {
    fetchFalso = jest.spyOn(global, "fetch");
    logFalso = jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());
  afterAll(() => app.close());

  it("CNH em dia e tudo conferindo: 200 e aprovada", async () => {
    serproResponde(200, respostaTudoConfere);
    const resposta = await enviarPedido(pedidoExemplo);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ aprovada: true, motivos: [], modo: "demonstracao" });
  });

  it("CNH com impedimento: 200, reprovada, com o motivo", async () => {
    serproResponde(200, respostaCom({ "cnh.possui_impedimento": false }));
    const resposta = await enviarPedido(pedidoExemplo);

    expect(resposta.body.aprovada).toBe(false);
    expect(resposta.body.motivos).toEqual(["CNH com impedimento"]);
  });

  it("dados inválidos: 400 sem chamar o Serpro", async () => {
    const resposta = await enviarPedido({ ...pedidoExemplo, cpf: "123" });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      erro: "dados_invalidos",
      mensagem: "Confira os campos destacados.",
      problemas: [{ campo: "cpf", mensagem: "CPF inválido." }],
    });
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("JSON quebrado: 400 json_invalido", async () => {
    const resposta = await request(app.getHttpServer())
      .post("/cnh/validar")
      .set("Content-Type", "application/json")
      .send("{ isto não é json");

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe("json_invalido");
  });

  it("Serpro com erro: 502 erro_no_serpro", async () => {
    serproResponde(503, {});
    const resposta = await enviarPedido(pedidoExemplo);

    expect(resposta.status).toBe(502);
    expect(resposta.body.erro).toBe("erro_no_serpro");
  });

  it("resposta estranha do Serpro: 500 erro_interno", async () => {
    fetchFalso.mockResolvedValue(new Response("isto não é JSON", { status: 200 }));
    const resposta = await enviarPedido(pedidoExemplo);

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: "erro_interno", mensagem: "Erro inesperado na API." });
  });

  it("o log da consulta mascara o CPF (LGPD)", async () => {
    serproResponde(200, respostaTudoConfere);
    await enviarPedido(pedidoExemplo);

    const linhasDoLog = logFalso.mock.calls.map((chamada) => String(chamada[0])).join("\n");
    expect(linhasDoLog).toContain("***.744.350-**");
    expect(linhasDoLog).not.toContain("25774435016");
  });

  it("/saude, /docs e /openapi.json respondem", async () => {
    await request(app.getHttpServer()).get("/saude").expect(200, { ok: true, modo: "demonstracao" });
    expect((await request(app.getHttpServer()).get("/docs")).text).toMatch(/swagger-ui/i);
    expect((await request(app.getHttpServer()).get("/openapi.json")).body.paths).toHaveProperty(["/cnh/validar"]);
  });

  it("a raiz leva para a documentação", async () => {
    await request(app.getHttpServer()).get("/").expect(302).expect("Location", "/docs");
  });

  it("toda rota do código está documentada no Swagger", () => {
    const servidor = app.getHttpAdapter().getInstance();
    const camadas: Array<{ route?: { path: string } }> = (servidor.router ?? servidor._router).stack;
    const documentadas = Object.keys(criarDocumentacao(app).paths);

    const rotasDoCodigo = camadas
      .filter((camada) => camada.route)
      .map((camada) => camada.route!.path)
      .filter((rota) => rota !== "/" && rota !== "/openapi.json" && !rota.startsWith("/docs"));

    expect(rotasDoCodigo.length).toBeGreaterThan(0);
    for (const rota of rotasDoCodigo) {
      expect(documentadas).toContain(rota);
    }
  });

  it("o exemplo do Swagger passa na validação (documentação e código combinam)", async () => {
    serproResponde(200, respostaTudoConfere);
    const esquemas = criarDocumentacao(app).components!.schemas as Record<string, any>;
    const exemploDe = (esquema: string) =>
      Object.fromEntries(
        Object.entries(esquemas[esquema].properties).map(([campo, def]: [string, any]) => [campo, def.example]),
      );

    const resposta = await enviarPedido({ ...exemploDe("ValidarCnhDto"), cnh: exemploDe("DadosDaCnhDto") });
    expect(resposta.status).toBe(200);
  });
});
