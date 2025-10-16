
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut } from './Icons';

interface HeaderProps {
    title: string;
    userName: string;
}

const Header: React.FC<HeaderProps> = ({ title, userName }) => {
  const { logout } = useAuth();

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center space-x-4">
        <span className="text-gray-600 hidden sm:block">Olá, {userName}</span>
        <button
          onClick={logout}
          className="flex items-center space-x-2 text-red-500 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
