
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Item } from '../../types';
import { apiGetItems, apiAddItem, apiUpdateItem, apiAddStock } from '../../services/mockApi';
import { PlusCircle, AlertTriangle, Camera } from '../common/Icons';

// Global type for html5-qrcode library
declare global {
    interface Window {
        Html5Qrcode: any;
    }
}

// This component should be defined outside ItemManagement to prevent re-creation on re-renders
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

// ItemForm and AddStockForm should also be outside
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
    const scannerRef = useRef<any>(null);
    const readerElementId = "qr-reader-item-form";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: name === 'quantity' || name === 'minQuantity' ? Number(value) : value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const startScanner = useCallback(() => {
        if (!isScanning && window.Html5Qrcode) {
            setScanError(null);
            setIsScanning(true);
            
            // Wait for DOM element to be ready
            setTimeout(() => {
                const element = document.getElementById(readerElementId);
                if (!element) {
                    console.error("Scanner element not found");
                    setScanError("Erro ao inicializar scanner.");
                    setIsScanning(false);
                    return;
                }
                
                const html5QrCode = new window.Html5Qrcode(readerElementId);
                scannerRef.current = html5QrCode;
                
                // Configurações otimizadas para códigos de barras pequenos em celular
                const config = {
                    fps: 20, // Aumentar fps para melhor detecção
                    qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
                        // Área adaptativa - 80% da menor dimensão
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const qrboxSize = Math.floor(minEdge * 0.8);
                        return {
                            width: qrboxSize,
                            height: Math.floor(qrboxSize * 0.6) // Retangular para barcode
                        };
                    },
                    aspectRatio: 1.777778, // 16:9 - padrão de câmeras mobile
                    disableFlip: false,
                    videoConstraints: {
                        facingMode: "environment",
                        // Solicitar resolução alta para códigos pequenos
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        // Foco e zoom para melhor leitura
                        advanced: [
                            { focusMode: "continuous" },
                            { zoom: 2.0 } // Zoom 2x para códigos pequenos
                        ]
                    }
                };
                
                html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText: string) => {
                        // Vibração de feedback (se disponível)
                        if (navigator.vibrate) {
                            navigator.vibrate(200); // Vibra por 200ms
                        }
                        
                        // Show success feedback immediately
                        setScanSuccess(true);
                        setFormData(prev => ({ ...prev, barcode: decodedText }));
                        
                        // Highlight barcode field
                        setBarcodeJustScanned(true);
                        
                        // Stop scanner and close modal after showing success
                        setTimeout(() => {
                            stopScanner();
                            setScanSuccess(false);
                            // Remove highlight after 2 seconds
                            setTimeout(() => setBarcodeJustScanned(false), 2000);
                        }, 1000); // 1 segundo para mostrar o feedback
                    },
                    (errorMessage: string) => { /* ignore errors */ }
                ).catch((err: any) => {
                    console.error("Não foi possível iniciar o scanner.", err);
                    setScanError("Erro ao acessar a câmera. Verifique as permissões.");
                    setIsScanning(false);
                });
            }, 100);
        }
    }, [isScanning]);

    const stopScanner = useCallback(() => {
        if (scannerRef.current && isScanning) {
            scannerRef.current.stop().then(() => {
                setIsScanning(false);
                scannerRef.current = null;
            }).catch((err: any) => {
                console.error("Falha ao parar scanner", err);
                setIsScanning(false);
            });
        }
    }, [isScanning]);

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                stopScanner();
            }
        };
    }, [stopScanner]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">{item?.id ? 'Editar Item' : 'Adicionar Novo Insumo'}</h2>
                
                {isScanning ? (
                    <div className="mb-4">
                        <div className="w-full aspect-square bg-gray-800 rounded-lg overflow-hidden relative">
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
                            
                            <button 
                                type="button"
                                onClick={stopScanner} 
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700"
                                disabled={scanSuccess}
                            >
                                Cancelar Scanner
                            </button>
                            
                            {/* Dicas de uso */}
                            <div className="absolute top-4 left-0 right-0 px-4">
                                <div className="bg-black bg-opacity-70 text-white text-sm p-3 rounded-lg text-center">
                                    <p className="font-semibold mb-1">📱 Dicas para melhor leitura:</p>
                                    <p>• Mantenha distância de 10-20cm</p>
                                    <p>• Certifique-se de ter boa iluminação</p>
                                    <p>• Mantenha o celular firme e paralelo</p>
                                    <p>• Para códigos pequenos, aproxime devagar</p>
                                </div>
                            </div>
                        </div>
                        {scanError && <p className="mt-2 text-red-600 text-sm">{scanError}</p>}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Form fields here */}
                        <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Nome do Insumo" className="w-full p-2 border rounded" required/>
                        
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Código de Barras</label>
                            <div className="flex space-x-2">
                                <input 
                                    name="barcode" 
                                    value={formData.barcode || ''} 
                                    onChange={handleChange} 
                                    placeholder="Digite ou escaneie" 
                                    className={`flex-1 p-2 border rounded transition-all duration-300 ${
                                        barcodeJustScanned 
                                            ? 'border-green-500 bg-green-50 ring-2 ring-green-300' 
                                            : 'border-gray-300'
                                    }`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={startScanner}
                                    className="flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                    title="Escanear código de barras"
                                >
                                    <Camera className="w-5 h-5"/>
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
                            <input type="number" name="quantity" value={formData.quantity || 0} onChange={handleChange} placeholder="Quantidade Atual" className="w-1/2 p-2 border rounded" required/>
                            <input type="number" name="minQuantity" value={formData.minQuantity || 0} onChange={handleChange} placeholder="Quantidade Mínima" className="w-1/2 p-2 border rounded" required/>
                        </div>
                        <input name="supplier" value={formData.supplier || ''} onChange={handleChange} placeholder="Fornecedor (Opcional)" className="w-full p-2 border rounded" />
                        <input name="location" value={formData.location || ''} onChange={handleChange} placeholder="Localização" className="w-full p-2 border rounded" required/>
                        
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
                    <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" className="w-full p-2 border rounded" required/>
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
        if(item.id) {
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

    const openEditForm = (item: Item) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const openAddForm = () => {
        setEditingItem({});
        setIsFormOpen(true);
    };

    const openStockForm = (item: Item) => {
        setStockItem(item);
        setIsStockFormOpen(true);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Gerenciamento de Insumos</h2>
                <button onClick={openAddForm} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                    <PlusCircle className="w-5 h-5"/>
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
