import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Type, Image as ImageIcon, Save, ShoppingCart, RotateCw, Trash2, Eraser, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { BACKEND_URL, getApiErrorMessage, getDemoSession } from '../lib/api';
import { HexColorPicker } from 'react-colorful';
import { APPAREL_PRODUCTS } from '../data/products';
import { normalizeColorHex, resolveProductVisual } from '../lib/productVisuals';

const CANVAS_WIDTH = 620;
const CANVAS_HEIGHT = 700;

const FONT_OPTIONS = [
  'Arial',
  'Poppins',
  'Montserrat',
  'Georgia',
  'Times New Roman',
  'Trebuchet MS',
  'Courier New',
  'Impact',
  'Comic Sans MS',
];


const DEMO_DESIGNS_KEY = 'desire_demo_designs';
const INTEGRATED_STICKER_KEY = 'desire_integrated_sticker_url';

const saveDemoDesign = (designPayload) => {
  const existing = JSON.parse(localStorage.getItem(DEMO_DESIGNS_KEY) || '[]');
  const design = {
    design_id: 'demo_design_' + Date.now(),
    ...designPayload,
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(DEMO_DESIGNS_KEY, JSON.stringify([design, ...existing]));
  return design;
};

function CustomizePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const baseImageRef = useRef(null);
  const printAreaRef = useRef(null);
  const printGuideRef = useRef(null);
  const loadSeqRef = useRef(0);

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#e8e8e8');
  const [selectedSize, setSelectedSize] = useState('M');
  const [view, setView] = useState('front');

  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#111111');
  const [textFont, setTextFont] = useState('Poppins');
  const [textSize, setTextSize] = useState(42);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingIntegratedSticker, setPendingIntegratedSticker] = useState(null);

  const preselectedProduct = location.state?.selectedProduct;
  const preselectedColor = location.state?.selectedColor;

  const loadFabric = useCallback(async () => {
    if (fabricRef.current) return fabricRef.current;
    const mod = await import('fabric');
    const f = mod.fabric || mod;
    fabricRef.current = f;
    return f;
  }, []);

  const loadImageElement = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }, []);

  const getEditableObjects = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    return canvas.getObjects().filter((obj) => obj?.data?.editable);
  }, []);

  const keepObjectInPrintArea = useCallback((obj) => {
    const canvas = canvasRef.current;
    if (!canvas || !obj || !obj.data?.editable) return;

    obj.setCoords();
    const b = obj.getBoundingRect(true, true);
    let dx = 0;
    let dy = 0;

    if (b.left < 0) dx = -b.left;
    if (b.top < 0) dy = -b.top;
    if (b.left + b.width > canvas.getWidth()) dx = canvas.getWidth() - (b.left + b.width);
    if (b.top + b.height > canvas.getHeight()) dy = canvas.getHeight() - (b.top + b.height);

    obj.left += dx;
    obj.top += dy;
    obj.setCoords();
  }, []);

  const createPrintClip = useCallback(async () => null, []);

  const updateEditableObjectClips = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objs = getEditableObjects();
    for (const obj of objs) {
      obj.clipPath = undefined;
      keepObjectInPrintArea(obj);
    }
    canvas.requestRenderAll();
  }, [getEditableObjects, keepObjectInPrintArea]);

  const addPrintGuide = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (printGuideRef.current) {
      canvas.remove(printGuideRef.current);
      printGuideRef.current = null;
      canvas.requestRenderAll();
    }
  }, []);

  const clearEditableObjects = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    getEditableObjects().forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    if (printGuideRef.current) { if (canvas.bringObjectToFront) canvas.bringObjectToFront(printGuideRef.current); else if (printGuideRef.current.bringToFront) printGuideRef.current.bringToFront(); }
    canvas.requestRenderAll();
  }, [getEditableObjects]);

  const applyBaseColor = useCallback(async (hexColor) => {
    const canvas = canvasRef.current;
    const base = baseImageRef.current;
    const f = await loadFabric();
    if (!canvas || !base || !f?.filters?.BlendColor) return;

    const color = normalizeColorHex(hexColor);
    const alpha = color.toLowerCase() === '#ffffff' ? 0.14 : 0.5;

    base.filters = [
      new f.filters.BlendColor({
        color,
        mode: 'tint',
        alpha,
      }),
    ];

    if (typeof base.applyFilters === 'function') base.applyFilters();
    canvas.requestRenderAll();
  }, [loadFabric]);

  const loadBaseProduct = useCallback(async (product, color, resetDesign = false) => {
    if (!product) return;

    const canvas = canvasRef.current;
    const f = await loadFabric();
    const FabricImageClass = f?.FabricImage || f?.Image;
    if (!canvas || !FabricImageClass) return;

    const loadId = ++loadSeqRef.current;
    const visual = resolveProductVisual(product);

    const candidates = [
      visual.imageUrl,
      `${window.location.origin}${visual.imageUrl}`,
      `${process.env.PUBLIC_URL || ''}${visual.imageUrl}`,
    ];

    let htmlImage = null;
    for (const src of candidates) {
      try {
        htmlImage = await loadImageElement(src);
        break;
      } catch {
        // try next
      }
    }

    if (!htmlImage || loadId !== loadSeqRef.current) {
      console.error('Template could not load:', visual.imageUrl);
      return;
    }

    if (baseImageRef.current) {
      canvas.remove(baseImageRef.current);
      baseImageRef.current = null;
    }

    const img = new FabricImageClass(htmlImage, {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2 + 10,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      hoverCursor: 'default',
    });

    const targetW = CANVAS_WIDTH * 0.82;
    const targetH = CANVAS_HEIGHT * 0.82;
    const scale = Math.min(targetW / Math.max(img.width || 1, 1), targetH / Math.max(img.height || 1, 1));
    img.scale(scale);
    img.flipX = view === 'back';

    baseImageRef.current = img;
    canvas.add(img);
    if (canvas.sendObjectToBack) canvas.sendObjectToBack(img); else if (img.sendToBack) img.sendToBack();

    const baseW = img.getScaledWidth();
    const baseH = img.getScaledHeight();
    const baseLeft = img.left - baseW / 2;
    const baseTop = img.top - baseH / 2;
    printAreaRef.current = {
      left: baseLeft + baseW * 0.04,
      top: baseTop + baseH * 0.04,
      width: baseW * 0.92,
      height: baseH * 0.92,
    };

    await addPrintGuide();
    await updateEditableObjectClips();
    await applyBaseColor(color);

    if (resetDesign) clearEditableObjects();
    canvas.requestRenderAll();
  }, [addPrintGuide, applyBaseColor, clearEditableObjects, loadFabric, loadImageElement, updateEditableObjectClips, view]);

  const initCanvas = useCallback(async () => {
    const f = await loadFabric();
    if (!f?.Canvas) throw new Error('Fabric Canvas unavailable');

    if (canvasRef.current) {
      canvasRef.current.dispose();
      canvasRef.current = null;
    }

    const canvas = new f.Canvas('design-canvas', {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#f3f3f3',
      preserveObjectStacking: true,
      selection: true,
    });

    canvas.on('object:moving', (e) => keepObjectInPrintArea(e.target));
    canvas.on('object:scaling', (e) => keepObjectInPrintArea(e.target));
    canvas.on('object:rotating', (e) => keepObjectInPrintArea(e.target));
    canvas.on('object:modified', (e) => keepObjectInPrintArea(e.target));

    canvas.on('mouse:dblclick', (e) => {
      if (e.target?.type === 'i-text') {
        e.target.enterEditing();
        e.target.selectAll();
        canvas.requestRenderAll();
      }
    });

    canvasRef.current = canvas;
  }, [keepObjectInPrintArea, loadFabric]);

  const applyPreferredSelection = useCallback((allProducts) => {
    if (!allProducts.length) return;

    let chosen = allProducts[0];
    if (preselectedProduct) {
      const matched = allProducts.find(
        (p) => p.product_id === preselectedProduct.product_id || p.type === preselectedProduct.type || p.name === preselectedProduct.name
      );
      if (matched) chosen = matched;
    }

    const preferred = normalizeColorHex(preselectedColor || chosen.colors?.[0] || '#e8e8e8');
    const available = (chosen.colors || []).map(normalizeColorHex);

    setSelectedProduct(chosen);
    setSelectedSize(chosen.sizes?.[0] || 'M');
    setSelectedColor(available.includes(preferred) ? preferred : available[0] || '#e8e8e8');
  }, [preselectedColor, preselectedProduct]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/products`);
      setProducts(response.data);
      applyPreferredSelection(response.data);
    } catch {
      setProducts(APPAREL_PRODUCTS);
      applyPreferredSelection(APPAREL_PRODUCTS);
    }
  }, [applyPreferredSelection]);

  useEffect(() => {
    initCanvas()
      .then(fetchProducts)
      .catch((error) => {
        console.error(error);
        alert('Customization workspace failed to initialize. Please refresh.');
      });


    const integratedSticker = localStorage.getItem(INTEGRATED_STICKER_KEY);
    if (integratedSticker) {
      setPendingIntegratedSticker(integratedSticker);
      localStorage.removeItem(INTEGRATED_STICKER_KEY);
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, [fetchProducts, initCanvas]);

  useEffect(() => {
    if (selectedProduct) {
      loadBaseProduct(selectedProduct, normalizeColorHex(selectedColor || selectedProduct.colors?.[0] || '#e8e8e8'), true);
    }
  }, [selectedProduct, loadBaseProduct]);

  useEffect(() => {
    applyBaseColor(selectedColor);
  }, [selectedColor, applyBaseColor]);

  useEffect(() => {
    const base = baseImageRef.current;
    const canvas = canvasRef.current;
    if (base && canvas) {
      base.flipX = view === 'back';
      canvas.requestRenderAll();
    }
  }, [view]);

  const addImageToCanvas = useCallback(async (src) => {
    const canvas = canvasRef.current;
    const base = baseImageRef.current;
    const f = await loadFabric();
    const FabricImageClass = f?.FabricImage || f?.Image;
    if (!canvas || !FabricImageClass) return;

    let img = null;
    if (typeof FabricImageClass.fromURL === 'function') {
      const maybePromise = FabricImageClass.fromURL(src, { crossOrigin: 'anonymous' });
      if (maybePromise && typeof maybePromise.then === 'function') {
        img = await maybePromise;
      } else {
        img = await new Promise((resolve) => {
          FabricImageClass.fromURL(
            src,
            (loaded) => resolve(loaded || null),
            { crossOrigin: 'anonymous' }
          );
        });
      }
    }

    if (!img) {
      const imageElement = await loadImageElement(src);
      img = new FabricImageClass(imageElement, { crossOrigin: 'anonymous' });
    }
    if (!img) return;

    const fitBaseW = base ? base.getScaledWidth() : canvas.getWidth() * 0.7;
    const fitBaseH = base ? base.getScaledHeight() : canvas.getHeight() * 0.7;
    const fit = Math.min((fitBaseW * 0.3) / Math.max(img.width, 1), (fitBaseH * 0.3) / Math.max(img.height, 1), 1);

    img.set({
      left: base ? base.left : canvas.getWidth() / 2,
      top: base ? base.top : canvas.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      cornerStyle: 'circle',
      transparentCorners: false,
      borderColor: '#ba4a1f',
      cornerColor: '#ba4a1f',
      data: { editable: true, kind: 'image' },
    });
    img.scale(fit);
    img.clipPath = undefined;

    canvas.add(img);
    keepObjectInPrintArea(img);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [keepObjectInPrintArea, loadFabric, loadImageElement]);
  useEffect(() => {
    if (!pendingIntegratedSticker || !selectedProduct) return;

    const insertSticker = async () => {
      try {
        await addImageToCanvas(pendingIntegratedSticker);
      } catch (error) {
        console.error('Failed to add AI sticker:', error);
      } finally {
        setPendingIntegratedSticker(null);
      }
    };

    insertSticker();
  }, [pendingIntegratedSticker, selectedProduct, addImageToCanvas]);

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${BACKEND_URL}/api/upload`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await addImageToCanvas(`${BACKEND_URL}${response.data.url}`);
    } catch (error) {
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await addImageToCanvas(dataUrl);
      } catch (fallbackError) {
        console.error(fallbackError);
        alert(getApiErrorMessage(error, 'Image upload failed'));
      }
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleAddText = async () => {
    const canvas = canvasRef.current;
    const base = baseImageRef.current;
    const f = await loadFabric();
    if (!canvas || !textInput.trim() || !f?.IText) return;

    const text = new f.IText(textInput, {
      left: base ? base.left : canvas.getWidth() / 2,
      top: base ? base.top : canvas.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      fontSize: textSize,
      fill: textColor,
      fontFamily: textFont,
      fontWeight: '700',
      textAlign: 'center',
      cornerStyle: 'circle',
      transparentCorners: false,
      borderColor: '#ba4a1f',
      cornerColor: '#ba4a1f',
      data: { editable: true, kind: 'text' },
    });

    text.clipPath = undefined;
    canvas.add(text);
    keepObjectInPrintArea(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.requestRenderAll();
    setTextInput('');
  };
  const handleRotate = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj || !obj.data?.editable) return;
    obj.rotate((obj.angle || 0) + 15);
    keepObjectInPrintArea(obj);
    canvas.requestRenderAll();
  };

  const handleDeleteSelected = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj || !obj.data?.editable) return;
    canvas.remove(obj);
    canvas.requestRenderAll();
  };

  const handleResetDesign = () => clearEditableObjects();

  const serializeEditableElements = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return [];

    return getEditableObjects().map((obj, index) => ({
      id: obj.id || `element_${index}`,
      type: obj.type,
      content: obj.type === 'i-text' ? obj.text : obj.src,
      position: { x: obj.left, y: obj.top },
      size: { width: obj.width * obj.scaleX, height: obj.height * obj.scaleY },
      rotation: obj.angle,
      style: {
        color: obj.fill,
        fontFamily: obj.fontFamily,
        fontSize: obj.fontSize,
      },
      layer: index,
    }));
  }, [getEditableObjects]);

  const handleSaveDesign = async () => {
    if (!selectedProduct) return;
    setLoading(true);

    const payload = {
      product_id: selectedProduct.product_id,
      product_color: selectedColor,
      elements: serializeEditableElements(),
    };

    try {
      await axios.post(`${BACKEND_URL}/api/designs`, payload, { withCredentials: true });
      alert('Design saved successfully!');
    } catch (error) {
      const demoUser = getDemoSession();
      if (demoUser?.user_id) {
        saveDemoDesign({ ...payload, user_id: demoUser.user_id });
        alert('Design saved successfully! (demo mode)');
      } else {
        alert(getApiErrorMessage(error, 'Error saving design'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const designResponse = await axios.post(
        `${BACKEND_URL}/api/designs`,
        {
          product_id: selectedProduct.product_id,
          product_color: selectedColor,
          elements: serializeEditableElements(),
        },
        { withCredentials: true }
      );

      await axios.post(
        `${BACKEND_URL}/api/cart`,
        {
          design_id: designResponse.data.design_id,
          product_id: selectedProduct.product_id,
          product_color: selectedColor,
          size: selectedSize,
          price: selectedProduct.base_price,
        },
        { withCredentials: true }
      );

      alert('Added to cart!');
      navigate('/cart');
    } catch {
      alert('Error adding to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleExportDesign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2, quality: 1 });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `design-${selectedProduct?.type || 'apparel'}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen theme-page pb-10">
      <Navbar />

      <div className="theme-shell pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="customizer-title" data-testid="customize-title">Customize Your Apparel</h1>

          <div className="customizer-layout">
            <div>
              <div className="glass rounded-2xl p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-600">Live Product Preview</p>
                  <p className="text-xs text-slate-500">Double click text to edit</p>
                </div>

                <div className="w-full overflow-auto rounded-xl border border-slate-300 bg-[#ece8e3] p-3 md:p-4">
                  <div className="mx-auto" style={{ width: CANVAS_WIDTH, minWidth: CANVAS_WIDTH }}>
                    <canvas id="design-canvas" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{selectedProduct?.name || 'Select Product'}</p>
                    <p className="text-sm text-slate-600">Color: {selectedColor}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleRotate} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-2 text-sm" data-testid="rotate-button">
                      <RotateCw className="h-4 w-4" /> Rotate
                    </button>
                    <button onClick={handleDeleteSelected} className="px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 flex items-center gap-2 text-sm" data-testid="delete-button">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                    <button onClick={handleResetDesign} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2 text-sm">
                      <Eraser className="h-4 w-4" /> Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass rounded-2xl p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Product Selector</label>
                  <select
                    className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3"
                    value={selectedProduct?.product_id || ''}
                    onChange={(e) => {
                      const product = products.find((p) => p.product_id === e.target.value);
                      if (!product) return;
                      setSelectedProduct(product);
                      setSelectedColor(normalizeColorHex(product.colors?.[0] || '#e8e8e8'));
                      setSelectedSize(product.sizes?.[0] || 'M');
                    }}
                    data-testid="product-selector"
                  >
                    {products.map((product) => (
                      <option key={product.product_id} value={product.product_id}>{product.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Product Color</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct?.colors?.map((color) => {
                      const hex = normalizeColorHex(color);
                      return (
                        <button
                          key={hex}
                          type="button"
                          className={`w-10 h-10 rounded-full border-4 transition-all ${selectedColor === hex ? 'border-indigo-600 scale-105' : 'border-transparent'}`}
                          style={{ backgroundColor: hex }}
                          onClick={() => setSelectedColor(hex)}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct?.sizes?.map((size) => (
                      <button
                        key={size}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold ${selectedSize === size ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">View</label>
                  <div className="flex gap-2">
                    <button className={`flex-1 px-3 py-2 rounded-lg ${view === 'front' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`} onClick={() => setView('front')}>Front</button>
                    <button className={`flex-1 px-3 py-2 rounded-lg ${view === 'back' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`} onClick={() => setView('back')}>Back</button>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2"><ImageIcon className="h-5 w-5" />Sticker / Logo Upload</h3>
                <label className="block w-full cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" data-testid="image-upload-input" />
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600">Click to upload</p>
                  </div>
                </label>
                <button
                  onClick={() => navigate('/sticker-maker')}
                  className="mt-3 w-full rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 transition-colors"
                  data-testid="open-sticker-maker-button"
                >
                  Open AI Sticker Maker
                </button>
              </div>

              <div className="glass rounded-2xl p-6 relative">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Type className="h-5 w-5" />Add Text</h3>
                <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Enter text" className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3 mb-3" data-testid="text-input" />

                <label className="text-sm font-semibold mb-1 block">Font</label>
                <select value={textFont} onChange={(e) => setTextFont(e.target.value)} className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3 mb-3">
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                  ))}
                </select>

                <label className="text-sm font-semibold mb-1 block">Font Size</label>
                <input type="range" min="20" max="90" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full mb-3" />

                <label className="text-sm font-semibold mb-2 block">Text Color</label>
                <button className="w-12 h-12 rounded-lg border-2 border-slate-300 mb-3" style={{ backgroundColor: textColor }} onClick={() => setShowColorPicker((v) => !v)} />
                {showColorPicker && (
                  <div className="absolute z-10 mt-2">
                    <HexColorPicker color={textColor} onChange={setTextColor} />
                  </div>
                )}

                <button onClick={handleAddText} className="w-full rounded-full bg-indigo-600 text-white px-6 py-3 font-bold hover:bg-indigo-700" data-testid="add-text-button">Add Text</button>
              </div>

              <div className="glass rounded-2xl p-6 space-y-3">
                <button onClick={handleSaveDesign} disabled={loading} className="w-full rounded-full bg-slate-700 text-white px-6 py-3 font-bold hover:bg-slate-800 flex items-center justify-center gap-2" data-testid="save-design-button">
                  <Save className="h-5 w-5" /> Save Design
                </button>
                <button onClick={handleExportDesign} className="w-full rounded-full bg-[#2f4f6e] text-white px-6 py-3 font-bold hover:opacity-95 flex items-center justify-center gap-2">
                  <Download className="h-5 w-5" /> Export Image
                </button>
                <button onClick={handleAddToCart} disabled={loading} className="w-full rounded-full bg-indigo-600 text-white px-6 py-3 font-bold hover:bg-indigo-700 flex items-center justify-center gap-2" data-testid="add-to-cart-button">
                  <ShoppingCart className="h-5 w-5" /> Add to Cart
                </button>
                <p className="text-center text-sm text-slate-600">Price: Rs.{selectedProduct?.base_price || '--'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomizePage;






