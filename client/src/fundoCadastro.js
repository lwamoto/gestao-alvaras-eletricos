import fundo1 from './assets/curitiba-bg-1.jpg';
import fundo2 from './assets/curitiba-bg-2.jpg';
import fundo3 from './assets/curitiba-bg-3.jpg';

export const FUNDOS_CADASTRO = [fundo1, fundo2, fundo3];

const JANELA_MS = 6 * 60 * 60 * 1000; // troca a cada 6 horas

export function indiceFundoAtual() {
  return Math.floor(Date.now() / JANELA_MS) % FUNDOS_CADASTRO.length;
}
