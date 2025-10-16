
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Header from '../common/Header';
import ItemManagement from './ItemManagement';
import UserManagement from './UserManagement';
import MovementHistory from './MovementHistory';

type Tab = 'items' | 'users' | 'history';

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('items');

  const renderContent = () => {
    switch (activeTab) {
      case 'items':
        return <ItemManagement />;
      case 'users':
        return <UserManagement />;
      case 'history':
        return <MovementHistory />;
      default:
        return <ItemManagement />;
    }
  };

  const getTabClass = (tabName: Tab) =>
    `px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 ${
      activeTab === tabName
        ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
        : 'text-gray-500 hover:text-indigo-600'
    }`;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Painel do Gestor" userName={user.name} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('items')} className={getTabClass('items')}>
                        Insumos
                    </button>
                    <button onClick={() => setActiveTab('users')} className={getTabClass('users')}>
                        Usuários
                    </button>
                    <button onClick={() => setActiveTab('history')} className={getTabClass('history')}>
                        Histórico
                    </button>
                </nav>
            </div>
            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
