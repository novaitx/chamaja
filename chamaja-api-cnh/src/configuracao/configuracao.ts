export type ModoDeOperacao = "demonstracao" | "producao";

export interface RegrasDeAprovacao {
  nomeMinimo: number;
  earMinimo: number;
  exigirEar: boolean;
  categoriasCarro: string[];
}

export interface Configuracao {
  porta: number;
  modo: ModoDeOperacao;
  urlBase: string;
  tempoLimiteMs: number;
  tokenFixo: string;
  consumerKey: string;
  consumerSecret: string;
  urlToken: string;
  idTemplateRfb: string;
  tokenGcc: string;
  cnpjAnuente: string;
  regras: RegrasDeAprovacao;
}

type Ambiente = Record<string, string | undefined>;

function lerLista(texto: string | undefined, padrao: string): string[] {
  return (texto || padrao)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function lerConfiguracao(env: Ambiente = process.env): Configuracao {
  return {
    porta: Number(env.PORT || 3000),
    modo: env.SERPRO_MODO === "producao" ? "producao" : "demonstracao",
    urlBase: env.SERPRO_URL || "",
    tempoLimiteMs: Number(env.SERPRO_TEMPO_LIMITE_MS || 15000),
    tokenFixo: env.SERPRO_TOKEN || "",
    consumerKey: env.SERPRO_CONSUMER_KEY || "",
    consumerSecret: env.SERPRO_CONSUMER_SECRET || "",
    urlToken: env.SERPRO_URL_TOKEN || "https://gateway.apiserpro.serpro.gov.br/token",
    idTemplateRfb: env.RFB_ID_TEMPLATE || "",
    tokenGcc: env.GCC_TOKEN || "",
    cnpjAnuente: env.SENATRAN_CNPJ_ANUENTE || "",
    regras: {
      nomeMinimo: Number(env.REGRA_NOME_MINIMO || 0.85),
      earMinimo: Number(env.REGRA_EAR_MINIMO || 0.8),
      exigirEar: (env.REGRA_EXIGIR_EAR || "sim") === "sim",
      categoriasCarro: lerLista(env.REGRA_CATEGORIAS_CARRO, "B,AB,C,AC,D,AD,E,AE"),
    },
  };
}

export function variaveisFaltando(configuracao: Configuracao): string[] {
  const faltando: string[] = [];

  if (!configuracao.urlBase) faltando.push("SERPRO_URL");
  if (!configuracao.idTemplateRfb) faltando.push("RFB_ID_TEMPLATE");
  if (!configuracao.cnpjAnuente) faltando.push("SENATRAN_CNPJ_ANUENTE");

  const temOAuth = Boolean(configuracao.consumerKey && configuracao.consumerSecret);

  if (configuracao.modo === "producao") {
    if (!temOAuth) faltando.push("SERPRO_CONSUMER_KEY e SERPRO_CONSUMER_SECRET");
  } else {
    if (!configuracao.tokenFixo && !temOAuth) faltando.push("SERPRO_TOKEN");
    if (!configuracao.tokenGcc) faltando.push("GCC_TOKEN");
  }

  return faltando;
}

export function validarAmbiente(env: Ambiente): Ambiente {
  const faltando = variaveisFaltando(lerConfiguracao(env));

  if (faltando.length) {
    throw new Error(`Configuração incompleta. Defina no ambiente: ${faltando.join(", ")}.`);
  }

  return env;
}
