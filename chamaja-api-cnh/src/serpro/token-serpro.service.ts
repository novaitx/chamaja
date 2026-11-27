import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ErroDeApi } from "../comum/erro-de-api";
import type { Configuracao } from "../configuracao/configuracao";
import { erroDeConexao } from "./erro-de-conexao";

interface TokenEmMemoria {
  token: string;
  venceEm: number;
}

interface RespostaDoToken {
  access_token: string;
  expires_in?: number;
}

@Injectable()
export class TokenSerproService {
  private tokenAtual: TokenEmMemoria | null = null;

  constructor(private readonly configuracao: ConfigService<Configuracao, true>) {}

  usaOAuth(): boolean {
    return Boolean(
      this.configuracao.get("consumerKey", { infer: true }) && this.configuracao.get("consumerSecret", { infer: true }),
    );
  }

  async obter({ renovar = false } = {}): Promise<string> {
    if (!this.usaOAuth()) return this.configuracao.get("tokenFixo", { infer: true });
    if (!renovar && this.tokenAtual && Date.now() < this.tokenAtual.venceEm) return this.tokenAtual.token;

    const respostaToken = await this.pedirToken();
    if (!respostaToken.ok) {
      throw new ErroDeApi(
        502,
        "credenciais_serpro_recusadas",
        `O Serpro recusou as credenciais (HTTP ${respostaToken.status}).`,
      );
    }

    const dadosToken = (await respostaToken.json()) as RespostaDoToken;
    const segundosDeValidade = Number(dadosToken.expires_in || 3600);

    this.tokenAtual = {
      token: dadosToken.access_token,
      venceEm: Date.now() + Math.max(60, segundosDeValidade - 300) * 1000,
    };

    return this.tokenAtual.token;
  }

  esquecer(): void {
    this.tokenAtual = null;
  }

  private async pedirToken(): Promise<Response> {
    const chave = this.configuracao.get("consumerKey", { infer: true });
    const segredo = this.configuracao.get("consumerSecret", { infer: true });
    const credenciais = Buffer.from(`${chave}:${segredo}`).toString("base64");

    try {
      return await fetch(this.configuracao.get("urlToken", { infer: true }), {
        method: "POST",
        headers: {
          Authorization: `Basic ${credenciais}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "ChamaJa-API-CNH/0.3",
        },
        body: "grant_type=client_credentials",
        signal: AbortSignal.timeout(this.configuracao.get("tempoLimiteMs", { infer: true })),
      });
    } catch (erro) {
      throw erroDeConexao(erro);
    }
  }
}
