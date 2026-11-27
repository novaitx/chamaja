import { pedidoExemplo, respostaCom, respostaTudoConfere } from "../../test/exemplos-serpro";
import type { RegrasDeAprovacao } from "../configuracao/configuracao";
import type { PedidoDeValidacao, RespostaDatavalid } from "../serpro/tipos-datavalid";
import { decidir } from "./regras-de-aprovacao";

const regras: RegrasDeAprovacao = {
  nomeMinimo: 0.85,
  earMinimo: 0.8,
  exigirEar: true,
  categoriasCarro: ["B", "AB", "C", "D", "E"],
};
const HOJE = "2026-11-23";
const pedido: PedidoDeValidacao = pedidoExemplo;

const pedidoCom = (mudancasNaCnh: Partial<PedidoDeValidacao["cnh"]>): PedidoDeValidacao => ({
  ...pedidoExemplo,
  cnh: { ...pedidoExemplo.cnh, ...mudancasNaCnh },
});

const motivosDe = (resposta: RespostaDatavalid, outroPedido = pedido) =>
  decidir(resposta, outroPedido, regras, HOJE).motivos;

describe("regras de aprovação (LM09)", () => {
  it("tudo confere: aprovada, sem motivos", () => {
    const resultado = decidir(respostaTudoConfere, pedido, regras, HOJE);
    expect(resultado.aprovada).toBe(true);
    expect(resultado.motivos).toEqual([]);
    expect(resultado.conferencias.semImpedimento).toBe(true);
    expect(resultado.conferencias.ear).toBe(1);
  });

  const casosDeReprovacao: Array<[Record<string, unknown>, string]> = [
    [{ rfb_existe: false }, "CPF não encontrado na Receita Federal"],
    [{ "rfb.situacao_cpf": false }, "CPF não está regular na Receita Federal"],
    [{ cnh_existe: false }, "CNH não encontrada para este CPF"],
    [{ "cnh.nome_similaridade": 0.6 }, "Nome não confere com a CNH"],
    [{ "cnh.data_nascimento": false }, "Data de nascimento não confere com a CNH"],
    [{ "cnh.numero_registro": false }, "Número de registro da CNH não confere"],
    [{ "cnh.categoria": false }, "Categoria da CNH não confere"],
    [{ "cnh.data_validade": false }, "Data de validade da CNH não confere"],
    [{ "cnh.data_primeira_habilitacao": false }, "Data da primeira habilitação não confere"],
    [{ "cnh.situacao": false }, "CNH não está emitida (pode estar suspensa, cassada ou cancelada)"],
    [{ "cnh.possui_impedimento": false }, "CNH com impedimento"],
    [{ "cnh.observacoes_similaridade": 0.2 }, "CNH sem EAR (Exerce Atividade Remunerada)"],
  ];

  it.each(casosDeReprovacao)("reprova quando o Serpro responde %j", (mudanca, motivoEsperado) => {
    expect(motivosDe(respostaCom(mudanca))).toEqual([motivoEsperado]);
  });

  it("nome com semelhança no limite (0,85) passa", () => {
    expect(motivosDe(respostaCom({ "cnh.nome_similaridade": 0.85 }))).toEqual([]);
  });

  it("CNH vencida reprova, mesmo com o Serpro confirmando os dados", () => {
    expect(motivosDe(respostaTudoConfere, pedidoCom({ dataValidade: "2025-04-03" }))).toEqual(["CNH vencida"]);
  });

  it("categoria A (só moto) reprova para carro", () => {
    expect(motivosDe(respostaTudoConfere, pedidoCom({ categoria: "A" }))).toEqual([
      "Categoria não permite dirigir carro",
    ]);
  });

  it("sem exigir EAR, a falta de EAR não reprova", () => {
    const resultado = decidir(
      respostaCom({ "cnh.observacoes_similaridade": 0 }),
      pedido,
      { ...regras, exigirEar: false },
      HOJE,
    );
    expect(resultado.aprovada).toBe(true);
  });

  it("primeira habilitação não enviada fica como null e não reprova", () => {
    const semPrimeiraHabilitacao = pedidoCom({ dataPrimeiraHabilitacao: undefined });
    const resultado = decidir(
      respostaCom({ "cnh.data_primeira_habilitacao": undefined }),
      semPrimeiraHabilitacao,
      regras,
      HOJE,
    );
    expect(resultado.conferencias.dataPrimeiraHabilitacao).toBe(null);
    expect(resultado.aprovada).toBe(true);
  });

  it("resposta vazia do Serpro reprova com segurança", () => {
    expect(motivosDe({})).toEqual(["CPF não encontrado na Receita Federal", "CNH não encontrada para este CPF"]);
  });
});
