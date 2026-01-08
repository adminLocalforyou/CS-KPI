import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Debug Log สำหรับตรวจสอบลำดับการทำงาน
console.log("🛠️ [Portal System] Initializing main module...");

const startApp = () => {
  console.log("🛠️ [Portal System] Finding root container...");
  const container = document.getElementById('root');

  if (!container) {
    const errorMsg = "Could not find 'root' element in DOM.";
    console.error("❌ [Portal System]", errorMsg);
    return;
  }

  try {
    console.log("🛠️ [Portal System] Mounting React tree...");
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ [Portal System] Application rendered successfully.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [Portal System] Render crashed:", err);
    
    // แสดง Error บน UI หาก React พัง
    container.innerHTML = `
      <div style="padding:40px; text-align:center; font-family:sans-serif; color:#e11d48;">
        <h2 style="font-weight:800; margin-bottom:8px;">Runtime Error</h2>
        <p style="background:#fff1f2; padding:12px; border-radius:8px; border:1px solid #fda4af; display:inline-block;">${msg}</p>
        <p style="font-size:12px; margin-top:16px; color:#64748b;">Please check the browser console for more details.</p>
      </div>
    `;
  }
};

// ตรวจสอบความพร้อมของ DOM
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startApp();
} else {
  window.addEventListener('DOMContentLoaded', startApp);
}