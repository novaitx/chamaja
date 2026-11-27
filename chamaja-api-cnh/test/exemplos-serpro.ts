import type { RespostaDatavalid } from "../src/serpro/tipos-datavalid";

export const pedidoExemplo = {
  cpf: "257.744.350-16",
  nome: "Manuela Elisa da Mota",
  dataNascimento: "1975-06-04",
  cnh: {
    numeroRegistro: "00000000",
    categoria: "B",
    dataValidade: "2099-04-03",
    dataPrimeiraHabilitacao: "2000-04-03",
  },
};

export const respostaTudoConfere: RespostaDatavalid = {
  rfb_existe: true,
  cnh_existe: true,
  rfb: {
    nome_similaridade: 1,
    nome_social_similaridade: 1,
    situacao_cpf: true,
    data_nascimento: true,
    data_inscricao_cpf: true,
  },
  cnh: {
    nome_similaridade: 1,
    data_nascimento: true,
    sexo: true,
    nacionalidade: true,
    nome_mae_similaridade: 1,
    nome_pai_similaridade: 1,
    tipo_documento_origem: true,
    numero_documento_origem_similaridade: 1,
    orgao_expedidor_documento_origem: true,
    uf_expedidor_documento_origem: true,
    numero_registro: true,
    categoria: true,
    situacao: true,
    registro_nacional_estrangeiro: true,
    data_primeira_habilitacao: true,
    data_ultima_emissao: true,
    data_validade: true,
    possui_impedimento: true,
    observacoes_similaridade: 1,
    endereco: {
      logradouro_similaridade: 1,
      numero_similaridade: 1,
      complemento_similaridade: 1,
      bairro_similaridade: 1,
      cep: true,
      municipio_similaridade: 1,
      uf: true,
    },
  },
};

export function respostaCom(mudancas: Record<string, unknown>): RespostaDatavalid {
  const resposta = structuredClone(respostaTudoConfere) as Record<string, any>;

  for (const [caminho, valor] of Object.entries(mudancas)) {
    const partes = caminho.split(".");
    const ultimaParte = partes.pop()!;
    let alvo = resposta;
    for (const parte of partes) alvo = alvo[parte];
    alvo[ultimaParte] = valor;
  }

  return resposta;
}
