"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function EmployeeNav() {
  const { logout } = useAuth();

  return (
    <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <Link href="/employee/dashboard" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Dashboard</Link>
      <Link href="/employee/exams" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>My Exams</Link>
      <button
        onClick={() => logout()}
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
      >
        Logout
      </button>
    </nav>
  );
}
