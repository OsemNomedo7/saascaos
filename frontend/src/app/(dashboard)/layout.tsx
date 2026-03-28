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
      {/* Global ambient orbs — aurora multicolor */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {/* Top-left: ciano intenso */}
        <div className="float-slow" style={{
          position: 'absolute', width: 1000, height: 800, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,210,255,0.22) 0%, rgba(0,180,255,0.08) 40%, transparent 70%)',
          top: '-30%', left: '-15%',
          filter: 'blur(50px)',
        }} />
        {/* Top-right: roxo/violeta */}
        <div className="float-med" style={{
          position: 'absolute', width: 900, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(160,60,255,0.20) 0%, rgba(120,40,255,0.06) 40%, transparent 70%)',
          top: '-20%', right: '-15%',
          filter: 'blur(45px)',
          animationDelay: '4s',
        }} />
        {/* Lado esquerdo: verde (menor presença) */}
        <div className="float-slow" style={{
          position: 'absolute', width: 600, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,100,0.15) 0%, rgba(0,200,60,0.04) 50%, transparent 70%)',
          top: '30%', left: '-8%',
          filter: 'blur(40px)',
          animationDelay: '2s',
        }} />
        {/* Lado direito: azul elétrico */}
        <div className="float-med" style={{
          position: 'absolute', width: 700, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,100,255,0.18) 0%, rgba(0,80,220,0.05) 50%, transparent 70%)',
          top: '25%', right: '-10%',
          filter: 'blur(40px)',
          animationDelay: '6s',
        }} />
        {/* Bottom-left: turquesa/teal */}
        <div className="float-slow" style={{
          position: 'absolute', width: 800, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,180,0.18) 0%, rgba(0,180,160,0.05) 50%, transparent 70%)',
          bottom: '-20%', left: '-10%',
          filter: 'blur(45px)',
          animationDelay: '1s',
        }} />
        {/* Bottom-right: magenta/rosa */}
        <div className="float-med" style={{
          position: 'absolute', width: 700, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,0,160,0.14) 0%, rgba(220,0,120,0.04) 50%, transparent 70%)',
          bottom: '-15%', right: '-10%',
          filter: 'blur(40px)',
          animationDelay: '8s',
        }} />
        {/* Centro: laranja quente suave */}
        <div className="float-slow" style={{
          position: 'absolute', width: 400, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,120,0,0.10) 0%, transparent 70%)',
          top: '50%', left: '45%',
          filter: 'blur(35px)',
          animationDelay: '3s',
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
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '40px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
