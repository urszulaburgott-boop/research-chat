// pages/_app.js
export default function App({ Component, pageProps }) {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', background: '#f7f7fb', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
        <Component {...pageProps} />
      </div>
    </div>
  );
}
