export const metadata = { title: "Research Chat" };

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body style={{ color: "#000", background: "#fff", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, 'Source Sans Pro', Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
