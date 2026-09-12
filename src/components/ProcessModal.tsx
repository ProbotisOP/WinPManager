import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Terminal,
  Folder,
  HardDrive,
  Clock,
  Network,
  Copy,
  Check,
  FolderOpen,
  ExternalLink,
  Square
} from 'lucide-react';
import { PortItem } from '../types';
import { api } from '../api';

interface ProcessModalProps {
  port: PortItem | null;
  onClose: () => void;
  onKill: (port: number, pid: number) => void;
  isTerminating: boolean;
}

export const ProcessModal: React.FC<ProcessModalProps> = ({
  port,
  onClose,
  onKill,
  isTerminating
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!port) return null;

  const copyVal = (key: string, text: string) => {
    api.copyText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="bg-[#12131b] w-full max-w-2xl rounded-lg border border-[#212330] shadow-2xl flex flex-col max-h-[85vh] text-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1f212e] bg-[#0e0f16]">
            <div className="flex items-center gap-3">
              <span className="font-mono-code font-bold text-base text-zinc-100">
                :{port.port}
              </span>
              <span className="text-zinc-500">•</span>
              <span className="font-semibold text-zinc-200 text-sm">
                {port.framework || port.processName}
              </span>
              <span className="text-zinc-400 font-mono-code text-xs">
                (PID {port.pid})
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0b0c11] p-3 rounded border border-[#1b1c26]">
                <div className="text-zinc-400 text-xs uppercase font-semibold mb-1">
                  Memory (RSS)
                </div>
                <div className="font-mono-code text-sm text-zinc-100 font-bold">
                  {port.memoryFormatted}
                </div>
              </div>

              <div className="bg-[#0b0c11] p-3 rounded border border-[#1b1c26]">
                <div className="text-zinc-400 text-xs uppercase font-semibold mb-1">
                  Uptime
                </div>
                <div className="font-mono-code text-sm text-zinc-100 font-bold">
                  {port.uptimeFormatted || 'Active'}
                </div>
              </div>

              <div className="bg-[#0b0c11] p-3 rounded border border-[#1b1c26]">
                <div className="text-zinc-400 text-xs uppercase font-semibold mb-1">
                  Bound Interface
                </div>
                <div className="font-mono-code text-sm text-zinc-100 truncate font-semibold" title={port.addresses}>
                  {port.addresses}
                </div>
              </div>
            </div>

            {/* Command Line */}
            <div className="bg-[#0b0c11] p-3.5 rounded border border-[#1b1c26]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300">
                  Command Line Arguments
                </span>
                {port.commandLine && (
                  <button
                    onClick={() => copyVal('cmd', port.commandLine)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {copiedKey === 'cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'cmd' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <pre className="font-mono-code text-xs text-zinc-300 bg-[#08080c] p-3 rounded border border-[#161720] overflow-x-auto whitespace-pre-wrap break-all select-text leading-relaxed">
                {port.commandLine || 'No command line parameters available.'}
              </pre>
            </div>

            {/* Project Folder */}
            {port.projectPath && (
              <div className="bg-[#0b0c11] p-3.5 rounded border border-[#1b1c26]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-300">
                    Project Path
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => copyVal('folder', port.projectPath!)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      {copiedKey === 'folder' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'folder' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => api.openFolder(port.projectPath!)}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Reveal in Explorer</span>
                    </button>
                  </div>
                </div>
                <div className="font-mono-code text-xs text-zinc-300 bg-[#08080c] p-2.5 rounded border border-[#161720] break-all select-text">
                  {port.projectPath}
                </div>
              </div>
            )}

            {/* Binary Path */}
            {port.executablePath && (
              <div className="bg-[#0b0c11] p-3.5 rounded border border-[#1b1c26]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-300">
                    Executable Location
                  </span>
                  <button
                    onClick={() => copyVal('exe', port.executablePath)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {copiedKey === 'exe' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'exe' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono-code text-xs text-zinc-400 bg-[#08080c] p-2.5 rounded border border-[#161720] break-all select-text">
                  {port.executablePath}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-[#1f212e] bg-[#0e0f16] flex items-center justify-between">
            <button
              onClick={() => api.openUrl(port.url)}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[#191b26] hover:bg-[#222433] text-zinc-200 text-sm font-medium border border-[#262838] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Browser</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded text-sm text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => {
                  onKill(port.port, port.pid);
                  onClose();
                }}
                disabled={isTerminating || port.isSystem}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-colors cursor-pointer ${
                  port.isSystem
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Force Terminate Process Tree</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
