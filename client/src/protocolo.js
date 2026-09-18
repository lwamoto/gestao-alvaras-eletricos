// Protocolo da empreiteira segue o padrão "01.<código>" — se digitarem só o
// código, assume o prefixo "01."; se já digitarem outro prefixo (ex "02."),
// respeita o que a pessoa escreveu.
export function formatarProtocolo(valor) {
  const limpo = String(valor || '').trim();
  if (!limpo) return '';
  if (/^\d{2}\./.test(limpo)) return limpo;
  return `01.${limpo}`;
}
