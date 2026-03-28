'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#050a05', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 32, height: 32,
            border: '2px solid rgba(0,255,65,0.2)',
            borderTopColor: '#00ff41',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#1a4a1a', letterSpacing: '0.15em' }}>
            {'> CARREGANDO...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050a05', position: 'relative' }}>
      {/* Global ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div className="orb-green float-slow" style={{ width: 600, height: 600, top: '-15%', right: '-10%' }} />
        <div className="orb-cyan float-med" style={{ width: 500, height: 500, bottom: '5%', left: '-8%', animationDelay: '2s' }} />
        <div className="orb-green" style={{ width: 300, height: 300, top: '45%', right: '20%', opacity: 0.5 }} />
        <div className="orb-orange" style={{ width: 250, height: 250, bottom: '20%', right: '-5%' }} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(5,10,5,0.85)', backdropFilter: 'blur(4px)' }}
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '40px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
