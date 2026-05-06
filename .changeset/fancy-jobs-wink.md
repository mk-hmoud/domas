---
"@domas/client-core": minor
"client": minor
"server": minor
"@domas/ui": minor
---

Added student applications management page to the admin dashboard. Admins with `students.view` can browse applications; approving and rejecting requires the new `students.review_applications` permission. Approve/reject buttons are hidden for users without that permission.
