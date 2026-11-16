// Regras do CNPJ: limpar, validar e formatar.
// Vale para o CNPJ numérico e para o alfanumérico (novas inscrições desde julho de 2026):
// as 12 primeiras posições podem ter letras; os 2 dígitos verificadores são sempre números.

// Tira pontos, barra, hífen e espaços, e deixa as letras maiúsculas.
export function limparCnpj(valor) {
  return String(valor ?? "").replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
}

// Valor de cada caractere no cálculo: o código ASCII menos 48.
// Assim "0" a "9" valem 0 a 9, e "A" vale 17, "B" vale 18, e assim por diante (regra da Receita).
function valor(caractere) {
  return caractere.charCodeAt(0) - 48;
}

// Calcula um dígito verificador pelo módulo 11, com os pesos de 2 a 9 da direita para a esquerda.
function digito(base) {
  let soma = 0;
  let peso = 2;
  for (let i = base.length - 1; i >= 0; i--) {
    soma += valor(base[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

// Confere formato e dígitos verificadores.
export function cnpjValido(entrada) {
  const cnpj = limparCnpj(entrada);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(cnpj)) return false;
  if (/^(.)\1{13}$/.test(cnpj)) return false; // 11111111111111 e parecidos
  const base = cnpj.slice(0, 12);
  const dv1 = digito(base);
  const dv2 = digito(base + dv1);
  return cnpj.endsWith(`${dv1}${dv2}`);
}

// Formata para exibir: 00.000.000/0001-91
export function formatarCnpj(entrada) {
  const c = limparCnpj(entrada);
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}
