# Criterium EDU

Criterium EDU is an automated system for checking assignments based on criteria. It enables efficient evaluation of student work using predefined criteria and supports both automated and manual review processes.

## Project Structure

This is a monorepo project with the following structure:

- `apps/api`: NestJS backend application
- `apps/web`: React frontend application
- `libs/shared`: Shared code between applications

## Features

- Task management with criteria-based assessment
- Student task solution submission
- Automated assessment of student solutions
- Manual review and feedback by mentors
- User management with different roles (admin, mentor, student)
- Authentication and authorization

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- PostgreSQL

### Setup

1. Clone the repository
```
git clone https://github.com/mdportnov/criterium-edu.git
cd criterium-edu
```

2. Install dependencies
```
npm install
```

3. Create a PostgreSQL database
```
createdb criterium_edu
```

4. Configure environment variables
```
cp .env.example .env
```
Then edit `.env` to match your local configuration.

5. Run database migrations
```
npm run migration:run
```

6. Start the API server
```
npm run start:dev
```

7. Start the web application
```
npm run web:dev
```

## Tech Stack

### Backend
- NestJS
- TypeORM
- PostgreSQL
- JWT Authentication
- Pino Logger
- Swagger

### Frontend
- React
- React Router
- React Query
- Formik & Yup
- HeroUI (components library)
- Tailwind CSS
- Axios

## Project Management

### Backend Development

- Run the server: `npm run start:dev`
- Generate a migration: `npm run migration:generate -- -n MigrationName`
- Run migrations: `npm run migration:run`
- Revert the last migration: `npm run migration:revert`

### Frontend Development

- Run the development server: `npm run web:dev`
- Build for production: `npm run web:build`

## API Documentation

API documentation is automatically generated with Swagger and can be accessed at:

```
http://localhost:3000/api/docs
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.