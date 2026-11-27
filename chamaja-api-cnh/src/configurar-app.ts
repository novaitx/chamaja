import { ValidationPipe } from "@nestjs/common";
import { json, type NextFunction, type Request, type Response } from "express";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { FiltroDeErros } from "./comum/filtro-de-erros";
import { erroDeDadosInvalidos } from "./comum/problemas";

export function criarDocumentacao(app: NestExpressApplication) {
  const opcoes = new DocumentBuilder()
    .setTitle("ChamaJá · API de Validação de CNH")
    .setVersion("0.3.0")
    .setDescription(
      "Confere a CNH do motorista na base oficial (Senatran e Receita Federal) pelo **Serpro Datavalid v5** " +
        "e decide se ela atende às regras do ChamaJá (LM09): CNH emitida, sem impedimento, com EAR, válida e de categoria para carro.\n\n" +
        "O Serpro não devolve os dados da CNH: ele compara o que foi enviado com a base oficial. A decisão (aprovada ou não) é do ChamaJá.\n\n" +
        "**Modo demonstração:** usa o ambiente gratuito do Serpro, com dados de exemplo. Para testar, use a pessoa fictícia do Serpro " +
        "(já preenchida no exemplo abaixo). Dados de pessoas reais não funcionam na demonstração e não devem ser usados em testes (LGPD).",
    )
    .addTag("CNH", "Validação da CNH do motorista")
    .addTag("Sistema", "Situação da API")
    .build();

  return SwaggerModule.createDocument(app, opcoes);
}

function tratarCorpoInvalido(erro: { type?: string }, _req: Request, res: Response, next: NextFunction) {
  if (erro.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "json_invalido", mensagem: "O corpo da requisição não é um JSON válido." });
  }
  if (erro.type === "entity.too.large") {
    return res.status(413).json({ erro: "corpo_muito_grande", mensagem: "O corpo da requisição passou de 100 KB." });
  }
  next(erro);
}

export function configurarApp(app: NestExpressApplication) {
  app.use(json({ limit: "100kb" }));
  app.use(tratarCorpoInvalido);
  app.useGlobalFilters(new FiltroDeErros());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: erroDeDadosInvalidos,
    }),
  );

  SwaggerModule.setup("docs", app, criarDocumentacao(app), {
    jsonDocumentUrl: "openapi.json",
    customSiteTitle: "ChamaJá · API de CNH",
  });
}
