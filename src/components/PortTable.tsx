import React from 'react';
import { ExternalLink, FolderOpen, Info, Square, Check, Copy } from 'lucide-react';
import { PortItem } from '../types';
import { api } from '../api';

interface PortTableProps {
  ports: PortItem[];
  onKill: (port: number, pid: number) => void;
  onInspect: (port: PortItem) => void;
  terminatingPids: Set<number>;
}

export const PortTable: React.FC<PortTableProps> = ({
  ports,
  onKill,
  onInspect,
  terminatingPids
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyPort = (port: number, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    api.copyText(String(port));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  return (
    <div className="bg-[#101118] rounded-lg border border-[#1d1f2b] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0c0d13] text-zinc-400 uppercase text-xs tracking-wider border-b border-[#1d1f2b] font-semibold select-none">
            <tr>
              <th className="px-4 py-3">Port</th>
              <th className="px-4 py-3">Runtime / Framework</th>
              <th className="px-4 py-3">Process & PID</th>
              <th className="px-4 py-3">Project Directory</th>
              <th className="px-4 py-3">Memory</th>
              <th className="px-4 py-3">Uptime</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181a24]">
            {ports.map((port) => {
              const isTerminating = terminatingPids.has(port.pid);

              return (
                <tr
                  key={port.id}
                  className={`hover:bg-[#151722] transition-colors group ${
                    isTerminating ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  {/* Port */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 font-mono-code font-bold text-zinc-100 text-base">
                      <span className="text-zinc-500 font-normal">:</span>
                      <span>{port.port}</span>
                      <button
                        onClick={(e) => copyPort(port.port, port.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 p-1 transition-opacity cursor-pointer"
                        title="Copy port number"
                      >
                        {copiedId === port.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Framework */}
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono-code bg-[#191b26] border border-[#242637] text-zinc-200 font-medium">
                      {port.framework || (port.isSystem ? 'System' : 'Process')}
                    </span>
                  </td>

                  {/* Process & PID */}
                  <td className="px-4 py-3.5 font-mono-code">
                    <span className="text-zinc-200 font-medium text-sm">{port.processName}</span>
                    <span className="text-zinc-500 ml-2 text-xs">PID {port.pid}</span>
                  </td>

                  {/* Project / Path */}
                  <td className="px-4 py-3.5 max-w-[240px]">
                    {port.projectName ? (
                      <div className="truncate text-zinc-200 font-medium text-sm" title={port.projectPath || ''}>
                        {port.projectName}
                      </div>
                    ) : port.projectPath ? (
                      <div className="truncate text-zinc-500 text-xs font-mono-code" title={port.projectPath}>
                        {port.projectPath}
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Memory */}
                  <td className="px-4 py-3.5 font-mono-code text-zinc-300 text-sm">
                    {port.memoryFormatted}
                  </td>

                  {/* Uptime */}
                  <td className="px-4 py-3.5 font-mono-code text-zinc-400 text-sm">
                    {port.uptimeFormatted || 'Active'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => api.openUrl(port.url)}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#202230] transition-colors cursor-pointer"
                        title={`Open http://localhost:${port.port}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {port.projectPath && (
                        <button
                          onClick={() => api.openFolder(port.projectPath!)}
                          className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#202230] transition-colors cursor-pointer"
                          title="Reveal in File Explorer"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onInspect(port)}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#202230] transition-colors cursor-pointer"
                        title="Process Inspection"
                      >
                        <Info className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onKill(port.port, port.pid)}
                        disabled={isTerminating || port.isSystem}
                        className={`ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                          port.isSystem
                            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
                            : 'bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/40'
                        }`}
                        title={port.isSystem ? 'System process protected' : `Kill port ${port.port}`}
                      >
                        {isTerminating ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-300/40 border-t-red-300 rounded-full animate-spin" />
                        ) : (
                          <Square className="w-3 h-3 fill-current" />
                        )}
                        <span>Kill</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
