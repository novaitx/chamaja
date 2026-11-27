export interface TokenGcc {
  token: string;
  cnpjAnuente: string;
}

export interface RespostaDatavalid {
  rfb_existe?: boolean;
  cnh_existe?: boolean;
  rfb?: {
    situacao_cpf?: boolean;
    [campo: string]: unknown;
  };
  cnh?: {
    nome_similaridade?: number;
    data_nascimento?: boolean;
    numero_registro?: boolean;
    categoria?: boolean;
    data_validade?: boolean;
    data_primeira_habilitacao?: boolean;
    situacao?: boolean;
    possui_impedimento?: boolean;
    observacoes_similaridade?: number;
    [campo: string]: unknown;
  };
}

export interface PedidoDeValidacao {
  cpf: string;
  nome: string;
  dataNascimento: string;
  cnh: {
    numeroRegistro: string;
    categoria: string;
    dataValidade: string;
    dataPrimeiraHabilitacao?: string;
  };
}
