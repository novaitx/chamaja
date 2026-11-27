import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { configurarApp } from "./configurar-app";
import type { Configuracao } from "./configuracao/configuracao";

async function iniciar() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configurarApp(app);

  const porta = app.get(ConfigService<Configuracao, true>).get("porta", { infer: true });
  await app.listen(porta);

  Logger.log(`API de CNH no ar em http://localhost:${porta}/docs`, "Inicio");
}

void iniciar();
