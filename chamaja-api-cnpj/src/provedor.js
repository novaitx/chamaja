// Conversa com o provedor de CNPJ (hoje a BrasilAPI, para testes).
// Para trocar de provedor no futuro, só este arquivo muda.

// Erro "conhecido": já sabe qual status HTTP e qual código devolver para o app.
export class ErroConsulta extends Error {
  constructor(status, codigo, mensagem) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
  }
}

// Busca o CNPJ no provedor e devolve a resposta dele, sem mexer.
export async function buscarNoProvedor(cnpj) {
  const url = process.env.CNPJ_PROVEDOR_URL || "https://brasilapi.com.br/api/cnpj/v1";
  const tempoLimite = Number(process.env.CNPJ_TEMPO_LIMITE_MS || 8000);

  let resposta;
  try {
    resposta = await fetch(`${url}/${cnpj}`, {
            headers: { Accept: "application/json", "User-Agent": "ChamaJa-API-CNPJ/0.2" },
      signal: AbortSignal.timeout(tempoLimite),
    });
  } catch (e) {
    if (e?.name === "TimeoutError") {
      throw new ErroConsulta(504, "provedor_demorou", "O provedor de CNPJ demorou para responder.");
    }
    throw new ErroConsulta(504, "provedor_inacessivel", "Não foi possível falar com o provedor de CNPJ.");
  }

  if (resposta.status === 404) {
    throw new ErroConsulta(404, "cnpj_nao_encontrado", "CNPJ não encontrado na Receita Federal.");
  }
  if (resposta.status === 429) {
    throw new ErroConsulta(429, "limite_do_provedor", "Muitas consultas seguidas. Tente de novo em instantes.");
  }
  if (!resposta.ok) {
    throw new ErroConsulta(502, "erro_no_provedor", `O provedor respondeu com erro ${resposta.status}.`);
  }

  // Se o provedor mandar algo que não é JSON, o erro sobe e a API devolve 500 erro_interno.
  return await resposta.json();
}

// Traduz a resposta da BrasilAPI para os campos que o ChamaJá usa.
export function paraFormatoChamaJa(d) {
  const situacao = d.descricao_situacao_cadastral ? String(d.descricao_situacao_cadastral).toUpperCase() : null;
  return {
    cnpj: d.cnpj ?? null,
    razaoSocial: d.razao_social || null,
    nomeFantasia: d.nome_fantasia || null,
    situacao,
    ativa: situacao === "ATIVA",
    mei: Boolean(d.opcao_pelo_mei),
    dataAbertura: d.data_inicio_atividade || null,
    atividadePrincipal: d.cnae_fiscal_descricao || null,
    municipio: d.municipio || null,
    uf: d.uf || null,
    consultadoEm: new Date().toISOString(),
  };
}
