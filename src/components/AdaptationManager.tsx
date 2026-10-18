import React, { useState } from 'react';
import { AdaptationChannel, SfdTokenInfo } from '../types/mib3';
import { 
  Search, ShieldAlert, ShieldCheck, Filter, RotateCcw, 
  Check, Lock, Sliders, ChevronRight, HelpCircle
} from 'lucide-react';

interface AdaptationManagerProps {
  channels: AdaptationChannel[];
  onChangeChannelValue: (channelId: string, newValue: string) => void;
  onResetChannel: (channelId: string) => void;
  sfdToken: SfdTokenInfo;
}

export const AdaptationManager: React.FC<AdaptationManagerProps> = ({
  channels,
  onChangeChannelValue,
  onResetChannel,
  sfdToken
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterModifiedOnly, setFilterModifiedOnly] = useState<boolean>(false);
  const [filterSfdOnly, setFilterSfdOnly] = useState<boolean>(false);

  const categories = [
    'All',
    'Connectivity',
    'Lighting & Ambience',
    'Display & Virtual Cockpit',
    'Audio & Acoustics',
    'Developer & Services',
    'Vehicle Configuration'
  ];

  const filteredChannels = channels.filter((ch) => {
    const matchesSearch = 
      ch.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ch.subName && ch.subName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ch.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || ch.category === selectedCategory;
    const matchesModified = !filterModifiedOnly || ch.currentValue !== ch.defaultValue;
    const matchesSfd = !filterSfdOnly || ch.requiresSfd;

    return matchesSearch && matchesCategory && matchesModified && matchesSfd;
  });

  const modifiedCount = channels.filter(c => c.currentValue !== c.defaultValue).length;

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Search Bar */}
      <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                MODULE 5F • ADAPTATIONS (IDE)
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Adaptation Channel Explorer
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Modify internal parameters, BAP broadcast matrices, and hardware switches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Modified: <strong className="text-cyan-400">{modifiedCount}</strong> / {channels.length}
            </span>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-800/80">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by channel name, subname, or function..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="sm:col-span-6 flex items-center gap-2 flex-wrap sm:justify-end">
            <button
              onClick={() => setFilterModifiedOnly(!filterModifiedOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                filterModifiedOnly
                  ? 'bg-amber-950/60 text-amber-300 border-amber-700'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>Modified Only ({modifiedCount})</span>
            </button>

            <button
              onClick={() => setFilterSfdOnly(!filterSfdOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                filterSfdOnly
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>SFD Required Only</span>
            </button>
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-700/60'
                  : 'bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Adaptation Channels List */}
      <div className="space-y-3">
        {filteredChannels.length === 0 ? (
          <div className="p-8 text-center bg-[#0f131d] border border-slate-800 rounded-xl text-slate-500 text-xs">
            No adaptation channels match your filter criteria.
          </div>
        ) : (
          filteredChannels.map((ch) => {
            const isModified = ch.currentValue !== ch.defaultValue;

            return (
              <div
                key={ch.id}
                className={`p-4 rounded-xl border transition-all ${
                  isModified
                    ? 'bg-slate-900/90 border-amber-600/60 shadow-md shadow-amber-950/20'
                    : 'bg-[#0f131d] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  
                  {/* Channel Details */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {ch.category}
                      </span>
                      {ch.requiresSfd && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          SFD Token
                        </span>
                      )}
                      {ch.securityAccess && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          Login: {ch.securityAccess}
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span className="text-cyan-400">{ch.channelName}</span>
                      {ch.subName && (
                        <>
                          <span className="text-slate-500 font-normal">›</span>
                          <span className="text-amber-300">{ch.subName}</span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 max-w-3xl font-sans">
                      {ch.description}
                    </p>
                  </div>

                  {/* Channel Value Editor & Stock Reset */}
                  <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Default: <strong className="text-slate-400">{ch.defaultValue}</strong>
                      </span>
                      
                      {ch.allowedValues && ch.allowedValues.length > 0 ? (
                        <select
                          aria-label={`Value for ${ch.channelName} ${ch.subName || ''}`}
                          value={ch.currentValue}
                          onChange={(e) => onChangeChannelValue(ch.id, e.target.value)}
                          className={`mt-1 font-mono text-xs px-3 py-1.5 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                            isModified
                              ? 'bg-amber-950/80 text-amber-200 border-amber-500 font-bold'
                              : 'bg-slate-900 text-white border-slate-700'
                          }`}
                        >
                          {ch.allowedValues.map((val) => (
                            <option key={val} value={val} className="bg-slate-900 text-slate-200">
                              {val}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          aria-label={`Value for ${ch.channelName} ${ch.subName || ''}`}
                          value={ch.currentValue}
                          onChange={(e) => onChangeChannelValue(ch.id, e.target.value)}
                          className={`mt-1 font-mono text-xs px-3 py-1.5 rounded-lg border focus:outline-none transition-colors w-32 ${
                            isModified
                              ? 'bg-amber-950/80 text-amber-200 border-amber-500 font-bold'
                              : 'bg-slate-900 text-white border-slate-700'
                          }`}
                        />
                      )}
                    </div>

                    {isModified && (
                      <button
                        onClick={() => onResetChannel(ch.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
                        title="Revert to factory default value"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
