import { chromium } from '@playwright/test';
import sharp from 'sharp';
const browser = await chromium.launch();
try {
 const context = await browser.newContext({ reducedMotion: 'reduce' });
 const page = await context.newPage();
 await page.setViewportSize({ width: 1440, height: 1050 });
 await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:4324');
 await page.evaluate(() => document.fonts.ready);
 await page.locator('.hero-showcase img').evaluateAll(async images => { await Promise.all(images.map(image => image.decode())); });
 await sharp(await page.screenshot()).webp({ quality: 88 }).toFile('public/images/portfolio-desktop.webp');
 await page.setViewportSize({ width: 390, height: 844 });
 await sharp(await page.screenshot()).webp({ quality: 88 }).toFile('public/images/portfolio-mobile.webp');
 await page.setViewportSize({ width: 1440, height: 1050 });
 await sharp(await page.locator('.numbers-section').screenshot()).webp({ quality: 88 }).toFile('public/images/portfolio-numbers.webp');
 console.log('Captured three real portfolio screenshots.');
} finally { await browser.close(); }
