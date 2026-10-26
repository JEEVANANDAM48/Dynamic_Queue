import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import {
  Play,
  CheckCircle,
  PhoneCall,
  RotateCcw,
  SkipForward,
  UserX,
  Clock,
  Users,
  AlertCircle,
  Activity
} from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useContext(AuthContext);
  const { socket, joinServiceCentreRoom } = useContext(SocketContext);

  const [counter, setCounter] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [waitingTokens, setWaitingTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Live timer for active service duration
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    fetchStaffQueueState(true);
  }, []);

  const centreId = counter?.serviceCentreId
    ? (typeof counter.serviceCentreId === 'object' ? counter.serviceCentreId._id : counter.serviceCentreId)
    : null;

  useEffect(() => {
    if (centreId) {
      joinServiceCentreRoom(centreId);
    }
  }, [centreId]);

  useEffect(() => {
    const handleQueueUpdate = () => {
      fetchStaffQueueState(false);
    };

    if (socket) {
      socket.on('queueUpdated', handleQueueUpdate);
      socket.on('tokenCalled', handleQueueUpdate);
      socket.on('serviceStarted', handleQueueUpdate);
      socket.on('serviceCompleted', handleQueueUpdate);
    }

    // Auto-poll every 5s in background without flickering UI
    const pollInterval = setInterval(() => {
      fetchStaffQueueState(false);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.off('queueUpdated', handleQueueUpdate);
        socket.off('tokenCalled', handleQueueUpdate);
        socket.off('serviceStarted', handleQueueUpdate);
        socket.off('serviceCompleted', handleQueueUpdate);
      }
    };
  }, [socket]);

  // Timer interval calculation based on server serviceStartTime
  useEffect(() => {
    let interval = null;
    if (currentToken && currentToken.status === 'SERVING' && currentToken.serviceStartTime) {
      const calculateSeconds = () => {
        const start = new Date(currentToken.serviceStartTime).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        setElapsedSeconds(diff);
      };

      calculateSeconds();
      interval = setInterval(calculateSeconds, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentToken]);

  const fetchStaffQueueState = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.get('/staff/queue-state');
      if (res.data.success) {
        setCounter(res.data.data.counter);
        setCurrentToken(res.data.data.currentToken);
        setWaitingTokens(res.data.data.waitingTokens || []);
      }
    } catch (err) {
      console.error('Failed to fetch staff queue state', err);
      setMessage(err.response?.data?.message || 'Error loading counter queue data');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleCallNext = async () => {
    try {
      setActionLoading(true);
      setMessage('');
      const res = await api.post('/staff/call-next');
      if (res.data.success) {
        setMessage(`Called token ${res.data.data.tokenNumber}`);
        await fetchStaffQueueState();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to call next token');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async () => {
    if (!currentToken) return;
    try {
      setActionLoading(true);
      setMessage('');
      const res = await api.post('/staff/service/start', { tokenId: currentToken._id });
      if (res.data.success) {
        setMessage(`Service started for token ${currentToken.tokenNumber}`);
        await fetchStaffQueueState();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to start service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteService = async () => {
    if (!currentToken) return;
    try {
      setActionLoading(true);
      setMessage('');
      const res = await api.post('/staff/service/complete', { tokenId: currentToken._id });
      if (res.data.success) {
        const duration = res.data.data.actualServiceDuration;
        setMessage(`Service completed for ${currentToken.tokenNumber}! Duration: ${duration} mins recorded.`);
        await fetchStaffQueueState();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to complete service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNoShow = async () => {
    if (!currentToken) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/staff/tokens/${currentToken._id}/no-show`);
      if (res.data.success) {
        setMessage(`Token ${currentToken.tokenNumber} marked as No-Show`);
        await fetchStaffQueueState();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to mark No-Show');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipToken = async () => {
    if (!currentToken) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/staff/tokens/${currentToken._id}/skip`);
      if (res.data.success) {
        setMessage(`Token ${currentToken.tokenNumber} skipped`);
        await fetchStaffQueueState();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to skip token');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecallToken = async () => {
    if (!currentToken) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/staff/tokens/${currentToken._id}/recall`);
      if (res.data.success) {
        setMessage(`Recalled ${currentToken.tokenNumber} on display speaker`);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to recall token');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper format seconds to 00:00:00
  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  if (loading && !counter) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Activity className="animate-spin text-cyan-600 mx-auto mb-2" size={32} />
          <p className="text-sm font-medium text-slate-600">Loading Counter Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header Card */}
      <div className="bg-navy-900 rounded-2xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-cyan-500/30">
                {counter ? counter.counterNumber : 'Counter Desk'}
              </span>
              <span className="text-slate-400 text-xs font-medium">
                {counter?.serviceCentreId?.name || 'City Service Centre'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Staff Queue Operations Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4 bg-navy-800/80 px-4 py-3 rounded-xl border border-navy-700">
            <Users className="text-cyan-400" size={24} />
            <div>
              <div className="text-xs text-slate-400 font-medium">Waiting Customers</div>
              <div className="text-xl font-bold text-white">{waitingTokens.length} in queue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div className="mb-6 p-4 bg-cyan-50 border border-cyan-200 text-cyan-900 text-sm font-medium rounded-xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-xs text-cyan-700 font-bold">Dismiss</button>
        </div>
      )}

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Current Active Token Desk */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`bg-white rounded-2xl p-8 border shadow-lg transition-all ${
            currentToken?.status === 'SERVING' ? 'pulse-serving border-emerald-500' : 'border-slate-200'
          }`}>
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Current Active Token
              </div>
              {currentToken ? (
                <span className={`px-3 py-1 text-xs font-extrabold uppercase rounded-full tracking-wide ${
                  currentToken.status === 'SERVING' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  currentToken.status === 'CALLED' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  ● STATUS: {currentToken.status}
                </span>
              ) : (
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                  IDLE / NO TOKEN ACTIVE
                </span>
              )}
            </div>

            {currentToken ? (
              <div className="text-center py-4">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  NOW SERVING TOKEN
                </div>
                <div className="text-6xl font-black tracking-tight text-navy-900 mb-2">
                  {currentToken.tokenNumber}
                </div>
                <div className="text-sm font-medium text-slate-600">
                  Service: <span className="font-semibold text-slate-900">{currentToken.serviceId?.name || 'General Service'}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Customer: <span className="font-semibold text-slate-700">{currentToken.customerName || 'Customer'}</span>
                </div>

                {/* Service Timer Display */}
                <div className="mt-8 bg-slate-900 rounded-xl p-6 max-w-sm mx-auto shadow-inner text-white border border-slate-800">
                  <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">
                    <Clock size={16} className="text-cyan-400" />
                    <span>ELAPSED SERVICE DURATION</span>
                  </div>
                  <div className="font-mono text-4xl font-extrabold text-cyan-400 tracking-wider">
                    {formatTimer(elapsedSeconds)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {currentToken.status === 'SERVING' ? 'Server-side authoritative timer running' : 'Press START SERVICE to begin timer'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <PhoneCall size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-base font-semibold text-slate-600">No token is currently called or being served.</p>
                <p className="text-xs text-slate-400 mt-1">Click [ CALL NEXT TOKEN ] to bring in the next waiting customer.</p>
              </div>
            )}

            {/* Action Buttons Toolbar */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                
                {/* CALL NEXT */}
                <button
                  onClick={handleCallNext}
                  disabled={actionLoading || (currentToken && currentToken.status === 'SERVING')}
                  className="py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl shadow hover:shadow-lg transition flex items-center justify-center space-x-2 text-sm disabled:opacity-40"
                >
                  <PhoneCall size={18} className="text-cyan-400" />
                  <span>CALL NEXT</span>
                </button>

                {/* START SERVICE */}
                <button
                  onClick={handleStartService}
                  disabled={actionLoading || !currentToken || currentToken.status === 'SERVING'}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow hover:shadow-lg transition flex items-center justify-center space-x-2 text-sm disabled:opacity-40"
                >
                  <Play size={18} />
                  <span>START SERVICE</span>
                </button>

                {/* COMPLETE SERVICE */}
                <button
                  onClick={handleCompleteService}
                  disabled={actionLoading || !currentToken || currentToken.status !== 'SERVING'}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow hover:shadow-lg transition flex items-center justify-center space-x-2 text-sm col-span-2 md:col-span-1 disabled:opacity-40"
                >
                  <CheckCircle size={18} />
                  <span>COMPLETE SERVICE</span>
                </button>

                {/* SECONDARY ACTIONS */}
                <button
                  onClick={handleRecallToken}
                  disabled={actionLoading || !currentToken}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition text-xs flex items-center justify-center space-x-1 disabled:opacity-40"
                >
                  <RotateCcw size={14} />
                  <span>RECALL</span>
                </button>

                <button
                  onClick={handleSkipToken}
                  disabled={actionLoading || !currentToken}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition text-xs flex items-center justify-center space-x-1 disabled:opacity-40"
                >
                  <SkipForward size={14} />
                  <span>SKIP TOKEN</span>
                </button>

                <button
                  onClick={handleMarkNoShow}
                  disabled={actionLoading || !currentToken}
                  className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg transition text-xs flex items-center justify-center space-x-1 disabled:opacity-40"
                >
                  <UserX size={14} />
                  <span>NO-SHOW</span>
                </button>

              </div>
            </div>

          </div>
        </div>

        {/* Right 1 Column: Waiting Queue */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center">
              <Users size={18} className="mr-2 text-cyan-600" />
              <span>Upcoming Queue</span>
            </h3>
            <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 font-bold text-xs rounded-full">
              {waitingTokens.length} Waiting
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1">
            {waitingTokens.length > 0 ? (
              waitingTokens.map((t, idx) => (
                <div
                  key={t._id}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-navy-900 text-cyan-400 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base leading-none">
                        {t.tokenNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {t.serviceId?.name || 'Consultation'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-cyan-700">
                      ~{t.estimatedWaitMinutes} mins
                    </div>
                    <div className="text-[10px] text-slate-400">Est. Wait</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle size={36} className="mx-auto mb-2 text-emerald-400" />
                <p className="text-xs font-medium text-slate-500">Queue is empty!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All waiting customers have been served.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffDashboard;
