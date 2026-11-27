import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Configuracao } from "../configuracao/configuracao";
import { BrasilApiService, RespostaBrasilApi } from "./brasil-api.service";
import type { EmpresaDto } from "./dto/empresa.dto";

type DadosDaEmpresa = Omit<EmpresaDto, "origem">;

interface EmpresaGuardada {
  salvaEm: number;
  empresa: DadosDaEmpresa;
}

export function converterParaEmpresa(dados: RespostaBrasilApi): DadosDaEmpresa {
  const situacao = dados.descricao_situacao_cadastral ? String(dados.descricao_situacao_cadastral).toUpperCase() : null;

  return {
    cnpj: dados.cnpj ?? null,
    razaoSocial: dados.razao_social || null,
    nomeFantasia: dados.nome_fantasia || null,
    situacao,
    ativa: situacao === "ATIVA",
    mei: Boolean(dados.opcao_pelo_mei),
    dataAbertura: dados.data_inicio_atividade || null,
    atividadePrincipal: dados.cnae_fiscal_descricao || null,
    municipio: dados.municipio || null,
    uf: dados.uf || null,
    consultadoEm: new Date().toISOString(),
  };
}

@Injectable()
export class CnpjService {
  private readonly empresasConsultadas = new Map<string, EmpresaGuardada>();

  constructor(
    private readonly brasilApi: BrasilApiService,
    private readonly configuracao: ConfigService<Configuracao, true>,
  ) {}

  async consultar(cnpj: string): Promise<EmpresaDto> {
    const emCache = this.empresasConsultadas.get(cnpj);
    if (emCache && Date.now() - emCache.salvaEm < this.validadeDoCacheMs()) {
      return { ...emCache.empresa, origem: "cache" };
    }

    const empresa = converterParaEmpresa(await this.brasilApi.buscarEmpresa(cnpj));
    this.empresasConsultadas.set(cnpj, { salvaEm: Date.now(), empresa });
    return { ...empresa, origem: "provedor" };
  }

  private validadeDoCacheMs(): number {
    return this.configuracao.get("minutosDeCache", { infer: true }) * 60 * 1000;
  }
}
