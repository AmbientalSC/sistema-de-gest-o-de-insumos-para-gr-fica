
import React from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/auth/Login';
import ManagerDashboard from './components/manager/ManagerDashboardNew';
import CollaboratorDashboard from './components/collaborator/CollaboratorDashboard';
import { Role } from './types';

const App: React.FC = () => {
  const { user } = useAuth();

  const renderContent = () => {
    if (!user) {
      return <Login />;
    }

    switch (user.role) {
      case Role.Manager:
        return <ManagerDashboard />;
      case Role.Collaborator:
        return <CollaboratorDashboard />;
      default:
        return <Login />;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      {renderContent()}
    </div>
  );
};

export default App;
