import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import {
  DocumentSection,
  DocumentTemplate,
  DocumentTemplateType,
  DocumentLanguage,
  UpdateDocumentTemplateDto,
} from '@domas/ts-types';
import { DocumentTemplatesRepository } from '../repositories/document-templates.repository';

export interface TemplateData {
  student: { fullName: string; studentNumber: string };
  room: { name: string };
  bed: { label: string };
  staff: { fullName: string };
  manager: { fullName: string };
  now: string;
  snapshots?: Array<{
    nameTr: string;
    nameEn: string;
    scope: string;
    quantity: number;
  }>;
  liabilities?: Array<{
    item_name_tr: string;
    item_name_en: string;
    report_description: string;
    amount: number;
    currency: string;
  }>;
  financials?: {
    totalDeposit: number;
    totalDeductions: number;
    refundAmount: number;
    currency: string;
  };
}

@Injectable()
export class DocumentTemplatesService {
  private readonly fontPath = path.join(process.cwd(), 'src/assets/fonts/Roboto-Regular.ttf');
  private readonly fontBoldPath = path.join(process.cwd(), 'src/assets/fonts/Roboto-Bold.ttf');

  constructor(private readonly repo: DocumentTemplatesRepository) {}

  async findAll(): Promise<DocumentTemplate[]> {
    return this.repo.findAll();
  }

  async findOne(id: number): Promise<DocumentTemplate> {
    const template = await this.repo.findById(id);
    if (!template) throw new NotFoundException(`Document template ${id} not found`);
    return template;
  }

  async update(id: number, dto: UpdateDocumentTemplateDto): Promise<DocumentTemplate> {
    await this.findOne(id);
    return this.repo.update(id, dto);
  }

