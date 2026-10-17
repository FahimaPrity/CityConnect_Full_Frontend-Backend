# Eutropia_Project

# Complaint Management Platform

## Project Description

The Complaint Management Platform is a web-based backend system developed using Django and Django REST Framework to streamline the process of submitting, managing, tracking, and resolving customer complaints. The system provides a structured workflow that allows customers to submit complaints while enabling support agents and administrators to manage tickets efficiently.

Customers can create complaint tickets and track their status. Support agents can access their assigned tickets, update ticket priorities, and manage the resolution process. Administrators can assign tickets to support agents and oversee the overall complaint management workflow.

The platform also includes a Service Level Agreement (SLA) management system to monitor resolution deadlines and identify overdue complaints. Automated email notifications are integrated into ticket-related events to keep relevant users informed about ticket creation, assignment, priority changes, and status updates. In addition, the system maintains activity logs to record important actions and provides role-based dashboard summaries for monitoring complaint statistics.

The backend is built with **Python, Django, Django REST Framework, and PostgreSQL**, with JWT-based authentication for secure API access. The system follows a modular architecture, separating user management, ticket handling, notifications, SLA tracking, activity logging, and dashboard functionality into individual Django applications.

## Key Features

* Customer registration and JWT-based authentication
* Role-based access for customers, support agents, and administrators
* Complaint ticket creation and tracking
* Ticket assignment and priority management
* Ticket status and resolution management
* SLA deadlines and breach monitoring
* Email notifications for important ticket events
* Activity logs for tracking ticket-related actions
* Role-specific dashboard summaries
* RESTful API architecture for integration with a frontend application

## Technology Stack

* **Programming Language:** Python
* **Backend Framework:** Django
* **API Framework:** Django REST Framework
* **Authentication:** JSON Web Tokens (JWT)
* **Database:** PostgreSQL
* **Email Integration:** Django email framework

## Project Objective

The primary objective of this project is to develop a reliable and maintainable backend system that improves complaint-handling efficiency, supports accountability, monitors resolution deadlines, and provides a clear workflow for customers, support agents, and administrators.

The backend is designed to support integration with a separate frontend application through RESTful APIs.
