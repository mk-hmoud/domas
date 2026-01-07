---
"@domas/client-core": minor
"client-admin": minor
"@domas/ui": minor
---

ui: Added UI components for Locations.
_ LocationTree component for tree style navigation of nodes.
_ LocationDetail provides greater information on a specific node.
_ LocationManager brings both components together in one.
_ CreateLocationModal a form for location creation. \* ConfirmDeleteModal used for the deletion of locations.

client-core: Location based logic for the UI.
_ LocationsContext handles the state of the locations tree and the api calls.
_ SharedLocatoinsPage brings the logic of the LocationsContext and the UI together to function as a global page for locations CRUD manipulations.

client-admin: Added LocationsPage route.
