import { ApiProperty } from "@nestjs/swagger";

export type OrigemDaResposta = "provedor" | "cache";

export class EmpresaDto {
  @ApiProperty({ description: "CNPJ sem pontuação", example: "00000000000191", nullable: true, type: String })
  cnpj: string | null;

  @ApiProperty({ example: "BANCO DO BRASIL SA", nullable: true, type: String })
  razaoSocial: string | null;

  @ApiProperty({ example: "DIRECAO GERAL", nullable: true, type: String })
  nomeFantasia: string | null;

  @ApiProperty({ description: "Situação cadastral na Receita", example: "ATIVA", nullable: true, type: String })
  situacao: string | null;

  @ApiProperty({ description: "true quando a situação é ATIVA", example: true })
  ativa: boolean;

  @ApiProperty({ description: "Optante pelo MEI", example: false })
  mei: boolean;

  @ApiProperty({ example: "1966-08-01", nullable: true, type: String })
  dataAbertura: string | null;

  @ApiProperty({ example: "Bancos múltiplos, com carteira comercial", nullable: true, type: String })
  atividadePrincipal: string | null;

  @ApiProperty({ example: "BRASILIA", nullable: true, type: String })
  municipio: string | null;

  @ApiProperty({ example: "DF", nullable: true, type: String })
  uf: string | null;

  @ApiProperty({ description: "Quando o provedor foi consultado", example: "2026-11-27T12:30:00.000Z" })
  consultadoEm: string;

  @ApiProperty({
    enum: ["provedor", "cache"],
    description: "provedor = consulta feita agora; cache = resposta guardada",
    example: "provedor",
  })
  origem: OrigemDaResposta;
}
