const FORMATO_CNPJ = /^[0-9A-Z]{12}[0-9]{2}$/;
const TODOS_IGUAIS = /^(.)\1{13}$/;

export function limparCnpj(texto: unknown): string {
  return String(texto ?? "")
    .replace(/[^0-9a-zA-Z]/g, "")
    .toUpperCase();
}

function valorDoCaractere(caractere: string): number {
  return caractere.charCodeAt(0) - 48;
}

function calcularDigito(base: string): number {
  let soma = 0;
  let peso = 2;

  for (let posicao = base.length - 1; posicao >= 0; posicao--) {
    soma += valorDoCaractere(base[posicao]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }

  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cnpjValido(texto: unknown): boolean {
  const cnpj = limparCnpj(texto);
  if (!FORMATO_CNPJ.test(cnpj) || TODOS_IGUAIS.test(cnpj)) return false;

  const base = cnpj.slice(0, 12);
  const primeiroDigito = calcularDigito(base);
  const segundoDigito = calcularDigito(base + primeiroDigito);

  return cnpj.endsWith(`${primeiroDigito}${segundoDigito}`);
}

export function formatarCnpj(texto: unknown): string {
  const cnpj = limparCnpj(texto);
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
}
