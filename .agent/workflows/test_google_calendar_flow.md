---
description: Test Google Calendar Integration Workflow
---

# Testing Google Calendar & Meet Integration

This workflow guides you through testing the end-to-end meeting scheduling flow.

## Prerequisites
1. **Google Cloud Config**: Ensure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` are set in `Backend/.env`.
2. **Backend Running**: `npm start` in `Backend`.
3. **Frontend Running**: `npm run dev` in `Client-React`.

## Step 1: Create Test Data
Run the helper script to create a dummy Recruiter and Student in your local database.

```bash
cd Backend
node scripts/createTestRecruiter.js
```

**Copy the URLs** output by this script. They contain the IDs you need.

## Step 2: Connect Recruiter's Calendar
1. Open the **Connect Calendar URL** from the script output in your browser.
   - Example: `http://localhost:5000/api/auth/google?recruiterId=...`
2. Sign in with your **Google Account**.
3. Grant permissions for Calendar.
4. You should be redirected to the Dashboard with `status=calendar_connected`.

## Step 3: Book a Meeting as a Student
1. Open the **Book Meeting URL** from the script output.
   - Example: `http://localhost:5173/book/<RECRUITER_ID>?studentId=<STUDENT_ID>`
2. You will see the "Public Booking Page" with the recruiter's name.
3. Select a **Date** and **Time Slot** (slots appear around 9 AM - 5 PM UTC/Local).
4. Click **Confirm Booking**.

## Step 4: Verify Results
1. **Frontend**: You should see a "Meeting Scheduled!" success message.
2. **Google Calendar**: Check the calendar of the Google account you connected.
   - You should see a new event "Meeting: Test Recruiter & Test Student".
   - Open the event detail -> Verify "Join with Google Meet" link is present.
3. **Database**: Check the `Meeting` table (optional).
   - `npx prisma studio` -> Select `Meeting`.
