export const soDigitos = (texto: unknown): string => String(texto ?? "").replace(/\D/g, "");

function calcularDigitoCpf(base: string): number {
  let soma = 0;
  for (let posicao = 0; posicao < base.length; posicao++) {
    soma += Number(base[posicao]) * (base.length + 1 - posicao);
  }
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

export function cpfValido(texto: unknown): boolean {
  const cpf = soDigitos(texto);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const primeiroDigito = calcularDigitoCpf(cpf.slice(0, 9));
  const segundoDigito = calcularDigitoCpf(cpf.slice(0, 9) + primeiroDigito);

  return cpf.endsWith(`${primeiroDigito}${segundoDigito}`);
}

export function dataValida(texto: unknown): texto is string {
  if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const data = new Date(`${texto}T12:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === texto;
}

export function mascararCpf(cpf: unknown): string {
  const digitos = soDigitos(cpf);
  return digitos.length === 11 ? `***.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-**` : "***";
}
