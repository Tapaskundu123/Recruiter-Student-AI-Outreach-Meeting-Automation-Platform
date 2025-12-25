import prisma from '../src/db/client.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test the complete /admin/confirm-meeting flow
 * This script simulates an admin confirming a meeting
 */
async function testMeetingConfirmation() {
    console.log('🧪 Testing Complete Meeting Confirmation Flow...\n');

    try {
        // 1. Find or create a test recruiter with Google Calendar connected
        console.log('1️⃣ Finding test recruiter...');
        let recruiter = await prisma.recruiter.findFirst({
            where: {
                googleRefreshToken: { not: null }
            }
        });

        if (!recruiter) {
            console.log('   ⚠️  No recruiter with Google Calendar found');
            console.log('   Please connect a recruiter\'s Google Calendar first\n');
            return;
        }

        console.log(`   ✓ Found recruiter: ${recruiter.name} (${recruiter.email})\n`);

        // 2. Find a pending availability slot
        console.log('2️⃣ Finding pending availability slot...');
        let availabilitySlot = await prisma.availabilitySlot.findFirst({
            where: {
                recruiterId: recruiter.id,
                status: 'pending',
                startTime: {
                    gte: new Date()
                }
            }
        });

        if (!availabilitySlot) {
            console.log('   ⚠️  No pending availability slots found');
            console.log('   Creating a test availability slot...\n');

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

            availabilitySlot = await prisma.availabilitySlot.create({
                data: {
                    recruiterId: recruiter.id,
                    startTime: tomorrow,
                    duration: 30,
                    status: 'pending'
                }
            });
        }

        console.log(`   ✓ Availability slot: ${availabilitySlot.startTime}\n`);

        // 3. Find or create a waitlisted student
        console.log('3️⃣ Finding waitlisted student...');
        let student = await prisma.student.findFirst({
            where: {
                status: 'waitlist'
            }
        });

        if (!student) {
            console.log('   Creating test student...\n');
            student = await prisma.student.create({
                data: {
                    name: 'Test Student',
                    email: process.env.TEST_EMAIL || 'test-student@example.com',
                    university: 'Test University',
                    major: 'Computer Science',
                    graduationYear: 2025,
                    status: 'waitlist',
                    country: 'USA',
                    platform: 'test'
                }
            });
        }

        console.log(`   ✓ Student: ${student.name} (${student.email})\n`);

        // 4. Simulate the API call
        console.log('4️⃣ Confirming meeting (similar to API call)...\n');
        console.log(`   POST /api/admin/confirm-meeting`);
        console.log(`   Body: {`);
        console.log(`     "availabilitySlotId": "${availabilitySlot.id}",`);
        console.log(`     "studentId": "${student.id}",`);
        console.log(`     "agenda": "Technical interview discussion"`);
        console.log(`   }\n`);

        // Import scheduler
        const { scheduleMeeting } = await import('../src/calendar/scheduler.js');

        // Schedule the meeting (this will send emails!)
        const meeting = await scheduleMeeting({
            recruiterId: recruiter.id,
            refreshToken: recruiter.googleRefreshToken,
            studentId: student.id,
            recruiterEmail: recruiter.email,
            studentEmail: student.email,
            recruiterName: recruiter.name,
            studentName: student.name,
            scheduledTime: availabilitySlot.startTime,
            duration: availabilitySlot.duration,
            title: 'Test Meeting Discussion',
            description: 'Technical interview discussion',
            eventField: recruiter.field || 'General',
            keyAreas: ['Technical skills', 'Project experience']
        });

        // Update availability slot
        await prisma.availabilitySlot.update({
            where: { id: availabilitySlot.id },
            data: {
                status: 'confirmed',
                meetingId: meeting.id,
                confirmedBy: 'test-admin'
            }
        });

        console.log('✅ SUCCESS! Meeting confirmed and emails sent!\n');
        console.log('Meeting Details:');
        console.log(`   ID: ${meeting.id}`);
        console.log(`   Title: ${meeting.title}`);
        console.log(`   Time: ${meeting.scheduledTime}`);
        console.log(`   Duration: ${meeting.duration} minutes`);
        console.log(`   Google Meet: ${meeting.googleMeetLink}\n`);

        console.log('Email Recipients:');
        console.log(`   📧 Recruiter: ${recruiter.email}`);
        console.log(`   📧 Student: ${student.email}\n`);

        console.log('Next Steps:');
        console.log('   1. Check both email inboxes');
        console.log('   2. Verify email contains Google Meet link');
        console.log('   3. Check Brevo dashboard for delivery status');
        console.log('   4. Verify meeting appears in recruiter\'s Google Calendar\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nStack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testMeetingConfirmation()
    .then(() => {
        console.log('Test completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test failed:', error);
        process.exit(1);
    });
