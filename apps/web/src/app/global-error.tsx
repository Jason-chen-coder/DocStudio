'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#fafafa',
          }}
        >
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 800,
                color: '#ef4444',
                margin: 0,
              }}
            >
              500
            </h1>
            <p
              style={{
                marginTop: '16px',
                fontSize: '20px',
                fontWeight: 600,
                color: '#111',
              }}
            >
              应用崩溃了
            </p>
            <p style={{ marginTop: '8px', color: '#666' }}>
              发生了严重错误，请刷新页面重试
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: '#4F46E5',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
