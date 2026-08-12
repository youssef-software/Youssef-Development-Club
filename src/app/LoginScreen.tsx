import React from 'react';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '48px', color: '#38bdf8', marginBottom: '10px', textShadow: '0 0 20px rgba(56, 189, 248, 0.5)' }}>نظام ارتقاء المستوى</h1>
      <p style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '40px' }}>يجب تسجيل الدخول للوصول إلى بياناتك السحابية</p>
      <button 
        onClick={onLogin}
        style={{ padding: '15px 40px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '20px', height: '20px' }} />
        تسجيل الدخول بحساب جوجل
      </button>
    </div>
  );
}