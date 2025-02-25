import { Inter } from 'next/font/google';
import "./globals.css";
import Navbar from "../components/navbar/navbar";
import Providers from './providers';
import styles from './layout.module.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Gestiona Tu Arriendo",
  description: "Gestiona tu arriendo de manera fácil y eficiente",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${styles.body}`}>
        <Providers>
          <Navbar />
          <main className={styles.main}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
