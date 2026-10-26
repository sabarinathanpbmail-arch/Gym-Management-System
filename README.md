# 🏋️ Gym Management System

A full-stack web application designed to help gym owners manage their entire gym operation, including trainers, members, membership plans, subscriptions, attendance, payments, revenue, workout plans, and fitness progress tracking.

The system provides role-based access for Gym Owners, Trainers, and Members, allowing each user to manage their responsibilities through a dedicated dashboard. It also supports email-based invitations using SMTP, enabling gym owners to invite trainers, members, and staff to join their gym.

## 📌 Project Overview

Managing a gym involves handling multiple activities, including member registration, trainer assignments, membership renewals, attendance tracking, payments, and workout management.

The Gym Management System brings these activities together in one centralized platform. Gym owners can oversee gym operations, trainers can manage their assigned members and workout plans, and members can track their own fitness activities and progress.

## 🚀 Features

### 👑 Gym Owner Dashboard

- Manage overall gym operations from a centralized dashboard.
- Invite trainers, members, and staff through email.
- Manage trainer and member accounts.
- Create and manage membership plans.
- Manage subscriptions and membership renewals.
- Track member attendance.
- Monitor payments, revenue, and subscription activity.
- View member profiles and fitness progress.
- Oversee workout plans and trainer assignments.

### 📨 Email Invitation System

- Send invitations to trainers, members, and staff using SMTP email delivery.
- Allow invited users to access the invitation link.
- Support custom password setup for invited users.
- Associate users with their assigned roles and gym.
- Redirect users to the appropriate dashboard after successful account activation and authentication.

### 💪 Trainer Dashboard

- View and manage assigned members.
- Create and assign workout plans.
- Track members' fitness progress.
- Monitor workout activities and performance.
- View member profiles and relevant fitness information.
- Manage training-related activities for assigned members.

### 🧑‍🤝‍🧑 Member Dashboard

- View personal profile information.
- Access membership and subscription details.
- View assigned workout plans.
- Track workout activities and fitness progress.
- View attendance and relevant membership information.

### 🔐 Authentication and Role-Based Access

- Email-based Gym Owner verification using OTP.
- SMTP-based email delivery for verification and invitations.
- Custom password setup for invited users.
- Role-based dashboard redirection.
- Authentication and authorization for protected application features.

### 📊 Membership and Financial Management

- Create and manage membership plans.
- Manage subscriptions and renewals.
- Track attendance records.
- Record and monitor payments.
- View revenue-related information.
- Maintain member and membership records.

## 🛠️ Tech Stack

### Frontend

- **React.js** — Building interactive user interfaces.
- **JavaScript** — Application logic and frontend functionality.
- **CSS3** — Styling and responsive layouts.
- **React Router** — Client-side navigation and dashboard routing.

### Backend

- **Java** — Backend application logic.
- **REST APIs** — Communication between the frontend and backend.
- **Java Servlet API** — Handling HTTP requests and responses where used in the backend.

### Database and Cloud Platform

- **Zoho Catalyst Data Store** — Storing application data, including user profiles and gym-related records.
- **Zoho Catalyst** — Cloud platform for backend and application services.

### Email and Authentication

- **SMTP** — Sending OTP verification emails and invitation emails.
- **Zoho Catalyst Authentication** — Authentication integration, where configured and supported by the application.

## 🏗️ Application Architecture

The application follows a frontend-backend architecture in which React.js communicates with the Java backend through REST APIs.

```text
React.js Frontend
       |
       | REST API Requests
       v
Java Backend
       |
       +----------------------+
       |                      |
       v                      v
Zoho Catalyst Data Store   SMTP Email Service
       |                      |
       v                      v
User and Gym Data        OTPs and Invitations
```

## 🔄 Application Workflow

### 1. Gym Owner Registration

1. The Gym Owner registers using their account details.
2. An OTP is sent to the owner's email address.
3. The owner verifies the account using the received OTP.
4. After successful verification and authentication, the owner accesses the Gym Owner Dashboard.

### 2. Trainer, Member, and Staff Invitations

1. The Gym Owner selects the role of the person to invite.
2. The owner enters the recipient's email address and required details.
3. The backend processes the invitation and sends an email using SMTP.
4. The recipient opens the invitation link and completes the password setup and account activation process.
5. The recipient accesses the dashboard associated with their assigned role.

### 3. Role-Based Dashboard Access

| Role | Dashboard | Responsibilities |
|---|---|---|
| Gym Owner | Owner Dashboard | Gym operations, trainers, members, plans, payments, and revenue |
| Trainer | Trainer Dashboard | Assigned members, workout plans, and progress tracking |
| Member | Member Dashboard | Personal profile, workouts, membership, attendance, and progress |
| Staff | Staff Dashboard | Authorized gym management operations |

### 4. Subsequent Login

After account activation, users sign in through the application's authentication flow. The system identifies their assigned role and directs them to the appropriate dashboard, subject to authentication and authorization checks.

## 🗂️ Main Application Modules

- Authentication and User Management
- Gym Owner Dashboard
- Trainer Management
- Member Management
- Staff Management
- Membership Plan Management
- Subscription and Renewal Management
- Attendance Tracking
- Payment and Revenue Management
- Workout Plan Management
- Fitness Progress Tracking
- Email Invitations and Notifications
- Profile Management

## 🔌 API Integration

The frontend communicates with the Java backend through REST APIs.

The API layer supports the application's user-management and gym-management operations, including:

- User registration and authentication
- OTP verification
- Email invitation processing
- Password setup and account activation
- Trainer and member management
- Membership and subscription management
- Attendance tracking
- Payment and revenue operations
- Workout plan management
- Fitness progress tracking
- Role-specific dashboard data

*Exact endpoint names and request formats depend on the implemented backend routes.*

## 🔒 Security Considerations

- Validate authentication and authorization on the backend.
- Restrict gym management operations according to user roles.
- Protect invitation links with appropriate token validation and expiration.
- Prevent reuse of single-use invitation tokens.
- Keep SMTP credentials and other secrets in server-side environment variables.
- Never store plaintext passwords.
- Protect user and gym data from unauthorized access.

## 🎯 Learning Outcomes

Through this project, I gained practical experience in:

- Developing a full-stack application using React.js and Java.
- Designing REST APIs for frontend-backend communication.
- Implementing role-based application workflows.
- Integrating SMTP for email notifications and invitations.
- Working with Zoho Catalyst as a cloud platform and data store.
- Managing gym-related data and business operations.
- Structuring a multi-role application with separate dashboards.
- Handling user authentication and account-management workflows.

## 👨‍💻 Author

**Sabari Nathan P B**

- GitHub: [SABARINATHAN-hash](https://github.com/SABARINATHAN-hash)
- LinkedIn: [Sabarinathan](https://linkedin.com/in/sabarinathan08/)

---

*Gym Management System — Simplifying gym operations through centralized management, role-based access, and digital fitness tracking.*
