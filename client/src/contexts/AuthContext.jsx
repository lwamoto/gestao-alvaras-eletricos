import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { login as loginApi, logout as logoutApi, me as meApi } from '../authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const dados = await meApi();
        setUsuario(dados);
      } catch {
        setUsuario(null);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const login = useCallback(async (identificador, senha) => {
    const dados = await loginApi(identificador, senha);
    setUsuario(dados);
    return dados;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setUsuario(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  return contexto;
}
