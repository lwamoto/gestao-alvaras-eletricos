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

export function corFixaDoTipo(tipo) {
  return TIPOS.find((t) => t.valor === tipo)?.cor || 'preto';
}
