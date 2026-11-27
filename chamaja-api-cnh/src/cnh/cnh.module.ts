import { Module } from "@nestjs/common";
import { SerproModule } from "../serpro/serpro.module";
import { CnhController } from "./cnh.controller";
import { CnhService } from "./cnh.service";

@Module({
  imports: [SerproModule],
  controllers: [CnhController],
  providers: [CnhService],
})
export class CnhModule {}
