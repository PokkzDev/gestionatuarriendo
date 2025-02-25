const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Delete all existing users
  await prisma.user.deleteMany({});
  
  const password = await bcrypt.hash('clave123', 10);

  // Create Arrendatario account
  await prisma.user.create({
    data: {
      email: 'arrendatario@gestionatuarriendo.cl',
      name: 'Usuario Arrendatario',
      password: password,
      emailVerified: new Date(),
      image: 'https://ui-avatars.com/api/?name=Usuario+Arrendatario',
      role: 'ARRENDATARIO',
    },
  });

  // Create Propietario account
  await prisma.user.create({
    data: {
      email: 'propietario@gestionatuarriendo.cl',
      name: 'Usuario Propietario',
      password: password,
      emailVerified: new Date(),
      image: 'https://ui-avatars.com/api/?name=Usuario+Propietario',
      role: 'PROPIETARIO',
    },
  });

  // Create user with both roles
  await prisma.user.create({
    data: {
      email: 'admin@gestionatuarriendo.cl',
      name: 'Administrador',
      password: password,
      emailVerified: new Date(),
      image: 'https://ui-avatars.com/api/?name=Administrador',
      role: 'AMBOS',
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 