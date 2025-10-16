
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Item } from '../../types';
import { apiGetItemByBarcode, apiCheckoutItem } from '../../services/mockApi';
import Header from '../common/Header';
import { Camera, CheckCircle } from '../common/Icons';

// This is a global type because html5-qrcode is loaded from a script
declare global {
    interface Window {
        Html5Qrcode: any;
    }
}
const CheckoutModal: React.FC<{
    item: Item;
    onClose: () => void;
    onConfirm: (itemId: number, quantity: number) => Promise<void>;
}> = ({ item, onClose, onConfirm }) => {
    const [quantity, setQuantity] = useState(1);
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = async () => {
        setIsConfirming(true);
        await onConfirm(item.id, quantity);
        // The parent will close the modal on success
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
                <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
                <p className="text-gray-600 mb-1">Localização: {item.location}</p>
                <p className="text-gray-600 mb-4">Estoque atual: {item.quantity} {item.unitOfMeasure}</p>
                <div className="my-6">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade para dar baixa:
                    </label>
                    <input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        min="1"
                        max={item.quantity}
                        className="w-32 text-center p-2 border border-gray-300 rounded-md text-lg"
                        autoFocus
                    />
                </div>
                <div className="flex flex-col space-y-3">
                     <button
                        onClick={handleConfirm}
                        disabled={isConfirming || quantity > item.quantity}
                        className="w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                    >
                        {isConfirming ? 'Confirmando...' : 'Confirmar Baixa'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isConfirming}
                        className="w-full px-4 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Cancelar
                    </button>
                    {quantity > item.quantity && <p className="text-red-500 text-sm mt-2">Quantidade indisponível em estoque.</p>}
                </div>
            </div>
        </div>
    );
};

const SuccessOverlay: React.FC<{ onDismiss: () => void; }> = ({ onDismiss }) => (
    <div className="fixed inset-0 bg-green-500 bg-opacity-90 flex flex-col justify-center items-center text-white z-50 p-4 text-center" onClick={onDismiss}>
        <CheckCircle className="w-24 h-24 mb-6" />
        <h2 className="text-4xl font-extrabold mb-4">Sucesso!</h2>
        <p className="text-lg">Baixa de estoque realizada.</p>
        <p className="mt-8 text-sm opacity-80">(Toque para continuar)</p>
    </div>
);


const CollaboratorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItem, setScannedItem] = useState<Item | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const scannerRef = useRef<any>(null);
    const readerElementId = "qr-reader";

    const startScanner = useCallback(() => {
        if (!isScanning && window.Html5Qrcode) {
            setScanError(null);
            const html5QrCode = new window.Html5Qrcode(readerElementId);
            scannerRef.current = html5QrCode;
            setIsScanning(true);
            html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText: string) => {
                    try {
                        stopScanner();
                        const item = await apiGetItemByBarcode(decodedText);
                        setScannedItem(item);
                    } catch (error) {
                        setScanError("Código de barras não encontrado.");
                        setTimeout(() => setScanError(null), 3000);
                        stopScanner();
                    }
                },
                (errorMessage: string) => { /* ignore errors */ }
            ).catch((err: any) => {
                console.error("Unable to start scanning.", err);
                setScanError("Não foi possível iniciar a câmera.");
                setIsScanning(false);
            });
        }
    }, [isScanning]);
    
    const stopScanner = useCallback(() => {
        if (scannerRef.current && isScanning) {
            scannerRef.current.stop().then(() => {
                setIsScanning(false);
                scannerRef.current = null;
            }).catch((err: any) => {
                console.error("Failed to stop scanner", err);
                setIsScanning(false); // Force state change even on error
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

    const handleCheckout = async (itemId: number, quantity: number) => {
        await apiCheckoutItem(itemId, quantity);
        setScannedItem(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000); // Auto-dismiss success message
    };

    const reset = () => {
        setScannedItem(null);
        setShowSuccess(false);
        setScanError(null);
        stopScanner();
    }

    if (!user) return null;

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <Header title="Baixa de Insumo" userName={user.name} />
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                
                {isScanning ? (
                    <div className="w-full max-w-md aspect-square bg-gray-800 rounded-lg overflow-hidden relative">
                         <div id={readerElementId} className="w-full h-full" />
                         <button onClick={stopScanner} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 px-6 py-3 rounded-lg font-bold">
                            Cancelar
                         </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
                        <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                            Aponte a câmera para o código de barras do insumo para dar baixa no estoque.
                        </p>
                        <button
                            onClick={startScanner}
                            className="flex items-center justify-center space-x-3 w-64 h-16 bg-indigo-600 rounded-lg text-xl font-bold hover:bg-indigo-500 transition-transform transform hover:scale-105"
                        >
                            <Camera className="w-8 h-8"/>
                            <span>Escanear</span>
                        </button>
                    </div>
                )}
                {scanError && <p className="mt-4 text-red-400 bg-red-900/50 px-4 py-2 rounded-md">{scanError}</p>}
            </main>

            {scannedItem && <CheckoutModal item={scannedItem} onClose={reset} onConfirm={handleCheckout} />}
            {showSuccess && <SuccessOverlay onDismiss={reset} />}
        </div>
    );
};

export default CollaboratorDashboard;
