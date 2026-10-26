import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Activity,
  Clock,
  CheckCircle,
  Building,
  Layers,
  Monitor,
  Plus,
  BarChart3,
  ListFilter
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | centres | services | counters | staff | history
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data state
  const [centres, setCentres] = useState([]);
  const [services, setServices] = useState([]);
  const [counters, setCounters] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [records, setRecords] = useState([]);

  // Form Modals / Inputs
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'centre' | 'service' | 'counter' | 'staff'
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resAnalytics = await api.get('/admin/analytics');
      if (resAnalytics.data.success) setAnalytics(resAnalytics.data.data);

      if (activeTab === 'centres') {
        const res = await api.get('/admin/service-centres');
        if (res.data.success) setCentres(res.data.data);
      } else if (activeTab === 'services') {
        const res = await api.get('/admin/services');
        if (res.data.success) setServices(res.data.data);
        const resCentres = await api.get('/admin/service-centres');
        if (resCentres.data.success) setCentres(resCentres.data.data);
      } else if (activeTab === 'counters') {
        const res = await api.get('/admin/counters');
        if (res.data.success) setCounters(res.data.data);
        const resCentres = await api.get('/admin/service-centres');
        if (resCentres.data.success) setCentres(resCentres.data.data);
        const resServices = await api.get('/admin/services');
        if (resServices.data.success) setServices(resServices.data.data);
      } else if (activeTab === 'staff') {
        const res = await api.get('/admin/users');
        if (res.data.success) setStaffUsers(res.data.data.filter(u => u.role === 'STAFF'));
        const resCentres = await api.get('/admin/service-centres');
        if (resCentres.data.success) setCentres(resCentres.data.data);
        const resCounters = await api.get('/admin/counters');
        if (resCounters.data.success) setCounters(resCounters.data.data);
      } else if (activeTab === 'history') {
        const res = await api.get('/admin/service-records');
        if (res.data.success) setRecords(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setFormData({});
    setShowModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'centre') {
        await api.post('/admin/service-centres', formData);
      } else if (modalType === 'service') {
        await api.post('/admin/services', formData);
      } else if (modalType === 'counter') {
        await api.post('/admin/counters', formData);
      } else if (modalType === 'staff') {
        await api.post('/admin/staff', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating entity');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">System Administration</h1>
          <p className="text-xs text-slate-500 mt-1">Manage Service Centres, Counters, Services, Staff & Analytics</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 bg-slate-200/80 p-1.5 rounded-xl border border-slate-300/60">
          {[
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'centres', label: 'Centres', icon: Building },
            { id: 'services', label: 'Services', icon: Layers },
            { id: 'counters', label: 'Counters', icon: Monitor },
            { id: 'staff', label: 'Staff Users', icon: Users },
            { id: 'history', label: 'Service Logs', icon: Clock },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-navy-900 text-cyan-400 shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analytics Cards Header */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Active Tokens</div>
            <div className="text-2xl font-black text-navy-900 mt-1">{analytics.totalActiveTokens}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-amber-600 uppercase">Waiting</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{analytics.waitingCustomers}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-emerald-600 uppercase">Serving</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{analytics.servingCustomers}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-blue-600 uppercase">Completed Today</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{analytics.completedToday}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-cyan-600 uppercase">Avg Service Time</div>
            <div className="text-2xl font-black text-cyan-600 mt-1">{analytics.avgServiceTimeMinutes}m</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-purple-600 uppercase">Total Counters</div>
            <div className="text-2xl font-black text-purple-600 mt-1">{analytics.totalCounters}</div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg min-h-[400px]">
        
        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">System Performance & Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-2">Real-Time Estimation Engine</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The waiting-time estimation algorithm dynamically calculates projected turn times using:
                </p>
                <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc pl-4">
                  <li>Recent historical completed service durations (moving average)</li>
                  <li>Elapsed time on currently active counters</li>
                  <li>Multi-counter availability scheduling algorithm</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-2">Service Centres</h3>
                <div className="text-3xl font-black text-navy-900">{analytics?.totalCentres || 0}</div>
                <p className="text-xs text-slate-500 mt-1">Configured active service centres</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-2">Configured Services</h3>
                <div className="text-3xl font-black text-cyan-700">{analytics?.totalServices || 0}</div>
                <p className="text-xs text-slate-500 mt-1">Services with independent queues</p>
              </div>
            </div>
          </div>
        )}

        {/* CENTRES TAB */}
        {activeTab === 'centres' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Service Centres</h2>
              <button
                onClick={() => handleOpenModal('centre')}
                className="px-4 py-2 bg-navy-900 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Add Service Centre</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                    <th className="py-3 px-4">Centre Name</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {centres.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-slate-100 font-mono text-xs font-bold rounded">{c.code}</span></td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{c.address || 'N/A'}</td>
                      <td className="py-3 px-4"><span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Services & Categories</h2>
              <button
                onClick={() => handleOpenModal('service')}
                className="px-4 py-2 bg-navy-900 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Add Service</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                    <th className="py-3 px-4">Service Name</th>
                    <th className="py-3 px-4">Prefix Code</th>
                    <th className="py-3 px-4">Default Duration</th>
                    <th className="py-3 px-4">Service Centre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map(s => (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-cyan-100 text-cyan-900 font-mono font-bold text-xs rounded">{s.code}</span></td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{s.defaultDurationMinutes} mins</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{s.serviceCentreId?.name || 'All Centres'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COUNTERS TAB */}
        {activeTab === 'counters' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Counters Configuration</h2>
              <button
                onClick={() => handleOpenModal('counter')}
                className="px-4 py-2 bg-navy-900 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Add Counter</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                    <th className="py-3 px-4">Counter Number</th>
                    <th className="py-3 px-4">Service Centre</th>
                    <th className="py-3 px-4">Supported Services</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {counters.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.counterNumber}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{c.serviceCentreId?.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {c.supportedServices?.map(svc => (
                            <span key={svc._id} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded">
                              {svc.name} ({svc.code})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4"><span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STAFF USERS TAB */}
        {activeTab === 'staff' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Staff User Accounts</h2>
              <button
                onClick={() => handleOpenModal('staff')}
                className="px-4 py-2 bg-navy-900 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Create Staff User</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Assigned Centre</th>
                    <th className="py-3 px-4">Assigned Counter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffUsers.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{u.email}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{u.serviceCentreId?.name || 'Unassigned'}</td>
                      <td className="py-3 px-4 font-semibold text-cyan-800">{u.counterId?.counterNumber || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERVICE HISTORY LOGS */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Historical Completed Service Durations</h2>
            <p className="text-xs text-slate-500 mb-4">These actual service durations drive the dynamic waiting time algorithm.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Counter</th>
                    <th className="py-3 px-4">Actual Duration</th>
                    <th className="py-3 px-4">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{r.tokenId?.tokenNumber || 'N/A'}</td>
                      <td className="py-3 px-4 text-xs text-slate-700">{r.serviceId?.name}</td>
                      <td className="py-3 px-4 text-xs font-semibold">{r.counterId?.counterNumber}</td>
                      <td className="py-3 px-4 font-extrabold text-emerald-700">{r.actualDurationMinutes} mins</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 uppercase">
              Create {modalType}
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {modalType === 'centre' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Centre Name</label>
                    <input
                      type="text"
                      required
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                      placeholder="North City Centre"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Code</label>
                    <input
                      type="text"
                      required
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                      placeholder="NCC"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Address</label>
                    <input
                      type="text"
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                      placeholder="456 North Avenue"
                    />
                  </div>
                </>
              )}

              {modalType === 'service' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Service Name</label>
                    <input
                      type="text"
                      required
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                      placeholder="Passport Renewal"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Prefix Code (e.g. P)</label>
                    <input
                      type="text"
                      required
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                      placeholder="P"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Default Duration (mins)</label>
                    <input
                      type="number"
                      required
                      defaultValue={10}
                      onChange={e => setFormData({...formData, defaultDurationMinutes: Number(e.target.value)})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Service Centre</label>
                    <select
                      required
                      onChange={e => setFormData({...formData, serviceCentreId: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                    >
                      <option value="">Select Centre</option>
                      {centres.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {modalType === 'counter' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Counter Number</label>
                    <input
                      type="text"
                      required
                      onChange={e => setFormData({...formData, counterNumber: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                      placeholder="Counter 4"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Service Centre</label>
                    <select
                      required
                      onChange={e => setFormData({...formData, serviceCentreId: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                    >
                      <option value="">Select Centre</option>
                      {centres.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {modalType === 'staff' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Email</label>
                    <input
                      type="email"
                      required
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <input
                      type="password"
                      required
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Assigned Centre</label>
                    <select
                      onChange={e => setFormData({...formData, serviceCentreId: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                    >
                      <option value="">Select Centre</option>
                      {centres.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Assigned Counter</label>
                    <select
                      onChange={e => setFormData({...formData, counterId: e.target.value})}
                      className="w-full p-2 bg-slate-50 border rounded text-sm mt-1"
                    >
                      <option value="">Select Counter</option>
                      {counters.map(c => <option key={c._id} value={c._id}>{c.counterNumber}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-900 text-cyan-400 font-bold text-xs rounded-xl shadow"
                >
                  Create Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
