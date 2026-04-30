import React, { useState } from 'react';
import { X, Server, Database, Activity } from 'lucide-react';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { BrokerLoginPanel } from './BrokerLoginPanel';

export function SettingsPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('broker');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#131722] border border-[#2a2e39] rounded-lg shadow-2xl w-full max-w-4xl flex h-[600px] overflow-hidden">
        
        {/* ─── Sidebar Nav ─── */}
        <div className="w-56 bg-[#0a0b0d] border-r border-[#2a2e39] flex flex-col">
          <div className="p-4 border-b border-[#2a2e39]">
            <h2 className="text-white font-semibold">Settings</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <TabButton 
              active={activeTab === 'broker'} 
              onClick={() => setActiveTab('broker')}
              icon={<Server size={16} />}
              label="Broker & Auth"
            />
            <TabButton 
              active={activeTab === 'diagnostics'} 
              onClick={() => setActiveTab('diagnostics')}
              icon={<Activity size={16} />}
              label="Diagnostics"
            />
            <TabButton 
              active={activeTab === 'data'} 
              onClick={() => setActiveTab('data')}
              icon={<Database size={16} />}
              label="Data Management"
            />
          </div>
        </div>

        {/* ─── Content Area ─── */}
        <div className="flex-1 flex flex-col relative bg-[#131722]">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white rounded-md hover:bg-[#2a2e39] transition-colors z-10"
          >
            <X size={20} />
          </button>
          
          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === 'broker' && <BrokerLoginPanel />}
            {activeTab === 'diagnostics' && <DiagnosticsPanel />}
            {activeTab === 'data' && (
              <div className="text-gray-400">
                <h3 className="text-white font-medium mb-4">Instrument Data Sync</h3>
                <p className="text-sm mb-4">Sync F&O master data from Dhan API to local SQLite database.</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors">
                  Force Sync Now
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
        active 
          ? 'bg-blue-600/20 text-blue-400 font-medium' 
          : 'text-gray-400 hover:text-white hover:bg-[#1e222d]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
