import { corFixaDoTipo } from './constants.js';

export function corDoAlvara(alvara) {
  if (alvara.prioridade && alvara.situacao !== 'RECEBIDO') return 'vermelho';
  if (alvara.situacao === 'ENVIADO' || alvara.situacao === 'RECEBIDO') return 'verde';
  return null;
}

export function corDoTipo(alvara) {
  return corDoAlvara(alvara) || corFixaDoTipo(alvara.tipo);
}

export function corDoNumero(alvara) {
  return corDoAlvara(alvara) || 'preto';
}
