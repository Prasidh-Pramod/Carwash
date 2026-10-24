import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  MessageSquare, 
  Receipt, 
  CreditCard, 
  Building2, 
  Flame,
  ExternalLink 
} from 'lucide-react';

function ReceiptBody({ invoice, isPaid, isFree, copyTitle }) {
  return (
    <div className="space-y-5 text-slate-800 print:text-black">
      {copyTitle && (
        <div className="text-center pb-2 border-b-2 border-slate-200 print:border-black font-mono font-bold text-xs uppercase tracking-widest text-blue-700 print:text-black flex items-center justify-between">
          <span>{copyTitle}</span>
          <span className="text-[10px] text-slate-500 print:text-slate-600 font-sans font-normal">
            Official Car Wash POS Receipt
          </span>
        </div>
      )}

      {/* Dealer & Invoice Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200 print:border-slate-300">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900 print:text-black tracking-tight">
              {invoice.dealer_name}
            </span>
          </div>
          <p className="text-xs text-slate-500 print:text-slate-600 mt-0.5">{invoice.dealer_address}, {invoice.dealer_city}</p>
          <p className="text-xs text-slate-500 print:text-slate-600">Phone: {invoice.dealer_phone}</p>
        </div>

        <div className="sm:text-right">
          <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-1.5 ${
            isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 print:border-black print:text-black' : 'bg-amber-50 text-amber-800 border border-amber-200 print:border-black print:text-black'
          }`}>
            {invoice.status}
          </span>
          <div className="text-xs font-mono font-bold text-slate-900 print:text-black">
            {invoice.invoice_number}
          </div>
          <div className="text-[11px] text-slate-500 print:text-slate-600">
            Ticket: {invoice.wash_code}
          </div>
          {(invoice.check_in_time || invoice.queue_time) && (
            <div className="text-[11px] text-slate-500 print:text-slate-600">
              Check-In: {new Date(invoice.check_in_time || invoice.queue_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          )}
          <div className="text-[11px] text-slate-500 print:text-slate-600">
            Billed: {new Date(invoice.issued_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        </div>
      </div>

      {/* Customer & Vehicle Info */}
      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 print:bg-slate-100 border border-slate-200 print:border-slate-300 text-xs">
        <div>
          <div className="text-[10px] uppercase font-semibold text-slate-500 print:text-slate-600">Billed To</div>
          <div className="font-bold text-slate-900 print:text-black text-sm">{invoice.customer_name}</div>
          <div className="text-slate-600 print:text-slate-700">{invoice.customer_phone}</div>
          {Boolean(invoice.customer_subscribed) && (
            <div className="mt-1 text-[10px] text-amber-700 print:text-slate-900 font-semibold flex items-center gap-1">
              ★ Subscribed Member
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase font-semibold text-slate-500 print:text-slate-600">Vehicle</div>
          <div className="font-mono font-bold bg-slate-900 text-amber-300 px-2 py-0.5 rounded inline-block print:bg-transparent print:text-black text-xs shadow-xs my-0.5">
            {invoice.license_plate}
          </div>
          <div className="text-slate-700 print:text-slate-700 font-medium">
            {invoice.vehicle_make} {invoice.vehicle_model}
          </div>
          <div className="text-[10px] text-slate-500 print:text-slate-600">
            Bay #{invoice.bay_number || 1}
          </div>
        </div>
      </div>

      {/* Special Loyalty Callout if 4th Wash Free! */}
      {isFree && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 print:border-slate-400 print:bg-slate-100 text-amber-900 print:text-black text-xs flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-600 print:text-black shrink-0" />
          <div>
            <span className="font-bold">4th Wash 100% FREE Loyalty Perk!</span>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {invoice.free_wash_reason || 'Subscribed customer multi-vehicle promo discount applied.'}
            </p>
          </div>
        </div>
      )}

      {/* Itemized Table */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase text-slate-500 print:text-slate-700 border-b border-slate-200 print:border-slate-300 pb-2 flex justify-between">
          <span>Service Description</span>
          <span>Amount</span>
        </div>

        {/* Base Wash Service */}
        <div className="flex justify-between text-xs py-1">
          <div>
            <div className="font-semibold text-slate-900 print:text-black">{invoice.service_name}</div>
            <div className="text-[10px] text-slate-500 print:text-slate-600">Full vehicle wash & bay treatment</div>
          </div>
          <div className="font-mono font-semibold text-slate-900 print:text-black">
            {invoice.dealer_currency}{Number(invoice.subtotal - (invoice.addons?.reduce((s, a) => s + a.price, 0) || 0)).toFixed(2)}
          </div>
        </div>

        {/* Addons */}
        {invoice.addons && invoice.addons.map((ad, idx) => (
          <div key={idx} className="flex justify-between text-xs py-1">
            <div className="text-slate-700 print:text-slate-700">
              + {ad.name}
            </div>
            <div className="font-mono text-slate-700 print:text-slate-700">
              {invoice.dealer_currency}{Number(ad.price).toFixed(2)}
            </div>
          </div>
        ))}

        {/* Subtotal, Discounts, Tax */}
        <div className="border-t border-slate-200 print:border-slate-300 pt-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500 print:text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono">{invoice.dealer_currency}{Number(invoice.subtotal).toFixed(2)}</span>
          </div>

          {Number(invoice.discount) > 0 && (
            <div className="flex justify-between text-amber-700 print:text-black font-bold">
              <span>Loyalty Discount (4th Wash Free)</span>
              <span className="font-mono">-{invoice.dealer_currency}{Number(invoice.discount).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500 print:text-slate-600">
            <span>Sales Tax (8%)</span>
            <span className="font-mono">{invoice.dealer_currency}{Number(invoice.tax).toFixed(2)}</span>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between text-base font-extrabold text-slate-900 print:text-black pt-2 border-t border-slate-200 print:border-slate-400">
            <span>Total Amount</span>
            <span className="font-mono">{invoice.dealer_currency}{Number(invoice.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method / Settlement */}
      <div className="text-xs text-slate-500 print:text-slate-700 flex items-center justify-between pt-2">
        <span>Payment Method: <strong className="text-slate-800 print:text-black">{invoice.payment_method || 'Pending'}</strong></span>
        {isPaid && invoice.paid_at && (
          <span>Paid on: {new Date(invoice.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        )}
      </div>
    </div>
  );
}

export default function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  onPayInvoice,
  onSendWhatsApp
}) {
  if (!isOpen || !invoice) return null;

  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [waLink, setWaLink] = useState('');
  const [copyCount, setCopyCount] = useState('3'); // Default: 3 copies (Triplicate)

  const isFree = Boolean(invoice.is_free_wash);
  const isPaid = invoice.status === 'PAID';

  const handleSendWhatsApp = async () => {
    setSending(true);
    try {
      const res = await onSendWhatsApp(invoice.id);
      setSentSuccess(true);
      if (res?.whatsapp?.directWaLink) {
        setWaLink(res.whatsapp.directWaLink);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white border border-slate-200 w-full max-w-xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black print:max-h-none print:overflow-visible">
        
        {/* Modal Controls (Pinned Header - Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Official Wash Receipt
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Number of print copies selector */}
            <select
              value={copyCount}
              onChange={(e) => setCopyCount(e.target.value)}
              className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-600"
              title="Number of copies to print"
            >
              <option value="3">3 Copies (Triplicate)</option>
              <option value="1">1 Copy (Single)</option>
            </select>

            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition text-xs font-semibold flex items-center gap-1.5 px-3 shadow-xs"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCREEN VIEW (Single clean card with WhatsApp & payment actions) */}
        <div className="print:hidden flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800">
          <ReceiptBody invoice={invoice} isPaid={isPaid} isFree={isFree} copyTitle="OFFICIAL RECEIPT" />

          {/* WHATSAPP ACTION BUTTONS */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            
            {/* Mark as Paid if pending */}
            {!isPaid && (
              <button
                onClick={() => onPayInvoice(invoice.id, 'Card')}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Mark as Paid (Credit / Cash / Online)</span>
              </button>
            )}

            {/* SEND VIA WHATSAPP */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    Deliver Invoice via WhatsApp
                  </span>
                </div>
                {invoice.whatsapp_sent ? (
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Sent previously
                  </span>
                ) : null}
              </div>

              <p className="text-[11px] text-emerald-700">
                Sends an official receipt directly to customer's WhatsApp (<strong>{invoice.customer_phone}</strong>) with itemized breakdown and printable link.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSendWhatsApp}
                  disabled={sending}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{sending ? 'Sending WhatsApp...' : 'Send Invoice to WhatsApp'}</span>
                </button>

                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1 border border-emerald-300 transition"
                    title="Open directly in WhatsApp Web / App"
                  >
                    <span>Open Chat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {sentSuccess && (
                <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Invoice WhatsApp dispatched and logged successfully!</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* PRINT ONLY VIEW (Prints EXACTLY 3 Copies in Triplicate, or 1 Copy) */}
        <div className="hidden print:block text-black bg-white p-4">
          {copyCount === '3' ? (
            <>
              {/* Copy 1: Customer Copy */}
              <div className="receipt-copy">
                <ReceiptBody invoice={invoice} isPaid={isPaid} isFree={isFree} copyTitle="1. ORIGINAL — CUSTOMER COPY" />
              </div>

              {/* Copy 2: Accounts / Office Copy */}
              <div className="receipt-copy">
                <ReceiptBody invoice={invoice} isPaid={isPaid} isFree={isFree} copyTitle="2. DUPLICATE — ACCOUNTS & AUDIT COPY" />
              </div>

              {/* Copy 3: Gate Pass / Bay Staff Copy */}
              <div className="receipt-copy">
                <ReceiptBody invoice={invoice} isPaid={isPaid} isFree={isFree} copyTitle="3. TRIPLICATE — BAY STAFF & GATE PASS" />
              </div>
            </>
          ) : (
            <div className="receipt-copy">
              <ReceiptBody invoice={invoice} isPaid={isPaid} isFree={isFree} copyTitle="OFFICIAL RECEIPT" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
