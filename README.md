TaskFlow

A Django-based task management system with a production-ready backend deployed on Render.

## Problem

Managing tasks manually or across multiple tools leads to poor organization and lack of tracking.

## Solution

TaskFlow provides a centralized system to create, update, and track tasks with persistent storage and backend logic.

## Tech Stack

- Backend: Django
- Database: SQLite (development), PostgreSQL (production)
- Static Files: Whitenoise
- Version Control: GitHub

## Architecture

The application follows a client-server architecture:

Frontend → Django Backend → PostgreSQL Database

- Django handles business logic and routing
- PostgreSQL ensures persistent storage
- Environment variables manage sensitive configuration


## Features

- User authentication
- Create, update, delete tasks
- Admin dashboard
- Persistent database storage

## Local Setup

git clone https://github.com/yourusername/taskflow.git
cd taskflow

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

## Production Considerations

- Disabled DEBUG mode
- Used PostgreSQL instead of SQLite
- Configured environment variables for security
- Used Gunicorn for production server
- Served static files using Whitenoise

## Key Learnings

- Difference between development and production environments
- Backend deployment workflow
- Importance of environment variables
- Database configuration in production