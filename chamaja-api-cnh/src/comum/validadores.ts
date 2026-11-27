import { ValidationOptions, registerDecorator } from "class-validator";
import { cpfValido, dataValida } from "./documentos";

export function EhCpf(opcoes?: ValidationOptions) {
  return (alvo: object, propriedade: string) =>
    registerDecorator({
      name: "ehCpf",
      target: alvo.constructor,
      propertyName: propriedade,
      options: { message: "CPF inválido.", ...opcoes },
      validator: { validate: (valor: unknown) => cpfValido(valor) },
    });
}

export function EhData(opcoes?: ValidationOptions) {
  return (alvo: object, propriedade: string) =>
    registerDecorator({
      name: "ehData",
      target: alvo.constructor,
      propertyName: propriedade,
      options: { message: "Use a data no formato AAAA-MM-DD.", ...opcoes },
      validator: { validate: (valor: unknown) => dataValida(valor) },
    });
}
