import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ErroDeApi } from "../comum/erro-de-api";
import { mascararCpf } from "../comum/documentos";
import type { Configuracao } from "../configuracao/configuracao";
import { DatavalidService } from "../serpro/datavalid.service";
import type { ResultadoValidacaoDto } from "./dto/resultado-validacao.dto";
import type { ValidarCnhDto } from "./dto/validar-cnh.dto";
import { decidir } from "./regras-de-aprovacao";

@Injectable()
export class CnhService {
  private readonly logger = new Logger("ConsultasCnh");

  constructor(
    private readonly datavalid: DatavalidService,
    private readonly configuracao: ConfigService<Configuracao, true>,
  ) {}

  async validar(pedido: ValidarCnhDto): Promise<ResultadoValidacaoDto> {
    const cpfMascarado = mascararCpf(pedido.cpf);

    try {
      const respostaSerpro = await this.datavalid.validar(pedido);
      const resultado = decidir(respostaSerpro, pedido, this.configuracao.get("regras", { infer: true }));

      this.registrar({ cpf: cpfMascarado, aprovada: resultado.aprovada, motivos: resultado.motivos });

      return {
        ...resultado,
        modo: this.configuracao.get("modo", { infer: true }),
        consultadoEm: new Date().toISOString(),
      };
    } catch (erro) {
      this.registrar({ cpf: cpfMascarado, erro: erro instanceof ErroDeApi ? erro.codigo : "erro_interno" });
      throw erro;
    }
  }

  private registrar(evento: Record<string, unknown>) {
    this.logger.log(JSON.stringify({ finalidade: "cadastro_motorista", ...evento }));
  }
}
