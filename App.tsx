import React, { useState } from 'react';
import { QrCode, Sparkles, Zap } from 'lucide-react';
import EditorPanel from './components/EditorPanel';
import PreviewPanel from './components/PreviewPanel';
import { QRData, QRStyle, DEFAULT_QR_DATA, DEFAULT_QR_STYLE } from './types';

function App() {
  const [qrData, setQrData] = useState<QRData>(DEFAULT_QR_DATA);
  const [qrStyle, setQrStyle] = useState<QRStyle>(DEFAULT_QR_STYLE);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <QrCode size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">OpenQR<span className="text-blue-600">AI</span></h1>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Free & Unlimited</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <a 
              href="#" 
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              <Zap size={16} className="text-amber-400 fill-amber-400" />
              <span>Powered by Gemini</span>
            </a>
            <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[calc(100vh-9rem)]">
          
          {/* Left Column: Editor */}
          <div className="lg:col-span-7 h-full">
            <div className="h-full flex flex-col gap-6">
              <div className="mb-2">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Create your custom QR Code</h2>
                <p className="text-slate-500 flex items-center gap-2">
                  Generate fully custom QR codes with AI-powered content assistance.
                </p>
              </div>
              <EditorPanel 
                data={qrData}
                onChange={setQrData}
              />
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-5 lg:h-full lg:sticky lg:top-24">
             <PreviewPanel 
               data={qrData}
               style={qrStyle}
               onStyleChange={setQrStyle}
             />
             <div className="mt-4 text-center">
                <p className="text-xs text-slate-400">
                  Generated codes are completely free forever. <br/>High resolution suitable for print.
                </p>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;