import { Module } from "@nestjs/common";
import { BrasilApiService } from "./brasil-api.service";
import { CnpjController } from "./cnpj.controller";
import { CnpjService } from "./cnpj.service";

@Module({
  controllers: [CnpjController],
  providers: [CnpjService, BrasilApiService],
})
export class CnpjModule {}
