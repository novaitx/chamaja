import type { RegrasDeAprovacao } from "../configuracao/configuracao";
import type { PedidoDeValidacao, RespostaDatavalid } from "../serpro/tipos-datavalid";
import type { ConferenciasDto } from "./dto/resultado-validacao.dto";

export interface ResultadoDaAnalise {
  aprovada: boolean;
  motivos: string[];
  conferencias: ConferenciasDto;
}

const dataDeHoje = () => new Date().toISOString().slice(0, 10);
const numeroOuNulo = (valor: unknown) => (typeof valor === "number" ? valor : null);

function lerConferencias(resposta: RespostaDatavalid, pedido: PedidoDeValidacao): ConferenciasDto {
  const rfb = resposta.rfb ?? {};
  const cnh = resposta.cnh ?? {};

  return {
    cpfEncontrado: resposta.rfb_existe === true,
    cnhEncontrada: resposta.cnh_existe === true,
    cpfRegular: rfb.situacao_cpf === true,
    nome: numeroOuNulo(cnh.nome_similaridade),
    dataNascimento: cnh.data_nascimento === true,
    numeroRegistro: cnh.numero_registro === true,
    categoria: cnh.categoria === true,
    dataValidade: cnh.data_validade === true,
    dataPrimeiraHabilitacao: pedido.cnh.dataPrimeiraHabilitacao ? cnh.data_primeira_habilitacao === true : null,
    cnhEmitida: cnh.situacao === true,
    semImpedimento: cnh.possui_impedimento === true,
    ear: numeroOuNulo(cnh.observacoes_similaridade),
  };
}

export function decidir(
  resposta: RespostaDatavalid | null | undefined,
  pedido: PedidoDeValidacao,
  regras: RegrasDeAprovacao,
  hoje: string = dataDeHoje(),
): ResultadoDaAnalise {
  const conferencias = lerConferencias(resposta ?? {}, pedido);
  const motivos: string[] = [];

  if (!conferencias.cpfEncontrado) motivos.push("CPF não encontrado na Receita Federal");
  else if (!conferencias.cpfRegular) motivos.push("CPF não está regular na Receita Federal");

  if (!conferencias.cnhEncontrada) {
    motivos.push("CNH não encontrada para este CPF");
  } else {
    if ((conferencias.nome ?? 0) < regras.nomeMinimo) motivos.push("Nome não confere com a CNH");
    if (!conferencias.dataNascimento) motivos.push("Data de nascimento não confere com a CNH");
    if (!conferencias.numeroRegistro) motivos.push("Número de registro da CNH não confere");
    if (!conferencias.categoria) motivos.push("Categoria da CNH não confere");
    if (!conferencias.dataValidade) motivos.push("Data de validade da CNH não confere");
    if (conferencias.dataPrimeiraHabilitacao === false) motivos.push("Data da primeira habilitação não confere");
    if (!conferencias.cnhEmitida) motivos.push("CNH não está emitida (pode estar suspensa, cassada ou cancelada)");
    if (!conferencias.semImpedimento) motivos.push("CNH com impedimento");
    if (regras.exigirEar && (conferencias.ear ?? 0) < regras.earMinimo) {
      motivos.push("CNH sem EAR (Exerce Atividade Remunerada)");
    }
  }

  if (pedido.cnh.dataValidade < hoje) motivos.push("CNH vencida");
  if (!regras.categoriasCarro.includes(pedido.cnh.categoria)) motivos.push("Categoria não permite dirigir carro");

  return { aprovada: motivos.length === 0, motivos, conferencias };
}
