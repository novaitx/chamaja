import { HttpException } from "@nestjs/common";

export interface CorpoDeErro {
  erro: string;
  mensagem: string;
  [extra: string]: unknown;
}

export class ErroDeApi extends HttpException {
  readonly codigo: string;

  constructor(status: number, codigo: string, mensagem: string, extras: Record<string, unknown> = {}) {
    super({ erro: codigo, mensagem, ...extras } satisfies CorpoDeErro, status);
    this.codigo = codigo;
  }
}
