
import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng, toSvg } from 'html-to-image';
import { QRData, QRStyle, QRType } from '../types';
import { Download, Upload, Palette, Smartphone, QrCode, FileCode, Github, ExternalLink } from 'lucide-react';

interface PreviewPanelProps {
  data: QRData;
  style: QRStyle;
  onStyleChange: (style: QRStyle) => void;
}

const PRESET_COLORS = [
  { bg: '#ffffff', fg: '#000000' },
  { bg: '#ffffff', fg: '#2563eb' }, // Blue
  { bg: '#ffffff', fg: '#dc2626' }, // Red
  { bg: '#0f172a', fg: '#ffffff' }, // Dark
  { bg: '#fff7ed', fg: '#ea580c' }, // Orange
];

const PreviewPanel: React.FC<PreviewPanelProps> = ({ data, style, onStyleChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<'qr' | 'mobile'>('qr');
  const [animStage, setAnimStage] = useState(0); // 0: init, 1: splash, 2: content

  // Animation effect for mobile preview
  useEffect(() => {
    if (viewMode === 'mobile' && data.type === QRType.DIGITAL_CARD) {
        setAnimStage(0);
        const t1 = setTimeout(() => setAnimStage(1), 100);
        const t2 = setTimeout(() => setAnimStage(2), 2000); // 2s splash
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }
  }, [viewMode, data.type]);

  const handleDownload = async (format: 'png' | 'svg') => {
    if (!ref.current) return;
    setDownloading(true);
    try {
      let dataUrl;
      const options = { cacheBust: true, pixelRatio: 4 };

      if (format === 'png') {
        dataUrl = await toPng(ref.current, options);
      } else {
        dataUrl = await toSvg(ref.current, options);
      }

      const link = document.createElement('a');
      link.download = `openqr-ai-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadHtml = () => {
    if (!data.digitalCard) return;
    const dc = data.digitalCard;
    const buttonsJson = JSON.stringify(dc.buttons);
    
    // Construct the self-contained HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${dc.name} - Digital Card</title>
    <meta name="description" content="${dc.jobTitle} at ${dc.company}">
    <style>
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; color: #1f2937; height: 100vh; display: flex; justify-content: center; }
        .container { width: 100%; max-width: 480px; background: white; min-height: 100%; position: relative; overflow-y: auto; box-shadow: 0 0 40px rgba(0,0,0,0.1); }
        
        /* Splash Screen */
        #splash {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: ${dc.themeColor};
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            z-index: 9999; transition: opacity 0.5s ease-out, visibility 0.5s;
        }
        .splash-logo { width: 120px; height: 120px; object-fit: contain; background: white; border-radius: 24px; padding: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: pulse 2s infinite ease-in-out; }

        /* Content */
        #content { opacity: 0; transform: translateY(20px); transition: all 0.8s ease-out; }
        .header { background: ${dc.themeColor}; padding: 40px 20px 80px; text-align: center; color: white; border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; }
        .profile-container { margin-top: -60px; display: flex; justify-content: center; margin-bottom: 20px; }
        .profile-pic { width: 120px; height: 120px; border-radius: 50%; border: 5px solid white; background: #f3f4f6; object-fit: cover; box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        .info { text-align: center; padding: 0 24px; margin-bottom: 32px; }
        .name { font-size: 26px; font-weight: 800; color: #111827; margin-bottom: 4px; }
        .role { font-size: 15px; color: #6b7280; font-weight: 500; margin-bottom: 16px; }
        .bio { font-size: 15px; color: #4b5563; line-height: 1.6; max-width: 90%; margin: 0 auto; }
        
        /* Buttons */
        .actions { padding: 0 24px 40px; display: flex; flex-direction: column; gap: 14px; }
        .btn { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: white; border: 1px solid #e5e7eb; border-radius: 18px; text-decoration: none; color: #111827; font-weight: 600; font-size: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.02); transition: transform 0.2s; }
        .btn:active { transform: scale(0.98); background: #f9fafb; }
        .btn-icon { font-size: 20px; margin-right: 12px; }
        
        .footer { text-align: center; padding-bottom: 30px; font-size: 13px; color: #9ca3af; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
    </style>
</head>
<body>
    <div id="splash">
        ${dc.splashImage ? `<img src="${dc.splashImage}" class="splash-logo" alt="Logo">` : ''}
    </div>
    <div class="container">
        <div id="content">
            <div class="header"></div>
            <div class="profile-container">
                ${dc.profileImage ? `<img src="${dc.profileImage}" class="profile-pic" alt="${dc.name}">` : '<div class="profile-pic"></div>'}
            </div>
            <div class="info">
                <div class="name">${dc.name}</div>
                <div class="role">${dc.jobTitle}${dc.company ? ' | ' + dc.company : ''}</div>
                <div class="bio">${dc.bio}</div>
            </div>
            <div class="actions" id="action-list"></div>
            <div class="footer">Generadted by OpenQR AI</div>
        </div>
    </div>
    <script>
        const buttons = ${buttonsJson};
        function getIcon(type) {
            if (type === 'phone') return '📞';
            if (type === 'email') return '✉️';
            return '🌐';
        }
        window.addEventListener('load', () => {
            const list = document.getElementById('action-list');
            buttons.forEach(btn => {
                const a = document.createElement('a');
                a.className = 'btn';
                a.innerHTML = \`<div style="display:flex; align-items:center"><span class="btn-icon">\${getIcon(btn.btnType)}</span><span>\${btn.label}</span></div><span>→</span>\`;
                
                let url = btn.url.trim();
                if (btn.btnType === 'phone') {
                    // Strip everything except numbers and +
                    const clean = url.replace(/[^0-9+]/g, '');
                    a.href = 'tel:' + clean;
                } else if (btn.btnType === 'email') {
                    a.href = 'mailto:' + url;
                } else {
                    if (!url.startsWith('http')) url = 'https://' + url;
                    a.href = url;
                    a.target = '_blank';
                }
                list.appendChild(a);
            });
            setTimeout(() => {
                const splash = document.getElementById('splash');
                const content = document.getElementById('content');
                splash.style.opacity = '0';
                splash.style.visibility = 'hidden';
                content.style.opacity = '1';
                content.style.transform = 'translateY(0)';
            }, 2000);
        });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // IMPORTANT: Naming this index.html allows it to work instantly on GitHub Pages
    link.download = 'index.html'; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          {viewMode === 'qr' ? <QrCode size={18} /> : <Smartphone size={18} />}
          {viewMode === 'qr' ? 'QR Preview' : 'Mobile Preview'}
        </h2>
        
        {data.type === QRType.DIGITAL_CARD && (
            <div className="flex bg-slate-200 rounded-lg p-1">
                <button 
                    onClick={() => setViewMode('qr')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'qr' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    title="QR Code View"
                >
                    <QrCode size={16} />
                </button>
                <button 
                    onClick={() => setViewMode('mobile')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    title="Mobile Page View"
                >
                    <Smartphone size={16} />
                </button>
            </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#f8fafc] overflow-y-auto">
        
        {viewMode === 'qr' ? (
             <div ref={ref} className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 transform transition-transform hover:scale-[1.02]">
                <QRCodeSVG
                    value={data.value}
                    size={280}
                    fgColor={style.fgColor}
                    bgColor={style.bgColor}
                    level="H"
                    includeMargin={style.includeMargin}
                    imageSettings={style.logoUrl ? {
                        src: style.logoUrl,
                        x: undefined,
                        y: undefined,
                        height: 280 * (style.logoSize / 100),
                        width: 280 * (style.logoSize / 100),
                        excavate: true,
                    } : undefined}
                />
            </div>
        ) : (
            // Mobile Simulation View
            <div className="w-[300px] h-[550px] bg-white rounded-[40px] border-[8px] border-slate-900 shadow-2xl overflow-hidden relative">
                {/* Status Bar */}
                <div className="absolute top-0 left-0 right-0 h-6 bg-slate-900 z-50 flex justify-between px-6 items-center">
                    <div className="w-10 h-3 bg-black rounded-b-xl mx-auto"></div>
                </div>

                {/* Simulated Screen Content */}
                <div className="h-full w-full overflow-y-auto bg-slate-50 relative">
                     {/* 1. Splash Screen Phase */}
                     <div 
                        className={`absolute inset-0 z-40 flex items-center justify-center transition-all duration-500 ${animStage >= 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        style={{ backgroundColor: data.digitalCard?.themeColor || '#2563eb' }}
                     >
                        {data.digitalCard?.splashImage && (
                             <img src={data.digitalCard.splashImage} className="w-24 h-24 object-contain bg-white rounded-xl p-2 shadow-lg animate-pulse" />
                        )}
                     </div>

                     {/* 2. Main Content Phase */}
                     <div className={`transition-all duration-700 transform ${animStage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <div style={{ backgroundColor: data.digitalCard?.themeColor || '#2563eb' }} className="pt-12 pb-16 px-4 text-center rounded-b-[30px] shadow-lg">
                        </div>
                        
                        <div className="-mt-12 flex justify-center mb-3">
                             {data.digitalCard?.profileImage ? (
                                 <img src={data.digitalCard.profileImage} className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-gray-200" />
                             ) : (
                                 <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-slate-200" />
                             )}
                        </div>

                        <div className="text-center px-4 mb-6">
                            <h3 className="font-bold text-lg text-slate-900">{data.digitalCard?.name || 'Your Name'}</h3>
                            <p className="text-xs text-slate-500">{data.digitalCard?.jobTitle || 'Job Title'}</p>
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{data.digitalCard?.bio}</p>
                        </div>

                        <div className="px-4 space-y-2 pb-8">
                             {data.digitalCard?.buttons.map(btn => (
                                 <div key={btn.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                     <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        {btn.btnType === 'phone' ? '📞' : btn.btnType === 'email' ? '✉️' : '🌐'} {btn.label}
                                     </span>
                                     <span className="text-slate-300 text-xs">→</span>
                                 </div>
                             ))}
                             {(!data.digitalCard?.buttons.length) && (
                                <div className="text-center text-xs text-slate-400 py-4 italic">No buttons added</div>
                             )}
                        </div>
                     </div>
                </div>
            </div>
        )}

      </div>

      <div className="p-6 bg-white border-t border-slate-100 space-y-4">
        {data.type === QRType.DIGITAL_CARD && (
             <button
                onClick={handleDownloadHtml}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
             >
                <FileCode size={18} />
                Download Page HTML (index.html)
             </button>
        )}

        <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customize QR Style</h3>
            
            <div className="flex gap-2">
                {PRESET_COLORS.map((c, i) => (
                    <button
                        key={i}
                        onClick={() => onStyleChange({ ...style, fgColor: c.fg, bgColor: c.bg })}
                        className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
                        style={{ backgroundColor: c.bg, borderColor: c.fg === '#ffffff' ? '#000' : 'transparent' }}
                    >
                        <div className="w-4 h-4 rounded-full mx-auto" style={{ backgroundColor: c.fg }} />
                    </button>
                ))}
                <div className="relative flex-1">
                    <input 
                        type="color" 
                        value={style.fgColor}
                        onChange={(e) => onStyleChange({ ...style, fgColor: e.target.value })}
                        className="w-full h-8 opacity-0 absolute cursor-pointer"
                    />
                    <div className="w-full h-8 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 text-xs hover:bg-slate-200 transition-colors">
                        <Palette size={14} className="mr-1" /> Custom
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleDownload('png')}
            disabled={downloading}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all shadow-sm hover:shadow-md disabled:opacity-70"
          >
            {downloading ? (
                <span className="animate-spin">⌛</span>
            ) : (
                <Download size={18} />
            )}
            Save PNG
          </button>
          <button
            onClick={() => handleDownload('svg')}
            disabled={downloading}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all shadow-sm hover:shadow-md disabled:opacity-70"
          >
            <Download size={18} />
            Save SVG
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
