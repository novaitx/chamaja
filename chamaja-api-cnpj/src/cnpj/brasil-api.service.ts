import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ErroDeApi } from "../comum/erro-de-api";
import type { Configuracao } from "../configuracao/configuracao";

export interface RespostaBrasilApi {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  descricao_situacao_cadastral?: string;
  opcao_pelo_mei?: boolean | number | null;
  data_inicio_atividade?: string;
  cnae_fiscal_descricao?: string;
  municipio?: string;
  uf?: string;
}

@Injectable()
export class BrasilApiService {
  constructor(private readonly configuracao: ConfigService<Configuracao, true>) {}

  async buscarEmpresa(cnpj: string): Promise<RespostaBrasilApi> {
    const resposta = await this.chamar(cnpj);

    switch (resposta.status) {
      case 404:
        throw new ErroDeApi(404, "cnpj_nao_encontrado", "CNPJ não encontrado na Receita Federal.");
      case 429:
        throw new ErroDeApi(429, "limite_do_provedor", "Muitas consultas seguidas. Tente de novo em instantes.");
    }

    if (!resposta.ok) {
      throw new ErroDeApi(502, "erro_no_provedor", `O provedor respondeu com erro ${resposta.status}.`);
    }

    return (await resposta.json()) as RespostaBrasilApi;
  }

  private async chamar(cnpj: string): Promise<Response> {
    const urlBase = this.configuracao.get("urlDoProvedor", { infer: true });
    const tempoLimiteMs = this.configuracao.get("tempoLimiteMs", { infer: true });

    try {
      return await fetch(`${urlBase}/${cnpj}`, {
        headers: { Accept: "application/json", "User-Agent": "ChamaJa-API-CNPJ/0.4" },
        signal: AbortSignal.timeout(tempoLimiteMs),
      });
    } catch (erro) {
      const nomeDoErro = (erro as { name?: string } | null)?.name;
      if (nomeDoErro === "TimeoutError" || nomeDoErro === "AbortError") {
        throw new ErroDeApi(504, "provedor_demorou", "O provedor de CNPJ demorou para responder.");
      }
      throw new ErroDeApi(504, "provedor_inacessivel", "Não foi possível falar com o provedor de CNPJ.");
    }
  }
}
