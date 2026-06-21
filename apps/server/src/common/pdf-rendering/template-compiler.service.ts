import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Compiles admin-authored HTML/CSS templates against a server-built data
 * context. Handlebars only does string interpolation/iteration (no arbitrary
 * JS execution), and `{{value}}` is HTML-escaped by default, so the only way
 * a template author can inject raw markup is via the explicit `{{{value}}}`
 * triple-stash form - same trust boundary as everywhere else admin/manager
 * users can already enter rich text (e.g. announcements).
 */
@Injectable()
export class TemplateCompilerService {
  private readonly handlebars: typeof Handlebars;
  private readonly fontFaceCss: string;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
    this.fontFaceCss = this.buildFontFaceCss();
  }

  // Embed the same Roboto font used by the legacy PDFKit renderer as a data
  // URI so Turkish glyphs render consistently regardless of what fonts (if
  // any) happen to be installed in the headless Chromium environment.
  private buildFontFaceCss(): string {
    try {
      const regular = fs
        .readFileSync(path.join(process.cwd(), 'src/assets/fonts/Roboto-Regular.ttf'))
        .toString('base64');
      const bold = fs
        .readFileSync(path.join(process.cwd(), 'src/assets/fonts/Roboto-Bold.ttf'))
        .toString('base64');
      return `
  @font-face { font-family: 'Roboto'; src: url(data:font/ttf;base64,${regular}) format('truetype'); font-weight: normal; }
  @font-face { font-family: 'Roboto'; src: url(data:font/ttf;base64,${bold}) format('truetype'); font-weight: bold; }`;
    } catch {
      return '';
    }
  }

  private registerHelpers() {
    this.handlebars.registerHelper(
      'formatDate',
      (value: string | Date | undefined, locale = 'en-GB') => {
        if (!value) return '';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString(locale);
      },
    );

    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  }

  /**
   * Wraps the admin's html_body + css fragments into a standalone print
   * document (A4, Roboto for Turkish glyphs) and interpolates the data
   * context. Returns full HTML ready to hand to the PDF renderer.
   */
  compile(htmlBody: string, css: string, context: Record<string, unknown>): string {
    const bodyTemplate = this.handlebars.compile(htmlBody, { noEscape: false });
    const renderedBody = bodyTemplate(context);

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${this.fontFaceCss}
  @page { size: A4; margin: 40px; }
  body { font-family: 'Roboto', 'DejaVu Sans', sans-serif; font-size: 10pt; color: #111; }
  table { border-collapse: collapse; width: 100%; }
  ${css}
</style>
</head>
<body>
${renderedBody}
</body>
</html>`;
  }
}
