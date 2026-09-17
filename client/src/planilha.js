// Regras de formatação numérica da Planilha de Alvará: sempre ponto decimal
// (nunca vírgula) e no mínimo 1 casa depois do ponto — "7" vira "7.0".
export function formatarNumeroPlanilha(valor) {
  const n = parseFloat(String(valor).replace(',', '.'));
  if (!Number.isFinite(n)) return '0.0';
  let str = (Math.round(n * 100) / 100).toFixed(2);
  if (str.endsWith('0')) str = str.slice(0, -1);
  return str;
}

// Largura e área não são digitadas — derivam da natureza do serviço:
// postes (natureza 5) sempre 1.0x1.0; cabos (9/290/Z) largura fixa em 0.1 e
// área = extensão(m) × 0.1, arredondada pro múltiplo de 0.05 mais próximo.
export function calcularLarguraArea(naturezaServico, qtdExtensao) {
  if (naturezaServico === '5') {
    return { larguraM: 1, areaM2: 1 };
  }
  const qtd = parseFloat(String(qtdExtensao).replace(',', '.')) || 0;
  const areaBruta = qtd * 0.1;
  const areaM2 = Math.round(areaBruta / 0.05) * 0.05;
  return { larguraM: 0.1, areaM2 };
}
