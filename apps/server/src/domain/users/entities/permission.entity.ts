export class Permission {
  id!: number;
  slug!: string;
  description?: string;

  constructor(partial: Partial<Permission>) {
    Object.assign(this, partial);
  }
}
