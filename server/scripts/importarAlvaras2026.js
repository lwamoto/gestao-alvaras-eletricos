// Importação em lote dos alvarás reais (AVANTI/CONSTRUCEL/ELETROCHESKI/ENERGY)
// repassados pelo usuário em 2026-09-18. Roda uma vez; é seguro rodar de novo
// porque pula qualquer numeroProjeto que já exista.
// Uso: node scripts/importarAlvaras2026.js
import 'dotenv/config';
import mongoose from 'mongoose';
import Alvara from '../src/models/Alvara.js';
import Usuario from '../src/models/Usuario.js';
import HistoricoAlvara from '../src/models/HistoricoAlvara.js';

function parseData(str) {
  if (!str) return undefined;
  const [d, m, yRaw] = str.split('/');
  const ano = yRaw.length === 2 ? 2000 + parseInt(yRaw, 10) : parseInt(yRaw, 10);
  return new Date(Date.UTC(ano, parseInt(m, 10) - 1, parseInt(d, 10)));
}

function formatarProtocolo(valor) {
  const limpo = String(valor || '').trim();
  if (!limpo) return '';
  if (/^\d{2}\./.test(limpo)) return limpo;
  return `01.${limpo}`;
}

// [numeroProjeto, empreiteira, situacao, dataMarcada, dataRecebimentoAlvara, numeroAlvara, protocolo]
const REGISTROS = [
  ['1723865', 'AVANTI', 'RECEBIDO', '06/07/26', '03/08/2026', '2026/0017734', ''],
  ['1724317', 'AVANTI', 'RECEBIDO', '06/07/26', '03/08/2026', '2026/0017737', ''],
  ['1731805', 'AVANTI', 'RECEBIDO', '06/07/26', '03/08/2026', '2026/0017856', ''],
  ['1737330', 'AVANTI', 'ENVIADO', '09/09/2026', '', '', ''],
  ['1729373', 'CONSTRUCEL', 'RECEBIDO', '08/07/26', '04/08/2026', '2026/0017835', ''],
  ['1733230/1733231', 'CONSTRUCEL', 'RECEBIDO', '03/08/2026', '05/08/2026', '2026/0018615', ''],
  ['1732418/1732419', 'CONSTRUCEL', 'RECEBIDO', '03/08/2026', '05/08/2026', '2026/0018614', ''],
  ['1732627', 'CONSTRUCEL', 'RECEBIDO', '18/08/2026', '24/08/2026', '2026/0019737', ''],
  ['1735077', 'CONSTRUCEL', 'RECEBIDO', '18/08/2026', '19/08/2026', '2026/0019750', ''],
  ['1734921', 'CONSTRUCEL', 'RECEBIDO', '20/08/2026', '02/09/2026', '2026/0021186', ''],
  ['1714028', 'CONSTRUCEL', 'RECEBIDO', '21/08/2026', '02/09/2026', '2026/0021164', ''],
  ['1732990', 'CONSTRUCEL', 'RECEBIDO', '21/08/2026', '02/09/2026', '2026/0021168', ''],
  ['1742068I', 'CONSTRUCEL', 'RECEBIDO', '25/08/2026', '02/09/2026', '2026/0021233', ''],
  ['1734909', 'CONSTRUCEL', 'RECEBIDO', '25/08/2026', '02/09/2026', '2026/0021180', ''],
  ['1741252', 'CONSTRUCEL', 'A_FAZER', '18/09/2026', '', '', '20265390528222'],
  ['1736956-1737144', 'ELETROCHESKI', 'ENVIADO', '14/09/2026', '', '', ''],
  ['1733888', 'ELETROCHESKI', 'RECEBIDO', '28/08/2026', '14/09/26', '2026/0021766', '20264963122510'],
  ['1738790', 'ELETROCHESKI', 'RECEBIDO', '28/08/2026', '14/09/26', '2026/0021771', '20265227993228'],
  ['1720974', 'ELETROCHESKI', 'RECEBIDO', '04/08/26', '07/08/2026', '2026/0015935', ''],
  ['1721614', 'ELETROCHESKI', 'RECEBIDO', '28/07/26', '05/08/2026', '2026/0018628', ''],
  ['1725309', 'ELETROCHESKI', 'RECEBIDO', '04/08/26', '29/07/2026', '2026/0015924', ''],
  ['1726987', 'ELETROCHESKI', 'RECEBIDO', '29/07/26', '03/08/2026', '2026/0018621', ''],
  ['1727679/1728004', 'ELETROCHESKI', 'RECEBIDO', '03/07/26', '03/08/2026', '2026/0015901', ''],
  ['1728445I', 'ELETROCHESKI', 'RECEBIDO', '29/07/26', '03/08/2026', '2026/0018620', ''],
  ['1726986', 'ELETROCHESKI', 'RECEBIDO', '04/08/26', '03/08/2026', '2026/0018708', ''],
  ['1741575/1741973', 'ELETROCHESKI', 'ENVIADO', '09/09/2026', '', '', ''],
  ['1460141I', 'ENERGY', 'RECEBIDO', '04/08/26', '24/08/2026', '2026/0018704', ''],
  ['1727688', 'ENERGY', 'RECEBIDO', '01/08/26', '04/08/26', '2026/0015897', ''],
  ['1642539', 'ENERGY', 'RECEBIDO', '18/08/2026', '02/09/2026', '2026/0021732', ''],
  ['1729717', 'ENERGY', 'RECEBIDO', '18/08/2026', '24/08/26', '2026/0019743', ''],
  ['1736931', 'ENERGY', 'RECEBIDO', '18/08/2026', '24/08/26', '2026/0019753', ''],
  ['1581907', 'ENERGY', 'RECEBIDO', '16/08/26', '14/09/26', '2026/0021726', '20265444968738'],
  ['1739541', 'ENERGY', 'RECEBIDO', '31/08/26', '14/09/26', '2026/0021773', '20265251500959'],
  ['1739222', 'ENERGY', 'RECEBIDO', '02/08/26', '14/09/26', '2026/0021772', '20265285655387'],
  ['1735513', 'ENERGY', 'ENVIADO', '18/09/26', '', '', '20265687383394'],
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const usuarioCopel = await Usuario.findOne({ tipo: 'COPEL' }).sort({ createdAt: 1 });
  if (!usuarioCopel) {
    console.error('Nenhum usuário COPEL encontrado — crie um antes de importar.');
    await mongoose.disconnect();
    process.exit(1);
  }

  let criados = 0;
  let pulados = 0;

  for (const [numeroProjeto, empreiteira, situacao, dataMarcada, dataRecebimento, numeroAlvara, protocoloRaw] of REGISTROS) {
    const existente = await Alvara.findOne({ numeroProjeto });
    if (existente) {
      console.log(`Pulado (já existe): ${numeroProjeto}`);
      pulados++;
      continue;
    }

    const alvara = await Alvara.create({
      incluidoPor: 'IMPORTAÇÃO EM LOTE',
      numeroProjeto,
      tipo: 'PARTICULAR',
      empreiteira,
      situacao,
      dataMarcada: parseData(dataMarcada),
      dataRecebimentoAlvara: parseData(dataRecebimento),
      numeroAlvara: numeroAlvara || '',
      protocolo: formatarProtocolo(protocoloRaw),
    });

    await HistoricoAlvara.create({
      alvaraId: alvara._id,
      numeroProjeto: alvara.numeroProjeto,
      acao: 'criado',
      usuarioId: usuarioCopel._id,
      usuarioNome: usuarioCopel.nome,
      alteracoes: { origem: 'Importação em lote 2026-09-18' },
    });

    console.log(`Criado: ${numeroProjeto} (${empreiteira}, ${situacao})`);
    criados++;
  }

  console.log(`\nConcluído — ${criados} criado(s), ${pulados} pulado(s) (já existiam).`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro na importação:', err.message);
  process.exit(1);
});
