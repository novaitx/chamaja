import { join } from "node:path";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { FiltroDeErros } from "./comum/filtro-de-erros";

export function criarDocumentacao(app: NestExpressApplication) {
  const opcoes = new DocumentBuilder()
    .setTitle("ChamaJá · API de Consulta de CNPJ")
    .setVersion("0.4.0")
    .setDescription(
      "Confere se um CNPJ é válido (numérico ou alfanumérico), consulta a Receita Federal por um provedor " +
        "e devolve os dados no formato do ChamaJá. As respostas ficam guardadas por 60 minutos (cache).\n\n" +
        "Provedor atual: BrasilAPI (gratuito, para testes). O provedor definitivo ainda será escolhido (MOB-81, integração 5).",
    )
    .addTag("CNPJ", "Consulta de empresas")
    .addTag("Sistema", "Situação da API")
    .build();

  return SwaggerModule.createDocument(app, opcoes);
}

export function configurarApp(app: NestExpressApplication) {
  app.useGlobalFilters(new FiltroDeErros());
  app.useStaticAssets(join(__dirname, "..", "public"));

  SwaggerModule.setup("docs", app, criarDocumentacao(app), {
    jsonDocumentUrl: "openapi.json",
    customSiteTitle: "ChamaJá · API de CNPJ",
  });
}
