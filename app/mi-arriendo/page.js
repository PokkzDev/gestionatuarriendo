'use client';

import RoleGuard from '@/components/RoleGuard';
import MiArriendoContent from './components/MiArriendoContent';

export default function MiArriendo() {
  return (
    <RoleGuard allowedRoles={['ARRENDATARIO', 'AMBOS']} redirectTo="/">
      <MiArriendoContent />
    </RoleGuard>
  );
} 