// Roteiro de QA no navegador (Playwright). Requer `npx vite --port 5199` rodando (modo DEV: usa window.__nl).
// Uso: PW=/caminho/para/playwright-core node scripts/smoke.mjs [pastaDeCapturas] [url]
//   (ou `npm run smoke`). Navegador: CHROME=/caminho/do/chrome opcional.
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const out = process.argv[2] || 'qa-shots';
const URL = process.argv[3] || 'http://localhost:5199/';
mkdirSync(out, { recursive: true });
const require = createRequire(import.meta.url);
let pw;
try { pw = await import(process.env.PW ? require.resolve(process.env.PW) : 'playwright-core'); } catch { pw = await import('playwright'); }
const { chromium } = pw.default ?? pw;
const exe = process.env.CHROME || undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

const problems = [];
const navs = [];
const VIEWS = [['p', { width: 390, height: 844 }], ['l', { width: 1280, height: 720 }]];
// Marcadores simples de vazamento de idioma.
const PT_WORDS = /\b(você|não|para|com|uma|seu|sua|mais|já|então|também|está|foi|vida|dinheiro|trabalho)\b/i;
const EN_WORDS = /\b(the|you|your|with|and|have|has|was|for|this|that)\b/i;

async function audit(page, tag, lang) {
  const r = await page.evaluate(auditFn).catch(async () => { await page.waitForTimeout(800); return page.evaluate(auditFn); });
  report(r, tag, lang);
}
function auditFn() {
  {
    const vw = innerWidth;
    const bad = [];
    for (const el of document.querySelectorAll('body *')) {
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (b.right > vw + 1 && !el.closest('[data-allow-overflow]')) {
        // ignora o que está dentro de contêiner rolável horizontalmente
        let p = el.parentElement, scroll = false;
        while (p) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') { scroll = true; break; } p = p.parentElement; }
        if (!scroll) bad.push('overflow-x: ' + el.tagName + '.' + el.className + ' ' + (el.textContent || '').slice(0, 30));
      }
      if ((el.tagName === 'BUTTON' || el.classList.contains('btn')) && el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== 'visible')
        bad.push('texto cortado: ' + (el.textContent || '').slice(0, 40));
    }
    if (document.documentElement.scrollWidth > vw + 1) bad.push('scroll horizontal da página');
    // o histórico guarda o texto no idioma em que foi escrito (limitação conhecida): fora da checagem
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('.feed, script, style').forEach((n) => n.remove());
    document.body.appendChild(clone); clone.style.cssText = 'position:absolute;left:-99999px;top:0;width:' + innerWidth + 'px';
    const text = clone.innerText; clone.remove();
    return { bad, text };
  }
}
function report(r, tag, lang) {
  for (const b of r.bad.slice(0, 6)) problems.push(`${tag}: ${b}`);
  if (lang === 'en') for (const l of r.text.split('\n')) if (/[ãõç]|ê|ô|\b\w*(dade|mente|ções?)\b/i.test(l) && l.length < 80) problems.push(`${tag}: acento/termo PT em inglês: "${l.trim().slice(0, 70)}"`);
  const lines = r.text.split('\n').map((s) => s.trim()).filter((s) => s.length > 14);
  const re = lang === 'en' ? PT_WORDS : EN_WORDS;
  // nomes próprios/moeda não contam: só linhas com 2+ palavras do idioma errado
  const count = (s) => (s.match(new RegExp(re.source, 'gi')) || []).length;
  for (const l of lines) if (count(l) >= 2) problems.push(`${tag}: possível vazamento de idioma (${lang}): "${l.slice(0, 80)}"`);
}

