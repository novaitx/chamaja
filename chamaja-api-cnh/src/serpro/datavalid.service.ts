import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ErroDeApi } from "../comum/erro-de-api";
import type { Configuracao } from "../configuracao/configuracao";
import { erroDeConexao } from "./erro-de-conexao";
import { GccService } from "./gcc.service";
import type { PedidoDeValidacao, RespostaDatavalid, TokenGcc } from "./tipos-datavalid";
import { TokenSerproService } from "./token-serpro.service";

export function montarCorpo(pedido: PedidoDeValidacao, gcc: TokenGcc, idTemplateRfb: string) {
  const cnh: Record<string, string | boolean> = {
    numero_registro: pedido.cnh.numeroRegistro,
    categoria: pedido.cnh.categoria,
    situacao: "EMITIDA",
    data_validade: pedido.cnh.dataValidade,
    possui_impedimento: false,
    observacoes: "EAR",
  };

  if (pedido.cnh.dataPrimeiraHabilitacao) {
    cnh.data_primeira_habilitacao = pedido.cnh.dataPrimeiraHabilitacao;
  }

  return {
    privacidade: {
      rfb: { id_template: idTemplateRfb },
      senatran: { token: gcc.token, cnpj_anuente: gcc.cnpjAnuente },
    },
    cpf: pedido.cpf,
    validacao: {
      nome: pedido.nome,
      data_nascimento: pedido.dataNascimento,
      rfb: { situacao_cpf: "REGULAR" },
      cnh,
    },
  };
}

@Injectable()
export class DatavalidService {
  constructor(
    private readonly configuracao: ConfigService<Configuracao, true>,
    private readonly tokenSerpro: TokenSerproService,
    private readonly gcc: GccService,
  ) {}

  async validar(pedido: PedidoDeValidacao): Promise<RespostaDatavalid> {
    const tokenGcc = await this.gcc.obterToken();
    const corpo = montarCorpo(pedido, tokenGcc, this.configuracao.get("idTemplateRfb", { infer: true }));

    let respostaSerpro = await this.enviar(corpo, await this.tokenSerpro.obter());
    if (respostaSerpro.status === 401) {
      respostaSerpro = await this.enviar(corpo, await this.tokenSerpro.obter({ renovar: true }));
    }

    if (respostaSerpro.ok) return (await respostaSerpro.json()) as RespostaDatavalid;
    throw await this.erroDaResposta(respostaSerpro);
  }

  private async enviar(corpo: object, token: string): Promise<Response> {
    try {
      return await fetch(`${this.configuracao.get("urlBase", { infer: true })}/v5/pessoa-fisica/validacao`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "ChamaJa-API-CNH/0.3",
        },
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(this.configuracao.get("tempoLimiteMs", { infer: true })),
      });
    } catch (erro) {
      throw erroDeConexao(erro);
    }
  }

  private async erroDaResposta(respostaSerpro: Response): Promise<ErroDeApi> {
    switch (respostaSerpro.status) {
      case 401:
      case 403:
        return new ErroDeApi(502, "acesso_serpro_negado", "O Serpro recusou o acesso desta API.");
      case 400:
      case 422: {
        const detalhe = await respostaSerpro.text().catch(() => "");
        return new ErroDeApi(502, "pedido_recusado_serpro", `O Serpro recusou o formato do pedido. ${detalhe}`.trim());
      }
      case 429:
        return new ErroDeApi(429, "limite_serpro", "Muitas consultas seguidas. Tente de novo em instantes.");
      default:
        return new ErroDeApi(502, "erro_no_serpro", `O Serpro respondeu com erro ${respostaSerpro.status}.`);
    }
  }
}
