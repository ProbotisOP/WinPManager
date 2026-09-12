import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col gap-1.5 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto flex items-center justify-between px-3 py-2 rounded-md bg-[#161722] border border-[#262838] shadow-lg text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isSuccess
                      ? 'bg-emerald-400'
                      : isError
                      ? 'bg-red-400'
                      : 'bg-indigo-400'
                  }`}
                />
                <div>
                  <span className="font-medium text-zinc-100">{toast.title}</span>
                  {toast.description && (
                    <span className="text-zinc-500 text-[11px] ml-1.5">
                      {toast.description}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="text-zinc-500 hover:text-zinc-300 ml-2 p-0.5 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