  async renderPdf(
    type: DocumentTemplateType,
    language: DocumentLanguage,
    data: TemplateData,
  ): Promise<Buffer> {
    const template = await this.repo.findByTypeAndLanguage(type, language);
    if (!template) {
      throw new NotFoundException(
        `No document template found for type="${type}" language="${language}"`,
      );
    }

    const isTR = language === 'TR';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.registerFont('Custom-Regular', this.fontPath);
      doc.registerFont('Custom-Bold', this.fontBoldPath);
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      for (const section of template.sections as DocumentSection[]) {
        this.renderSection(doc, section, data, isTR);
      }

      doc.end();
    });
  }

  // ─── Section renderer ────────────────────────────────────────────────────

  private renderSection(
    doc: PDFKit.PDFDocument,
    section: DocumentSection,
    data: TemplateData,
    isTR: boolean,
  ): void {
    switch (section.type) {
      case 'text': {
        doc.font(section.bold ? 'Custom-Bold' : 'Custom-Regular').fontSize(section.fontSize ?? 10);
        const opts: PDFKit.Mixins.TextOptions = {};
        if (section.align) opts.align = section.align as any;
        if (section.underline) opts.underline = true;
        doc.text(this.interpolate(section.content, data), opts);
        if (section.spaceAfter != null) doc.moveDown(section.spaceAfter);
        break;
      }

      case 'rules_list': {
        doc.font('Custom-Regular').fontSize(section.fontSize ?? 9);
        for (const item of section.items) {
          doc.text(item, { align: 'justify' });
          doc.moveDown(0.1);
        }
        break;
      }

      case 'signature_row': {
        const ySig = doc.y;
        const xPositions = [40, 200, 380];
        const sigLabel = isTR ? 'İmza' : 'Signature';
        doc.font('Custom-Regular').fontSize(10);
        section.columns.forEach((col, i) => {
          const x = xPositions[i] ?? 40 + i * 160;
          const name = this.interpolate(`{{${col.nameVar}}}`, data);
          doc.text(col.label, x, ySig);
          doc.text(name, x, ySig + 15);
          if (col.idLine) doc.text(this.interpolate(col.idLine, data), x, ySig + 30);
          doc.text(`${sigLabel}: ....................`, x, ySig + 55);
        });
        doc.x = 40;
        doc.y = ySig + 75;
        break;
      }

      case 'inventory_table': {
        if (data.snapshots?.length) {
          this.drawInventoryTable(doc, data.snapshots, isTR);
        }
        break;
      }

      case 'deposit_info': {
        if (data.financials) {
          const f = data.financials;
          doc.font('Custom-Regular').fontSize(9);
          doc.text(
            isTR
              ? `Depozito Miktarı: ${f.totalDeposit} ${f.currency} Kesinti Miktarı: ${f.totalDeductions} ${f.currency} İade Miktarı: ${f.refundAmount} ${f.currency}`
              : `Amount of Deposit: ${f.totalDeposit} ${f.currency} Amount Deductions: ${f.totalDeductions} ${f.currency} Refund Amount: ${f.refundAmount} ${f.currency}`,
          );
        }
        break;
      }

      case 'liability_table': {
        if (data.liabilities?.length) {
          doc.addPage();
          doc
            .font('Custom-Bold')
            .fontSize(12)
            .text(isTR ? 'HASAR VE BORÇ DETAYLARI' : 'DAMAGE AND DEBT DETAILS', {
              align: 'center',
            });
          doc.moveDown();
          doc.font('Custom-Regular').fontSize(10);
          data.liabilities.forEach((l, idx) => {
            const itemName = isTR ? l.item_name_tr : l.item_name_en;
            const line = itemName
              ? `${itemName} (${l.report_description}): ${l.amount} ${l.currency}`
              : `${l.report_description}: ${l.amount} ${l.currency}`;
            doc.text(`${idx + 1}. ${line}`);
          });
        }
        break;
      }

      case 'spacer':
        doc.moveDown(section.lines ?? 1);
        break;

      case 'page_break':
        doc.addPage();
        break;
    }
  }

  // ─── Inventory table (two-column layout) ─────────────────────────────────

  private drawInventoryTable(
    doc: PDFKit.PDFDocument,
    items: NonNullable<TemplateData['snapshots']>,
    isTR: boolean,
  ): void {
    const startY = doc.y;
    const startX = 40;
    const colWidth = 250;
    const gap = 10;
    const offName = 0;
    const offScope = 160;
    const offQty = 220;

    const drawHeader = (x: number, y: number) => {
      doc.fontSize(9).font('Custom-Bold');
      doc.text(isTR ? 'Eşya Adı' : 'Item Name', x + offName, y);
      doc.text(isTR ? 'Kapsam' : 'Scope', x + offScope, y);
      doc.text(isTR ? 'Adet' : 'Qty', x + offQty, y);
      doc
        .moveTo(x, y + 12)
        .lineTo(x + colWidth, y + 12)
        .stroke();
    };

    drawHeader(startX, startY);
    drawHeader(startX + colWidth + gap, startY);

    let currentY = startY + 18;
    doc.font('Custom-Regular').fontSize(8.5);

    const half = Math.ceil(items.length / 2);
    const leftItems = items.slice(0, half);
    const rightItems = items.slice(half);
    const maxRows = Math.max(leftItems.length, rightItems.length);

    for (let i = 0; i < maxRows; i++) {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
        drawHeader(startX, currentY);
        drawHeader(startX + colWidth + gap, currentY);
        currentY += 18;
      }

      if (i % 2 === 0) {
        doc
          .rect(startX, currentY - 2, colWidth * 2 + gap, 12)
          .fillColor('#f5f5f5')
          .fill()
          .fillColor('black');
      }

      const left = leftItems[i];
      if (left) {
        const prefix = left.scope === 'bed' ? (isTR ? 'Kişisel' : 'Pers') : isTR ? 'Oda' : 'Room';
        const name = isTR ? left.nameTr || left.nameEn : left.nameEn || left.nameTr;
        doc.text(name, startX + offName + 2, currentY, { width: offScope - 5, lineBreak: false });
        doc.text(prefix, startX + offScope, currentY);
        doc.text(String(left.quantity), startX + offQty, currentY);
      }

      const right = rightItems[i];
      if (right) {
        const xPos = startX + colWidth + gap;
        const prefix = right.scope === 'bed' ? (isTR ? 'Kişisel' : 'Pers') : isTR ? 'Oda' : 'Room';
        const name = isTR ? right.nameTr || right.nameEn : right.nameEn || right.nameTr;
        doc.text(name, xPos + offName + 2, currentY, { width: offScope - 5, lineBreak: false });
        doc.text(prefix, xPos + offScope, currentY);
        doc.text(String(right.quantity), xPos + offQty, currentY);
      }

      currentY += 12;
    }

    doc.x = startX;
    doc.y = currentY + 10;
  }

  // ─── Placeholder interpolation ────────────────────────────────────────────

  private interpolate(text: string, data: TemplateData): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
      const parts = key.trim().split('.');
      let val: any = data;
      for (const part of parts) val = val?.[part];
      return val != null ? String(val) : '';
    });
  }
}
