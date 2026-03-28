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
      {/* Global ambient orbs — vivid floating lights */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {/* Large top-right green orb */}
        <div className="float-slow" style={{
          position: 'absolute', width: 900, height: 900, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,65,0.14) 0%, rgba(0,255,65,0.04) 40%, transparent 70%)',
          top: '-25%', right: '-15%',
          filter: 'blur(40px)',
        }} />
        {/* Large bottom-left cyan orb */}
        <div className="float-med" style={{
          position: 'absolute', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.03) 40%, transparent 70%)',
          bottom: '-15%', left: '-10%',
          filter: 'blur(35px)',
          animationDelay: '3s',
        }} />
        {/* Mid purple accent */}
        <div className="float-slow" style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180,80,255,0.09) 0%, rgba(180,80,255,0.02) 50%, transparent 70%)',
          top: '35%', right: '-5%',
          filter: 'blur(30px)',
          animationDelay: '5s',
        }} />
        {/* Small mid-left green */}
        <div className="float-med" style={{
          position: 'absolute', width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,65,0.1) 0%, transparent 70%)',
          top: '55%', left: '15%',
          filter: 'blur(25px)',
          animationDelay: '1.5s',
        }} />
        {/* Bottom-right cyan accent */}
        <div className="float-slow" style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          bottom: '5%', right: '10%',
          filter: 'blur(28px)',
          animationDelay: '7s',
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
