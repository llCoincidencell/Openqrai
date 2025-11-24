
import React, { useState } from 'react';
import { QRData, QRType, DigitalCardButton } from '../types';
import { 
  Link, 
  Type, 
  Wifi, 
  Contact, 
  Mail, 
  Sparkles, 
  Loader2,
  Smartphone,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  Globe,
  Phone,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import * as GeminiService from '../services/geminiService';

interface EditorPanelProps {
  data: QRData;
  onChange: (data: QRData) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showHostingHelp, setShowHostingHelp] = useState(false);

  const handleTypeChange = (newType: QRType) => {
    let newValue = '';
    // Set default value based on type
    if (newType === QRType.URL) newValue = data.url || 'https://';
    if (newType === QRType.TEXT) newValue = data.text || '';
    if (newType === QRType.WIFI) newValue = `WIFI:S:${data.wifi?.ssid};T:${data.wifi?.encryption};P:${data.wifi?.password};H:${data.wifi?.hidden};;`;
    if (newType === QRType.EMAIL) newValue = `mailto:${data.email?.address}?subject=${data.email?.subject}&body=${data.email?.body}`;
    if (newType === QRType.VCARD) newValue = buildVCardString(data.vcard!);
    if (newType === QRType.DIGITAL_CARD) newValue = data.digitalCard?.hostedUrl || 'https://example.com';

    onChange({ ...data, type: newType, value: newValue });
    setAiError(null);
  };

  const buildVCardString = (v: NonNullable<QRData['vcard']>) => {
    return `BEGIN:VCARD
VERSION:3.0
N:${v.lastName};${v.firstName}
FN:${v.firstName} ${v.lastName}
ORG:${v.company}
TITLE:${v.jobTitle}
TEL:${v.phone}
EMAIL:${v.email}
URL:${v.website}
NOTE:${v.bio}
END:VCARD`;
  };

  const buildWifiString = (w: NonNullable<QRData['wifi']>) => {
    return `WIFI:S:${w.ssid};T:${w.encryption};P:${w.password};H:${w.hidden};;`;
  };

  const buildEmailString = (e: NonNullable<QRData['email']>) => {
    return `mailto:${e.address}?subject=${encodeURIComponent(e.subject)}&body=${encodeURIComponent(e.body)}`;
  };

  // Handlers for standard types
  const handleVCardChange = (field: keyof NonNullable<QRData['vcard']>, value: string) => {
    const newVcard = { ...data.vcard!, [field]: value };
    onChange({
      ...data,
      vcard: newVcard,
      value: buildVCardString(newVcard)
    });
  };

  const handleWifiChange = (field: keyof NonNullable<QRData['wifi']>, value: any) => {
    const newWifi = { ...data.wifi!, [field]: value };
    onChange({
      ...data,
      wifi: newWifi,
      value: buildWifiString(newWifi)
    });
  };

  const handleEmailChange = (field: keyof NonNullable<QRData['email']>, value: string) => {
    const newEmail = { ...data.email!, [field]: value };
    onChange({
      ...data,
      email: newEmail,
      value: buildEmailString(newEmail)
    });
  };

  // Handlers for Digital Card
  const handleDigitalCardChange = (field: keyof NonNullable<QRData['digitalCard']>, value: any) => {
    const newCard = { ...data.digitalCard!, [field]: value };
    // If the hosted URL changes, update the QR value immediately
    const qrValue = field === 'hostedUrl' ? (value as string) : (newCard.hostedUrl || 'https://example.com');
    
    onChange({
      ...data,
      digitalCard: newCard,
      value: qrValue
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'profileImage' | 'splashImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        handleDigitalCardChange(field, ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCardButton = () => {
    const newBtn: DigitalCardButton = { id: Date.now().toString(), label: '', url: '', btnType: 'web' };
    handleDigitalCardChange('buttons', [...(data.digitalCard?.buttons || []), newBtn]);
  };

  const updateCardButton = (id: string, updates: Partial<DigitalCardButton>) => {
    const newBtns = data.digitalCard?.buttons.map(b => b.id === id ? { ...b, ...updates } : b) || [];
    handleDigitalCardChange('buttons', newBtns);
  };

  const removeCardButton = (id: string) => {
    const newBtns = data.digitalCard?.buttons.filter(b => b.id !== id) || [];
    handleDigitalCardChange('buttons', newBtns);
  };

  // AI Actions
  const handleAIBio = async () => {
    if (data.type === QRType.VCARD) {
        if (!data.vcard?.firstName || !data.vcard?.jobTitle) {
            setAiError("Please fill in Name and Job Title first.");
            return;
        }
        setIsGenerating(true);
        setAiError(null);
        try {
            const bio = await GeminiService.generateBio(
            `${data.vcard.firstName} ${data.vcard.lastName}`,
            data.vcard.jobTitle,
            data.vcard.company
            );
            handleVCardChange('bio', bio);
        } catch (e) {
            setAiError("Failed to generate bio. Try again.");
        } finally {
            setIsGenerating(false);
        }
    } else if (data.type === QRType.DIGITAL_CARD) {
        if (!data.digitalCard?.name || !data.digitalCard?.jobTitle) {
            setAiError("Please fill in Name and Job Title first.");
            return;
        }
        setIsGenerating(true);
        setAiError(null);
        try {
            const bio = await GeminiService.generateBio(
            data.digitalCard.name,
            data.digitalCard.jobTitle,
            data.digitalCard.company
            );
            handleDigitalCardChange('bio', bio);
        } catch (e) {
            setAiError("Failed to generate bio.");
        } finally {
            setIsGenerating(false);
        }
    }
  };

  const handleAIEmail = async () => {
    if (!data.email?.subject) {
        setAiError("Please add a subject first.");
        return;
    }
    setIsGenerating(true);
    setAiError(null);
    try {
        const body = await GeminiService.generateEmailBody(data.email.subject, data.email.address);
        handleEmailChange('body', body);
    } catch (e) {
        setAiError("Failed to generate email body.");
    } finally {
        setIsGenerating(false);
    }
  };

  const tabs = [
    { type: QRType.URL, icon: Link, label: 'Link' },
    { type: QRType.DIGITAL_CARD, icon: Smartphone, label: 'Smart Page' },
    { type: QRType.VCARD, icon: Contact, label: 'VCard' },
    { type: QRType.WIFI, icon: Wifi, label: 'WiFi' },
    { type: QRType.EMAIL, icon: Mail, label: 'Email' },
    { type: QRType.TEXT, icon: Type, label: 'Text' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Type Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => handleTypeChange(tab.type)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-xl transition-all whitespace-nowrap
              ${data.type === tab.type 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inputs Form */}
      <div className="p-6 flex-1 overflow-y-auto">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
            {data.type === QRType.DIGITAL_CARD ? 'Design Your Page' : 'Enter Content'}
        </h2>
        
        {data.type === QRType.URL && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                value={data.url}
                onChange={(e) => onChange({ ...data, url: e.target.value, value: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <p className="text-sm text-slate-500">Your QR code will open this URL automatically.</p>
          </div>
        )}

        {data.type === QRType.DIGITAL_CARD && (
          <div className="space-y-6">
             <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">1. Design your mobile landing page below.</p>
                <p className="mb-1">2. Download the HTML file from the Preview panel.</p>
                <p>3. Upload it to a host (see guide below) and paste the link here.</p>
             </div>

             {/* Images */}
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Profile Pic</label>
                   <div className="relative group">
                     <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-all overflow-hidden bg-slate-50">
                        {data.digitalCard?.profileImage ? (
                             <img src={data.digitalCard.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <ImageIcon className="text-slate-400 mb-2" size={24} />
                                <span className="text-xs text-slate-400 font-medium">Upload</span>
                            </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'profileImage')} />
                     </label>
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Splash Logo</label>
                   <div className="relative group">
                     <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-all overflow-hidden bg-slate-50">
                        {data.digitalCard?.splashImage ? (
                             <img src={data.digitalCard.splashImage} alt="Splash" className="w-full h-full object-contain p-2" />
                        ) : (
                            <>
                                <Upload className="text-slate-400 mb-2" size={24} />
                                <span className="text-xs text-slate-400 font-medium">Upload</span>
                            </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'splashImage')} />
                     </label>
                   </div>
                </div>
             </div>

             {/* Personal Info */}
             <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Theme Color</label>
                    <div className="flex items-center gap-3">
                         <input 
                            type="color" 
                            value={data.digitalCard?.themeColor}
                            onChange={(e) => handleDigitalCardChange('themeColor', e.target.value)}
                            className="h-10 w-20 rounded cursor-pointer"
                         />
                         <span className="text-sm text-slate-500 font-mono">{data.digitalCard?.themeColor}</span>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={data.digitalCard?.name}
                        onChange={(e) => handleDigitalCardChange('name', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Job Title"
                        value={data.digitalCard?.jobTitle}
                        onChange={(e) => handleDigitalCardChange('jobTitle', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                 </div>
                 <input
                        type="text"
                        placeholder="Company"
                        value={data.digitalCard?.company}
                        onChange={(e) => handleDigitalCardChange('company', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                 <div className="relative">
                    <textarea
                        rows={3}
                        placeholder="Short Bio"
                        value={data.digitalCard?.bio}
                        onChange={(e) => handleDigitalCardChange('bio', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                        onClick={handleAIBio}
                        disabled={isGenerating}
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-medium rounded-full hover:shadow-lg transition-all disabled:opacity-70"
                    >
                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        AI
                    </button>
                 </div>
                 {aiError && <p className="text-xs text-red-500">{aiError}</p>}
             </div>

             {/* Buttons/Links */}
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Actions & Buttons</label>
                <div className="space-y-3">
                    {data.digitalCard?.buttons.map((btn) => (
                        <div key={btn.id} className="flex flex-col sm:flex-row gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="flex gap-2 flex-1">
                                <div className="relative w-1/3 min-w-[100px]">
                                    <select
                                        value={btn.btnType || 'web'}
                                        onChange={(e) => {
                                            const newType = e.target.value as 'web' | 'phone' | 'email';
                                            updateCardButton(btn.id, { btnType: newType });
                                        }}
                                        className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                                    >
                                        <option value="web">Web</option>
                                        <option value="phone">Phone</option>
                                        <option value="email">Email</option>
                                    </select>
                                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        {(!btn.btnType || btn.btnType === 'web') && <Globe size={14} />}
                                        {btn.btnType === 'phone' && <Phone size={14} />}
                                        {btn.btnType === 'email' && <Mail size={14} />}
                                    </div>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Label" 
                                    value={btn.label}
                                    onChange={(e) => updateCardButton(btn.id, { label: e.target.value })}
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                             </div>
                             <div className="flex gap-2 flex-1">
                                <input 
                                    type={btn.btnType === 'phone' ? 'tel' : btn.btnType === 'email' ? 'email' : 'url'}
                                    placeholder={btn.btnType === 'phone' ? '555-0123' : btn.btnType === 'email' ? 'email@site.com' : 'https://...'} 
                                    value={btn.url}
                                    onChange={(e) => updateCardButton(btn.id, { url: e.target.value })}
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button 
                                    onClick={() => removeCardButton(btn.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                             </div>
                        </div>
                    ))}
                    <button 
                        onClick={addCardButton}
                        className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm font-medium hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Add Action Button
                    </button>
                </div>
             </div>

             {/* FINAL URL & HOSTING HELP */}
             <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-800 mb-1">Final Hosted URL</label>
                <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs text-slate-500">
                        Paste the link where you uploaded your HTML file.
                    </p>
                    <button 
                        onClick={() => setShowHostingHelp(!showHostingHelp)}
                        className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                    >
                        <HelpCircle size={12} /> How to host?
                    </button>
                </div>

                {showHostingHelp && (
                    <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm space-y-3">
                        <h4 className="font-semibold text-slate-800">Hosting on GitHub (Free):</h4>
                        <ol className="list-decimal pl-4 space-y-2 text-slate-600">
                            <li>Design your page and click <strong>Download Page HTML</strong> (It will save as <code>index.html</code>).</li>
                            <li>Create a repository on <a href="https://github.com/new" target="_blank" className="text-blue-600 underline">GitHub</a>.</li>
                            <li>Upload the <code>index.html</code> file to the root of the repository.</li>
                            <li>Go to Settings {'>'} Pages and enable GitHub Pages from the main branch.</li>
                            <li>Copy the provided link (e.g., <code>https://username.github.io/repo</code>) and paste it below.</li>
                        </ol>
                    </div>
                )}

                <input
                    type="url"
                    value={data.digitalCard?.hostedUrl}
                    onChange={(e) => handleDigitalCardChange('hostedUrl', e.target.value)}
                    placeholder="https://mysite.com/my-card.html"
                    className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
             </div>
          </div>
        )}

        {data.type === QRType.TEXT && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plain Text</label>
              <textarea
                rows={5}
                value={data.text}
                onChange={(e) => onChange({ ...data, text: e.target.value, value: e.target.value })}
                placeholder="Enter your text here..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}

        {data.type === QRType.EMAIL && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="email"
                placeholder="Recipient Email"
                value={data.email?.address}
                onChange={(e) => handleEmailChange('address', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
               <input
                type="text"
                placeholder="Subject"
                value={data.email?.subject}
                onChange={(e) => handleEmailChange('subject', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="relative">
                 <textarea
                  rows={6}
                  placeholder="Email Body"
                  value={data.email?.body}
                  onChange={(e) => handleEmailChange('body', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                 <button 
                  onClick={handleAIEmail}
                  disabled={isGenerating}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-medium rounded-full hover:shadow-lg transition-all disabled:opacity-70"
                >
                  {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI Write
                </button>
              </div>
            </div>
             {aiError && <p className="text-xs text-red-500">{aiError}</p>}
          </div>
        )}

        {data.type === QRType.WIFI && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Network Name (SSID)</label>
              <input
                type="text"
                value={data.wifi?.ssid}
                onChange={(e) => handleWifiChange('ssid', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="text"
                value={data.wifi?.password}
                onChange={(e) => handleWifiChange('password', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Encryption</label>
                <select
                  value={data.wifi?.encryption}
                  onChange={(e) => handleWifiChange('encryption', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="WPA/WPA2">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">No Encryption</option>
                </select>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.wifi?.hidden}
                    onChange={(e) => handleWifiChange('hidden', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-slate-700">Hidden Network</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {data.type === QRType.VCARD && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={data.vcard?.firstName}
                onChange={(e) => handleVCardChange('firstName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={data.vcard?.lastName}
                onChange={(e) => handleVCardChange('lastName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Mobile Phone"
              value={data.vcard?.phone}
              onChange={(e) => handleVCardChange('phone', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={data.vcard?.email}
              onChange={(e) => handleVCardChange('email', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
             <input
              type="url"
              placeholder="Website"
              value={data.vcard?.website}
              onChange={(e) => handleVCardChange('website', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Company"
                value={data.vcard?.company}
                onChange={(e) => handleVCardChange('company', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="Job Title"
                value={data.vcard?.jobTitle}
                onChange={(e) => handleVCardChange('jobTitle', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div className="relative group">
              <textarea
                rows={3}
                placeholder="Professional Summary / Bio"
                value={data.vcard?.bio}
                onChange={(e) => handleVCardChange('bio', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
              <button 
                onClick={handleAIBio}
                disabled={isGenerating}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-medium rounded-full hover:shadow-lg transition-all disabled:opacity-70"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI Assist
              </button>
            </div>
            {aiError && <p className="text-xs text-red-500">{aiError}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