const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` });
const run = (page, fn, arg) => page.evaluate(fn, arg);
const clear = (page) => page.evaluate(() => { const S = window.__nl; for (let i = 0; i < 12; i++) { const s = S.getState(); if (s.game?.minigame) break; if (s.game?.pending) s.choose(s.game.pending.choices[0].index); else if (s.game?.lastResult) s.dismissResult(); else break; } });
const age = (page) => page.evaluate(() => { const g = window.__nl.getState().game; return Math.floor((g.t - g.player.birth) / 12); });

async function live(page, toAge) {
  await page.evaluate((toAge) => {
    const S = window.__nl;
    for (let i = 0; i < 600; i++) {
      const s = S.getState(), g = s.game;
      if (!g || g.dead || Math.floor((g.t - g.player.birth) / 12) >= toAge) break;
      if (g.minigame) s.run((x) => { x.minigame = null; });
      else if (g.pending) s.choose(g.pending.choices[0].index);
      else if (g.lastResult) s.dismissResult();
      else s.advance();
    }
  }, toAge);
  await clear(page);
}

for (const [vn, viewport] of VIEWS) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const tag0 = vn;
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs.push(f.url()); });
  page.on('pageerror', (e) => problems.push(`${tag0}: pageerror ${e.message}`));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`${tag0}: console.${m.type()} ${m.text().slice(0, 160)}`); });

  // 1. Primeira abertura: escolha de idioma
  const go = async () => { for (let i = 0; i < 5; i++) { try { await page.goto(URL); return; } catch { await page.waitForTimeout(1500); } } };
  await go(); await page.evaluate(() => localStorage.clear()); await go();
  await page.waitForTimeout(500);
  await shot(page, `${vn}-01-idioma`); await audit(page, `${vn}/idioma`, 'pt');
  await page.getByRole('button', { name: /Português/ }).click();
  await page.waitForTimeout(400);

  // 1b. Aviso de conteúdo adulto / maioridade
  const adult = page.getByRole('button', { name: /Tenho 18 anos|I am 18/ });
  if (await adult.count()) { await shot(page, `${vn}-01b-maioridade`); await audit(page, `${vn}/maioridade`, 'pt'); await adult.click(); await page.waitForTimeout(400); }

  // 2. Nova vida com talento premium
  await page.evaluate(() => window.__nl.getState().setPremium(true));
  await page.waitForTimeout(300);
  await shot(page, `${vn}-02-nova-vida`); await audit(page, `${vn}/nova-vida`, 'pt');
  await page.locator('select').nth(0).selectOption({ index: 3 });
  await page.locator('select').nth(1).selectOption({ index: 1 });
  await page.locator('select').nth(2).selectOption({ index: 1 }).catch(() => {});
  await shot(page, `${vn}-03-nova-vida-pais`);
  await page.locator('button.advance').click();
  await page.waitForTimeout(500);
  await shot(page, `${vn}-04-primeira-tela`);
  await audit(page, `${vn}/primeira-tela`, 'pt');
  // tutorial (coach-marks): captura o primeiro passo e pula
  const skip = page.locator('.tour button', { hasText: /Pular|Skip/ });
  if (await skip.count()) { await shot(page, `${vn}-04b-tutorial`); await audit(page, `${vn}/tutorial`, 'pt'); await skip.click(); await page.waitForTimeout(300); }

  // 3. Turnos e eventos
  await live(page, 8);
  await page.evaluate(() => { const S = window.__nl.getState(); S.advance(); });
  await page.waitForTimeout(700);
  await shot(page, `${vn}-05-turno`);
  // tempo automático
  await clear(page);
  await page.evaluate(() => window.__nl.getState().setPlaying(true));
  await page.waitForTimeout(2500);
  await shot(page, `${vn}-06-auto`);
  await page.evaluate(() => window.__nl.getState().setPlaying(false));
  await live(page, 30);
  await page.evaluate(() => window.__nl.getState().run((g) => { g.money += 200000; }));
  await clear(page);

  for (const lang of ['pt', 'en']) {
    await page.evaluate((l) => window.__nl.getState().setLanguage(l), lang);
    await page.waitForTimeout(300);
    await clear(page);
    // abas
    for (const tab of ['vida', 'rotina', 'carreira', 'empresa', 'celular', 'pessoas']) {
      await page.evaluate((tb) => { const s = window.__nl.getState(); s.setApp(null); s.setTab(tb); }, tab);
      await page.waitForTimeout(350);
      await shot(page, `${vn}-${lang}-tab-${tab}`); await audit(page, `${vn}/${lang}/tab-${tab}`, lang);
    }
    // apps do celular
    await page.evaluate(() => window.__nl.getState().setTab('celular'));
    await page.waitForTimeout(250);
    const n = await page.locator('.app-tile').count();
    for (let i = 0; i < n; i++) {
      await page.evaluate(() => { const s = window.__nl.getState(); s.setApp(null); s.setTab('celular'); });
      await page.waitForTimeout(150);
      await clear(page);
      const tile = page.locator('.app-tile').nth(i);
      const label = await tile.innerText({ timeout: 4000 }).then((x) => (x.trim().split('\n').pop() || String(i)).replace(/\W+/g, '_')).catch(() => null);
      if (!label) { problems.push(`${vn}/${lang}: app ${i} sumiu; estado=${await page.evaluate(() => JSON.stringify({ dead: !!window.__nl.getState().game.dead, tab: window.__nl.getState().tab, pending: !!window.__nl.getState().game.pending }))}`); await shot(page, `${vn}-${lang}-app-${i}-sumiu`); continue; }
      await tile.click(); await page.waitForTimeout(400);
      await shot(page, `${vn}-${lang}-app-${i}-${label}`); await audit(page, `${vn}/${lang}/app-${label}`, lang);
      // rola até o fim para detectar scroll quebrado
      await page.evaluate(() => { const m = document.querySelector('.main, main, .content') || document.scrollingElement; m.scrollTo?.(0, 99999); });
    }
    await page.evaluate(() => window.__nl.getState().setApp(null));
  }

  // 4. Troca de idioma ao vivo com evento pendente
  await page.evaluate(() => window.__nl.getState().setTab('vida'));
  await live(page, 31); await clear(page);
  await page.evaluate(() => window.__nl.getState().setLanguage('en')); await page.waitForTimeout(300);
  for (let i = 0; i < 40; i++) {
    const st = await page.evaluate(() => !!window.__nl.getState().game.pending);
    if (st) break;
    await page.evaluate(() => { const s = window.__nl.getState(); if (s.game.lastResult) s.dismissResult(); else s.advance(); });
  }
  if (await page.evaluate(() => !!window.__nl.getState().game.pending)) {
    await page.waitForTimeout(800); await shot(page, `${vn}-07-evento-en`); await audit(page, `${vn}/evento-en`, 'en');
    await page.evaluate(() => window.__nl.getState().setLanguage('pt')); await page.waitForTimeout(300);
    await shot(page, `${vn}-08-evento-troca-pt`); await audit(page, `${vn}/evento-troca-pt`, 'pt');
    await page.evaluate(() => window.__nl.getState().setLanguage('en')); await clear(page);
  }

  // 5. Minigames
  for (const id of ['livro', 'sinais', 'assalto', 'fuga']) {
    await clear(page);
    await page.evaluate((id) => window.__nl.getState().run((g) => { g.minigame = { id, action: 'test', level: 1 }; }), id);
    await page.waitForTimeout(600);
    await shot(page, `${vn}-mg-${id}`); await audit(page, `${vn}/mg-${id}`, 'en');
    await page.evaluate(() => window.__nl.getState().run((g) => { g.minigame = null; }));
  }

  // 6. Prisão
  await clear(page);
  await page.evaluate(() => window.__nl.getState().run((g) => { g.job = null; g.life.crime.record += 1; g.life.crime.prison = { monthsLeft: 18, total: 18, crime: 'roubo', conduct: 50, gang: null }; }));
  await page.waitForTimeout(500);
  for (const tab of ['vida', 'rua']) {
    await page.evaluate((tb) => { const s = window.__nl.getState(); if (tb === 'rua') { s.setTab('celular'); s.setApp('rua'); } else { s.setApp(null); s.setTab('vida'); } }, tab);
    await page.waitForTimeout(400);
    await shot(page, `${vn}-prisao-${tab}`); await audit(page, `${vn}/prisao-${tab}`, 'en');
  }
  await page.evaluate(() => window.__nl.getState().run((g) => { g.life.crime.prison = null; }));

  // 7. Morte, pontuação, fitas, herdeiro
  await page.evaluate(() => { const s = window.__nl.getState(); s.setApp(null); s.setTab('vida'); s.run((g) => { g.player.stats.saude = 0; }); });
  await clear(page);
  for (let i = 0; i < 30; i++) {
    const dead = await page.evaluate(() => !!window.__nl.getState().game.dead);
    if (dead) break;
    await page.evaluate(() => { const s = window.__nl.getState(); if (s.game.pending) s.choose(s.game.pending.choices[0].index); else if (s.game.lastResult) s.dismissResult(); else s.advance(); });
  }
  await page.waitForTimeout(1500);
  await shot(page, `${vn}-09-morte`); await audit(page, `${vn}/morte`, 'en');
  await page.evaluate(() => { const o = document.querySelector('.overlay'); if (o) o.scrollTo(0, 99999); });
  await page.waitForTimeout(300); await shot(page, `${vn}-10-morte-fim`);
  const heirBtn = page.locator('.overlay .pick').first();
  if (await heirBtn.count()) { await heirBtn.click().catch(() => {}); await page.waitForTimeout(800); await shot(page, `${vn}-11-herdeiro`); await audit(page, `${vn}/herdeiro`, 'en'); }
  else { const q = page.locator('.overlay button.btn.block').last(); if (await q.count()) { await q.click().catch(() => {}); await page.waitForTimeout(500); await shot(page, `${vn}-11-nova-vida`); } }
  await page.close();
}
await browser.close();
const uniq = [...new Set(problems)];
console.log(uniq.length ? `PROBLEMAS (${uniq.length}):\n` + uniq.join('\n') : 'smoke OK: sem problemas');
console.log('navegações:', navs.length);
console.log('capturas em', out);
process.exit(uniq.length ? 1 : 0);
