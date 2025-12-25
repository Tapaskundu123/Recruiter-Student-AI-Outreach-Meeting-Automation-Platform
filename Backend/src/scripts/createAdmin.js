import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../db/client.js';

async function createDefaultAdmin() {
    try {
        // Check if admin already exists
        const existing = await prisma.admin.findUnique({
            where: { email: 'admin@example.com' }
        });

        if (existing) {
            console.log('✓ Default admin already exists');
            console.log('Email: admin@example.com');
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash('admin123', 12);

        // Create admin
        const admin = await prisma.admin.create({
            data: {
                email: 'admin@example.com',
                passwordHash,
                name: 'Admin User',
                role: 'admin',
                isActive: true
            }
        });

        console.log('✓ Default admin created successfully!');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
        console.log('\n⚠️  IMPORTANT: Change this password after first login!');

    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createDefaultAdmin();
