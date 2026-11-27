import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Sistema")
@Controller("saude")
export class SaudeController {
  @Get()
  @ApiOperation({ summary: "Confere se a API está no ar" })
  @ApiOkResponse({ description: "API no ar", schema: { example: { ok: true } } })
  verificar() {
    return { ok: true };
  }
}
