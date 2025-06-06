# Criterium EDU

A comprehensive educational platform for managing tasks, solutions, and reviews with role-based access control.

## Project Structure

This project is organized as a monorepo with two main parts:

- `/apps/api`: Backend API built with NestJS, TypeORM, and PostgreSQL.
- `/apps/web-ui`: Frontend application built with React, TypeScript, and DaisyUI/TailwindCSS.

## Features

- **Authentication**: Secure login, registration, and JWT-based authentication.
- **Role-Based Access Control**: Different privileges for admins, reviewers, and students.
- **Task Management**: Create, edit, and delete educational tasks with evaluation criteria.
- **Solution Submission**: Students can submit solutions to tasks.
- **Review System**: Manual and automatic review of solutions with feedback.
- **User Management**: Admin panel for managing users and their roles.
- **Dashboard**: Overview of tasks, solutions, and reviews.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm (v7 or higher)
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/criterium-edu.git
   cd criterium-edu
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and other settings
   ```

4. Run database migrations:
   ```bash
   cd apps/api
   pnpm run migration:run
   ```

### Running the Application

#### Development Mode

To run both backend and frontend in development mode:

```bash
pnpm run start:all
```

To run only the backend:

```bash
pnpm run start:api
```

To run only the frontend:

```bash
pnpm run start:web
```

#### Production Build

```bash
pnpm run build
```

## API Documentation

API documentation is available at `/api/docs` when the server is running.

## Technologies Used

### Backend
- NestJS
- TypeORM
- PostgreSQL
- JWT Authentication
- Swagger/OpenAPI

### Frontend
- React
- TypeScript
- React Query
- React Router
- React Hook Form
- Zod
- TailwindCSS
- DaisyUI
- Axios

## License

MIT
