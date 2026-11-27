import { ErroDeApi } from "../comum/erro-de-api";

export function erroDeConexao(erro: unknown): ErroDeApi {
  const nomeDoErro = (erro as { name?: string } | null)?.name;
  const demorou = nomeDoErro === "TimeoutError" || nomeDoErro === "AbortError";

  return demorou
    ? new ErroDeApi(504, "serpro_demorou", "O Serpro demorou para responder.")
    : new ErroDeApi(504, "serpro_inacessivel", "Não foi possível falar com o Serpro.");
}
