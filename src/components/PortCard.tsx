import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, FolderOpen, Info, Square, Copy, Check } from 'lucide-react';
import { PortItem } from '../types';
import { api } from '../api';

interface PortCardProps {
  port: PortItem;
  onKill: (port: number, pid: number) => void;
  onInspect: (port: PortItem) => void;
  isTerminating?: boolean;
}

export const PortCard: React.FC<PortCardProps> = ({
  port,
  onKill,
  onInspect,
  isTerminating = false
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    api.copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      className={`surface-card rounded-lg p-4 flex flex-col justify-between text-sm ${
        isTerminating ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-mono-code text-base font-bold text-zinc-100">
            <span className="text-zinc-500 font-normal">:</span>
            <span>{port.port}</span>
            <button
              onClick={(e) => handleCopy(String(port.port), e)}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 transition-colors cursor-pointer"
              title="Copy port"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <span className="px-2.5 py-1 rounded text-xs font-mono-code bg-[#1a1c27] border border-[#27293b] text-zinc-300 font-medium">
            {port.framework || (port.isSystem ? 'System' : 'Process')}
          </span>
        </div>

        {/* Project & Process */}
        <div className="mb-3.5">
          {port.projectName ? (
            <div className="font-semibold text-zinc-100 truncate text-sm mb-1" title={port.projectPath || ''}>
              {port.projectName}
            </div>
          ) : (
            <div className="font-semibold text-zinc-200 truncate text-sm mb-1">
              {port.processName}
            </div>
          )}

          <div className="text-xs font-mono-code text-zinc-400 truncate">
            <span>PID {port.pid}</span>
            <span className="mx-2 text-zinc-600">•</span>
            <span>{port.processName}</span>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-[#0f1016] border border-[#1b1c27] mb-3.5 font-mono-code text-xs text-zinc-300">
          <div>
            <span className="text-zinc-500 text-[11px] block uppercase font-medium">Memory</span>
            <span className="text-zinc-200 font-semibold">{port.memoryFormatted}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[11px] block uppercase font-medium">Uptime</span>
            <span className="text-zinc-200 font-semibold">{port.uptimeFormatted || 'Active'}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-[#1e202c] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => api.openUrl(port.url)}
            className="p-2 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title={`Open http://localhost:${port.port}`}
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {port.projectPath && (
            <button
              onClick={() => api.openFolder(port.projectPath!)}
              className="p-2 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer"
              title="Reveal in File Explorer"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onInspect(port)}
            className="p-2 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title="Inspect Process Details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onKill(port.port, port.pid)}
          disabled={isTerminating || port.isSystem}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
            port.isSystem
              ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              : 'bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/40'
          }`}
        >
          {isTerminating ? (
            <div className="w-3.5 h-3.5 border-2 border-red-300/40 border-t-red-300 rounded-full animate-spin" />
          ) : (
            <Square className="w-3 h-3 fill-current" />
          )}
          <span>Kill</span>
        </button>
      </div>
    </motion.div>
  );
};
