# 🏛️ Exam Hall Allocator

An end-to-end seat allocation and staff duties management system designed to optimize exam hall distributions, manage exam session rules, and provide real-time dashboards and mobile applications for students and teachers.

---

## 📂 Project Structure

This repository is a monorepo consisting of the following key sub-projects:

*   **`Backend`**: Node.js, Express, and PostgreSQL backend REST API. Contains the core seat allocation engine, DB controllers, CSV generators, and authentication handlers.
*   **`Frontend`**: React SPA built with Vite, styled with Tailwind CSS and Lucide React. An administrative portal to upload CSV files, preview room layouts, toggle defective seats, configure allocation rules, and run the seat allocator engine.
*   **`Student mobile app`**: An Expo/React Native mobile application for students to log in, view their upcoming exam timetables, and securely check their seat allocation details (with dynamic time-based visibility controls).
*   **`Teacher mobile app`**: An Expo/React Native mobile application for teachers to check invigilation duties, download candidate checklists for assigned rooms, and request invigilation duties alterations (with admin approval workflows).

---

## 🛠️ Tech Stack

*   **Backend:** Node.js, Express, PostgreSQL (`pg` library), JWT, BCrypt.
*   **Web Portal:** React (v18), Vite, Tailwind CSS, Recharts, Lucide Icons.
*   **Mobile Apps:** Expo (SDK 54), React Native, React Navigation, Axios, AsyncStorage.

---

## 💾 Database Setup (PostgreSQL)

The system stores students, teachers, seat configurations, rooms, sessions, and duty records in a PostgreSQL database.

### 1. Database Creation
Create a new database in PostgreSQL named `Examhall`:
```sql
CREATE DATABASE "Examhall";
```

### 2. Schema Initialization
Run the commands inside the root [`schema.sql`](./schema.sql) file to create the tables in your PostgreSQL database. Alternatively, run:
```bash
psql -U postgres -d Examhall -f schema.sql
```

### 3. Connection Setup
Navigate to the `Backend` directory and check the `.env` file configuration:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/examhall
PORT=3000
STUDENT_JWT_SECRET=super_secret_student_key_123
TEACHER_JWT_SECRET=mysecretteacherkey
```
> **Note:** Ensure database user credentials match your local PostgreSQL setup. If your database credentials differ from the defaults, update the connection configurations in:
> - `Backend/.env`
> - `Backend/src/db/index.js`
> - `Backend/setup_students.js`
> - `Backend/setup_teachers.js`
> - `Backend/setup_rooms.js`

---

## 🚀 How to Run the Applications

### 🔹 1. Backend Service
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the database initialization script to populate all tables (students, teachers, and exam halls):
   ```bash
   npm run db:init
   ```
   *(This command runs all individual setup scripts automatically under the hood: `setup_students.js`, `setup_teachers.js`, and `setup_rooms.js`)*
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start running at `http://localhost:3000`.

---

### 🔹 2. Administrative Web Portal (Frontend)
1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to the local server address shown (typically `http://localhost:5173`). You can upload rooms, students, and teachers CSV files here to create and run exam hall allocations.

---

### 🔹 3. Student Mobile Application
1. Navigate to the student app folder:
   ```bash
   cd "Student mobile app/student-app"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo builder:
   ```bash
   npx expo start
   ```
4. Run on your device:
   * Download the **Expo Go** app from App Store (iOS) or Play Store (Android).
   * Scan the QR code displayed in the terminal window to open the app on your mobile device.
   * *Note: Ensure your computer and mobile phone are connected to the same Wi-Fi network.*

---

### 🔹 4. Teacher Mobile Application
1. Navigate to the teacher app folder:
   ```bash
   cd "Teacher mobile app/teacher-app"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo builder:
   ```bash
   npx expo start
   ```
4. Scan the terminal QR code using the **Expo Go** app on your phone. Ensure you are on the same Wi-Fi network.

---

## 🔒 Default Logins for Testing

After seeding the database, check `Backend/plain_passwords.json` to get the generated login passwords.

*   **Students:** Login with their Roll Number (e.g. `251001101` or `231501101`) and the password generated for them in `plain_passwords.json`.
*   **Teachers:** Login with their Teacher ID (e.g. `T001` to `T006`) and the password generated for them in `plain_passwords.json`.
