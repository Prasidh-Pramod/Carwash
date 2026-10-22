import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Phone, 
  Video, 
  MoreVertical, 
  Send, 
  CheckCheck, 
  ExternalLink,
  Smartphone,
  Sparkles
} from 'lucide-react';

export default function WhatsAppPhoneSimulator({
  isOpen,
  onClose,
  logs = [],
  dealer,
  onSendCustomWhatsApp
}) {
  if (!isOpen) return null;

  const [customText, setCustomText] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('+1 (555) 234-5678');
  const [recipientName, setRecipientName] = useState('John Miller');

  const handleSend = (e) => {
    e.preventDefault();
    if (!customText) return;
    onSendCustomWhatsApp({
      dealer_id: dealer.id,
      customer_name: recipientName,
      customer_phone: recipientPhone,
      message_type: 'CUSTOM',
      custom_text: customText
    });
    setCustomText('');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Top Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white">WhatsApp Live Simulator</h3>
            <p className="text-[11px] text-slate-400">Real-time inspection of customer messages</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* WhatsApp Simulated Phone Interface */}
      <div className="flex-1 flex flex-col bg-[#0b141a] text-slate-100 overflow-hidden">
        
        {/* WhatsApp App Header */}
        <div className="px-4 py-3 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
              {dealer?.name?.substring(0, 2).toUpperCase() || 'CW'}
            </div>
            <div>
              <div className="text-xs font-bold text-[#e9edef] flex items-center gap-1.5">
                <span>{dealer?.name || 'Car Wash Dealer'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <div className="text-[10px] text-[#8696a0]">Official Business Account</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[#aebac1]">
            <Video className="w-4 h-4 cursor-pointer" />
            <Phone className="w-4 h-4 cursor-pointer" />
            <MoreVertical className="w-4 h-4 cursor-pointer" />
          </div>
        </div>

        {/* Chat Messages Body (Wallpaper background) */}
        <div 
          className="flex-1 p-4 overflow-y-auto space-y-3"
          style={{
            backgroundImage: `radial-gradient(circle at center, rgba(17, 27, 33, 0.95), rgba(11, 20, 26, 0.98))`
          }}
        >
          <div className="text-center my-2">
            <span className="text-[10px] bg-[#182229] text-[#8696a0] px-2.5 py-1 rounded-md shadow uppercase tracking-wider">
              Today • End-to-End Encrypted
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8696a0]">
              No messages sent yet. Advance a wash in the bay or click "Send Invoice" to see live messages here!
            </div>
          ) : (
            logs.map(log => {
              const lines = log.message_body.split('\n');
              return (
                <div key={log.id} className="flex flex-col items-end">
                  <div className="max-w-[90%] bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-none px-3.5 py-2.5 shadow-md text-xs relative group border border-[#005c4b]">
                    
                    {/* Message Type Badge */}
                    <div className="flex items-center justify-between text-[10px] text-emerald-200/80 mb-1 border-b border-emerald-700/50 pb-1">
                      <span className="font-semibold uppercase tracking-wider">{log.message_type}</span>
                      <span>To: {log.recipient_name || log.recipient_phone}</span>
                    </div>

                    {/* Formatted body */}
                    <div className="space-y-1 font-sans leading-relaxed text-[11px] whitespace-pre-wrap">
                      {log.message_body}
                    </div>

                    {/* Metadata & Checkmarks */}
                    <div className="flex items-center justify-between text-[9px] text-[#8696a0] mt-2 pt-1 border-t border-emerald-700/30">
                      <span className="text-emerald-200/70">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {log.direct_wa_link && (
                          <a
                            href={log.direct_wa_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-200 underline hover:text-white flex items-center gap-0.5"
                          >
                            <span>Open Web</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Send Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-[#202c33] border-t border-[#2a3942] flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a test WhatsApp message..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="flex-1 bg-[#2a3942] text-xs text-white rounded-xl px-3 py-2 focus:outline-none placeholder-[#8696a0]"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-50"
            disabled={!customText}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
