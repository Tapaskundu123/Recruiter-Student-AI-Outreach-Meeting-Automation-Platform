import bcrypt from 'bcryptjs';
import prisma from '../src/db/client.js';

/**
 * Script to create an admin user
 * Usage: node scripts/create-admin.js
 */
async function createAdmin() {
    try {
        const email = 'admin@aioutreach.com';
        const password = 'admin123'; // Change this to a secure password
        const name = 'Admin User';

        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            console.log('❌ Admin with this email already exists');
            console.log('\nExisting Admin:');
            console.log(`  Email: ${existingAdmin.email}`);
            console.log(`  Name: ${existingAdmin.name}`);
            console.log(`  Role: ${existingAdmin.role}`);
            console.log(`  Active: ${existingAdmin.isActive}`);
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create admin
        const admin = await prisma.admin.create({
            data: {
                email,
                passwordHash,
                name,
                role: 'admin',
                isActive: true
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('\n📧 Login Credentials:');
        console.log(`  Email: ${admin.email}`);
        console.log(`  Password: ${password}`);
        console.log(`  Name: ${admin.name}`);
        console.log(`  Role: ${admin.role}`);
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');
        console.log(`\n🌐 Login at: http://localhost:5173/admin/login`);

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
