# HR Admin Portal

A role-based Human Resource Management application built using React, TypeScript, and Vite. The portal helps manage employee records, attendance, departments, designations, employee types, and Maker–Checker approval workflows.

## 1. Project Overview

The HR Admin Portal provides a centralized interface for managing HR operations with role-based access control.

The application supports three user roles:

### Common
- View all HR modules.
- Add attendance records directly.
- View Audit History.
- Cannot access Maker–Checker functionality.

### Maker
- View HR modules.
- Submit Create, Update, and Delete requests.
- Requests are submitted for Checker approval.
- Cannot approve or reject requests.

### Checker
- View HR modules.
- Review pending requests.
- Approve or reject submitted requests.
- Add remarks when rejecting requests.
- Cannot directly submit Create, Update, or Delete requests.

### Audit History
- Available to all three roles.
- Displays approved and rejected requests.
- Maintains a record of request activities.

## 2. Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | Frontend development |
| TypeScript | Type safety |
| Vite | Development server and build tool |
| Tailwind CSS | Styling |
| Redux Toolkit | State management |
| React Redux | Redux integration |
| React Router DOM | Routing and navigation |
| Axios | API communication |
| Formik | Form management |
| Yup | Form validation |
| React Toastify | Notifications |
| Lucide React | Icons |
| Mockoon | Mock API server |
| LocalStorage | Local request data persistence |

## 3. Project Modules

The application includes the following modules:

1. Dashboard
2. Employees
3. Employee Types
4. Departments
5. Designations
6. Attendance
7. Maker–Checker
8. Audit History

## 4. Project Setup and Installation

### Prerequisites

Make sure the following tools are installed:

- Node.js
- npm
- Visual Studio Code
- Mockoon

### Step 1: Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

### Step 2: Open the Project Folder

```bash
cd hr-admin-portal
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

The project root contains a `.env` file.

```env
VITE_API_BASE_URL=http://localhost:3001
```

### Step 5: Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in the terminal:

```text
http://localhost:5173
```

### Step 6: Create Production Build

```bash
npm run build
```

## 5. Mockoon Setup and Configuration

Mockoon is used to simulate backend API endpoints during frontend development.

### Mockoon Environment Details

| Setting | Value |
|---|---|
| Environment Name | Hr admin portal api |
| Host | localhost |
| Port | 3001 |
| API Base URL | http://localhost:3001 |
| CORS | Enabled |

### Steps to Start Mockoon

1. Open the Mockoon desktop application.
2. Select the `Hr admin portal api` environment.
3. Verify that the configured port is `3001`.
4. Click the Start Server button.
5. Keep Mockoon running while using the application.

### API Configuration

The frontend uses the following environment variable:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Make sure the Mockoon port and frontend API base URL match.

## 6. Demo Credentials

The following credentials are configured in the Mockoon login API.

| Role | Username | Password |
|---|---|---|
| Maker | maker1 | maker@123 |
| Checker | checker1 | checker@123 |
| Common | common1 | common@123 |

### Login API

- Method: `POST`
- Endpoint: `/auth/login`
- Full URL: `http://localhost:3001/auth/login`

The login API validates the username and password and returns the corresponding user role and mock authentication token.

Invalid credentials return a `401 Unauthorized` response.

## 7. API Endpoints

The following endpoints are configured in the Mockoon environment.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Root endpoint |
| POST | `/auth/login` | User authentication |
| GET | `/employees` | Fetch employees |
| GET | `/employee-types` | Fetch employee types |
| GET | `/departments` | Fetch departments |
| GET | `/designations` | Fetch designations |
| GET | `/attendance` | Fetch attendance records |
| POST | `/attendance` | Add attendance |
| GET | `/requests` | Fetch requests |
| POST | `/requests` | Submit a request |
| PATCH | `/requests/:id/approve` | Approve a request |
| PATCH | `/requests/:id/reject` | Reject a request |

## 8. Maker–Checker Workflow

The Maker–Checker workflow ensures that changes submitted by the Maker are reviewed by the Checker.

### Workflow Steps

1. Maker logs into the application.
2. Maker selects an HR module.
3. Maker submits a Create, Update, or Delete request.
4. The request is assigned Pending status.
5. Checker reviews the request details.
6. Checker approves or rejects the request.
7. Rejected requests can include remarks.
8. Approved and rejected requests are displayed in Audit History.

## 9. Role-Based Permissions

| Feature | Common | Maker | Checker |
|---|---|---|---|
| View HR Modules | Yes | Yes | Yes |
| Add Attendance | Yes | Request | No |
| Submit CRUD Requests | No | Yes | No |
| Approve Requests | No | No | Yes |
| Reject Requests | No | No | Yes |
| View Audit History | Yes | Yes | Yes |
| Access Maker–Checker | No | Yes | Yes |

## 10. Data Storage and Persistence

- Mockoon is used to provide mock