
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Item } from '../../types';
import { apiGetItems, apiAddItem, apiUpdateItem, apiAddStock } from '../../services/firebaseApi';
import { PlusCircle, AlertTriangle, Camera } from '../common/Icons';

// Global type for html5-qrcode library
declare global {
    interface Window {
        Html5Qrcode: any;
    }
}

const ItemRow: React.FC<{ item: Item; onAddStock: (item: Item) => void; onEdit: (item: Item) => void; }> = ({ item, onAddStock, onEdit }) => {
    const isLowStock = item.quantity <= item.minQuantity;
    return (
        <tr className={`border-b ${isLowStock ? 'bg-yellow-50' : 'bg-white'}`}>
            <td className="p-3 text-sm text-gray-700">{item.name}</td>
            <td className="p-3 text-sm text-gray-500">{item.barcode}</td>
            <td className="p-3 text-sm text-gray-700 font-medium">
                <div className="flex items-center">
                    {item.quantity} {item.unitOfMeasure}
                    {isLowStock && <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2" title="Estoque baixo" />}
                </div>
            </td>
            <td className="p-3 text-sm text-gray-500">{item.location}</td>
            <td className="p-3 text-sm text-gray-500 space-x-2 whitespace-nowrap">
                <button onClick={() => onAddStock(item)} className="text-green-600 hover:text-green-800 font-semibold">Adicionar Estoque</button>
                <button onClick={() => onEdit(item)} className="text-indigo-600 hover:text-indigo-800 font-semibold">Editar</button>
            </td>
        </tr>
    );
};

const ItemForm: React.FC<{
    item: Partial<Item> | null;
    onClose: () => void;
    onSave: (item: Partial<Item>) => void;
}> = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Item>>(item || {});
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanSuccess, setScanSuccess] = useState(false);
    const [barcodeJustScanned, setBarcodeJustScanned] = useState(false);
    const [isWebcam, setIsWebcam] = useState(false);
    const [zoom, setZoom] = useState<number>(1);

    const scannerRef = useRef<any>(null);
    const streamTrackRef = useRef<MediaStreamTrack | null>(null);
    const [torchOn, setTorchOn] = useState(false);
    const [torchAvailable, setTorchAvailable] = useState(false);
    const readerElementId = 'qr-reader-item-form';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'quantity' || name === 'minQuantity' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const stopScanner = useCallback(() => {
        if (scannerRef.current) {
            try { scannerRef.current.stop().catch(() => { }); } catch (e) { }
            scannerRef.current = null;
        }
        if (streamTrackRef.current) {
            try {
                const t = streamTrackRef.current;
                const caps = ((t.getCapabilities && t.getCapabilities()) as any) || {};
                if (caps.torch) {
                    try { t.applyConstraints({ advanced: [{ torch: false }] }); } catch (e) { }
                }
                try { t.stop(); } catch (e) { }
            } catch (e) { }
            streamTrackRef.current = null;
            setTorchOn(false);
        }
        setIsScanning(false);
    }, []);

    useEffect(() => () => stopScanner(), [stopScanner]);

    const toggleTorch = async () => {
        const track = streamTrackRef.current;
        if (!track) return;
        const caps = ((track.getCapabilities && track.getCapabilities()) as any) || {};
        if (!caps.torch) return;
        try {
            await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
            setTorchOn(v => !v);
        } catch (err) {
            console.warn('Erro ao alternar torch', err);
        }
    };

    const startScanner = useCallback(() => {
        if (isScanning || !window.Html5Qrcode) return;
        setScanError(null);
        setIsScanning(true);

        setTimeout(async () => {
            const element = document.getElementById(readerElementId);
            if (!element) { setScanError('Erro ao inicializar scanner.'); setIsScanning(false); return; }

            const html5QrCode = new window.Html5Qrcode(readerElementId);
            scannerRef.current = html5QrCode;

            const config = { fps: 12, qrbox: { width: 360, height: 160 }, aspectRatio: 1.777778, formatsToSupport: [0, 1, 2, 3, 7, 8, 11, 12, 13] } as any;
            const webcamConfig = { fps: 12, qrbox: { width: 480, height: 140 }, aspectRatio: 1.777778, formatsToSupport: [0, 1, 2, 3, 7, 8, 11, 12, 13] } as any;

            const startWithBestCamera = async () => {
                try {
                    if (window.Html5Qrcode.getCameras) {
                        const devices = await window.Html5Qrcode.getCameras();
                        const rear = devices.find((d: any) => /back|rear|traseira|traseiro|environment/i.test(d.label || ''));
                        const webcamCandidate = devices.find((d: any) => /front|user|integrated|webcam|logitech|camera|usb/i.test(d.label || ''));
                        const chosen = rear || webcamCandidate || devices[0];
                        const cameraId = chosen ? chosen.id : undefined;
                        const chosenLabel = (chosen && chosen.label) || '';
                        const chosenIsWebcam = /front|user|integrated|webcam|logitech|camera|usb/i.test(chosenLabel);
                        if (cameraId) {
                            const usedConfig = chosenIsWebcam ? webcamConfig : config;
                            setIsWebcam(chosenIsWebcam);
                            await html5QrCode.start(cameraId, usedConfig, (decodedText: string) => {
                                if (navigator.vibrate) navigator.vibrate(200);
                                setScanSuccess(true);
                                setFormData(prev => ({ ...prev, barcode: decodedText }));
                                setBarcodeJustScanned(true);
                                setTimeout(() => { stopScanner(); setScanSuccess(false); setIsScanning(false); setTimeout(() => setBarcodeJustScanned(false), 2000); }, 1000);
                            }, (errorMessage: string) => { });

                            try {
                                // pedir resolução maior para webcam/desktop
                                const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: cameraId }, width: { ideal: 1280 }, height: { ideal: 720 } } as any });
                                const track = stream.getVideoTracks()[0];
                                streamTrackRef.current = track;
                                const caps = ((track.getCapabilities && track.getCapabilities()) as any) || {};
                                setTorchAvailable(!!caps.torch);

                                // tentar aplicar foco contínuo/zoom se suportado
                                try {
                                    const advanced: any[] = [];
                                    if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
                                        advanced.push({ focusMode: 'continuous' });
                                    }
                                    if (caps.zoom && typeof caps.zoom === 'object') {
                                        const zmin = caps.zoom.min || 1;
                                        const zmax = caps.zoom.max || 1;
                                        const mid = Math.min(zmax, Math.max(zmin, zmin + (zmax - zmin) / 2));
                                        advanced.push({ zoom: mid });
                                        setZoom(mid);
                                    }
                                    if (advanced.length) {
                                        (track as any).applyConstraints({ advanced }).catch(() => { });
                                    }
                                } catch (e) { /* ignore */ }
                            } catch (e) { setTorchAvailable(false); }

                            return;
                        }
                    }
                } catch (err) { console.warn('Falha ao obter lista de câmeras / fallback', err); }

                try {
                    await html5QrCode.start({ facingMode: 'environment' } as any, config, (decodedText: string) => {
                        if (navigator.vibrate) navigator.vibrate(200);
                        setScanSuccess(true);
                        setFormData(prev => ({ ...prev, barcode: decodedText }));
                        setBarcodeJustScanned(true);
                        setTimeout(() => { stopScanner(); setScanSuccess(false); setIsScanning(false); setTimeout(() => setBarcodeJustScanned(false), 2000); }, 1000);
                    }, (errorMessage: string) => { });

                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } as any });
                        const track = stream.getVideoTracks()[0];
                        streamTrackRef.current = track;
                        const caps = ((track.getCapabilities && track.getCapabilities()) as any) || {};
                        setTorchAvailable(!!caps.torch);
                        try {
                            const advanced: any[] = [];
                            if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
                                advanced.push({ focusMode: 'continuous' });
                            }
                            if (caps.zoom && typeof caps.zoom === 'object') {
                                const zmin = caps.zoom.min || 1;
                                const zmax = caps.zoom.max || 1;
                                const mid = Math.min(zmax, Math.max(zmin, zmin + (zmax - zmin) / 2));
                                advanced.push({ zoom: mid });
                                setZoom(mid);
                            }
                            if (advanced.length) (track as any).applyConstraints({ advanced }).catch(() => { });
                        } catch (e) { }
                    } catch (e) { setTorchAvailable(false); }
                } catch (e) {
                    console.error('Não foi possível iniciar scanner', e);
                    setScanError('Erro ao acessar a câmera. Verifique as permissões.');
                    setIsScanning(false);
                }
            };

            startWithBestCamera().catch((err: any) => { console.error('Erro ao iniciar scanner', err); setScanError('Erro ao iniciar scanner.'); setIsScanning(false); });

        }, 100);
    }, [isScanning, stopScanner]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">{item?.id ? 'Editar Item' : 'Adicionar Novo Insumo'}</h2>

                {isScanning ? (
                    <div className="mb-4">
                        <div className={`w-full bg-gray-800 rounded-lg overflow-hidden relative ${isWebcam ? 'h-64' : 'aspect-square'}`}>
                            <div id={readerElementId} className="w-full h-full" />

                            {scanSuccess && (
                                <div className="absolute inset-0 bg-green-500 bg-opacity-95 flex flex-col items-center justify-center text-white z-10 animate-pulse">
                                    <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <p className="text-2xl font-bold mb-2">✓ Código Encontrado!</p>
                                    <p className="text-lg">Preenchendo formulário...</p>
                                </div>
                            )}

                            <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                                <div className="pointer-events-auto mb-4 flex items-center gap-3">
                                    {isWebcam && (
                                        <div className="flex items-center space-x-2 bg-black bg-opacity-40 px-3 py-2 rounded">
                                            <label className="text-sm text-white">Zoom</label>
                                            <input
                                                type="range"
                                                min={1}
                                                max={4}
                                                step={0.1}
                                                value={zoom}
                                                onChange={e => {
                                                    const v = Number(e.target.value);
                                                    setZoom(v);
                                                    const track = streamTrackRef.current;
                                                    if (track) {
                                                        const caps = ((track.getCapabilities && track.getCapabilities()) as any) || {};
                                                        if (caps.zoom) {
                                                            try { (track as any).applyConstraints({ advanced: [{ zoom: v }] }); } catch (err) { }
                                                        } else {
                                                            // fallback: aplicar zoom via CSS transform no vídeo/canvas montado pelo html5-qrcode
                                                            const el = document.getElementById(readerElementId);
                                                            if (el) {
                                                                (el as HTMLElement).style.transform = `scale(${v})`;
                                                            }
                                                        }
                                                    }
                                                }}
                                                className="w-32"
                                            />
                                        </div>
                                    )}
                                    {torchAvailable && (
                                        <button onClick={toggleTorch} className="bg-yellow-400 text-black px-3 py-2 rounded-md font-semibold">{torchOn ? 'Lanterna On' : 'Lanterna'}</button>
                                    )}
                                    <button onClick={stopScanner} className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold">Cancelar Scanner</button>
                                </div>
                            </div>

                        </div>
                        {scanError && <p className="mt-2 text-red-600 text-sm">{scanError}</p>}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Nome do Insumo" className="w-full p-2 border rounded" required />

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Código de Barras</label>
                            <div className="flex space-x-2">
                                <input
                                    name="barcode"
                                    value={formData.barcode || ''}
                                    onChange={handleChange}
                                    placeholder="Digite ou escaneie"
                                    className={`flex-1 p-2 border rounded transition-all duration-300 ${barcodeJustScanned ? 'border-green-500 bg-green-50 ring-2 ring-green-300' : 'border-gray-300'}`}
                                    required
                                />
                                <button type="button" onClick={startScanner} className="flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors" title="Escanear código de barras">
                                    <Camera className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <input name="description" value={formData.description || ''} onChange={handleChange} placeholder="Descrição" className="w-full p-2 border rounded" />
                        <select name="unitOfMeasure" value={formData.unitOfMeasure || 'Unidade'} onChange={handleChange} className="w-full p-2 border rounded">
                            <option>Unidade</option>
                            <option>Folha</option>
                            <option>Kg</option>
                            <option>Litro</option>
                        </select>
                        <div className="flex space-x-4">
                            <input type="number" name="quantity" value={formData.quantity || 0} onChange={handleChange} placeholder="Quantidade Atual" className="w-1/2 p-2 border rounded" required />
                            <input type="number" name="minQuantity" value={formData.minQuantity || 0} onChange={handleChange} placeholder="Quantidade Mínima" className="w-1/2 p-2 border rounded" required />
                        </div>
                        <input name="supplier" value={formData.supplier || ''} onChange={handleChange} placeholder="Fornecedor (Opcional)" className="w-full p-2 border rounded" />
                        <input name="location" value={formData.location || ''} onChange={handleChange} placeholder="Localização" className="w-full p-2 border rounded" required />

                        <div className="flex justify-end space-x-2 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Salvar</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const AddStockForm: React.FC<{
    item: Item;
    onClose: () => void;
    onAdd: (itemId: number, quantity: number) => void;
}> = ({ item, onClose, onAdd }) => {
    const [quantity, setQuantity] = useState(1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(item.id, quantity);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-4">Adicionar Estoque</h2>
                <p className="mb-4 text-gray-600">Item: <span className="font-semibold">{item.name}</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" className="w-full p-2 border rounded" required />
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Adicionar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ItemManagement: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isStockFormOpen, setIsStockFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null);
    const [stockItem, setStockItem] = useState<Item | null>(null);

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        const fetchedItems = await apiGetItems();
        setItems(fetchedItems);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSaveItem = async (item: Partial<Item>) => {
        if (item.id) {
            await apiUpdateItem(item as Item);
        } else {
            await apiAddItem(item);
        }
        setIsFormOpen(false);
        setEditingItem(null);
        fetchItems();
    };

    const handleAddStock = async (itemId: number, quantity: number) => {
        await apiAddStock(itemId, quantity);
        setIsStockFormOpen(false);
        setStockItem(null);
        fetchItems();
    };

    const openEditForm = (item: Item) => { setEditingItem(item); setIsFormOpen(true); };
    const openAddForm = () => { setEditingItem({}); setIsFormOpen(true); };
    const openStockForm = (item: Item) => { setStockItem(item); setIsStockFormOpen(true); };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Gerenciamento de Insumos</h2>
                <button onClick={openAddForm} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                    <PlusCircle className="w-5 h-5" />
                    <span>Adicionar Insumo</span>
                </button>
            </div>

            {isLoading ? <p>Carregando...</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Nome</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Cód. Barras</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Estoque</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Localização</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-left">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => <ItemRow key={item.id} item={item} onAddStock={openStockForm} onEdit={openEditForm} />)}
                        </tbody>
                    </table>
                </div>
            )}

            {isFormOpen && <ItemForm item={editingItem} onClose={() => setIsFormOpen(false)} onSave={handleSaveItem} />}
            {isStockFormOpen && stockItem && <AddStockForm item={stockItem} onClose={() => setIsStockFormOpen(false)} onAdd={handleAddStock} />}
        </div>
    );
};

export default ItemManagement;
