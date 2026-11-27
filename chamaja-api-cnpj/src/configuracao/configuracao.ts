export interface Configuracao {
  porta: number;
  urlDoProvedor: string;
  tempoLimiteMs: number;
  minutosDeCache: number;
}

export function lerConfiguracao(): Configuracao {
  const env = process.env;

  return {
    porta: Number(env.PORT ?? 3000),
    urlDoProvedor: env.CNPJ_PROVEDOR_URL ?? "https://brasilapi.com.br/api/cnpj/v1",
    tempoLimiteMs: Number(env.CNPJ_TEMPO_LIMITE_MS ?? 8000),
    minutosDeCache: Number(env.CNPJ_CACHE_MINUTOS ?? 60),
  };
}
