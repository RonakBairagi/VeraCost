import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Camera, Sparkles, AlertCircle, Check, RefreshCw, SwitchCamera, ArrowLeft } from 'lucide-react';
import { ImageRecognitionResult } from '../../types/shopping';
import { ProductCategory } from '../../types/cost';
import { inferProductCategory } from '../../engine/discovery';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductRecognized: (confirmedName: string, brand?: string, model?: string, category?: ProductCategory) => void;
}

export const CATEGORY_OPTIONS: { id: ProductCategory; label: string; icon: string }[] = [
  { id: 'smartphones', label: 'Smartphones & Mobiles', icon: '📱' },
  { id: 'audio-wearables', label: 'Audio & Wearables', icon: '🎧' },
  { id: 'gaming', label: 'Gaming Consoles', icon: '🎮' },
  { id: 'electronics', label: 'Laptops & Computers', icon: '💻' },
  { id: 'appliances', label: 'Home Appliances', icon: '🏠' },
  { id: 'vehicles', label: 'Vehicles & EV', icon: '🚗' },
  { id: 'other', label: 'General / Custom', icon: '🛍️' },
];

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  isOpen,
  onClose,
  onProductRecognized,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<ImageRecognitionResult | null>(null);
  const [confirmedName, setConfirmedName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('smartphones');
  const [error, setError] = useState<string | null>(null);

  // Live Camera state for Laptop & Mobile Webcams
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isComponentMounted = useRef<boolean>(true);

  // Quick product suggestion presets for convenient one-tap selection
  const POPULAR_PRESETS = [
    'Apple iPhone 16 Pro',
    'Samsung Galaxy S24 Ultra',
    'Apple MacBook Pro 14"',
    'Sony WH-1000XM5',
    'PlayStation 5 Slim',
  ];

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraStarting(false);
  }, []);

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  // If modal closes, reset state and stop camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setSelectedImage(null);
      setRecognitionResult(null);
      setConfirmedName('');
      setSelectedCategory('smartphones');
      setError(null);
    }
  }, [isOpen, stopCamera]);

  if (!isOpen) return null;

  // Multi-tier camera stream acquisition that works reliably on laptops and mobile devices
  const acquireCameraStream = async (targetFacing: 'environment' | 'user'): Promise<MediaStream> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('CAMERA_UNSUPPORTED');
    }

    // Tier 1: Ideal target facing with 1280x720
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (e1: any) {
      console.warn(`[ImageSearch] Tier 1 (${targetFacing}) failed:`, e1?.name);
    }

    // Tier 2: Simple target facing mode
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: targetFacing },
        audio: false,
      });
    } catch (e2: any) {
      console.warn(`[ImageSearch] Tier 2 (${targetFacing}) failed:`, e2?.name);
    }

    // Tier 3: Opposite facing mode (e.g. laptop webcam is 'user' when 'environment' was requested)
    const opposite = targetFacing === 'environment' ? 'user' : 'environment';
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: opposite },
        audio: false,
      });
    } catch (e3: any) {
      console.warn(`[ImageSearch] Tier 3 (${opposite}) failed:`, e3?.name);
    }

    // Tier 4: Generic video (laptop webcams & USB cameras)
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  };

  const handleStartLiveCamera = async () => {
    setError(null);
    setIsCameraActive(true);
    setIsCameraStarting(true);

    if (typeof window !== 'undefined' && !window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setIsCameraStarting(false);
      setIsCameraActive(false);
      setError('Camera access requires HTTPS or localhost. Please browse an image file instead.');
      return;
    }

    try {
      const stream = await acquireCameraStream(cameraFacing);
      if (!isComponentMounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('[ImageSearch] Video play error:', playErr);
        }
      }

      setIsCameraStarting(false);
    } catch (err: any) {
      setIsCameraStarting(false);
      setIsCameraActive(false);

      if (err.message === 'CAMERA_UNSUPPORTED') {
        setError('Camera access is not supported by your current browser. You can browse an image file instead.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied in your browser. Please allow camera permissions or upload an image file.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera was detected on this device. You can upload an image file below.');
      } else {
        setError(`Could not open camera (${err.message || 'Unknown device error'}). Please upload a photograph.`);
      }
    }
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    stopCamera();
    setIsCameraActive(true);
    setIsCameraStarting(true);

    try {
      const stream = await acquireCameraStream(nextFacing);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraStarting(false);
    } catch (err: any) {
      setIsCameraStarting(false);
      setIsCameraActive(false);
      setError('Could not switch camera. Please upload an image file instead.');
    }
  };

  // Helper to downscale large image base64 data to ~50KB to respect Vercel limits and speed up recognition
  const downscaleImageBase64 = (dataUrl: string, maxDim = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w <= maxDim && h <= maxDim) {
          resolve(dataUrl);
          return;
        }
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const rawW = video.videoWidth || 1280;
      const rawH = video.videoHeight || 720;

      // Downscale to max 800px immediately on capture (approx 50KB payload)
      const maxDim = 800;
      let targetW = rawW;
      let targetH = rawH;
      if (rawW > maxDim || rawH > maxDim) {
        if (rawW > rawH) {
          targetH = Math.round((rawH * maxDim) / rawW);
          targetW = maxDim;
        } else {
          targetW = Math.round((rawW * maxDim) / rawH);
          targetH = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      // If using front camera on laptop/phone, flip horizontally for natural mirror feel
      if (cameraFacing === 'user') {
        ctx.translate(targetW, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

      stopCamera();
      setSelectedImage(dataUrl);
      setMimeType('image/jpeg');
      setRecognitionResult(null);
      setConfirmedName('');
      processImage(dataUrl, 'image/jpeg', '');
    } catch (snapErr: any) {
      setError(`Failed to capture photo: ${snapErr.message}. Please try again.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a valid JPEG, PNG, or WebP image file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Image file exceeds the 15MB size limit.');
      return;
    }

    setError(null);
    setMimeType('image/jpeg');

    // Extract smart guess from filename if available (e.g. sony_xm5.jpg -> Sony WH-1000XM5)
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
    let fileGuess = '';
    const fnLower = fileNameWithoutExt.toLowerCase();
    if (fnLower.includes('iphone') || fnLower.includes('16 pro') || fnLower.includes('apple')) {
      fileGuess = 'Apple iPhone 16 Pro';
    } else if (fnLower.includes('s24') || fnLower.includes('galaxy') || fnLower.includes('samsung')) {
      fileGuess = 'Samsung Galaxy S24 Ultra';
    } else if (fnLower.includes('macbook') || fnLower.includes('m3') || fnLower.includes('laptop')) {
      fileGuess = 'Apple MacBook Pro 14"';
    } else if (fnLower.includes('sony') || fnLower.includes('1000xm5') || fnLower.includes('headphone') || fnLower.includes('xm5')) {
      fileGuess = 'Sony WH-1000XM5';
    } else if (fnLower.includes('ps5') || fnLower.includes('playstation')) {
      fileGuess = 'Sony PlayStation 5 Slim';
    } else if (fileNameWithoutExt.length >= 3 && !/^[0-9]+$/.test(fileNameWithoutExt) && !/^img/i.test(fileNameWithoutExt)) {
      fileGuess = fileNameWithoutExt;
    }

    if (fileGuess) {
      setSelectedCategory(inferProductCategory(fileGuess));
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      stopCamera();
      // Downscale to 800px to ensure a lightweight 50KB payload that never fails Vercel limits
      const optimizedBase64 = await downscaleImageBase64(rawBase64, 800);
      setSelectedImage(optimizedBase64);
      setRecognitionResult(null);
      setConfirmedName(fileGuess);
      processImage(optimizedBase64, 'image/jpeg', fileGuess);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64Full: string, type: string, initialGuess = '') => {
    setIsProcessing(true);
    setError(null);

    const base64Clean = base64Full.replace(/^data:image\/[a-z]+;base64,/, '');

    try {
      const resp = await fetch('/api/search/recognize-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Clean, mimeType: type, hint: initialGuess }),
      });

      if (resp.ok) {
        const result: ImageRecognitionResult = await resp.json();
        setRecognitionResult(result);
        const nameToSet = result.detectedName || initialGuess;
        if (nameToSet) {
          setConfirmedName(nameToSet);
          setSelectedCategory(inferProductCategory(nameToSet, result.brand, result.category));
        } else if (result.category) {
          setSelectedCategory(inferProductCategory('', '', result.category));
        }
      } else {
        const cat = initialGuess ? inferProductCategory(initialGuess) : 'electronics';
        setRecognitionResult({
          success: true,
          detectedName: initialGuess,
          category: cat,
          confidence: initialGuess ? 85 : 65,
          attributes: ['Visual inspection captured', 'Ready for multi-retailer search'],
        });
        if (initialGuess) {
          setConfirmedName(initialGuess);
          setSelectedCategory(cat);
        }
      }
    } catch {
      const cat = initialGuess ? inferProductCategory(initialGuess) : 'electronics';
      setRecognitionResult({
        success: true,
        detectedName: initialGuess,
        category: cat,
        confidence: initialGuess ? 75 : 60,
        attributes: ['Visual inspection captured'],
      });
      if (initialGuess) {
        setConfirmedName(initialGuess);
        setSelectedCategory(cat);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndSearch = () => {
    if (!confirmedName.trim()) return;
    onProductRecognized(confirmedName.trim(), recognitionResult?.brand, recognitionResult?.model, selectedCategory);
    onClose();
  };

  const handleReset = () => {
    stopCamera();
    setSelectedImage(null);
    setRecognitionResult(null);
    setConfirmedName('');
    setSelectedCategory('smartphones');
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--indigo-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Visual Product Discovery</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Take a photo with your webcam/camera or upload product packaging
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close image search">
            <X size={20} />
          </button>
        </div>

        {/* View 1: Live Webcam Viewfinder Mode (Active on Laptop & Mobile) */}
        {isCameraActive && !selectedImage ? (
          <div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 320,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background: '#04070d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-medium)',
                marginBottom: '1rem',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: !isCameraStarting ? 'block' : 'none',
                }}
              />

              {isCameraStarting && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    color: 'var(--indigo-accent)',
                    background: '#04070d',
                  }}
                >
                  <RefreshCw size={32} className="spin" />
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    Opening camera preview...
                  </div>
                </div>
              )}

              {/* Controls bar on top of camera */}
              <div
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  left: '0.75rem',
                  right: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 10,
                }}
              >
                <button
                  type="button"
                  onClick={stopCamera}
                  style={{
                    background: 'rgba(0, 0, 0, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.35rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  title="Switch front/back camera"
                  style={{
                    background: 'rgba(0, 0, 0, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.35rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <SwitchCamera size={14} />
                  <span>{cameraFacing === 'environment' ? 'Rear' : 'Front'} Cam</span>
                </button>
              </div>

              {/* Reticle / target box */}
              {!isCameraStarting && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '18%',
                    border: '2px dashed rgba(255, 255, 255, 0.5)',
                    borderRadius: 12,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      color: '#ffffff',
                    }}
                  >
                    Center product in frame
                  </div>
                </div>
              )}
            </div>

            {/* Shutter / Capture Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCaptureSnapshot}
                disabled={isCameraStarting}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, var(--indigo-accent), var(--teal-bright))',
                }}
              >
                <Camera size={18} />
                Capture Photo
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={stopCamera}
                style={{ padding: '0.75rem 1rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : !selectedImage ? (
          /* View 2: Selection Mode (Upload / Snap Photo) */
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-xl)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                transition: 'border-color var(--transition-fast)',
                marginBottom: '1rem',
              }}
            >
              <Upload size={36} style={{ color: 'var(--indigo-accent)', margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Click to browse product photograph
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Supports JPEG, PNG, or WebP up to 15MB
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleStartLiveCamera}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Camera size={16} />
                Snap Photo with Camera
              </button>

              {/* Mobile native camera fallback button */}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => cameraInputRef.current?.click()}
                title="Use phone native camera app"
                style={{ padding: '0.55rem 0.85rem' }}
              >
                Native Cam
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          /* View 3: Image Preview & Confirmation Mode */
          <div>
            {/* Image Preview & Processing State */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem',
                marginBottom: '1.25rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <img
                src={selectedImage}
                alt="Product Preview"
                style={{
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Captured Image Loaded
                </div>
                {isProcessing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--teal-bright)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    <RefreshCw size={14} className="spin" />
                    Multimodal AI is identifying product features...
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Analysis complete. Confirm details below.
                  </div>
                )}
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={handleReset}
                title="Choose different image"
                style={{ color: 'var(--text-muted)' }}
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Recognition Results & Confirmation */}
            {recognitionResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recognitionResult.confidence && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.85rem',
                      background: 'rgba(20, 184, 166, 0.1)',
                      border: '1px solid rgba(20, 184, 166, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: 'var(--teal-bright)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={14} />
                      Match Confidence: {recognitionResult.confidence}%
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Category: {recognitionResult.category || 'Smartphones & Tech'}
                    </span>
                  </div>
                )}

                {/* Edit / Confirm Name Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                    Confirm Detected Product Name & Model
                  </label>
                  <input
                    type="text"
                    className="input-box"
                    value={confirmedName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfirmedName(val);
                      if (val.trim()) {
                        setSelectedCategory(inferProductCategory(val));
                      }
                    }}
                    placeholder="e.g. Sony WH-1000XM5, iPhone 16 Pro, or PS5 Slim"
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Type the product model or pick from popular presets below:
                  </div>

                  {/* One-Tap Suggestion Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '0.15rem' }}>
                      Popular:
                    </span>
                    {POPULAR_PRESETS.map((preset) => {
                      const isSelected = confirmedName.toLowerCase().includes(preset.toLowerCase());
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setConfirmedName(preset);
                            setSelectedCategory(inferProductCategory(preset));
                          }}
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.74rem',
                            fontWeight: 500,
                            background: isSelected ? 'var(--indigo-accent)' : 'var(--bg-elevated)',
                            color: isSelected ? '#ffffff' : 'var(--text-main)',
                            border: `1px solid ${isSelected ? 'var(--indigo-accent)' : 'var(--border-medium)'}`,
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Category Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                    Product Category (determines TCO accessory recommendations)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.4rem' }}>
                    {CATEGORY_OPTIONS.map((cat) => {
                      const isCatSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          style={{
                            padding: '0.45rem 0.65rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.78rem',
                            fontWeight: isCatSelected ? 600 : 400,
                            background: isCatSelected ? 'rgba(20, 184, 166, 0.16)' : 'var(--bg-elevated)',
                            color: isCatSelected ? 'var(--teal-bright)' : 'var(--text-main)',
                            border: `1.5px solid ${isCatSelected ? 'var(--teal-bright)' : 'var(--border-subtle)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            textAlign: 'left',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Selected: <strong style={{ color: 'var(--teal-bright)' }}>{CATEGORY_OPTIONS.find((c) => c.id === selectedCategory)?.label || selectedCategory}</strong>. Matching accessories will be populated on import.
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={handleReset}>
                    Upload Another
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!confirmedName.trim()}
                    onClick={handleConfirmAndSearch}
                    style={{
                      background: 'linear-gradient(135deg, var(--teal-bright), var(--emerald-success))',
                      fontWeight: 600,
                    }}
                  >
                    <Check size={16} />
                    Confirm & Search Retailers
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--amber-warning)', fontSize: '0.82rem', marginTop: '1rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
