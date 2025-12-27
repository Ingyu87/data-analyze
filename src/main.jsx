import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// #region agent log
console.log('[DEBUG] main.jsx execution started');
fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:8',message:'main.jsx execution started',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
// #endregion

const rootElement = document.getElementById('root');

// #region agent log
console.log('[DEBUG] rootElement check', {found:!!rootElement,elementId:rootElement?.id});
fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:12',message:'rootElement check',data:{found:!!rootElement,elementId:rootElement?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
// #endregion

if (!rootElement) {
  console.error('Root element not found!');
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:16',message:'rootElement not found error',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
} else {
  try {
    // #region agent log
    console.log('[DEBUG] attempting ReactDOM.createRoot');
    fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:20',message:'attempting ReactDOM.createRoot',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // #region agent log
    console.log('[DEBUG] ReactDOM.createRoot succeeded');
    fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:28',message:'ReactDOM.createRoot succeeded',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    console.error('[DEBUG] Failed to render app:', error);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dc518251-d0df-4a77-b14b-c8d0a811e39f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:32',message:'ReactDOM.createRoot failed',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    rootElement.innerHTML = `
      <div style="color: white; padding: 20px; text-align: center;">
        <h1>애플리케이션 로드 오류</h1>
        <p>${error.message}</p>
      </div>
    `;
  }
}


