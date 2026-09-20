'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, RotateCw, Check, Upload, AlertTriangle } from 'lucide-react';

interface DirectCameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function DirectCameraCapture({ onCapture, onCancel }: DirectCameraCaptureProps) {
  const [cameraState, setCameraState] = useState<'initializing' | 'live' | 'captured' | 'permission_denied' | 'unsupported'>('initializing');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCurrentStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
  };

  // Start live stream
  const startCamera = async (mode: 'environment' | 'user') => {
    stopCurrentStream();
    setCameraState('initializing');
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unsupported');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err) {
        // Fallback if ideal facingMode fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState('live');
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied by your browser.');
        setCameraState('permission_denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device detected on this device.');
        setCameraState('unsupported');
      } else {
        setErrorMessage(err.message || 'Unable to access camera.');
        setCameraState('permission_denied');
      }
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      stopCurrentStream();
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, []);

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `camera_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);

        setCapturedFile(file);
        setCapturedPreviewUrl(previewUrl);

        stopCurrentStream();
        setCameraState('captured');
      },
      'image/jpeg',
      0.85
    );
  };

  const handleRetake = () => {
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
      setCapturedPreviewUrl(null);
    }
    setCapturedFile(null);
    startCamera(facingMode);
  };

  const handleConfirmUsePhoto = () => {
    if (capturedFile) {
      stopCurrentStream();
      onCapture(capturedFile);
    }
  };

  const handleClose = () => {
    stopCurrentStream();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden">
      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Bar */}
      <div className="p-4 flex items-center justify-between z-20 bg-gradient-to-b from-slate-950/80 to-transparent">
        <button
          onClick={handleClose}
          className="bg-slate-800/80 hover:bg-slate-700 text-white font-bold p-2.5 rounded-full backdrop-blur transition-all flex items-center space-x-1"
          title="Close Camera"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-white text-xs font-bold font-mono tracking-widest uppercase bg-slate-900/60 px-3 py-1 rounded-full border border-slate-700/50">
          Direct Camera Capture
        </span>

        {cameraState === 'live' ? (
          <button
            onClick={handleSwitchCamera}
            className="bg-slate-800/80 hover:bg-slate-700 text-white font-bold p-2.5 rounded-full backdrop-blur transition-all"
            title="Switch Camera (Front/Rear)"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Main Viewfinder / Camera Area */}
      <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
        {cameraState === 'initializing' && (
          <div className="flex flex-col items-center justify-center text-white space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-xs font-bold text-slate-300">Initializing device camera...</p>
          </div>
        )}

        {(cameraState === 'live' || cameraState === 'initializing') && (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Scanning Overlay Box */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              <div className="w-72 h-72 border-2 border-dashed border-emerald-400/90 rounded-3xl relative flex items-center justify-center shadow-[0_0_50px_rgba(52,211,153,0.2)]">
                <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              </div>

              <div className="mt-6 bg-slate-950/80 backdrop-blur border border-slate-700/80 px-4 py-2 rounded-2xl text-center max-w-xs">
                <p className="text-xs font-bold text-emerald-400">Align item inside frame</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Point at Wai Wai, momo, SIM pack, souvenirs, gear, or menu
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Captured Photo Preview State */}
        {cameraState === 'captured' && capturedPreviewUrl && (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            <img
              src={capturedPreviewUrl}
              alt="Captured Frame Preview"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Permission Denied UI */}
        {cameraState === 'permission_denied' && (
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl max-w-sm mx-4 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-950 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-800">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Camera Access Required</h3>
              <p className="text-xs text-slate-400 mt-1">
                {errorMessage || 'Camera access is required to scan directly in browser.'}
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => startCamera(facingMode)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition-all"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-xs transition-all"
              >
                Upload Image Instead
              </button>
            </div>
          </div>
        )}

        {/* Unsupported Browser UI */}
        {cameraState === 'unsupported' && (
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl max-w-sm mx-4 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-950 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-800">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Direct Camera Unsupported</h3>
              <p className="text-xs text-slate-400 mt-1">
                Direct camera capture isn't supported in this browser environment. Please select an image file to upload instead.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Image Instead</span>
            </button>
          </div>
        )}
      </div>

      {/* Controls Bar at Bottom */}
      <div className="p-6 bg-gradient-to-t from-slate-950 to-transparent flex items-center justify-center z-20">
        {cameraState === 'live' && (
          <button
            onClick={handleCapturePhoto}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform shadow-2xl"
            title="Take Photo"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500" />
          </button>
        )}

        {cameraState === 'captured' && (
          <div className="flex items-center space-x-4 w-full max-w-md">
            <button
              onClick={handleRetake}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center space-x-2 text-sm border border-slate-700"
            >
              <RotateCw className="w-4 h-4" />
              <span>Retake</span>
            </button>

            <button
              onClick={handleConfirmUsePhoto}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center space-x-2 text-sm shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Use Photo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
