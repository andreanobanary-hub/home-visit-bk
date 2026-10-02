import './globals.css';

export const metadata = {
  title: 'Aplikasi Home Visit BK',
  description: 'Layanan Bimbingan Konseling',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
