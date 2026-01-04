---
"client-admin": minor
"client-dorm": minor
---

'client-admin':
_ Added two routes /login and /dashboard.
_ /login is using the SharedLoginPage from 'client-core', and /dashboard is protected with ProtectedRoute from 'client-core'.

'client-dorm': \* Similar changes done to client-admin, /login changed to use SharedLoginPage, and /dashboard is changed to be a protected route.
