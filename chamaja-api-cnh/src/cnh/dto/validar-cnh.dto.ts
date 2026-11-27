import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, Matches, ValidateNested } from "class-validator";
import { soDigitos } from "../../comum/documentos";
import { EhCpf, EhData } from "../../comum/validadores";

export const CATEGORIAS_CNH = ["ACC", "A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"];

const textoLimpo = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);

export class DadosDaCnhDto {
  @ApiProperty({ description: "Número de registro da CNH (até 11 dígitos)", example: "00000000" })
  @Transform(({ value }) => soDigitos(value))
  @Matches(/^\d{1,11}$/, { message: "Número de registro da CNH inválido (até 11 dígitos)." })
  numeroRegistro: string;

  @ApiProperty({ enum: CATEGORIAS_CNH, example: "B" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  @IsIn(CATEGORIAS_CNH, { message: `Categoria inválida. Use uma destas: ${CATEGORIAS_CNH.join(", ")}.` })
  categoria: string;

  @ApiProperty({ format: "date", example: "2025-04-03" })
  @EhData()
  dataValidade: string;

  @ApiPropertyOptional({ format: "date", example: "2000-04-03" })
  @IsOptional()
  @EhData()
  dataPrimeiraHabilitacao?: string;
}

export class ValidarCnhDto {
  @ApiProperty({ description: "CPF do motorista, com ou sem pontuação", example: "257.744.350-16" })
  @Transform(({ value }) => soDigitos(value))
  @EhCpf()
  cpf: string;

  @ApiProperty({ description: "Nome completo, como está na CNH", example: "Manuela Elisa da Mota" })
  @Transform(textoLimpo)
  @IsString({ message: "Informe o nome completo." })
  @IsNotEmpty({ message: "Informe o nome completo." })
  nome: string;

  @ApiProperty({ format: "date", example: "1975-06-04" })
  @EhData()
  dataNascimento: string;

  @ApiProperty({ type: DadosDaCnhDto })
  @IsObject({ message: "Informe os dados da CNH." })
  @ValidateNested()
  @Type(() => DadosDaCnhDto)
  cnh: DadosDaCnhDto;
}
