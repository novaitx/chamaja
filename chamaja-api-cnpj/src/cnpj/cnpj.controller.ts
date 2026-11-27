import { Controller, Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ErroDto } from "../comum/dto/erro.dto";
import { CnpjPipe } from "./cnpj.pipe";
import { CnpjService } from "./cnpj.service";
import { EmpresaDto } from "./dto/empresa.dto";

const erroDocumentado = (status: number, description: string, erro: string, mensagem: string) =>
  ApiResponse({ status, description, type: ErroDto, example: { erro, mensagem } });

@ApiTags("CNPJ")
@Controller("cnpj")
export class CnpjController {
  constructor(private readonly cnpjService: CnpjService) {}

  @Get(":cnpj")
  @ApiOperation({
    summary: "Consulta um CNPJ",
    description:
      "Aceita o CNPJ com ou sem pontuação. Se vier com barra, envie a barra como %2F. " +
      "Antes de consultar o provedor, a API confere os dígitos verificadores; CNPJ inválido volta 400 sem gastar consulta.",
  })
  @ApiParam({
    name: "cnpj",
    description: "CNPJ com 14 caracteres. As 12 primeiras posições podem ter letras (formato alfanumérico).",
    example: "00000000000191",
  })
  @ApiOkResponse({ description: "Empresa encontrada", type: EmpresaDto })
  @erroDocumentado(400, "CNPJ inválido", "cnpj_invalido", "CNPJ inválido. Confira os números e letras.")
  @erroDocumentado(404, "CNPJ não existe na Receita", "cnpj_nao_encontrado", "CNPJ não encontrado na Receita Federal.")
  @erroDocumentado(
    429,
    "Muitas consultas seguidas",
    "limite_do_provedor",
    "Muitas consultas seguidas. Tente de novo em instantes.",
  )
  @erroDocumentado(500, "Erro inesperado", "erro_interno", "Erro inesperado na API.")
  @erroDocumentado(502, "O provedor respondeu com erro", "erro_no_provedor", "O provedor respondeu com erro 503.")
  @erroDocumentado(
    504,
    "Provedor fora do ar ou lento",
    "provedor_inacessivel",
    "Não foi possível falar com o provedor de CNPJ.",
  )
  consultar(@Param("cnpj", CnpjPipe) cnpj: string): Promise<EmpresaDto> {
    return this.cnpjService.consultar(cnpj);
  }
}
