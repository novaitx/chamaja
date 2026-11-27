import { HttpException } from "@nestjs/common";

export interface CorpoDeErro {
  erro: string;
  mensagem: string;
}

export class ErroDeApi extends HttpException {
  readonly codigo: string;

  constructor(status: number, codigo: string, mensagem: string) {
    super({ erro: codigo, mensagem } satisfies CorpoDeErro, status);
    this.codigo = codigo;
  }
}
