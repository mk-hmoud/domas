// Registry of generated-document types that admins/managers can edit the
// format of. Adding a new paper type later is: add an entry here (+ labels/
// sample context for the editor) and a context builder in the owning
// domain service - no template-engine code changes needed.
export const DOCUMENT_TYPES = {
  CHECK_IN_CONTRACT: 'check_in',
  CHECK_OUT_CONTRACT: 'check_out',
  DORM_CERTIFICATE: 'dorm_certificate',
} as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

export const DOCUMENT_TYPE_VALUES: DocumentType[] = Object.values(DOCUMENT_TYPES);

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  check_in: 'Check-In Contract',
  check_out: 'Check-Out Contract',
  dorm_certificate: 'Dormitory Accommodation Certificate',
};

// Merge-field hints surfaced in the admin template editor per document type.
export const DOCUMENT_TYPE_FIELDS: Record<DocumentType, string[]> = {
  check_in: [
    'student.firstName',
    'student.lastName',
    'student.studentNumber',
    'student.nationalId',
    'isTR',
    'room.name',
    'bed.label',
    'staffName',
    'managerName',
    'items[].nameTr / items[].nameEn / items[].scope / items[].quantity',
    'issueDate',
  ],
  check_out: [
    'student.firstName',
    'student.lastName',
    'student.studentNumber',
    'isTR',
    'room.name',
    'bed.label',
    'staffName',
    'managerName',
    'liabilities[].description / liabilities[].amount / liabilities[].currency',
    'totalDeposit',
    'totalDeductions',
    'refundAmount',
    'currency',
    'issueDate',
  ],
  dorm_certificate: [
    'student.firstName',
    'student.lastName',
    'student.studentNumber',
    'isTR',
    'room.name',
    'bed.label',
    'managerName',
    'issueDate',
    'booking.startDate',
    'booking.endDate',
  ],
};

// Synthetic fixtures used to render a live preview in the editor without
// needing to pick a real booking/student record.
export const DOCUMENT_TYPE_SAMPLE_CONTEXT: Record<DocumentType, Record<string, unknown>> = {
  check_in: {
    student: {
      firstName: 'Jane',
      lastName: 'Doe',
      studentNumber: '20230001',
      nationalId: 'A1234567',
    },
    isTR: false,
    room: { name: 'B-204' },
    bed: { label: 'A' },
    staffName: 'Staff Member',
    managerName: 'Housing Manager',
    items: [
      { nameTr: 'Yatak', nameEn: 'Bed', scope: 'bed', quantity: 1 },
      { nameTr: 'Dolap', nameEn: 'Wardrobe', scope: 'room', quantity: 1 },
    ],
    issueDate: new Date().toLocaleDateString('en-GB'),
  },
  check_out: {
    student: { firstName: 'Jane', lastName: 'Doe', studentNumber: '20230001' },
    isTR: false,
    room: { name: 'B-204' },
    bed: { label: 'A' },
    staffName: 'Staff Member',
    managerName: 'Housing Manager',
    liabilities: [{ description: 'Broken chair', amount: 50, currency: 'USD' }],
    totalDeposit: 200,
    totalDeductions: 50,
    refundAmount: 150,
    currency: 'USD',
    issueDate: new Date().toLocaleDateString('en-GB'),
  },
  dorm_certificate: {
    student: { firstName: 'Jane', lastName: 'Doe', studentNumber: '20230001' },
    isTR: false,
    room: { name: 'B-204' },
    bed: { label: 'A' },
    managerName: 'Housing Manager',
    issueDate: new Date().toLocaleDateString('en-GB'),
    booking: { startDate: '2025-09-01', endDate: '2026-06-08' },
  },
};
