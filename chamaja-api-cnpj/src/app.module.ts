import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CnpjModule } from "./cnpj/cnpj.module";
import { lerConfiguracao } from "./configuracao/configuracao";
import { SaudeController } from "./saude/saude.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [lerConfiguracao],
      ignoreEnvFile: process.env.NODE_ENV === "production",
    }),
    CnpjModule,
  ],
  controllers: [SaudeController],
})
export class AppModule {}
