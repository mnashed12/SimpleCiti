import React from 'react';

const logoUrl = '/HomePage/static/1031_TEO_Logo.svg';

export default function LogoTitle() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
      <img src={logoUrl} alt="Simple1031 Logo" style={{ height: 48, marginRight: 18 }} />
      <div style={{ fontWeight: 800, fontSize: 28, color: '#10174a', letterSpacing: '0.01em', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
        Simple1031™ Deferred Tax & Replacement Planner
      </div>
    </div>
  );
}
