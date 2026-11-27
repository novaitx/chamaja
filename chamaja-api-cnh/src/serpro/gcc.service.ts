import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ErroDeApi } from "../comum/erro-de-api";
import type { Configuracao } from "../configuracao/configuracao";
import type { TokenGcc } from "./tipos-datavalid";

@Injectable()
export class GccService {
  constructor(private readonly configuracao: ConfigService<Configuracao, true>) {}

  async obterToken(): Promise<TokenGcc> {
    const token = this.configuracao.get("tokenGcc", { infer: true });
    const emProducao = this.configuracao.get("modo", { infer: true }) === "producao";

    if (emProducao && !token) {
      throw new ErroDeApi(
        503,
        "gcc_nao_configurada",
        "A integração com a GCC ainda não foi configurada para produção.",
      );
    }

    return { token, cnpjAnuente: this.configuracao.get("cnpjAnuente", { infer: true }) };
  }
}
