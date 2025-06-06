You're right! Since you only have `.env.local` files and no `.env.example`, here's the corrected installation guide:

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

- Node.js (v22 or higher)
- npm (v10 or higher)
- Docker and Docker Compose (for Docker installation)
- PostgreSQL (for local installation)

## Installation

### Option 1: Using Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/mdportnov/criterium-edu.git
   cd criterium-edu
   ```

2. The repository contains pre-configured `.env.local` files for backend and frontend (`apps/api/.env.local` and `apps/web-ui/.env.local`) with all necessary environment variables.

3. Start all services using Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Once the services are running, the backend will be available on the port specified in `.env.local` (default 3000), and the frontend on the port specified in the corresponding `.env.local` (default 5173).

5. To stop the services:
   ```bash
   docker-compose down
   ```

**Note:**
- All database settings, JWT, and other parameters are pre-configured in `.env.local` files.
- Docker Compose automatically creates and connects the necessary containers (PostgreSQL, backend, frontend).

### Option 2: Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mdportnov/criterium-edu.git
   cd criterium-edu
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. The repository includes pre-configured `.env.local` files with all necessary environment variables. Review and modify them if needed for your local setup.

4. Start the backend server:
   ```bash
   npm run start:api
   ```

5. In a separate terminal, start the frontend server:
   ```bash
   npm run start:web
   ```

6. To stop the servers, use Ctrl+C in the terminal.

**Note:**
- Backend will be available on the port specified in `apps/api/.env.local` (default 3000).
- Frontend will be available on the port specified in `apps/web-ui/.env.local` (default 5173).

### Running Both Services Simultaneously

To run both backend and frontend in development mode:

```bash
npm run start:all
```

### Production Build

```bash
npm run build:all
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
