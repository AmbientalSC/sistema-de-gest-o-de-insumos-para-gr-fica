import React, { useEffect, useMemo, useState } from 'react';
import { Item, StockMovement, MovementType } from '../../types';
import { apiGetItems, apiGetMovementHistory } from '../../services/firebaseApi';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

const SmallCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-500">{title}</div>
        <div className="mt-2 text-2xl font-bold text-gray-800">{value}</div>
    </div>
);

function daysArray(count: number) {
    const arr: Date[] = [];
    for (let i = count - 1; i >= 0; i--) arr.push(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    return arr;
}

const Dashboard: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [periodDays, setPeriodDays] = useState<number>(30);

    useEffect(() => {
        (async () => {
            try {
                const [fItems, fMovements] = await Promise.all([apiGetItems(), apiGetMovementHistory()]);
                setItems(fItems || []);
                setMovements(fMovements || []);
            } catch (e) {
                console.error('Erro ao carregar dados do dashboard', e);
            }
        })();
    }, []);

    const totalItems = items.length;
    const totalStock = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const lowStockCount = items.filter(i => (Number(i.quantity) || 0) <= (Number(i.minQuantity) || 0)).length;

    const recentMovements = useMemo(() => {
        const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
        return movements.filter(m => new Date(m.timestamp).getTime() >= cutoff);
    }, [movements, periodDays]);

    // Entradas vs saídas por dia
    const lineData = useMemo(() => {
        const days = daysArray(periodDays);
        return days.map(d => {
            const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const dayEnd = dayStart + 24 * 60 * 60 * 1000;
            const dayMoves = recentMovements.filter(m => new Date(m.timestamp).getTime() >= dayStart && new Date(m.timestamp).getTime() < dayEnd);
            const ins = dayMoves.filter(m => m.type === MovementType.In).reduce((s, m) => s + m.quantity, 0);
            const outs = dayMoves.filter(m => m.type !== MovementType.In).reduce((s, m) => s + m.quantity, 0);
            return { date: d.toLocaleDateString(), in: ins, out: outs };
        });
    }, [recentMovements, periodDays]);

    // Top items por consumo (outs) no período
    const topItems = useMemo(() => {
        const map = new Map<number, { name: string; qty: number }>();
        recentMovements.filter(m => m.type !== MovementType.In).forEach(m => {
            const prev = map.get(m.itemId) || { name: m.itemName, qty: 0 };
            prev.qty += m.quantity;
            map.set(m.itemId, prev);
        });
        return Array.from(map.entries()).map(([id, v]) => ({ id, name: v.name, qty: v.qty })).sort((a, b) => b.qty - a.qty).slice(0, 10);
    }, [recentMovements]);

    // Distribuição por localização (estoque atual)
    const byLocation = useMemo(() => {
        const map = new Map<string, number>();
        items.forEach(i => {
            const loc = i.location || 'Sem localização';
            map.set(loc, (map.get(loc) || 0) + (Number(i.quantity) || 0));
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [items]);

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Dashboard de Estoque</h1>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Período:</label>
                    <select value={periodDays} onChange={e => setPeriodDays(Number(e.target.value))} className="p-2 border rounded">
                        <option value={7}>Últimos 7 dias</option>
                        <option value={30}>Últimos 30 dias</option>
                        <option value={90}>Últimos 90 dias</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <SmallCard title="Total de itens cadastrados" value={totalItems} />
                <SmallCard title="Total em estoque (unidades)" value={totalStock} />
                <SmallCard title="Itens com estoque baixo" value={lowStockCount} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500 mb-2">Entradas vs Saídas ({periodDays} dias)</div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={lineData}>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="in" stroke="#10b981" strokeWidth={2} />
                                <Line type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500 mb-2">Top {topItems.length} itens por consumo</div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={topItems} layout="vertical">
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" />
                                <Tooltip />
                                <Bar dataKey="qty" fill={COLORS[0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500 mb-2">Distribuição por Localização (estoque atual)</div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={byLocation} dataKey="value" nameKey="name" outerRadius={100} fill="#8884d8" label>
                                {byLocation.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
