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
    const [periodOption, setPeriodOption] = useState<string>('30');
    const [customStart, setCustomStart] = useState<string>('');
    const [customEnd, setCustomEnd] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

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
        // determine date range
        let startTs = 0;
        let endTs = Date.now();

        if (periodOption === 'custom') {
            if (customStart && customEnd) {
                startTs = new Date(customStart).getTime();
                // include end day full
                endTs = new Date(customEnd).getTime() + 24 * 60 * 60 * 1000 - 1;
            } else {
                // if custom not filled, fallback to default periodDays
                startTs = Date.now() - periodDays * 24 * 60 * 60 * 1000;
            }
        } else {
            const days = Number(periodOption) || periodDays;
            startTs = Date.now() - days * 24 * 60 * 60 * 1000;
        }

        const term = (searchTerm || '').trim().toLowerCase();
        return movements.filter(m => {
            const t = new Date(m.timestamp).getTime();
            if (t < startTs || t > endTs) return false;
            if (!term) return true;
            return (m.itemName || '').toLowerCase().includes(term) || String(m.itemId).toLowerCase().includes(term);
        });
    }, [movements, periodOption, periodDays, customStart, customEnd, searchTerm]);

    // Entradas vs saídas por dia
    const lineData = useMemo(() => {
        // build days array depending on periodOption/custom range
        let days: Date[] = [];
        if (periodOption === 'custom' && customStart && customEnd) {
            const s = new Date(customStart);
            const e = new Date(customEnd);
            const diff = Math.ceil((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000));
            for (let i = 0; i <= diff; i++) days.push(new Date(s.getFullYear(), s.getMonth(), s.getDate() + i));
        } else {
            const daysCount = Number(periodOption) || periodDays;
            days = daysArray(daysCount);
        }

        return days.map(d => {
            const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const dayEnd = dayStart + 24 * 60 * 60 * 1000;
            const dayMoves = recentMovements.filter(m => new Date(m.timestamp).getTime() >= dayStart && new Date(m.timestamp).getTime() < dayEnd);
            const ins = dayMoves.filter(m => m.type === MovementType.In).reduce((s, m) => s + m.quantity, 0);
            const outs = dayMoves.filter(m => m.type !== MovementType.In).reduce((s, m) => s + m.quantity, 0);
            return { date: d.toLocaleDateString(), entrada: ins, saida: outs };
        });
    }, [recentMovements, periodOption, periodDays, customStart, customEnd]);

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

    // NOTE: Distribuição por localização removida conforme solicitado

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Dashboard de Estoque</h1>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Período:</label>
                        <select value={periodOption} onChange={e => setPeriodOption(e.target.value)} className="p-2 border rounded">
                            <option value={7}>Últimos 7 dias</option>
                            <option value={30}>Últimos 30 dias</option>
                            <option value={90}>Últimos 90 dias</option>
                            <option value="custom">Personalizado</option>
                        </select>
                        {periodOption === 'custom' && (
                            <div className="flex items-center gap-2 ml-2">
                                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="p-2 border rounded" />
                                <span className="text-sm text-gray-500">até</span>
                                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="p-2 border rounded" />
                            </div>
                        )}
                    </div>
            </div>

                <div className="flex items-center gap-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <SmallCard title="Total de itens cadastrados" value={totalItems} />
                <SmallCard title="Total em estoque (unidades)" value={totalStock} />
                <SmallCard title="Itens com estoque baixo" value={lowStockCount} />
                    </div>
                    <div className="w-80">
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar item..." className="w-full p-2 border rounded" />
                    </div>
                </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500 mb-2">
                        Entradas vs Saídas {
                            periodOption === 'custom' && customStart && customEnd
                                ? `(${new Date(customStart).toLocaleDateString()} - ${new Date(customEnd).toLocaleDateString()})`
                                : `(${periodOption} dias)`
                        }
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={lineData}>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={2} />
                                <Line type="monotone" dataKey="saida" stroke="#ef4444" strokeWidth={2} />
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

            {/* Distribuição por Localização removida conforme solicitado */}
        </div>
    );
};

export default Dashboard;
