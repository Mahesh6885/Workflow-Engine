# Dynamic Workflow Automation Platform

A production-grade platform for defining, executing, and tracking dynamic workflows with configurable steps, rules, conditions, approvals, and notifications.

## 🚀 Overview

The **HalleyX Workflow Engine** provides a robust, scalable architecture for automating complex business processes. It allows administrators to build workflows through a dynamic builder and empowers users to submit and track requests in real-time.

## 🛠️ Technology Stack

- **Backend**: Django REST Framework, Python 3.10+
- **Database**: PostgreSQL (main), Redis (cache & message broker)
- **Task Orchestration**: Celery (with eager mode support for development)
- **Real-time**: Django Channels (WebSockets)
- **Frontend**: React 18+, Tailwind CSS, Lucide icons, Axios

## ✨ Core Features

### 1. Dynamic Workflow Builder
Create multi-step workflows with ease. Supports:
- **Step Types**: Tasks, Approvals, Notifications, Webhooks, Delays, and Gateways.
- **Rules & Branching**: Complex if-then logic to determine workflow paths.
- **Condition Gates**: Evaluate context data before entry to any step.

### 2. Powerful Execution Engine
- **Orchestration**: Automated handling of linear and branched execution paths.
- **Context Persistence**: State and data are preserved throughout the lifecycle.
- **Error Handling**: Built-in retry logic and failure logging for robust processing.
- **Dry-run Simulation**: Test workflows in a virtual environment before publishing.

### 3. Integrated Approval Center
- Multi-mode approvals (Any-one, All-required).
- Rejection paths for flexible error handling.
- Integrated with Notifications for immediate action.

### 4. Monitoring & Analytics
- **Live Monitor**: Track active executions in real-time over WebSockets.
- **Analytics Dashboard**: Insights into workflow usage, success rates, and user participation.
- **Audit Logs**: Comprehensive history of every action taken in the system.

## 🔧 Recent Updates (v1.1)

- **Enhanced Request Portal**: A dedicated "Create Request" page with a simplified workflow selection dropdown and better form handling.
- **Filtering & Access Control**: Support for `is_active` and `is_public` workflow statuses to manage visibility.
- **Self-Seeding Database**: Automated provisioning of common workflows like "Expense Workflow" and "Employee Onboarding" for a smooth start.
- **Optimized API**: Added support for non-paginated results via `nopage=true` for clean frontend integration.

## 🚦 Getting Started

### Local Development

#### Backend
1. `cd backend`
2. `python -m venv venv`
3. `venv\Scripts\activate` (Windows)
4. `pip install -r requirements.txt`
5. `python manage.py migrate`
6. `python manage.py runserver`

#### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---
Built with ❤️ for Scalable Automation.
