---
"server": minor
---

In Users module:
_ Created a controller with two endpoints for creating a user, and a role-based fetch function.
_ Added a findAll() function in the users repository, takes an array of userroles to fetch, all users if role is null. \* Result of findAll is paginated.
