import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ErroDto } from "../comum/dto/erro.dto";
import { CnhService } from "./cnh.service";
import { ResultadoValidacaoDto } from "./dto/resultado-validacao.dto";
import { ValidarCnhDto } from "./dto/validar-cnh.dto";

const erroDocumentado = (status: number, description: string, exemplo: Record<string, unknown>) =>
  ApiResponse({ status, description, type: ErroDto, example: exemplo });

@ApiTags("CNH")
@Controller("cnh")
export class CnhController {
  constructor(private readonly cnhService: CnhService) {}

  @Post("validar")
  @HttpCode(200)
  @ApiOperation({
    summary: "Valida a CNH de um motorista",
    description:
      "Os dados vão no corpo (nunca na URL), porque CPF e CNH são dados pessoais. " +
      "A API confere os campos, consulta o Serpro Datavalid v5 e aplica as regras da LM09.",
  })
  @ApiBody({ type: ValidarCnhDto })
  @ApiOkResponse({ description: "Consulta feita. Veja aprovada e motivos.", type: ResultadoValidacaoDto })
  @erroDocumentado(400, "Dados inválidos (antes de consultar o Serpro)", {
    erro: "dados_invalidos",
    mensagem: "Confira os campos destacados.",
    problemas: [{ campo: "cpf", mensagem: "CPF inválido." }],
  })
  @erroDocumentado(429, "Muitas consultas seguidas", {
    erro: "limite_serpro",
    mensagem: "Muitas consultas seguidas. Tente de novo em instantes.",
  })
  @erroDocumentado(500, "Erro inesperado", { erro: "erro_interno", mensagem: "Erro inesperado na API." })
  @erroDocumentado(502, "O Serpro recusou ou respondeu com erro", {
    erro: "erro_no_serpro",
    mensagem: "O Serpro respondeu com erro 503.",
  })
  @erroDocumentado(503, "GCC não configurada em produção", {
    erro: "gcc_nao_configurada",
    mensagem: "A integração com a GCC ainda não foi configurada para produção.",
  })
  @erroDocumentado(504, "Serpro fora do ar ou lento", {
    erro: "serpro_inacessivel",
    mensagem: "Não foi possível falar com o Serpro.",
  })
  validar(@Body() pedido: ValidarCnhDto): Promise<ResultadoValidacaoDto> {
    return this.cnhService.validar(pedido);
  }
}
