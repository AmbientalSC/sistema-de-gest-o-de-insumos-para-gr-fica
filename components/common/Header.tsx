
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut } from './Icons';
import { Role } from '../../types';

interface HeaderProps {
    title: string;
    userName: string;
}

const Header: React.FC<HeaderProps> = ({ title, userName }) => {
  const { logout, toggleRole, user, isImpersonating } = useAuth();

  const canToggle = user?.role === Role.Manager || isImpersonating;
  const toggleLabel = isImpersonating ? 'Voltar para Gestor' : 'Alternar Login';

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center space-x-4">
        <span className="text-gray-600 hidden sm:block">Olá, {userName}</span>
        <div className="flex items-center space-x-2">
          {canToggle && (
            <button
              onClick={() => toggleRole && toggleRole()}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
              title={toggleLabel}
            >
              {toggleLabel}
            </button>
          )}
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-red-500 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
