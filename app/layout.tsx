export const metadata = { title: "Los Tordos - Hockey", manifest: "/manifest.json", themeColor: "#0A1628" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head><link rel="manifest" href="/manifest.json"/><meta name="theme-color" content="#0A1628"/><meta name="apple-mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/></head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
