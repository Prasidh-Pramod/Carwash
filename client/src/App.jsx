import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import AuthScreen from './components/AuthScreen';
import KanbanBoard from './components/KanbanBoard';
import CheckInModal from './components/CheckInModal';
import CustomersView from './components/CustomersView';
import InvoicesView from './components/InvoicesView';
import InvoiceDetailModal from './components/InvoiceDetailModal';
import CustomerLiveTracker from './components/CustomerLiveTracker';
import DealerSettingsModal from './components/DealerSettingsModal';
import WhatsAppPhoneSimulator from './components/WhatsAppPhoneSimulator';
import AddVehicleModal from './components/AddVehicleModal';
import { api, getStoredToken, setStoredToken } from './api';

export default function App() {
  // Auth state
  const [authToken, setAuthToken] = useState(getStoredToken());
  const [currentUser, setCurrentUser] = useState(null);
  const [currentCarwash, setCurrentCarwash] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App tabs
  const [activeTab, setActiveTab] = useState('washes');

  // Business state
  const [washes, setWashes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);
  const [whatsappLogs, setWhatsappLogs] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Modals & Drawers
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [customerForVehicle, setCustomerForVehicle] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isWhatsAppDrawerOpen, setIsWhatsAppDrawerOpen] = useState(false);

  const socketRef = useRef(null);

  // 1. Check existing login session on mount
  useEffect(() => {
    async function checkAuth() {
      const token = getStoredToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        setCurrentUser(res.user);
        setCurrentCarwash(res.carwash);
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        setStoredToken(null);
        setAuthToken(null);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [authToken]);

  // 2. Load car wash data once authenticated
  const loadCarwashData = async (carwashId) => {
    if (!carwashId) return;
    setDataLoading(true);
    try {
      const [washesData, customersData, invoicesData, servicesData, waLogs] = await Promise.all([
        api.getWashes(carwashId),
        api.getCustomers(carwashId),
        api.getInvoices(carwashId),
        api.getServices(carwashId),
        api.getWhatsAppLogs(carwashId)
      ]);

      setWashes(washesData);
      setCustomers(customersData);
      setInvoices(invoicesData);
      setServices(servicesData);
      setWhatsappLogs(waLogs);
    } catch (err) {
      console.error('Failed to load car wash data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!currentCarwash) return;
    loadCarwashData(currentCarwash.id);
  }, [currentCarwash]);

  // 3. Socket.io Real-Time Synchronization
  useEffect(() => {
    if (!currentCarwash) return;

    // Connect to Socket.io server
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Join this carwash owner's dedicated real-time room
      socket.emit('join:carwash', currentCarwash.id);
    });

    // Real-time: Wash Status Updated (by bay staff or any device)
    socket.on('wash:updated', (payload) => {
      setWashes(prev => prev.map(w => w.id === payload.wash.id ? { ...w, ...payload.wash } : w));
    });

    // Real-time: New Car Intake Checked In
    socket.on('wash:created', (payload) => {
      setWashes(prev => [payload.wash, ...prev.filter(w => w.id !== payload.wash.id)]);
      // Reload customers & invoices to reflect loyalty / totals
      api.getCustomers(currentCarwash.id).then(setCustomers);
      api.getInvoices(currentCarwash.id).then(setInvoices);
      api.getWhatsAppLogs(currentCarwash.id).then(setWhatsappLogs);
    });

    // Real-time: Invoice Paid
    socket.on('invoice:updated', (payload) => {
      setInvoices(prev => prev.map(i => i.id === payload.invoice.id ? { ...i, ...payload.invoice } : i));
    });

    return () => {
      socket.disconnect();
    };
  }, [currentCarwash]);

  // Handle Login / Register success
  const handleLoginSuccess = (authData) => {
    setStoredToken(authData.token);
    setAuthToken(authData.token);
    setCurrentUser(authData.user);
    setCurrentCarwash(authData.carwash);
  };

  // Handle Logout
  const handleLogout = () => {
    setStoredToken(null);
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentCarwash(null);
    setWashes([]);
    setCustomers([]);
    setInvoices([]);
    setServices([]);
  };

  // Handlers
  const handleStatusChange = async (washId, newStatus) => {
    try {
      await api.updateWashStatus(washId, newStatus);
      await loadCarwashData(currentCarwash.id);
    } catch (err) {
      alert(`Error updating wash: ${err.message}`);
    }
  };

  const handleOpenInvoiceByWashId = async (washId) => {
    try {
      const inv = invoices.find(i => i.wash_id === washId);
      if (inv) {
        setSelectedInvoice(inv);
        setIsInvoiceModalOpen(true);
      } else {
        const fullInv = await api.getInvoice(washId);
        setSelectedInvoice(fullInv);
        setIsInvoiceModalOpen(true);
      }
    } catch (err) {
      alert(`Could not load invoice: ${err.message}`);
    }
  };

  const handleSendWhatsAppQuick = async (wash) => {
    try {
      await api.sendWhatsAppMessage({
        dealer_id: currentCarwash.id,
        wash_id: wash.id,
        customer_id: wash.customer_id,
        customer_name: wash.customer_name,
        customer_phone: wash.customer_phone,
        message_type: wash.status === 'COMPLETED' ? 'COMPLETED' : 'IN_WASH'
      });
      const logs = await api.getWhatsAppLogs(currentCarwash.id);
      setWhatsappLogs(logs);
      setIsWhatsAppDrawerOpen(true);
    } catch (err) {
      alert(`Failed to send WhatsApp: ${err.message}`);
    }
  };

  const handleSendWhatsAppInvoice = async (invoiceId) => {
    try {
      const res = await api.sendInvoiceWhatsApp(invoiceId);
      const [invs, logs] = await Promise.all([
        api.getInvoices(currentCarwash.id),
        api.getWhatsAppLogs(currentCarwash.id)
      ]);
      setInvoices(invs);
      setWhatsappLogs(logs);
      return res;
    } catch (err) {
      alert(`Failed to send invoice WhatsApp: ${err.message}`);
      throw err;
    }
  };

  const handlePayInvoice = async (invoiceId, method) => {
    try {
      await api.payInvoice(invoiceId, method);
      await loadCarwashData(currentCarwash.id);
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice(prev => ({ ...prev, status: 'PAID', payment_method: method }));
      }
    } catch (err) {
      alert(`Failed to mark invoice as paid: ${err.message}`);
    }
  };

  const handleToggleSubscription = async (customerId, isSubscribed) => {
    try {
      await api.updateSubscription(customerId, {
        is_subscribed: isSubscribed,
        subscription_plan: isSubscribed ? 'Gold Unlimited Member' : 'None'
      });
      await loadCarwashData(currentCarwash.id);
    } catch (err) {
      alert(`Failed to update subscription: ${err.message}`);
    }
  };

  const handleOpenAddVehicle = (customer) => {
    setCustomerForVehicle(customer);
    setIsAddVehicleOpen(true);
  };

  const handleVehicleAdded = async () => {
    await loadCarwashData(currentCarwash.id);
  };

  const handleUpdateDealer = async (dealerId, body) => {
    const updated = await api.updateDealer(dealerId, body);
    setCurrentCarwash(updated);
  };

  const handleSendCustomWhatsApp = async (body) => {
    try {
      await api.sendWhatsAppMessage(body);
      const logs = await api.getWhatsAppLogs(currentCarwash.id);
      setWhatsappLogs(logs);
    } catch (err) {
      alert(err.message);
    }
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Initializing WashFlow Owner Portal...
      </div>
    );
  }

  // Not Logged In -> Show Dedicated Owner Login Screen
  if (!authToken || !currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged In -> Private Car Wash Operations Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar (Specific to this single car wash owner) */}
      <Navbar
        carwash={currentCarwash}
        user={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCheckIn={() => setIsCheckInOpen(true)}
        onToggleWhatsAppDrawer={() => setIsWhatsAppDrawerOpen(!isWhatsAppDrawerOpen)}
        unreadWaCount={whatsappLogs.length}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {dataLoading && washes.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-sm">
            Syncing live bays for {currentCarwash?.name}...
          </div>
        ) : (
          <>
            {/* TAB 1: Live Wash Bay Kanban Board (Real-Time) */}
            {activeTab === 'washes' && (
              <KanbanBoard
                washes={washes}
                onStatusChange={handleStatusChange}
                onOpenInvoice={handleOpenInvoiceByWashId}
                onSendWhatsApp={handleSendWhatsAppQuick}
                dealer={currentCarwash}
              />
            )}

            {/* TAB 2: Customers & Multi-Vehicle Hub */}
            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                dealer={currentCarwash}
                onOpenAddVehicle={handleOpenAddVehicle}
                onToggleSubscription={handleToggleSubscription}
                onCheckInCustomer={() => setIsCheckInOpen(true)}
              />
            )}

            {/* TAB 3: Invoices & Billing */}
            {activeTab === 'invoices' && (
              <InvoicesView
                invoices={invoices}
                dealer={currentCarwash}
                onSelectInvoice={(inv) => { setSelectedInvoice(inv); setIsInvoiceModalOpen(true); }}
                onSendWhatsAppInvoice={handleSendWhatsAppInvoice}
              />
            )}

            {/* TAB 4: Customer Live Tracking Portal */}
            {activeTab === 'tracker' && (
              <CustomerLiveTracker
                washes={washes}
                dealer={currentCarwash}
                onOpenInvoice={handleOpenInvoiceByWashId}
              />
            )}

            {/* TAB 5: Owner Settings & Loyalty Promo Rules */}
            {activeTab === 'settings' && (
              <DealerSettingsModal
                dealer={currentCarwash}
                onUpdateDealer={handleUpdateDealer}
              />
            )}
          </>
        )}

      </main>

      {/* MODAL 1: Intake & Check-In */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        dealer={currentCarwash || {}}
        customers={customers}
        services={services}
        onCheckInSuccess={() => loadCarwashData(currentCarwash.id)}
        onOpenAddVehicle={handleOpenAddVehicle}
      />

      {/* MODAL 2: Add 2nd Vehicle (Unlocks 4th Wash Free!) */}
      <AddVehicleModal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        customer={customerForVehicle}
        onVehicleAdded={handleVehicleAdded}
      />

      {/* MODAL 3: Printable Invoice & WhatsApp Delivery */}
      <InvoiceDetailModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={selectedInvoice}
        onPayInvoice={handlePayInvoice}
        onSendWhatsApp={handleSendWhatsAppInvoice}
      />

      {/* DRAWER: Live WhatsApp Phone Simulator */}
      <WhatsAppPhoneSimulator
        isOpen={isWhatsAppDrawerOpen}
        onClose={() => setIsWhatsAppDrawerOpen(false)}
        logs={whatsappLogs}
        dealer={currentCarwash}
        onSendCustomWhatsApp={handleSendCustomWhatsApp}
      />

    </div>
  );
}
