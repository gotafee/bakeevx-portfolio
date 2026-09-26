import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const slugs=['detailing','car-wrapping','korean-school','ai-workshop','bakeevx'];
const routes=['/','/cases/',...slugs.map(s=>`/cases/${s}/`)];
for(const width of [360,390,768,1280,1440]){
 test(`All pages at ${width}px`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:900});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of routes){
   const response=await page.goto(route);expect(response?.status()).toBe(200);
   await page.evaluate(()=>document.fonts.ready);
   await expect(page.locator('h1')).toHaveCount(1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`Overflow on ${route}`).toBeTruthy();
   await page.evaluate(async()=>{for(const img of document.images){img.loading='eager'}await Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{})))});
   expect(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>(i as HTMLImageElement).naturalWidth>0)),`Broken image on ${route}`).toBeTruthy();
   if(width===390||width===1440){await page.evaluate(()=>document.querySelectorAll('.will-reveal').forEach(e=>e.classList.add('is-visible')));await page.waitForTimeout(750);await page.screenshot({path:`artifacts/${testInfo.project.name}-${width}-${route==='/'?'home':route.split('/').filter(Boolean).join('-')}.png`,fullPage:true})}
  }
  expect(errors).toEqual([]);
 });
}
test('Case order, pagination, contact and accordions',async({page})=>{
 for(const route of ['/','/cases/']){await page.goto(route);expect(await page.locator('.project-visual').evaluateAll(links=>links.map(a=>a.getAttribute('href')))).toEqual(slugs.map(s=>`/cases/${s}/`))}
 for(let i=0;i<slugs.length;i++){await page.goto(`/cases/${slugs[i]}/`);await expect(page.locator('.case-pagination a').last()).toHaveAttribute('href',`/cases/${slugs[(i+1)%slugs.length]}/`);if(slugs[i]==='bakeevx'){await expect(page.locator('.demo-badge')).toHaveCount(0);await expect(page.locator('.result-metrics strong').first()).toHaveText('7')}else{await expect(page.locator('.demo-badge')).toContainText('Демонстрационные данные')}}
 await page.goto('/');await page.locator('.service-row summary').first().click();await expect(page.locator('.service-row').first()).toHaveAttribute('open','');await page.locator('.service-row summary').nth(1).click();await expect(page.locator('.service-row').first()).not.toHaveAttribute('open','');
 await page.locator('.faq-row summary').first().click();await expect(page.locator('.faq-answer').first()).toBeVisible();
 for(const link of await page.locator('a[href*="t.me"]').all()){await expect(link).toHaveAttribute('href','https://t.me/bakeevx')}
});
test('Mobile menu keyboard interaction and reduced motion',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const button=page.locator('.menu-toggle');await button.focus();await page.keyboard.press('Enter');await expect(button).toHaveAttribute('aria-expanded','true');await expect(page.locator('#mobile-menu')).not.toHaveAttribute('inert','');
 await page.keyboard.press('Escape');await expect(button).toHaveAttribute('aria-expanded','false');await expect(button).toBeFocused();
 await button.click();await page.locator('#mobile-menu a').first().click();await expect(button).toHaveAttribute('aria-expanded','false');
 expect(await page.locator('.hero-star').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
});
test('Accessibility and missing page',async({page})=>{
 for(const route of routes){await page.goto(route);await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>document.querySelectorAll('.will-reveal').forEach(e=>e.classList.add('is-visible')));const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([])}
 const r=await page.goto('/missing-page/');expect(r?.status()).toBe(404);await expect(page.locator('h1')).toContainText('пусто');
});

test('Sticky glass header remains usable on desktop and mobile',async({page})=>{
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/');
  await page.evaluate(()=>window.scrollTo({top:1700,behavior:'instant'}));
  await expect(page.locator('.header')).toHaveClass(/is-scrolled/);
  expect((await page.locator('.header').boundingBox())?.y).toBe(0);
  const headerStyle=await page.locator('.header-inner').evaluate(e=>({radius:getComputedStyle(e).borderRadius,background:getComputedStyle(e).backgroundColor}));
  expect(headerStyle.radius).toBe(width===390?'18px':'22px');
  expect(headerStyle.background).toMatch(/rgba|rgb/);
  if(width===390){await page.locator('.menu-toggle').click();await expect(page.locator('#mobile-menu a').last()).toBeVisible();await page.locator('#mobile-menu a').first().click()}
  else await page.locator('.desktop-nav a').first().click();
  await expect.poll(async()=>Math.round((await page.locator('#services').boundingBox())?.y??0)).toBeGreaterThanOrEqual(76);
 }
});
test('Counters count once, respect reduced motion and retain static fallback',async({page,browser})=>{
 await page.goto('/');const counters=page.locator('[data-count-to]');
 await expect(counters).toHaveText(['0','0','0']);
 await page.locator('.numbers-section').scrollIntoViewIfNeeded();
 await expect.poll(async()=>Number(await counters.nth(1).textContent())).toBeGreaterThan(0);
 expect(Number(await counters.nth(1).textContent())).toBeLessThan(11);
 await expect(counters).toHaveText(['5','11','1']);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.locator('.numbers-section').scrollIntoViewIfNeeded();await expect(counters).toHaveText(['5','11','1']);
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await expect(counters).toHaveText(['5','11','1']);
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:page.url()});try{const staticPage=await context.newPage();await staticPage.goto('/');await expect(staticPage.locator('[data-count-to]')).toHaveText(['5','11','1'])}finally{await context.close()}
});
