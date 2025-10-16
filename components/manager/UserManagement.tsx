
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role } from '../../types';
import { apiGetUsers, apiAddUser } from '../../services/mockApi';
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

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        const fetchedUsers = await apiGetUsers();
        setUsers(fetchedUsers);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSaveUser = async (user: Partial<User>) => {
        await apiAddUser(user);
        setIsFormOpen(false);
        fetchUsers();
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

            {isLoading ? <p>Carregando...</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Nome</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Usuário</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Perfil</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="bg-white border-b">
                                    <td className="p-3 text-sm text-gray-700">{user.name}</td>
                                    <td className="p-3 text-sm text-gray-500">{user.username}</td>
                                    <td className="p-3 text-sm text-gray-700">
                                        <span className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${user.role === Role.Manager ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>
                                            {user.role}
                                        </span>
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
