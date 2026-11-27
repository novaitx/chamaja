import type { ValidationError } from "class-validator";
import { ErroDeApi } from "./erro-de-api";

export interface Problema {
  campo: string;
  mensagem: string;
}

export function listarProblemas(erros: ValidationError[], caminho = ""): Problema[] {
  return erros.flatMap((erro) => {
    const campo = caminho ? `${caminho}.${erro.property}` : erro.property;
    const mensagens = Object.values(erro.constraints ?? {});
    const doProprioCampo = mensagens.length ? [{ campo, mensagem: mensagens[0] }] : [];

    return [...doProprioCampo, ...listarProblemas(erro.children ?? [], campo)];
  });
}

export function erroDeDadosInvalidos(erros: ValidationError[]): ErroDeApi {
  return new ErroDeApi(400, "dados_invalidos", "Confira os campos destacados.", {
    problemas: listarProblemas(erros),
  });
}
