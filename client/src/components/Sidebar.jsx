import { EMPREITEIRAS } from '../constants.js';

export default function Sidebar({ view, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">SCA</div>
      <nav className="sidebar-nav">
        <button
          className={view === 'cadastrar' ? 'ativo' : ''}
          onClick={() => onNavigate('cadastrar')}
        >
          CADASTRAR
          <br />
          ALVARÁ
        </button>
        <button
          className={view === 'pesquisar' ? 'ativo' : ''}
          onClick={() => onNavigate('pesquisar')}
        >
          PESQUISAR
          <br />
          ALVARÁ
        </button>
      </nav>
      <div className="sidebar-empreiteiras">
        <span className="sidebar-empreiteiras-titulo">EMPREITEIRAS</span>
        <ul>
          {EMPREITEIRAS.map((emp) => (
            <li key={emp}>{emp}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
