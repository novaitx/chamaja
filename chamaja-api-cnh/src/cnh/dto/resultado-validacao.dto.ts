import { ApiProperty } from "@nestjs/swagger";
import type { ModoDeOperacao } from "../../configuracao/configuracao";

export class ConferenciasDto {
  @ApiProperty({ example: true })
  cpfEncontrado: boolean;

  @ApiProperty({ example: true })
  cnhEncontrada: boolean;

  @ApiProperty({ example: true })
  cpfRegular: boolean;

  @ApiProperty({ description: "Semelhança do nome, de 0 a 1", example: 1, nullable: true, type: Number })
  nome: number | null;

  @ApiProperty({ example: true })
  dataNascimento: boolean;

  @ApiProperty({ example: true })
  numeroRegistro: boolean;

  @ApiProperty({ example: true })
  categoria: boolean;

  @ApiProperty({ example: true })
  dataValidade: boolean;

  @ApiProperty({ description: "null quando a data não foi enviada", example: true, nullable: true, type: Boolean })
  dataPrimeiraHabilitacao: boolean | null;

  @ApiProperty({ example: true })
  cnhEmitida: boolean;

  @ApiProperty({ example: true })
  semImpedimento: boolean;

  @ApiProperty({ description: "Semelhança da observação EAR, de 0 a 1", example: 1, nullable: true, type: Number })
  ear: number | null;
}

export class ResultadoValidacaoDto {
  @ApiProperty({ description: "true só quando a CNH atende a todas as regras da LM09", example: false })
  aprovada: boolean;

  @ApiProperty({ type: [String], example: ["CNH vencida"] })
  motivos: string[];

  @ApiProperty({ type: ConferenciasDto })
  conferencias: ConferenciasDto;

  @ApiProperty({ enum: ["demonstracao", "producao"], example: "demonstracao" })
  modo: ModoDeOperacao;

  @ApiProperty({ example: "2026-11-27T12:30:00.000Z" })
  consultadoEm: string;
}
