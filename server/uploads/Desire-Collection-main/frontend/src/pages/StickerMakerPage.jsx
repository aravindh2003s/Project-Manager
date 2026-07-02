import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { BACKEND_URL, getApiErrorMessage } from '../lib/api';

const INTEGRATED_STICKER_KEY = 'desire_integrated_sticker_url';

function StickerMakerPage() {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage('');
    const previewUrl = URL.createObjectURL(file);
    setOriginalImage(previewUrl);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${BACKEND_URL}/api/stickers/remove-bg`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const { url, fallback_mode: fallbackMode } = response.data || {};
      if (!url) {
        throw new Error('Invalid sticker response');
      }

      setProcessedImage(`${BACKEND_URL}${url}`);
      setStatusMessage(
        fallbackMode
          ? 'AI background remover is currently unavailable. Showing original image as sticker.'
          : 'Background removed successfully.'
      );
    } catch (error) {
      console.error('Error processing image:', error);
      setProcessedImage(previewUrl);
      setStatusMessage(`${getApiErrorMessage(error, 'AI service unavailable')}. Showing original image as sticker.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'sticker.png';
    link.click();
  };

  const handleUseInCustomizer = () => {
    if (!processedImage) return;
    localStorage.setItem(INTEGRATED_STICKER_KEY, processedImage);
    navigate('/customize');
  };

  return (
    <div className="min-h-screen theme-page pb-10">
      <Navbar />

      <div className="theme-shell pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4" data-testid="sticker-maker-title">
              AI Sticker Maker
            </h1>
            <p className="text-xl text-slate-600">
              Remove backgrounds from any image instantly with AI
            </p>
          </div>

          {statusMessage && (
            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {statusMessage}
            </div>
          )}

          {!originalImage ? (
            <div className="glass rounded-3xl p-12">
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="sticker-upload-input"
                />
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center hover:border-indigo-400 transition-colors">
                  <Upload className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                  <p className="text-xl font-medium mb-2">Upload an image</p>
                  <p className="text-slate-600">Click to select or drag and drop</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-bold mb-4">Original</h3>
                  <img src={originalImage} alt="Original" className="w-full rounded-lg" />
                </div>

                <div className="glass rounded-2xl p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-pink-500" />
                    Sticker
                  </h3>
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : processedImage ? (
                    <img src={processedImage} alt="Processed" className="w-full rounded-lg bg-gradient-to-br from-slate-100 to-slate-200" />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                      Processing...
                    </div>
                  )}
                </div>
              </div>

              {processedImage && (
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleDownload}
                    className="rounded-full bg-indigo-600 text-white px-8 py-3 font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                    data-testid="download-sticker-button"
                  >
                    <Download className="h-5 w-5" />
                    Download Sticker
                  </button>
                  <button
                    onClick={handleUseInCustomizer}
                    className="rounded-full bg-emerald-600 text-white px-8 py-3 font-bold shadow-lg hover:scale-105 transition-all"
                    data-testid="use-in-customizer-button"
                  >
                    Use In Customizer
                  </button>
                  <button
                    onClick={() => {
                      setOriginalImage(null);
                      setProcessedImage(null);
                      setStatusMessage('');
                    }}
                    className="rounded-full bg-white text-slate-900 border-2 border-slate-200 px-8 py-3 font-bold hover:border-indigo-200 hover:bg-slate-50 transition-all"
                  >
                    Make Another
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">AI Powered</div>
              <p className="text-slate-600">Advanced AI removes backgrounds perfectly</p>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-pink-500 mb-2">Instant</div>
              <p className="text-slate-600">Get your sticker in seconds</p>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-amber-500 mb-2">Free</div>
              <p className="text-slate-600">No limits, no watermarks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StickerMakerPage;
