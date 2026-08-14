import './globals.css';

export const metadata = {
  title: 'SmartTask',
  description: 'Gestion de tâches - SmartTask',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="text-slate-800 antialiased">{children}</body>
    </html>
  );
}
