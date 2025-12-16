import prisma from '../src/db/client.js';

async function checkStudents() {
    try {
        const total = await prisma.student.count();
        const waitlist = await prisma.student.count({ where: { status: 'waitlist' } });
        const waitlisted = await prisma.student.count({ where: { status: 'waitlisted' } });

        console.log(`Total Students: ${total}`);
        console.log(`Status "waitlist": ${waitlist}`);
        console.log(`Status "waitlisted": ${waitlisted}`);

        if (total === 0) {
            console.log('Database is empty. Creating test student...');
            const testStudent = await prisma.student.create({
                data: {
                    name: 'Test Student',
                    email: 'test.student@example.com',
                    university: 'Test University',
                    major: 'Computer Science',
                    country: 'USA',
                    status: 'waitlist'
                }
            });
            console.log('Created test student:', testStudent.id);
        }

    } catch (e) {
        console.error(e);
    } finally {
        // client.js handles disconnect on process exit, but we can't easily access it here to close manually 
        // without process.exit if it's not exported. 
        // checking client.js: it exports prisma default. it has process.on('beforeExit').
        // So just finishing script should be fine.
        process.exit(0);
    }
}

checkStudents();
