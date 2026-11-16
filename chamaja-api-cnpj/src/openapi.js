// Documentação da API no padrão OpenAPI 3 (o "Swagger").
// É um "contrato": diz quais rotas existem, o que cada uma recebe e o que devolve.
// O Swagger UI lê este objeto e monta a página /docs, onde os devs testam a API pelo navegador.
// Regra de ouro: mudou uma rota ou um campo no código, muda aqui também.

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "ChamaJá · API de Consulta de CNPJ",
    version: "0.2.0",
    description:
      "Confere se um CNPJ é válido (numérico ou alfanumérico), consulta a Receita Federal por um provedor " +
      "e devolve os dados no formato do ChamaJá. As respostas ficam guardadas por 60 minutos (cache).\n\n" +
      "Provedor atual: BrasilAPI (gratuito, para testes). O provedor definitivo ainda será escolhido (MOB-81, integração 5).",
  },
  servers: [{ url: "/", description: "Este servidor" }],
  tags: [
    { name: "CNPJ", description: "Consulta de empresas" },
    { name: "Sistema", description: "Situação da API" },
  ],
  paths: {
    "/cnpj/{cnpj}": {
      get: {
        tags: ["CNPJ"],
        summary: "Consulta um CNPJ",
        description:
          "Aceita o CNPJ com ou sem pontuação. Se vier com barra, envie a barra como %2F. " +
          "Antes de consultar o provedor, a API confere os dígitos verificadores; CNPJ inválido volta 400 sem gastar consulta.",
        operationId: "consultarCnpj",
        parameters: [
          {
            name: "cnpj",
            in: "path",
            required: true,
            description: "CNPJ com 14 caracteres. As 12 primeiras posições podem ter letras (formato alfanumérico).",
            schema: { type: "string", example: "00000000000191" },
          },
        ],
        responses: {
          200: {
            description: "Empresa encontrada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Empresa" } } },
          },
          400: { $ref: "#/components/responses/CnpjInvalido" },
          404: { $ref: "#/components/responses/NaoEncontrado" },
          429: { $ref: "#/components/responses/LimiteDoProvedor" },
          500: { $ref: "#/components/responses/ErroInterno" },
          502: { $ref: "#/components/responses/ErroNoProvedor" },
          504: { $ref: "#/components/responses/ProvedorIndisponivel" },
        },
      },
    },
    "/saude": {
      get: {
        tags: ["Sistema"],
        summary: "Confere se a API está no ar",
        operationId: "saude",
        responses: {
          200: {
            description: "API no ar",
            content: {
              "application/json": {
                schema: { type: "object", properties: { ok: { type: "boolean", example: true } }, required: ["ok"] },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Empresa: {
        type: "object",
        required: ["cnpj", "ativa", "mei", "consultadoEm", "origem"],
        properties: {
          cnpj: { type: "string", description: "CNPJ sem pontuação", example: "00000000000191" },
          razaoSocial: { type: "string", nullable: true, example: "BANCO DO BRASIL SA" },
          nomeFantasia: { type: "string", nullable: true, example: "DIRECAO GERAL" },
          situacao: { type: "string", nullable: true, description: "Situação cadastral na Receita", example: "ATIVA" },
          ativa: { type: "boolean", description: "true quando a situação é ATIVA", example: true },
          mei: { type: "boolean", description: "Optante pelo MEI", example: false },
          dataAbertura: { type: "string", format: "date", nullable: true, example: "1966-08-01" },
          atividadePrincipal: { type: "string", nullable: true, example: "Bancos múltiplos, com carteira comercial" },
          municipio: { type: "string", nullable: true, example: "BRASILIA" },
          uf: { type: "string", nullable: true, example: "DF" },
          consultadoEm: { type: "string", format: "date-time", description: "Quando o provedor foi consultado", example: "2026-11-12T14:30:00.000Z" },
          origem: { type: "string", enum: ["provedor", "cache"], description: "provedor = consulta feita agora; cache = resposta guardada", example: "provedor" },
        },
      },
      Erro: {
        type: "object",
        required: ["erro", "mensagem"],
        properties: {
          erro: { type: "string", description: "Código fixo do erro, para o app decidir o que fazer" },
          mensagem: { type: "string", description: "Texto para mostrar ao usuário" },
        },
      },
    },
    responses: {
      CnpjInvalido: erro("CNPJ com formato ou dígito verificador errado", "cnpj_invalido", "CNPJ inválido. Confira os números e letras."),
      NaoEncontrado: erro("CNPJ válido, mas não existe na Receita", "cnpj_nao_encontrado", "CNPJ não encontrado na Receita Federal."),
      LimiteDoProvedor: erro("Muitas consultas seguidas", "limite_do_provedor", "Muitas consultas seguidas. Tente de novo em instantes."),
      ErroInterno: erro("Erro inesperado na API", "erro_interno", "Erro inesperado na API."),
      ErroNoProvedor: erro("O provedor respondeu com erro", "erro_no_provedor", "O provedor respondeu com erro 503."),
      ProvedorIndisponivel: erro(
        "O provedor não respondeu ou demorou mais de 8 segundos (erro: provedor_inacessivel ou provedor_demorou)",
        "provedor_demorou",
        "O provedor de CNPJ demorou para responder."
      ),
    },
  },
};

// Monta uma resposta de erro com exemplo, para não repetir o mesmo bloco seis vezes.
function erro(descricao, codigo, mensagem) {
  return {
    description: descricao,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Erro" },
        example: { erro: codigo, mensagem },
      },
    },
  };
}
