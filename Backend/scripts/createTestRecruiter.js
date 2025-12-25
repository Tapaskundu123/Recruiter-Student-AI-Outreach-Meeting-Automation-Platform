import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createTestData() {
  try {
    console.log('Creating test data...');

    const timestamp = Date.now();

    const recruiter = await prisma.recruiter.create({
      data: {
        name: `Ananya Sharma`,
        email: `ananya.sharma.${timestamp}@example.com`,
        company: 'Infosys',
        jobTitle: 'Talent Acquisition Lead',
        country: 'India',
        field: 'Software Engineering',
        platform: 'Manual Entry',
        status: 'active',
      },
    });

    console.log(`✅ Recruiter created: ${recruiter.name}`);

    const student = await prisma.student.create({
      data: {
        name: `Rahul Verma`,
        email: `rahul.verma.${timestamp}@example.com`,
        university: 'IIT Delhi',
        major: 'Computer Science',
        country: 'India',
        platform: 'Manual Entry',
        status: 'waitlist',
      },
    });

    console.log(`✅ Student created: ${student.name}`);

    console.log('\n--- NEXT STEPS ---');
    console.log(
      `1. Connect Calendar: http://localhost:5000/api/auth/google?recruiterId=${recruiter.id}`
    );
    console.log(
      `2. Book Meeting: http://localhost:5173/book/${recruiter.id}?studentId=${student.id}`
    );
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createTestData();
