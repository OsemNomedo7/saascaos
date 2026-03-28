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
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', position: 'relative' }}>
      {/* Ambient glow — complementa o SVG de circuit board */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div className="float-slow" style={{
          position: 'absolute', width: 700, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,255,0.12) 0%, transparent 70%)',
          top: '-15%', left: '-10%', filter: 'blur(60px)',
        }} />
        <div className="float-med" style={{
          position: 'absolute', width: 600, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(140,50,255,0.10) 0%, transparent 70%)',
          top: '-10%', right: '-10%', filter: 'blur(55px)', animationDelay: '5s',
        }} />
        <div className="float-slow" style={{
          position: 'absolute', width: 600, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,180,150,0.09) 0%, transparent 70%)',
          bottom: '-15%', left: '-5%', filter: 'blur(55px)', animationDelay: '3s',
        }} />
        <div className="float-med" style={{
          position: 'absolute', width: 550, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,80,255,0.09) 0%, transparent 70%)',
          bottom: '-10%', right: '-5%', filter: 'blur(50px)', animationDelay: '7s',
        }} />
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
        <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px, 3vw, 24px)', paddingBottom: '40px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
