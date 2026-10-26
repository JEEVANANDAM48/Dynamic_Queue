import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import { Monitor, BellRing, Clock } from 'lucide-react';

const DisplayBoard = () => {
  const { serviceCentreId } = useParams();
  const { socket, joinServiceCentreRoom } = useContext(SocketContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calledNotice, setCalledNotice] = useState(null);
  const [activeCentreId, setActiveCentreId] = useState(
    serviceCentreId && serviceCentreId !== 'demo' ? serviceCentreId : null
  );
  const activeCentreIdRef = React.useRef(activeCentreId);

  useEffect(() => {
    activeCentreIdRef.current = activeCentreId;
  }, [activeCentreId]);

  useEffect(() => {
    // Default to first centre if demo parameter passed
    if (serviceCentreId === 'demo') {
      api.get('/admin/service-centres').then(res => {
        if (res.data.success && res.data.data.length > 0) {
          const firstId = res.data.data[0]._id;
          setActiveCentreId(firstId);
          activeCentreIdRef.current = firstId;
          fetchDisplayData(firstId);
          joinServiceCentreRoom(firstId);
        }
      });
    } else if (serviceCentreId) {
      setActiveCentreId(serviceCentreId);
      activeCentreIdRef.current = serviceCentreId;
      fetchDisplayData(serviceCentreId);
      joinServiceCentreRoom(serviceCentreId);
    }
  }, [serviceCentreId]);

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchDisplayData();
    };

    const handleTokenCalled = (payload) => {
      setCalledNotice(payload);
      fetchDisplayData();
      // Auto dismiss banner after 8 seconds
      setTimeout(() => setCalledNotice(null), 8000);
    };

    socket.on('queueUpdated', handleRefresh);
    socket.on('tokenCalled', handleTokenCalled);
    socket.on('serviceStarted', handleRefresh);
    socket.on('serviceCompleted', handleRefresh);

    // Guaranteed auto-refresh interval for public TV display screens (every 2.5 seconds)
    const pollInterval = setInterval(() => {
      fetchDisplayData();
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      socket.off('queueUpdated', handleRefresh);
      socket.off('tokenCalled', handleTokenCalled);
      socket.off('serviceStarted', handleRefresh);
      socket.off('serviceCompleted', handleRefresh);
    };
  }, [socket, activeCentreId]);

  const fetchDisplayData = async (targetId) => {
    const idToFetch = targetId || activeCentreIdRef.current || (serviceCentreId !== 'demo' ? serviceCentreId : null);
    if (!idToFetch || idToFetch === 'demo') return;
    try {
      const res = await api.get(`/queues/display/${idToFetch}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load display board', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-navy-900 text-white flex flex-col items-center justify-center p-8">
        <Monitor className="animate-bounce text-cyan-400 mb-4" size={48} />
        <h2 className="text-xl font-bold tracking-wide">Loading Public Queue Display Screen...</h2>
      </div>
    );
  }

  const { serviceCentre, servingTokens, upcomingTokens } = data;

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col justify-between p-6 select-none">
      
      {/* Top Header */}
      <header className="flex items-center justify-between pb-6 border-b border-navy-700">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center font-extrabold text-white text-2xl shadow-lg shadow-cyan-500/30">
            Q
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{serviceCentre?.name || 'City Service Centre'}</h1>
            <p className="text-xs text-cyan-400 font-semibold tracking-wider uppercase">Live Queue Display Signage</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-navy-800 px-4 py-2 rounded-xl border border-navy-700">
          <Clock className="text-cyan-400" size={20} />
          <span className="font-mono text-xl font-bold text-white">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </header>

      {/* Called Banner Announcement */}
      {calledNotice && (
        <div className="my-4 p-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl shadow-2xl animate-pulse text-white flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BellRing size={36} className="animate-bounce" />
            <div>
              <div className="text-xs uppercase font-extrabold tracking-widest text-cyan-100">NOW SERVING ANNOUNCEMENT</div>
              <div className="text-3xl font-black">
                TOKEN <span className="underline">{calledNotice.tokenNumber}</span> → {calledNotice.counterNumber || 'COUNTER'}
              </div>
            </div>
          </div>
          <div className="text-sm font-bold bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">
            PLEASE PROCEED IMMEDIATELY
          </div>
        </div>
      )}

      {/* Main Grid: NOW SERVING (Left) & NEXT TOKENS (Right) */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-6 flex-1">
        
        {/* Left 2 Columns: NOW SERVING COUNTERS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>CURRENTLY SERVING AT COUNTERS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {servingTokens && servingTokens.length > 0 ? (
              servingTokens.map((token) => (
                <div
                  key={token._id}
                  className="bg-navy-800 rounded-3xl p-6 border-2 border-emerald-500/80 shadow-2xl relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-300 font-black text-xs uppercase tracking-wider rounded-xl border border-emerald-500/40">
                      {token.counterId?.counterNumber || 'Counter'}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {token.serviceId?.name || 'General Consultation'}
                    </span>
                  </div>

                  <div className="text-center py-6">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOKEN NUMBER</div>
                    <div className="text-6xl font-black text-white tracking-wider my-2">
                      {token.tokenNumber}
                    </div>
                  </div>

                  <div className="bg-navy-900/80 rounded-xl p-3 text-center border border-navy-700">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">● PROCEED TO DESK</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-navy-800/60 rounded-3xl p-12 text-center border border-navy-700">
                <p className="text-lg font-bold text-slate-400">No active calls right now</p>
                <p className="text-xs text-slate-500 mt-1">Waiting tokens will appear here when called by staff.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: UPCOMING QUEUE */}
        <div className="bg-navy-800/80 rounded-3xl p-6 border border-navy-700 shadow-2xl flex flex-col">
          <div className="pb-4 border-b border-navy-700 mb-4 flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-white tracking-wide">UPCOMING QUEUE</h3>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-lg border border-cyan-500/30">
              NEXT TOKENS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {upcomingTokens && upcomingTokens.length > 0 ? (
              upcomingTokens.map((t, idx) => (
                <div
                  key={t._id}
                  className="p-4 bg-navy-900/90 rounded-2xl border border-navy-700 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-9 h-9 rounded-xl bg-navy-800 text-cyan-400 font-black text-sm flex items-center justify-center border border-navy-700">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-black text-2xl text-white tracking-tight">
                        {t.tokenNumber}
                      </div>
                      <div className="text-xs text-slate-400">
                        {t.serviceId?.name || 'Service'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/30">
                      ~{t.estimatedWaitMinutes}m wait
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p className="text-sm font-semibold">Queue is clear</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer ticker */}
      <footer className="pt-4 border-t border-navy-700 flex items-center justify-between text-xs text-slate-400">
        <div>DYNAMIC QUEUE MANAGEMENT SYSTEM &bull; ACCESSIBLE PUBLIC DISPLAY</div>
        <div>Please keep your token receipt ready when called</div>
      </footer>

    </div>
  );
};

export default DisplayBoard;
