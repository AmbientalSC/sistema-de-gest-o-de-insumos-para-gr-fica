
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Barcode } from '../common/Icons';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { candidates, selectProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError('Usuário ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (id: number | string) => {
    if (selectProfile) selectProfile(id);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
            <div className="flex justify-center items-center mb-4">
                <Barcode className="h-12 w-12 text-indigo-600" />
            </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Gestão de Insumos
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para acessar o sistema
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Usuário</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-input" className="sr-only">Senha</label>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
        {/* Modal de seleção de perfil quando houver candidatos */}
        {candidates && candidates.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg">
              <h3 className="text-lg font-bold mb-4">Escolha o perfil</h3>
              <p className="text-sm text-gray-600 mb-4">Foram encontrados múltiplos perfis para este login. Escolha qual deseja usar:</p>
              <div className="space-y-2">
                {candidates.map(c => (
                  <button key={c.id} onClick={() => handleSelect(c.id)} className="w-full text-left p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-sm text-gray-500">{c.role}</div>
                      </div>
                      <div className="text-sm text-indigo-600">Usar</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
