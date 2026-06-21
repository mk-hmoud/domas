import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser } from 'puppeteer';

const RENDER_TIMEOUT_MS = 20_000;

/**
 * Renders admin-authored HTML/CSS templates to PDF via a single shared
 * headless Chromium instance (Puppeteer). Templates come from trusted
 * admin/manager users (gated by document_templates.manage), but we still
 * sandbox the render the same way we would untrusted HTML:
 *  - JavaScript execution is disabled on the page entirely.
 *  - Network requests are blocked except `data:` URIs and the app's own
 *    storage endpoint (so templates can reference uploaded logos/images),
 *    closing off SSRF via <img>/<link>/etc pointing at internal services.
 *  - Each render gets a hard timeout so a pathological template can't hang
 *    a Chromium tab indefinitely.
 */
@Injectable()
export class PdfRendererService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfRendererService.name);
  private browserPromise: Promise<Browser> | null = null;
  private readonly allowedHosts: string[];

  constructor(private readonly config: ConfigService) {
    const endpoints = [
      this.config.get<string>('STORAGE_ENDPOINT'),
      this.config.get<string>('STORAGE_PUBLIC_ENDPOINT'),
    ].filter((value): value is string => !!value);

    this.allowedHosts = endpoints
      .map((endpoint) => {
        try {
          return new URL(endpoint).host;
        } catch {
          return null;
        }
      })
      .filter((host): host is string => !!host);
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browserPromise;
  }

  async renderHtmlToPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);

      page.on('request', (request) => {
        const url = request.url();
        if (url.startsWith('data:') || url === 'about:blank') {
          request.continue();
          return;
        }
        if (request.resourceType() === 'document') {
          request.continue();
          return;
        }
        try {
          const host = new URL(url).host;
          if (this.allowedHosts.includes(host)) {
            request.continue();
            return;
          }
        } catch {
          // fall through to abort below
        }
        request.abort();
      });

      await page.setContent(html, { waitUntil: 'load', timeout: RENDER_TIMEOUT_MS });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        timeout: RENDER_TIMEOUT_MS,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close().catch((error) => this.logger.warn(`Failed to close page: ${error}`));
    }
  }

  async onModuleDestroy() {
    if (this.browserPromise) {
      const browser = await this.browserPromise.catch(() => null);
      await browser?.close();
    }
  }
}
