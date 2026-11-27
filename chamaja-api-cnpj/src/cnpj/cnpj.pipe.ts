import { Injectable, PipeTransform } from "@nestjs/common";
import { ErroDeApi } from "../comum/erro-de-api";
import { cnpjValido, limparCnpj } from "./cnpj";

@Injectable()
export class CnpjPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    const cnpj = limparCnpj(valor);

    if (!cnpjValido(cnpj)) {
      throw new ErroDeApi(400, "cnpj_invalido", "CNPJ inválido. Confira os números e letras.");
    }

    return cnpj;
  }
}
