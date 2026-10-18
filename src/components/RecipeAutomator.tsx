import React, { useState } from 'react';
import { RetrofitRecipe, SfdTokenInfo } from '../types/mib3';
import { RETROFIT_RECIPES } from '../data/mib3Database';
import { 
  Zap, Check, Clock, ShieldAlert, ShieldCheck, 
  ChevronDown, ChevronUp, Sparkles, Filter, 
  RotateCcw, AlertTriangle, ArrowRight, Layers
} from 'lucide-react';

interface RecipeAutomatorProps {
  appliedRecipeIds: string[];
  onApplyRecipe: (recipe: RetrofitRecipe) => void;
  onRevertRecipe: (recipe: RetrofitRecipe) => void;
  sfdToken: SfdTokenInfo;
  onOpenExport: () => void;
  onNavigateToLongCoding: () => void;
}

export const RecipeAutomator: React.FC<RecipeAutomatorProps> = ({
  appliedRecipeIds,
  onApplyRecipe,
  onRevertRecipe,
  sfdToken,
  onOpenExport,
  onNavigateToLongCoding
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>('recipe_wireless_carplay_aa');

  const categories = ['All', 'Connectivity', 'Sport & Cockpit', 'Comfort & Ambience', 'Developer & Diagnostics', 'Audio'];

  const filteredRecipes = RETROFIT_RECIPES.filter(
    r => selectedCategory === 'All' || r.category === selectedCategory
  );

  const appliedCount = appliedRecipeIds.length;

  return (
    <div className="space-y-6">
      
      {/* Hero Banner for Automated Coding */}
      <div className="bg-gradient-to-r from-slate-900 via-[#101726] to-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-cyan-500/5 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/80 mb-2 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              1-CLICK AUTOMATION ENGINE
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Say Goodbye to Manual MIB3 Coding Fatigue
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Select pre-validated retrofit bundles. The engine calculates bitwise hex modifications, 
              stages adaptation channels, and handles SFD prerequisites in milliseconds.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="text-center px-2">
              <span className="block text-2xl font-bold font-mono text-cyan-400">{appliedCount}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Applied</span>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-center px-2">
              <span className="block text-2xl font-bold font-mono text-emerald-400">{RETROFIT_RECIPES.length}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Available</span>
            </div>
            {appliedCount > 0 && (
              <button
                onClick={onOpenExport}
                className="ml-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-600/30"
              >
                <span>Export ({appliedCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/60'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* SFD Warning Banner if Locked */}
      {sfdToken.status !== 'UNLOCKED' && (
        <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">SFD Protection Lock Active on Module 5F:</span>
            <p className="text-amber-300/80">
              Applying recipes below will stage the changes locally in memory. To flash onto the car, 
              ensure you run the SFD Token unlock step first in the <strong>SFD Protection</strong> tab or allow your diagnostic tool to auto-unlock.
            </p>
          </div>
        </div>
      )}

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRecipes.map((recipe) => {
          const isApplied = appliedRecipeIds.includes(recipe.id);
          const isExpanded = expandedRecipeId === recipe.id;

          return (
            <div
              key={recipe.id}
              className={`border rounded-xl transition-all ${
                isApplied
                  ? 'bg-slate-900/90 border-cyan-600/60 shadow-lg shadow-cyan-950/30'
                  : 'bg-[#0f131d] border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {recipe.category}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      ~{recipe.estimatedTimeSec}s vs 20m manual
                    </span>
                    {recipe.requiresSfd && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/70 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        SFD Required
                      </span>
                    )}
                    {recipe.fecRequired && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/70">
                        FEC: {recipe.fecRequired}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    {recipe.title}
                    {isApplied && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-mono font-normal">
                        <Check className="w-3 h-3" /> APPLIED
                      </span>
                    )}
                  </h3>

                  <p className="text-xs text-slate-300 font-sans max-w-3xl">
                    {recipe.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <button
                    onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700/80"
                    title="View exact byte/bit changes and adaptation channels"
                  >
                    <span>Inspect</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isApplied ? (
                    <button
                      onClick={() => onRevertRecipe(recipe)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-red-950/70 text-slate-300 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Revert</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onApplyRecipe(recipe)}
                      className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-600/30"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>1-Click Apply</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Detailed Breakdown Panel when Expanded */}
              {isExpanded && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    
                    {/* Byte & Bit Changes */}
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-300 font-mono font-semibold">
                        <span className="flex items-center gap-1.5 text-cyan-300">
                          <Layers className="w-3.5 h-3.5" /> Long Coding Mutations ({recipe.byteChanges.length})
                        </span>
                        <span className="text-[10px] text-slate-500">ECU 0x5F DID 0x0600</span>
                      </div>
                      
                      {recipe.byteChanges.length === 0 ? (
                        <p className="text-slate-500 text-xs italic">No Long Coding bytes altered (Adaptation only).</p>
                      ) : (
                        <div className="space-y-1.5">
                          {recipe.byteChanges.map((bc, idx) => (
                            <div key={idx} className="p-2 rounded bg-slate-950/80 border border-slate-800/80 flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono text-cyan-400 font-semibold">
                                  Byte {bc.byteIndex} <span className="text-slate-500">›</span> Bit {bc.bitIndex}
                                </span>
                                <p className="text-slate-400 text-[11px] mt-0.5">{bc.reason}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                bc.targetValue 
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-red-950 text-red-300 border border-red-800'
                              }`}>
                                {bc.targetValue ? 'SET 1 (ON)' : 'SET 0 (OFF)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Adaptation Channel Changes */}
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-300 font-mono font-semibold">
                        <span className="flex items-center gap-1.5 text-amber-300">
                          <Zap className="w-3.5 h-3.5" /> Adaptation Channels ({recipe.adaptationChanges.length})
                        </span>
                        <span className="text-[10px] text-slate-500">Security Login: {recipe.securityAccess}</span>
                      </div>

                      {recipe.adaptationChanges.length === 0 ? (
                        <p className="text-slate-500 text-xs italic">No adaptations required.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {recipe.adaptationChanges.map((ac, idx) => (
                            <div key={idx} className="p-2 rounded bg-slate-950/80 border border-slate-800/80 flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono text-amber-400 font-semibold break-all">
                                  {ac.channelId}
                                </span>
                                <p className="text-slate-400 text-[11px] mt-0.5">{ac.reason}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800 shrink-0">
                                {ac.targetValue}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 font-mono">
                    <span>Supported: {recipe.supportedUnits.join(', ')}</span>
                    <button
                      onClick={onNavigateToLongCoding}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      View in Long Coding Studio &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
