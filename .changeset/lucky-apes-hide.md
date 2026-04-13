---
"@domas/client-core": minor
"@domas/ui": minor
---

Messaging feature: UI — email compose modal and WhatsApp 1-on-1 links.

1. **BulkActionsBar** (`@domas/ui`): Added optional `onSendEmail` prop. When provided, a "Send Email" button appears in the bar.

2. **StudentsTable** (`@domas/ui`): Added a WhatsApp menu item in each row's action menu — visible only when the student has a `whatsappNumber`. Clicking opens `wa.me/<number>` in a new tab.

3. **ComposeEmailModal** (`@domas/ui`): New modal that takes a `ResolveContactsDto`, resolves the recipient list from the server, and lets the user compose a subject and body. If ≤ 80 recipients have an email address, an "Open in Email Client" button builds a `mailto:?bcc=...` link. If > 80, a "Copy Email Addresses" button copies the full list to the clipboard for manual paste into Gmail/Outlook. Skipped recipients (no email) are shown in a summary badge.

4. **SharedStudentsPage** (`@domas/client-core`): Wired `onSendEmail` on `BulkActionsBar` to open `ComposeEmailModal` with the selected student IDs as the `list` scope. Student detail drawer now shows the WhatsApp number with an inline "Open" button, and an "Email" button when an email address is present.
