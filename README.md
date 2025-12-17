# Flexi Timetable Admin Panel

A web-based admin panel for managing users and uploading student timetables. Built with **React**, **React Query**, **Tailwind CSS**, and **Node/Express/MongoDB** backend.

---

## Features

- **Manage Users**
  - View all registered users
  - Filter/search by name, email, username, or roll number
  - Tabs to separate **Students**, **Staff**, and **Admins**
  - Role badges and initials-based avatars

- **Upload Timetables**
  - Drag-and-drop XLSX or CSV files
  - Upload progress indicator
  - Error handling with row-level reporting
  - File template for reference

- **Responsive UI**
  - Built using Tailwind CSS components
  - Scrollable tables and cards for large data

---

## Project Structure

/frontend # React application
/components # UI components (Card, Badge, Tabs, Avatar, etc.)
/pages # Pages like ManageUsers.tsx, UploadTimetables.tsx
/hooks # Custom hooks (use-toast, etc.)
App.tsx # Main application entry

/backend # Node.js/Express backend
/models # Mongoose models (User, Timetable)
/routes # Express routes (users, timetables)
server.ts # Express server setup


---

## Tech Stack

- **Frontend:** React, React Query, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Other:** React Hook Form, Toast notifications

---

## Getting Started

### 1. Clone the repository

git clone https://github.com/yourusername/flexi-timetable-admin.git
cd flexi-timetable-admin

2. Install dependencies

npm install


3. Environment Variables

Create a .env file in backend/:

MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/flexi-timetable
PORT=5000

4. Run the application

npm run dev

Visit http://localhost:3000 to access the admin panel
Visit https://flexiod.onrender.com to access demo pages of Admin, Student and Staff
Sample Credentials:
Admin : Admin - 12345678
username of other staff and students is available in Admin. (password is 12345678 for all)
NOTE : The demo page is learning purpose only.


Usage

- Go to Manage Users to view, filter, and browse users.
- Go to Upload Timetables to upload student timetable files.
- Download the template for correct column formatting.
- Monitor upload progress and errors in real-time.


Troubleshooting

- Users not loading
- Ensure backend is running and accessible
- Check CORS headers if frontend is on a different domain
- Use relative URL /api/admin/users in frontend fetch

Upload errors

- Ensure the file matches template columns
- Do not include _id in upload CSV/XLSX
- Row-level errors will be displayed in the UI
