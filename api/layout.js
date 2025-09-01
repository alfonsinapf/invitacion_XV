import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "Invitación XV Alfonsina",
  description: "Invitación digital de 15 años",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
        {/* Activa la medición de velocidad en Vercel */}
        <SpeedInsights />
      </body>
    </html>
  );
}
