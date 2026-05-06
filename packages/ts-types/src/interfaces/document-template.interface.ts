export type DocumentTemplateType = "check_in" | "check_out";
export type DocumentLanguage = "TR" | "EN";

export interface TextSection {
  type: "text";
  content: string;
  align?: "left" | "center" | "right" | "justify";
  bold?: boolean;
  fontSize?: number;
  underline?: boolean;
  spaceAfter?: number;
}

export interface RulesListSection {
  type: "rules_list";
  items: string[];
  fontSize?: number;
}

export interface SignatureColumn {
  label: string;
  nameVar: string;
  idLine?: string;
}

export interface SignatureRowSection {
  type: "signature_row";
  columns: SignatureColumn[];
}

export interface SpacerSection {
  type: "spacer";
  lines?: number;
}

export type DynamicSection =
  | { type: "inventory_table" }
  | { type: "liability_table" }
  | { type: "deposit_info" }
  | { type: "page_break" };

export type DocumentSection =
  | TextSection
  | RulesListSection
  | SignatureRowSection
  | SpacerSection
  | DynamicSection;

export interface DocumentTemplate {
  id: number;
  type: DocumentTemplateType;
  language: DocumentLanguage;
  title: string;
  sections: DocumentSection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDocumentTemplateDto {
  title?: string;
  sections?: DocumentSection[];
}
