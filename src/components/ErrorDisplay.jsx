// ErrorDisplay Component for showing authentication and app errors
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorDisplay = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md w-full bg-red-500/90 backdrop-blur-lg border border-red-400 rounded-lg p-4 shadow-lg z-50 animate-slide-in">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-white font-semibold text-sm mb-1">Error</h4>
          <p className="text-white/90 text-sm">{error}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;