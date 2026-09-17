import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function lerTemaSalvo() {
  try {
    const salvo = localStorage.getItem('sca:tema');
    return salvo === 'escuro' ? 'escuro' : 'claro';
  } catch {
    return 'claro';
  }
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(lerTemaSalvo);

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
    try {
      localStorage.setItem('sca:tema', tema);
    } catch {
      /* localStorage indisponível — só não persiste entre sessões */
    }
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTema((atual) => (atual === 'claro' ? 'escuro' : 'claro'));
  }, []);

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) throw new Error('useTheme precisa ser usado dentro de um ThemeProvider');
  return contexto;
}
