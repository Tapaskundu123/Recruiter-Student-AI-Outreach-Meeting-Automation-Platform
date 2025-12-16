
import 'dotenv/config'; // Load env vars
import prisma from '../src/db/client.js'; // Use the shared client

async function check() {
    const id = '787049';
    console.log(`Checking recruiter with ID: ${id}`);
    try {
        const recruiter = await prisma.recruiter.findUnique({
            where: { id: id }
        });
        if (recruiter) {
            console.log('Found:', recruiter);
        } else {
            console.log('Recruiter NOT FOUND');
            // List all for context
            const all = await prisma.recruiter.findMany({ select: { id: true, name: true } });
            console.log('Available Recruiters:', all);
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
