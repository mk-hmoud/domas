---
"@domas/database": minor
"@domas/ts-types": minor
"server": minor
---

Feature: Account Management & User Profile Enhancements.

    - Database & Entity Updates: Added firstName, lastName, and phoneNumber to the users table and User entity.
    - New Controller & Service: Added AccountController and AccountService to handle account operations.
    - Endpoints Implemented:
    	GET /account/profile: Returns the User entity populated with Roles and Permissions.
    	PATCH /account/profile: Supports updating profile fields (firstName, lastName, phoneNumber).
    	PATCH /account/password: Endpoint for password updates.
