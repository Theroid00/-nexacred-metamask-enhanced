import React from 'react';
import { Info } from 'lucide-react';

export default function DemoBanner() {
  // Only show in demo mode
  if (import.meta.env.VITE_ENABLE_DEMO_MODE !== 'true') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
        <Info size={16} />
        <span className="font-medium">
          🚀 This is a demo version of NexaCred Enhanced - 
          <span className="ml-1">
            Try logging in with any username/password or connect MetaMask to explore the platform!
          </span>
        </span>
      </div>
    </div>
  );
}
