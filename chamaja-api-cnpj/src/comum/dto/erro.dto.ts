import { ApiProperty } from "@nestjs/swagger";

export class ErroDto {
  @ApiProperty({
    description: "Código fixo do erro. É ele que o front usa para escolher a mensagem.",
    example: "cnpj_invalido",
  })
  erro: string;

  @ApiProperty({
    description: "Texto de apoio para quem desenvolve. Não exibir direto ao usuário.",
    example: "CNPJ inválido. Confira os números e letras.",
  })
  mensagem: string;
}
