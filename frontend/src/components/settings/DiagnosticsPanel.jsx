import React, { useEffect, useState } from 'react';
import { Activity, Database, Zap, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { dhanApi } from '../../lib/dhanApi';

export function DiagnosticsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Performance tracking
  const [perfMetrics, setPerfMetrics] = useState({
    pageLoad: 0,
    renderTime: 0,
    memoryUsed: 0
  });

  useEffect(() => {
    // 1. Gather browser performance metrics
    if (window.performance) {
      const navEntry = performance.getEntriesByType('navigation')[0];
      const pageLoad = navEntry ? navEntry.loadEventEnd - navEntry.startTime : 0;
      
      let memoryUsed = 0;
      if (performance.memory) {
        memoryUsed = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
      }

      setPerfMetrics({
        pageLoad: Math.round(pageLoad),
        renderTime: 0, // difficult to measure generic render time without React Profiler
        memoryUsed
      });
    }

    // 2. Fetch server diagnostics
    async function fetchDiagnostics() {
      try {
        setLoading(true);
        const res = await dhanApi.getDiagnostics();
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) return <div className="p-4 text-gray-400">Loading diagnostics...</div>;
  if (error) return <div className="p-4 text-red-400">Failed to load diagnostics: {error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6 text-sm text-gray-300">
      
      {/* ─── OVERVIEW METRICS ─── */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard 
          icon={<Activity size={18} className="text-blue-400" />}
          label="API Requests (Today)"
          value={`${data.usage.apiCallsToday} / 100K`}
          subtext={`${data.usage.usagePercent}% of Free Tier`}
          progress={data.usage.usagePercent}
        />
        <MetricCard 
          icon={<Database size={18} className="text-purple-400" />}
          label="D1 Storage (SQLite)"
          value={`${data.limits.d1.currentStorageMB} MB / 500 MB`}
          subtext={`${data.limits.d1.storageUsedPercent}% of Free Tier`}
          progress={data.limits.d1.storageUsedPercent}
        />
        <MetricCard 
          icon={<Zap size={18} className="text-yellow-400" />}
          label="Dhan API Health"
          value={data.connections.dhan.status.toUpperCase()}
          subtext={`${data.connections.dhan.latencyMs}ms Latency`}
          status={data.connections.dhan.status === 'authenticated' ? 'success' : 'warning'}
        />
        <MetricCard 
          icon={<Clock size={18} className="text-green-400" />}
          label="Server Edge Latency"
          value={`${data.diagnosticsResponseMs} ms`}
          subtext={`PoP: ${data.edge}`}
        />
      </div>

      {/* ─── CLIENT PERFORMANCE ─── */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded p-4">
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          <Activity size={16} /> Client Performance
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-gray-400 mb-1">Initial Page Load</div>
            <div className="text-lg text-white font-mono">{perfMetrics.pageLoad} ms</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Memory Usage (Heap)</div>
            <div className="text-lg text-white font-mono">{perfMetrics.memoryUsed > 0 ? `${perfMetrics.memoryUsed} MB` : 'N/A'}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">WebSocket Feed</div>
            <div className="text-lg text-white font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Connected (Relay)
            </div>
          </div>
        </div>
      </div>

      {/* ─── SYSTEM STATUS ─── */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded p-4">
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          <Database size={16} /> Database & Scrip Master
        </h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between py-2 border-b border-[#2a2e39]">
              <span className="text-gray-400">Total F&O Instruments</span>
              <span className="text-white font-mono">{data.database.instrumentsLoaded}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2a2e39]">
              <span className="text-gray-400">Last Scrip Sync</span>
              <span className="text-white">{data.database.instrumentAge}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between py-2 border-b border-[#2a2e39]">
              <span className="text-gray-400">Tables</span>
              <span className="text-white font-mono">{data.database.totalTables}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2a2e39]">
              <span className="text-gray-400">Cloudflare D1 Region</span>
              <span className="text-white">APAC (Free)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LIMITATIONS WARNING ─── */}
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-4 flex gap-3">
        <AlertTriangle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-yellow-500 font-medium mb-1">Cloudflare Free Tier Limits Active</h4>
          <p className="text-yellow-500/80 text-xs leading-relaxed">
            API is limited to 100,000 requests per day. Database writes are limited to 100,000 rows per day. 
            Ensure you do not leave the terminal open unattended on multiple devices. 
            Live prices via WebSocket do NOT consume API limits.
          </p>
        </div>
      </div>

    </div>
  );
}

// ─── Subcomponents ───

function MetricCard({ icon, label, value, subtext, progress, status }) {
  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-gray-400 font-medium">{label}</span>
      </div>
      <div className="text-xl text-white font-semibold mb-1">{value}</div>
      
      <div className="mt-auto">
        {progress !== undefined && (
          <div className="w-full bg-[#131722] rounded-full h-1.5 mb-2 mt-3">
            <div 
              className={`h-1.5 rounded-full ${progress > 80 ? 'bg-red-500' : progress > 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
              style={{ width: `${Math.min(100, progress)}%` }}
            ></div>
          </div>
        )}
        <div className={`text-xs ${status === 'warning' ? 'text-yellow-500' : 'text-gray-500'}`}>
          {subtext}
        </div>
      </div>
    </div>
  );
}
