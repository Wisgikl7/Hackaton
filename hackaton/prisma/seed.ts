import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (opcional)
  await prisma.visit.deleteMany();
  await prisma.user.deleteMany();

  // Hashear contraseñas
  const password = await bcrypt.hash('password123', 10);

  // Crear usuarios de prueba
  const autorizante1 = await prisma.user.create({
    data: {
      email: 'maria.garcia@empresa.com',
      name: 'María García',
      password: password,
      role: 'AUTORIZANTE',
    },
  });

  const autorizante2 = await prisma.user.create({
    data: {
      email: 'carlos.lopez@empresa.com',
      name: 'Carlos López',
      password: password,
      role: 'AUTORIZANTE',
    },
  });

  const recepcionista = await prisma.user.create({
    data: {
      email: 'ana.martinez@empresa.com',
      name: 'Ana Martínez',
      password: password,
      role: 'RECEPCIONISTA',
    },
  });

  console.log('✅ Usuarios creados:', {
    autorizante1: autorizante1.id,
    autorizante2: autorizante2.id,
    recepcionista: recepcionista.id,
  });

  // Crear visitas de prueba
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const visita1 = await prisma.visit.create({
    data: {
      nombreVisitante: 'Juan Pérez',
      dniVisitante: '12345678',
      empresa: 'Tech Solutions',
      motivo: 'Reunión comercial',
      fechaHoraEstimada: new Date(today.setHours(14, 0, 0, 0)),
      autorizanteId: autorizante1.id,
      estado: 'PRE_AUTORIZADA',
    },
  });

  const visita2 = await prisma.visit.create({
    data: {
      nombreVisitante: 'Laura Rodríguez',
      dniVisitante: '87654321',
      empresa: 'Consulting Group',
      motivo: 'Presentación de proyecto',
      fechaHoraEstimada: new Date(today.setHours(16, 0, 0, 0)),
      autorizanteId: autorizante1.id,
      estado: 'PRE_AUTORIZADA',
    },
  });

  const visita3 = await prisma.visit.create({
    data: {
      nombreVisitante: 'Pedro González',
      dniVisitante: '45678912',
      empresa: 'Marketing Pro',
      motivo: 'Entrevista de trabajo',
      fechaHoraEstimada: new Date(tomorrow.setHours(10, 0, 0, 0)),
      autorizanteId: autorizante2.id,
      estado: 'PRE_AUTORIZADA',
    },
  });

  const visita4 = await prisma.visit.create({
    data: {
      nombreVisitante: 'Sandra Díaz',
      dniVisitante: '78945612',
      empresa: 'Design Studio',
      motivo: 'Revisión de diseños',
      fechaHoraEstimada: new Date(today.setHours(11, 0, 0, 0)),
      autorizanteId: autorizante2.id,
      estado: 'EN_RECEPCION',
      fechaHoraLlegada: new Date(today.setHours(11, 5, 0, 0)),
      recepcionistaId: recepcionista.id,
    },
  });

  console.log('✅ Visitas creadas:', {
    visita1: visita1.id,
    visita2: visita2.id,
    visita3: visita3.id,
    visita4: visita4.id,
  });

  console.log('\n📊 Resumen del seed:');
  console.log('- 3 usuarios creados (2 autorizantes, 1 recepcionista)');
  console.log('- 4 visitas creadas');
  console.log('  * 3 en estado PRE_AUTORIZADA');
  console.log('  * 1 en estado EN_RECEPCION');
  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📝 Credenciales para testing:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Todos los usuarios tienen password: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nAutorizante 1:`);
  console.log(`  Email: ${autorizante1.email}`);
  console.log(`  ID: ${autorizante1.id}`);
  console.log(`\nAutorizante 2:`);
  console.log(`  Email: ${autorizante2.email}`);
  console.log(`  ID: ${autorizante2.id}`);
  console.log(`\nRecepcionista:`);
  console.log(`  Email: ${recepcionista.email}`);
  console.log(`  ID: ${recepcionista.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
