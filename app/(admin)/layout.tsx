import React from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <aside style={{ width: '250px', background: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--primary-color)' }}>
          CES Admin
        </h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Dashboard</Link>
          <Link href="/departments" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Departments</Link>
          <Link href="/users" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Users</Link>
          <Link href="/exams" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Exams</Link>
          <Link href="/question-bank" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Question Bank</Link>
          <Link href="/reports" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Reports</Link>
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <Link href="/login" style={{ color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </Link>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
