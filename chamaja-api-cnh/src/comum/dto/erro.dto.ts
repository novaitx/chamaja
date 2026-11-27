import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProblemaDto {
  @ApiProperty({ example: "cpf" })
  campo: string;

  @ApiProperty({ example: "CPF inválido." })
  mensagem: string;
}

export class ErroDto {
  @ApiProperty({
    description: "Código fixo do erro. É ele que o front usa para escolher a mensagem.",
    example: "dados_invalidos",
  })
  erro: string;

  @ApiProperty({
    description: "Texto de apoio para quem desenvolve. Não exibir direto ao usuário.",
    example: "Confira os campos destacados.",
  })
  mensagem: string;

  @ApiPropertyOptional({
    type: [ProblemaDto],
    description: "Só no erro dados_invalidos: um item por campo com problema.",
  })
  problemas?: ProblemaDto[];
}
