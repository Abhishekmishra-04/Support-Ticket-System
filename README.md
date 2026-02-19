# AI-Powered Support Ticket System

## Overview
This is a comprehensive Support Ticket System built for a Tech Intern Assessment. It features a React frontend, a Django REST Framework backend, and an LLM-powered classification engine to automatically suggest ticket categories and priorities.

## Tech Stack
- **Backend:** Django 5.x + Django REST Framework
- **Database:** PostgreSQL
- **Frontend:** React 19 + Tailwind CSS + Vite
- **LLM:** OpenAI (GPT-4o-mini)
- **Infrastructure:** Docker + Docker Compose

- Demo- <img width="1867" height="825" alt="image" src="https://github.com/user-attachments/assets/30059234-1634-4315-a711-63e5b5154bf7" />


## Setup Instructions

1.  **Clone the repository.**
2.  **Provide OpenAI API Key:**
    - Create a `.env` file in the root directory (use `.env.example` as a template).
    - Add your `OPENAI_API_KEY=your_key_here`.
3.  **Run the application:**
    ```bash
    docker-compose up --build
    ```
4.  **Access the application:**
    - Frontend: `http://localhost:5173`
    - API: `http://localhost:8000/api/`

## LLM Integration & Prompting
- **Model:** `gpt-4o-mini` was chosen for its balance of cost-efficiency and high performance in classification tasks.
- **Mechanism:** When a user types a description, the `/api/tickets/classify/` endpoint is called.
- **Prompt:**
  ```text
  You are a support ticket classification assistant. 
  Given the following ticket description, suggest the most appropriate category and priority.
  
  Categories: billing, technical, account, general
  Priorities: low, medium, high, critical
  
  Description: {description}
  
  Respond ONLY with a valid JSON object:
  {"suggested_category": "...", "suggested_priority": "..."}
  ```

## Design Decisions
1.  **DB-Level Aggregation:** The `/api/tickets/stats/` endpoint uses Django's `Count` and `Avg` functions within a single query to ensure high performance and scalability, avoiding Python-level loops.
2.  **Real-time Classification:** The frontend triggers classification on the "blur" event of the description field. This provides a snappy UX without overwhelming the API while the user is still typing.
3.  **Dockerization:** Multi-stage builds are used for the frontend to optimize image size. A `wait-for-it` style approach is implemented in the entrypoint to ensure the database is ready before running migrations.

## Suggested Incremental Commit History
1. `feat: initial project structure and docker configuration`
2. `feat(backend): implement Ticket model and basic CRUD views`
3. `feat(backend): add complex filtering and search to ticket list`
4. `feat(backend): implement DB-level aggregation for stats endpoint`
5. `feat(backend): add OpenAI classification endpoint with prompt engineering`
6. `feat(frontend): build ticket list with real-time filtering`
7. `feat(frontend): implement ticket submission with LLM auto-suggestions`
8. `feat(frontend): add stats dashboard with data visualization`
9. `fix: handle LLM API failures gracefully and refine UI styling`
10. `docs: update README with setup instructions and design decisions`
