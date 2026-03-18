import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Background } from '@xyflow/react'; // Just decorative dots

function Layout({ children }) {
  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 relative">
          {/* Subtle Background pattern */}
          <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full"></div>
          </div>
          <div className="relative z-10 animate-fade-in h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
