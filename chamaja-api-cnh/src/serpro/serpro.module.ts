import { Module } from "@nestjs/common";
import { DatavalidService } from "./datavalid.service";
import { GccService } from "./gcc.service";
import { TokenSerproService } from "./token-serpro.service";

@Module({
  providers: [DatavalidService, TokenSerproService, GccService],
  exports: [DatavalidService],
})
export class SerproModule {}
