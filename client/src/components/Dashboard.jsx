import { useEffect, useState } from 'react';
import { AlertCircle, ClipboardList, Clock, Send, CheckCircle2, Ban } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { getEstatisticas } from '../api.js';
import { useTheme } from '../contexts/ThemeContext.jsx';

const CORES_SITUACAO = {
  A_FAZER: '#9ca3af',
  ENVIADO: '#2563eb',
  RECEBIDO: '#16a34a',
  NAO_NECESSARIO: '#0d9488',
};

const LABEL_SITUACAO = {
  A_FAZER: 'A Fazer',
  ENVIADO: 'Enviado',
  RECEBIDO: 'Recebido',
  NAO_NECESSARIO: 'Não necessário',
};

const cardCls = 'bg-white dark:bg-[#1e2127] border border-gray-200 dark:border-white/10 rounded-md shadow-sm p-5';

function CardResumo({ icon: Icon, label, valor, cor }) {
  return (
    <div className={cardCls}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: `${cor}1a`, color: cor }}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-2xl font-bold text-copel-grafite leading-none">{valor}</p>
          <p className="text-xs text-copel-cinza-medio mt-1">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ usuario }) {
  const { tema } = useTheme();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const corGrade = tema === 'escuro' ? '#333740' : '#f2f2f2';
  const corTick = tema === 'escuro' ? '#9a9ea8' : '#8a8a8a';
  const corTickForte = tema === 'escuro' ? '#e8e8e8' : '#222222';
  const estiloTooltip = tema === 'escuro'
    ? { backgroundColor: '#20232a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#e8e8e8' }
    : { backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 6, color: '#222222' };

  useEffect(() => {
    getEstatisticas()
      .then(setDados)
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-copel-laranja border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded text-sm">
        <AlertCircle size={16} />
        {erro || 'Não foi possível carregar as estatísticas.'}
      </div>
    );
  }

  const dadosPizza = Object.entries(dados.porSituacao)
    .filter(([, total]) => total > 0)
    .map(([situacao, total]) => ({ situacao, nome: LABEL_SITUACAO[situacao], total }));

  const semDados = dados.total === 0;

  return (
    <div>
      <div className="pb-6 mb-8 border-b border-gray-200 dark:border-white/10">
        <h1 className="text-xl font-semibold text-copel-grafite">Dashboard</h1>
        <p className="mt-1 text-sm text-copel-cinza-medio">
          {usuario?.tipo === 'EMPREITEIRA'
            ? `Panorama dos alvarás da ${usuario.empreiteira}.`
            : 'Panorama geral dos alvarás no sistema.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <CardResumo icon={ClipboardList} label="Total" valor={dados.total} cor="#222222" />
        <CardResumo icon={Clock} label="A Fazer" valor={dados.porSituacao.A_FAZER} cor={CORES_SITUACAO.A_FAZER} />
        <CardResumo icon={Send} label="Enviado" valor={dados.porSituacao.ENVIADO} cor={CORES_SITUACAO.ENVIADO} />
        <CardResumo icon={CheckCircle2} label="Recebido" valor={dados.porSituacao.RECEBIDO} cor={CORES_SITUACAO.RECEBIDO} />
      </div>

      {semDados ? (
        <div className={cardCls + ' text-center py-14'}>
          <Ban size={28} className="mx-auto text-gray-300 dark:text-white/15 mb-2" />
          <p className="text-sm text-copel-cinza-medio">Nenhum alvará cadastrado ainda pra gerar estatísticas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={cardCls}>
            <h2 className="text-sm font-semibold text-copel-grafite mb-4">Por situação</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  dataKey="total"
                  nameKey="nome"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {dadosPizza.map((item) => (
                    <Cell key={item.situacao} fill={CORES_SITUACAO[item.situacao]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={estiloTooltip} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: corTickForte }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={cardCls}>
            <h2 className="text-sm font-semibold text-copel-grafite mb-4">Por responsável</h2>
            {dados.porResponsavel.length === 0 ? (
              <p className="text-sm text-copel-cinza-medio py-16 text-center">Nenhum alvará com responsável atribuído.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dados.porResponsavel} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={corGrade} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: corTick }} />
                  <YAxis type="category" dataKey="nome" width={90} tick={{ fontSize: 12, fill: corTickForte }} />
                  <Tooltip contentStyle={estiloTooltip} />
                  <Bar dataKey="total" fill="#f58220" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {usuario?.tipo === 'COPEL' && (
            <div className={cardCls + ' lg:col-span-2'}>
              <h2 className="text-sm font-semibold text-copel-grafite mb-4">Por empreiteira</h2>
              {dados.porEmpreiteira.length === 0 ? (
                <p className="text-sm text-copel-cinza-medio py-16 text-center">Nenhum alvará PARTICULAR cadastrado ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dados.porEmpreiteira} margin={{ top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={corGrade} />
                    <XAxis dataKey="nome" tick={{ fontSize: 12, fill: corTickForte }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: corTick }} />
                    <Tooltip contentStyle={estiloTooltip} />
                    <Bar dataKey="total" fill="#f58220" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
