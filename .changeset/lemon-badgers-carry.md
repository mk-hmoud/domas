---
"@domas/client-core": minor
"@domas/ui": minor
---

- **Hierarchical Bed Selection**:
  - Implemented a new `HierarchicalBedSelector` component that provides a guided, cascading selection process (University -> Campus -> Building -> Floor -> Room -> Bed).
  - The selector is type-agnostic and dynamically adapts to any campus hierarchy structure.
  - Automatically filters for eligible beds based on student gender and nationality once a room is reached.
