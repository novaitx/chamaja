import { Controller, Get, Redirect } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Configuracao } from "../configuracao/configuracao";

@ApiTags("Sistema")
@Controller()
export class SaudeController {
  constructor(private readonly configuracao: ConfigService<Configuracao, true>) {}

  @Get()
  @Redirect("/docs")
  @ApiExcludeEndpoint()
  abrirDocumentacao() {}

  @Get("saude")
  @ApiOperation({ summary: "Confere se a API está no ar" })
  @ApiOkResponse({ description: "API no ar", schema: { example: { ok: true, modo: "demonstracao" } } })
  verificar() {
    return { ok: true, modo: this.configuracao.get("modo", { infer: true }) };
  }
}
