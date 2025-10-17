
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Item } from '../../types';
import { apiGetItemByBarcode, apiCheckoutItem } from '../../services/firebaseApi';
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
    // usar string no input para permitir edição natural no mobile
    // começar vazio para que o usuário possa digitar sem um '1' pré-preenchido
    const [quantityStr, setQuantityStr] = useState<string>('');
    const [isConfirming, setIsConfirming] = useState(false);

    const numeric = (q: string) => {
        const n = Number(q);
        return Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n));
    };

    const handleConfirm = async () => {
        const q = numeric(quantityStr);
        if (q < 1) return;
        setIsConfirming(true);
        await onConfirm(item.id, q);
        // The parent will close the modal on success
    };

    const current = numeric(quantityStr);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center text-gray-900">
                <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
                <p className="text-gray-600 mb-1">Localização: {item.location}</p>
                <p className="text-gray-600 mb-4">Estoque atual: {item.quantity} {item.unitOfMeasure}</p>
                <div className="my-6">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade para dar baixa:
                    </label>
                    <input
                        id="quantity"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={quantityStr}
                        placeholder="1"
                        onChange={(e) => {
                            // manter apenas dígitos
                            const cleaned = (e.target.value || '').replace(/[^0-9]/g, '');
                            // permitir string vazia enquanto digita
                            setQuantityStr(cleaned);
                        }}
                        className="w-32 text-center p-2 border border-gray-300 rounded-md text-lg text-black"
                        autoFocus
                    />
                </div>
                <div className="flex flex-col space-y-3">
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirming || current < 1 || current > item.quantity}
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
                    {current > item.quantity && <p className="text-red-500 text-sm mt-2">Quantidade indisponível em estoque.</p>}
                </div>
            </div>
        </div>
    );
};

const SuccessOverlay: React.FC<{ onDismiss: () => void; itemName?: string | null }> = ({ onDismiss, itemName }) => (
    <div className="fixed inset-0 bg-green-500 bg-opacity-90 flex flex-col justify-center items-center text-white z-50 p-4 text-center" onClick={onDismiss}>
        <CheckCircle className="w-24 h-24 mb-6" />
        <h2 className="text-4xl font-extrabold mb-4">Sucesso!</h2>
        {itemName ? <p className="text-lg font-semibold">Baixa realizada: {itemName}</p> : <p className="text-lg">Baixa de estoque realizada.</p>}
        <p className="mt-8 text-sm opacity-80">(Toque para continuar)</p>
    </div>
);


const CollaboratorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItem, setScannedItem] = useState<Item | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successItemName, setSuccessItemName] = useState<string | null>(null);
    const scannerRef = useRef<any>(null);
    const streamTrackRef = useRef<MediaStreamTrack | null>(null);
    const [torchOn, setTorchOn] = useState(false);
    const [torchAvailable, setTorchAvailable] = useState(false);
    const [zoom, setZoom] = useState<number>(1);
    const [isWebcam, setIsWebcam] = useState(false);
    const readerElementId = "qr-reader";

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

                // Configurações otimizadas para CÓDIGOS DE BARRAS (retangular horizontal)
                const config = {
                    fps: 12,
                    qrbox: {
                        width: 360,
                        height: 160
                    },
                    aspectRatio: 1.777778,
                    formatsToSupport: [0, 1, 2, 3, 7, 8, 11, 12, 13]
                };

                const startWithBestCamera = async () => {
                    try {
                        if (window.Html5Qrcode.getCameras) {
                            const devices = await window.Html5Qrcode.getCameras();
                            const rear = devices.find((d: any) => /back|rear|traseira|traseiro|environment/i.test(d.label || ''));
                            const chosen = rear || devices[0];
                            const cameraId = chosen ? chosen.id : undefined;
                            if (cameraId) {
                                setIsWebcam(/front|user|integrated|webcam|logitech|camera|usb/i.test((chosen && chosen.label) || ''));
                                await html5QrCode.start(
                                    cameraId,
                                    config,
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
                                    (errorMessage: string) => { /* ignore frame errors */ }
                                );
                                try {
                                    const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: cameraId }, width: { ideal: 1280 }, height: { ideal: 720 } } as any });
                                    const track = stream.getVideoTracks()[0];
                                    streamTrackRef.current = track;
                                    const caps = (track.getCapabilities && (track.getCapabilities() as any)) || {};
                                    setTorchAvailable(!!caps.torch);
                                    if (caps.zoom) {
                                        const zmin = caps.zoom.min || 1;
                                        const zmax = caps.zoom.max || 1;
                                        const mid = Math.min(zmax, Math.max(zmin, (zmin + zmax) / 2));
                                        try { (track as any).applyConstraints({ advanced: [{ zoom: mid }] }); setZoom(mid); } catch (e) { }
                                    }
                                } catch (e) { setTorchAvailable(false); }
                                return;
                            }
                        }
                    } catch (err) {
                        console.warn('Falha ao obter câmeras / iniciar com cameraId, usando fallback', err);
                    }

                    html5QrCode.start(
                        { facingMode: 'environment' },
                        config,
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
                    ).catch(async (err: any) => {
                        console.error("Unable to start scanning.", err);
                        setScanError("Não foi possível iniciar a câmera. Verifique as permissões.");
                        setIsScanning(false);
                    });
                };

                startWithBestCamera().catch((err: any) => {
                    console.error('Erro ao iniciar scanner com câmera preferencial', err);
                    setScanError('Erro ao iniciar scanner.');
                    setIsScanning(false);
                });
            }, 100);
        }
    }, [isScanning]);

    const captureFrame = useCallback(() => {
        const el = document.getElementById(readerElementId);
        if (!el) return;
        const video = el.querySelector('video') as HTMLVideoElement | null;
        const canvas = document.createElement('canvas');
        if (video && video.readyState >= 2) {
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); window.open(canvas.toDataURL('image/png'), '_blank'); return; }
        }
        const inner = el.querySelector('canvas') as HTMLCanvasElement | null;
        if (inner) { try { window.open(inner.toDataURL('image/png'), '_blank'); return; } catch (e) { } }
    }, []);

    const toggleTorch = useCallback(async () => {
        const t = streamTrackRef.current as any;
        if (!t) return;
        const caps = (t.getCapabilities && (t.getCapabilities() as any)) || {};
        if (!caps.torch) return;
        try { await t.applyConstraints({ advanced: [{ torch: !torchOn }] }); setTorchOn(v => !v); } catch (err) { console.warn('torch toggle failed', err); }
    }, [torchOn]);

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
        // set success state and show item name (use atualmente escaneado)
        setSuccessItemName(scannedItem ? scannedItem.name : null);
        setScannedItem(null);
        setShowSuccess(true);
        setTimeout(() => { setShowSuccess(false); setSuccessItemName(null); }, 3000); // Auto-dismiss success message
    };

    const reset = () => {
        setScannedItem(null);
        setShowSuccess(false);
        setScanError(null);
        setSuccessItemName(null);
        stopScanner();
    }

    if (!user) return null;

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <Header title="Baixa de Insumo" userName={user.name} />
            <main className="flex-grow flex flex-col items-center justify-center p-4">

                {isScanning ? (
                    <div className="w-full max-w-md bg-gray-800 rounded-lg overflow-hidden relative">
                        <div className={`w-full ${isWebcam ? 'h-64' : 'aspect-square'} relative z-0`}>
                            <div id={readerElementId} className="w-full h-full overflow-hidden flex items-center justify-center" />
                        </div>

                        {/* Painel de controles fora do vídeo */}
                        <div className="bg-gray-900 px-4 py-3 flex items-center gap-3">
                            <button onClick={captureFrame} className="bg-blue-600 text-white px-3 py-2 rounded-md font-semibold">Tirar Foto</button>
                            <div className="flex items-center gap-2 text-sm text-gray-200">
                                <span>Zoom</span>
                                <input type="range" min={1} max={4} step={0.1} value={zoom} onChange={e => {
                                    const v = Number(e.target.value);
                                    setZoom(v);
                                    const track = streamTrackRef.current;
                                    if (track) {
                                        const caps = ((track.getCapabilities && track.getCapabilities()) as any) || {};
                                        if (caps.zoom) { try { (track as any).applyConstraints({ advanced: [{ zoom: v }] }); } catch (err) { } }
                                        else {
                                            const container = document.getElementById(readerElementId);
                                            const video = container?.querySelector('video') as HTMLElement | null;
                                            const canvas = container?.querySelector('canvas') as HTMLElement | null;
                                            const target = video || canvas || container;
                                            if (target) { (target as HTMLElement).style.transform = `scale(${v})`; (target as HTMLElement).style.transformOrigin = 'center center'; }
                                        }
                                    }
                                }} className="w-36" />
                            </div>
                            {torchAvailable && <button onClick={toggleTorch} className="bg-yellow-400 text-black px-3 py-2 rounded-md font-semibold">{torchOn ? 'Lanterna On' : 'Lanterna'}</button>}

                            <div className="ml-auto">
                                <button onClick={stopScanner} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Cancelar</button>
                            </div>
                        </div>
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
                            <Camera className="w-8 h-8" />
                            <span>Escanear</span>
                        </button>
                    </div>
                )}
                {scanError && <p className="mt-4 text-red-400 bg-red-900/50 px-4 py-2 rounded-md">{scanError}</p>}
            </main>

            {scannedItem && <CheckoutModal item={scannedItem} onClose={reset} onConfirm={handleCheckout} />}
            {showSuccess && <SuccessOverlay onDismiss={reset} itemName={successItemName} />}
        </div>
    );
};

export default CollaboratorDashboard;
