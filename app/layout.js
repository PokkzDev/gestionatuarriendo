import "./globals.css";
import Navbar from "../components/navbar/navbar";

export const metadata = {
  title: "Gestiona Tu Arriendo",
  description: "Gestiona tu arriendo de manera fácil y eficiente",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
