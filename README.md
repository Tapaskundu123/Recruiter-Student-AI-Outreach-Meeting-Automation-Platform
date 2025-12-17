# Recruiter-Student AI Outreach & Meeting Automation Platform

A comprehensive platform designed to automate the connection between university students and recruiters. The system handles data import, email outreach campaigns, meeting scheduling, and placement management.

## 🚀 Key Features Implemented

### 1. Data Management (New!)
*   **Flexible CSV Upload System**: Admins can upload Recruiter and Student data via CSV.
    *   **Dynamic Column Mapping**: Intelligent system maps columns (e.g., "full_name" -> "name") automatically.
    *   **Custom Data Preservation**: Any non-standard fields (e.g., "GPA", "Skills") are safely stored in a flexible JSON structure (`enrichedData`) and remain accessible.
    *   **Validation**: Automatic duplicate detection (via email) and row-level error tracking.
    *   **Dashboard**: Drag-and-drop interface with real-time progress and upload history.

### 2. Admin Dashboard
*   **Analytics Overview**: Visual stats for Total Recruiters, Active Campaigns, Waitlisted Students, and Upcoming Meetings.
*   **Quick Actions**: One-click access to import data, create campaigns, or manage meetings.
*   **Unified Sidebar Navigation**: Consistent layout across all admin pages (Dashboard, Availability, Campaigns, Leads, Analytics).

### 3. Campaign Management
*   **Email Automation**: Create and schedule email campaigns for recruiters.
*   **Template Support**: System uses Handlebars templates for personalized emails.
*   **Tracking**: Monitors sent emails and engagement (Open/Click rates).

### 4. Meeting Automation
*   **Availability Management**: Admin dashboard to manage recruiter availability slots.
*   **Public Booking Page**: dedicated booking pages for students/recruiters to schedule interviews.
*   **Google Calendar Integration**:
    *   OAuth2 integration for calendar sync.
    *   Automatic event creation upon confirmation.
    *   Meeting confirmation emails sent to both parties.
    *   Automated reminders (24h and 1h before meeting).

### 5. Lead & Student Management
*   **Waitlist System**: Students can join a waitlist and be approved/rejected.
*   **Lead Manager**: View and manage imported recruiters and students.
*   **Status Tracking**: Track student status (Waitlisted, Contacted, Scheduled, Placed).

---

## 🛠️ Tech Stack

### Backend
*   **Runtime**: Node.js + Express.js
*   **Database**: PostgreSQL
*   **ORM**: Prisma (with custom JSON fields for flexible data)
*   **Email**: Nodemailer (SMTP/Brevo)
*   **Calendar**: Google Calendar API
*   **File Handling**: Multer (CSV processing)

### Frontend
*   **Framework**: React.js (Vite)
*   **Styling**: Tailwind CSS + ShadCN UI
*   **State Management**: TanStack Query (React Query)
*   **Animations**: Framer Motion
*   **Router**: React Router DOM

---

## 🏃‍♂️ Getting Started

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL Database
*   Google Cloud Console Project (for Calendar API)
*   SMTP Provider (e.g., Brevo/Gmail)

### Installation

1.  **Clone the repository**
2.  **Install Dependencies**:
    ```bash
    # Backend
    cd Backend
    npm install

    # Frontend
    cd ../Client-React
    npm install
    ```

3.  **Database Setup**:
    ```bash
    cd Backend
    # Ensure .env has valid DATABASE_URL
    npx prisma migrate dev
    npx prisma generate
    ```

4.  **Environment Configuration**:
    Create `.env` files in both `Backend` and `Client-React` directories (see `.env.example`).

### Running the App

1.  **Start Backend** (Runs on port 5000):
    ```bash
    cd Backend
    npm start
    ```

2.  **Start Frontend** (Runs on port 5173):
    ```bash
    cd Client-React
    npm run dev
    ```

3.  **Access the Dashboard**:
    Open `http://localhost:5173/admin`

---

## 📚 Documentation

Detailed documentation for specific features can be found in `Backend/docs/`:
*   `CSV_UPLOAD_GUIDE.md`: How to use the new CSV system.
*   `FLEXIBLE_CSV_SYSTEM.md`: Technical details on dynamic column mapping.
*   `BREVO_SETUP.md`: Email configuration guide.

---

## 🔄 Recent Updates
*   **Dec 2025**: Replaced web scraping with robust CSV upload system.
*   **Dec 2025**: Added "Enriched Data" support for storing custom CSV columns.
*   **Dec 2025**: Implemented Admin Availability Dashboard with Google Calendar sync.
