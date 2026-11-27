import { ValidationPipe } from "@nestjs/common";
import { pedidoExemplo } from "../../../test/exemplos-serpro";
import { ErroDeApi } from "../../comum/erro-de-api";
import { erroDeDadosInvalidos } from "../../comum/problemas";
import { ValidarCnhDto } from "./validar-cnh.dto";

const pipe = new ValidationPipe({ whitelist: true, transform: true, exceptionFactory: erroDeDadosInvalidos });

const validar = (corpo: unknown) =>
  pipe.transform(corpo, { type: "body", metatype: ValidarCnhDto }) as Promise<ValidarCnhDto>;

async function camposComProblema(corpo: unknown): Promise<string[]> {
  try {
    await validar(corpo);
    return [];
  } catch (erro) {
    expect(erro).toBeInstanceOf(ErroDeApi);
    const resposta = (erro as ErroDeApi).getResponse() as { problemas: Array<{ campo: string }> };
    return resposta.problemas.map((problema) => problema.campo);
  }
}

describe("ValidarCnhDto", () => {
  it("pedido correto passa e sai limpo (CPF sem pontuação, categoria maiúscula, nome sem espaços)", async () => {
    const dados = await validar({
      ...pedidoExemplo,
      nome: `  ${pedidoExemplo.nome} `,
      cnh: { ...pedidoExemplo.cnh, categoria: "b" },
    });

    expect(dados).toBeInstanceOf(ValidarCnhDto);
    expect(dados.cpf).toBe("25774435016");
    expect(dados.nome).toBe("Manuela Elisa da Mota");
    expect(dados.cnh.categoria).toBe("B");
  });

  it("descarta campos que não fazem parte do pedido", async () => {
    const dados = await validar({ ...pedidoExemplo, senha: "x" });
    expect(dados).not.toHaveProperty("senha");
  });

  it("pedido vazio aponta todos os campos obrigatórios", async () => {
    expect(await camposComProblema({})).toEqual(["cpf", "nome", "dataNascimento", "cnh"]);
  });

  it("aponta o campo de dentro da CNH com o caminho completo", async () => {
    const campos = await camposComProblema({
      ...pedidoExemplo,
      cnh: { ...pedidoExemplo.cnh, categoria: "Z", dataPrimeiraHabilitacao: "ontem" },
    });

    expect(campos).toEqual(["cnh.categoria", "cnh.dataPrimeiraHabilitacao"]);
  });

  it("primeira habilitação é opcional", async () => {
    const { dataPrimeiraHabilitacao, ...cnhSemPrimeiraHabilitacao } = pedidoExemplo.cnh;
    expect(dataPrimeiraHabilitacao).toBeDefined();
    expect(await camposComProblema({ ...pedidoExemplo, cnh: cnhSemPrimeiraHabilitacao })).toEqual([]);
  });
});
