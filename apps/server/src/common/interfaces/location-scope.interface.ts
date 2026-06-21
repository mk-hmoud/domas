// Resolved location access for a staff member.
// unrestricted: true only for Recovery Admin - bypasses all location filtering.
// treePaths: ltree paths the user is anchored at; access extends to each path's
// entire subtree. Empty array = no location-scoped access (deny by default).
export interface LocationScope {
  unrestricted: boolean;
  treePaths: string[];
}
