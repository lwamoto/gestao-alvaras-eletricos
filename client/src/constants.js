export const TIPOS = [
  { valor: 'POO', cor: 'roxo' },
  { valor: 'CONSUMIDOR', cor: 'preto' },
  { valor: 'PARTICULAR', cor: 'vermelho' },
];

export const EMPREITEIRAS = [
  'AVANTI',
  'CONSTRUCEL',
  'CONTEL',
  'ELENG',
  'ENERGY',
  'ELETROCHESKI',
  'JB',
  'PROENG',
  'FELTRIN',
];

export const NATUREZAS_SERVICOS = [
  { valor: '5', label: '5', descricao: 'Substituição/lançamento de postes de energia elétrica' },
  { valor: '9', label: '9', descricao: 'Lançamento de cabos aéreos de energia elétrica' },
  { valor: '290', label: '290', descricao: 'Substituição/troca de cabos aéreos de energia elétrica' },
  { valor: 'Z', label: 'Z', descricao: 'Lançamento/substituição de cabos de rede subterrânea' },
];

export function corFixaDoTipo(tipo) {
  return TIPOS.find((t) => t.valor === tipo)?.cor || 'preto';
}
