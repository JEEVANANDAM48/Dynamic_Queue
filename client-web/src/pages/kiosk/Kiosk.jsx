import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Printer, CheckCircle, Clock, Building, Layers } from 'lucide-react';

const Kiosk = () => {
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState('');
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [generatedToken, setGeneratedToken] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      const res = await api.get('/admin/service-centres');
      if (res.data.success && res.data.data.length > 0) {
        setCentres(res.data.data);
        setSelectedCentre(res.data.data[0]._id);
        fetchServicesForCentre(res.data.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load centres', err);
    }
  };

  const fetchServicesForCentre = async (centreId) => {
    try {
      const res = await api.get('/admin/services');
      if (res.data.success) {
        const filtered = res.data.data.filter(s => s.serviceCentreId?._id === centreId || s.serviceCentreId === centreId);
        setServices(filtered.length > 0 ? filtered : res.data.data);
      }
    } catch (err) {
      console.error('Failed to load services', err);
    }
  };

  const handleCentreChange = (e) => {
    const val = e.target.value;
    setSelectedCentre(val);
    fetchServicesForCentre(val);
  };

  const handlePrintToken = async (e) => {
    e.preventDefault();
    if (!selectedService || !selectedCentre) {
      alert('Please select a service centre and service');
      return;
    }

    setLoading(true);
    try {
      // Create a temporary kiosk customer ID if not logged in
      const res = await api.post('/tokens', {
        serviceId: selectedService,
        serviceCentreId: selectedCentre,
        customerName,
        customerId: '65f000000000000000000001' // Standard demo customer ObjectId reference
      });

      if (res.data.success) {
        setGeneratedToken(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to print token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        <div className="bg-navy-900 p-8 text-white text-center">
          <Printer className="mx-auto text-cyan-400 mb-2" size={40} />
          <h1 className="text-2xl font-black">SELF-SERVICE KIOSK PRINT STATION</h1>
          <p className="text-xs text-cyan-300 mt-1">Feeds Directly into Central Queue Management Engine</p>
        </div>

        <div className="p-8">
          {generatedToken ? (
            <div className="text-center py-6">
              <div className="p-6 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-300 max-w-sm mx-auto shadow-inner">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">PRINTED TOKEN RECEIPT</div>
                <div className="text-6xl font-black text-navy-900 my-4 tracking-wider">{generatedToken.tokenNumber}</div>
                <div className="text-sm font-bold text-slate-800">{generatedToken.serviceId?.name || 'Consultation'}</div>
                <div className="text-xs text-slate-500 mt-1">Estimating wait: <span className="font-bold text-cyan-700">{generatedToken.estimatedWaitMinutes} mins</span></div>
                <div className="text-[10px] text-slate-400 mt-3 pt-3 border-t border-amber-200">Please take your printed ticket & watch public display screen</div>
              </div>

              <button
                onClick={() => setGeneratedToken(null)}
                className="mt-6 px-6 py-3 bg-navy-900 text-white font-bold text-sm rounded-xl shadow hover:bg-navy-800 transition"
              >
                Print Another Token
              </button>
            </div>
          ) : (
            <form onSubmit={handlePrintToken} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">1. Select Service Centre</label>
                <select
                  value={selectedCentre}
                  onChange={handleCentreChange}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                >
                  {centres.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">2. Select Service Category</label>
                <div className="grid grid-cols-1 gap-2">
                  {services.map(s => (
                    <button
                      type="button"
                      key={s._id}
                      onClick={() => setSelectedService(s._id)}
                      className={`p-4 rounded-xl border text-left flex items-center justify-between transition ${
                        selectedService === s._id
                          ? 'bg-cyan-50 border-cyan-500 text-cyan-900 font-bold shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-base">{s.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{s.description || 'Standard Service'}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-white font-mono font-bold text-xs rounded border">
                        PREFIX {s.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">3. Customer Name (Optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedService}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                <Printer size={20} />
                <span>{loading ? 'Printing Receipt...' : 'PRINT RECEIPT TOKEN'}</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default Kiosk;
