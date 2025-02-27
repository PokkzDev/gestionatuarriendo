import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Invitación - GestionaTuArriendo',
  description: 'Gestiona la invitación para arrendamiento de una propiedad',
};

export default function InvitationLayout({ children }) {
  return (
    <div className={inter.className}>
      {children}
    </div>
  );
} 