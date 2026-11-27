import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";
import type { CorpoDeErro } from "./erro-de-api";

const CODIGO_POR_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "requisicao_invalida",
  [HttpStatus.NOT_FOUND]: "rota_nao_encontrada",
  [HttpStatus.METHOD_NOT_ALLOWED]: "metodo_nao_permitido",
  [HttpStatus.PAYLOAD_TOO_LARGE]: "corpo_muito_grande",
};

function jaEstaNoFormato(corpo: unknown): corpo is CorpoDeErro {
  return typeof corpo === "object" && corpo !== null && "erro" in corpo && "mensagem" in corpo;
}

@Catch()
export class FiltroDeErros implements ExceptionFilter {
  private readonly logger = new Logger("Erros");

  catch(excecao: unknown, host: ArgumentsHost) {
    const resposta = host.switchToHttp().getResponse<Response>();

    if (excecao instanceof HttpException) {
      const status = excecao.getStatus();
      const corpo = excecao.getResponse();

      if (jaEstaNoFormato(corpo)) {
        return resposta.status(status).json(corpo);
      }

      if (status < HttpStatus.INTERNAL_SERVER_ERROR) {
        return resposta.status(status).json({
          erro: CODIGO_POR_STATUS[status] ?? "requisicao_recusada",
          mensagem: excecao.message,
        });
      }
    }

    this.logger.error(excecao instanceof Error ? excecao.stack : String(excecao));
    return resposta
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ erro: "erro_interno", mensagem: "Erro inesperado na API." });
  }
}
