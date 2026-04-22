---
"@domas/client-core": minor
"client": minor
"@domas/ui": minor
---

UI/UX overhaul of Registry and Inventory segments.

- Students: removed Card wrapper around the search input; bare TextInput now matches the Check-In/Check-Out pattern.
- Access Cards: removed redundant Stack wrapper; moved Tabs.List mb="md" onto the list; gave "All Cards" tab a distinct icon (IconId vs IconCards for batches).
- Inventory Catalog: removed Card wrapper around search input, consistent with Students.
- Damages: removed redundant Stack wrapper; pending damage count now shown as a red filled Badge on the "Reported" tab rightSection.
