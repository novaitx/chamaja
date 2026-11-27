import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CnhModule } from "./cnh/cnh.module";
import { lerConfiguracao, validarAmbiente } from "./configuracao/configuracao";
import { SaudeController } from "./saude/saude.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.demonstracao"],
      ignoreEnvFile: process.env.NODE_ENV === "production",
      validate: validarAmbiente,
      load: [() => lerConfiguracao()],
    }),
    CnhModule,
  ],
  controllers: [SaudeController],
})
export class AppModule {}
