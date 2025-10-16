
import React, { useState, useEffect, useCallback } from 'react';
import { StockMovement, MovementType } from '../../types';
import { apiGetMovementHistory } from '../../services/firebaseApi';

const MovementHistory: React.FC = () => {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        const history = await apiGetMovementHistory();
        setMovements(history);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Histórico de Movimentações</h2>
            {isLoading ? <p>Carregando histórico...</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Data</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Item</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Tipo</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Quantidade</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Usuário</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.map(move => (
                                <tr key={move.id} className="bg-white border-b">
                                    <td className="p-3 text-sm text-gray-500">{new Date(move.timestamp).toLocaleString('pt-BR')}</td>
                                    <td className="p-3 text-sm text-gray-700">{move.itemName}</td>
                                    <td className="p-3 text-sm">
                                        <span className={`p-1.5 text-xs font-medium uppercase tracking-wider rounded-lg ${move.type === MovementType.In ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {move.type}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-gray-700 font-bold">
                                        {move.type === MovementType.In ? '+' : '-'}{move.quantity}
                                    </td>
                                    <td className="p-3 text-sm text-gray-500">{move.userName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MovementHistory;
