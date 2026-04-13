export type ContactScope = "all" | "location" | "list";

export interface ResolveContactsDto {
  scope: ContactScope;
  /** Required when scope === 'location' */
  locationId?: number;
  /** Required when scope === 'list' */
  studentIds?: string[];
}

export interface ResolvedContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  whatsappNumber?: string;
}
