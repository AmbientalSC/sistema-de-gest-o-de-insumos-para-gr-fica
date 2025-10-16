
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role } from '../../types';
import { apiGetUsers, apiAddUser, apiToggleUserStatus } from '../../services/firebaseApi';
import { UserPlus } from '../common/Icons';

const UserForm: React.FC<{ 
    onClose: () => void; 
    onSave: (user: Partial<User>) => void; 
}> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<User>>({ role: Role.Collaborator });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Adicionar Novo Usuário</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Nome Completo" className="w-full p-2 border rounded" required />
                    <input name="username" value={formData.username || ''} onChange={handleChange} placeholder="Nome de Usuário" className="w-full p-2 border rounded" required />
                    <input name="password" type="password" value={formData.password || ''} onChange={handleChange} placeholder="Senha" className="w-full p-2 border rounded" required />
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value={Role.Collaborator}>Colaborador</option>
                        <option value={Role.Manager}>Gestor</option>
                    </select>

                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedUsers = await apiGetUsers();
            setUsers(fetchedUsers);
        } catch (err: any) {
            setError('Erro ao carregar usuários: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSaveUser = async (user: Partial<User>) => {
        setError(null);
        setSuccess(null);
        try {
            await apiAddUser(user);
            setIsFormOpen(false);
            setSuccess('Usuário criado com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        setError(null);
        setSuccess(null);
        try {
            await apiToggleUserStatus(userId, !currentStatus);
            setSuccess(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
            setTimeout(() => setSuccess(null), 3000);
            fetchUsers();
        } catch (err: any) {
            setError('Erro ao alterar status: ' + err.message);
            setTimeout(() => setError(null), 5000);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Gerenciamento de Usuários</h2>
                <button onClick={() => setIsFormOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                    <UserPlus className="w-5 h-5"/>
                    <span>Adicionar Usuário</span>
                </button>
            </div>

            {/* Mensagens de sucesso e erro */}
            {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">Carregando usuários...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">Nenhum usuário cadastrado.</p>
                    <p className="text-sm text-gray-500 mt-2">Clique em "Adicionar Usuário" para criar o primeiro acesso.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Nome</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Usuário</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Perfil</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Status</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className={`border-b ${user.active === false ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
                                    <td className="p-3 text-sm text-gray-700">{user.name}</td>
                                    <td className="p-3 text-sm text-gray-500">{user.username}</td>
                                    <td className="p-3 text-sm text-gray-700">
                                        <span className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${user.role === Role.Manager ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.active !== false ? 'Ativo' : 'Desativado'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm">
                                        <button
                                            onClick={() => handleToggleStatus(user.id as string, user.active !== false)}
                                            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                                                user.active !== false 
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                        >
                                            {user.active !== false ? 'Desativar' : 'Ativar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {isFormOpen && <UserForm onClose={() => setIsFormOpen(false)} onSave={handleSaveUser} />}
        </div>
    );
};

export default UserManagement;
