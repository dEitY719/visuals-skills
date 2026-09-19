// checks/menu.js — Menu checks (weight total ~15)
export async function runChecks(page) {
  var results = [];

  // 1. .viz-menu element exists
  try {
    var hasMenu = await page.evaluate(() => {
      return document.querySelector('.viz-menu') !== null;
    });
    results.push({
      name: 'menu-element-exists',
      category: 'menu',
      passed: hasMenu,
      weight: 2,
      message: '.viz-menu element exists in DOM',
      details: hasMenu ? '' : 'No element with class .viz-menu found'
    });
  } catch (e) {
    results.push({
      name: 'menu-element-exists',
      category: 'menu',
      passed: false,
      weight: 2,
      message: '.viz-menu element exists in DOM',
      details: 'Error checking menu element: ' + e.message
    });
  }

  // 2. Menu toggle button exists (.viz-menu-toggle)
  try {
    var hasToggle = await page.evaluate(() => {
      return document.querySelector('.viz-menu-toggle') !== null;
    });
    results.push({
      name: 'menu-toggle-exists',
      category: 'menu',
      passed: hasToggle,
      weight: 2,
      message: '.viz-menu-toggle button exists',
      details: hasToggle ? '' : 'No element with class .viz-menu-toggle found'
    });
  } catch (e) {
    results.push({
      name: 'menu-toggle-exists',
      category: 'menu',
      passed: false,
      weight: 2,
      message: '.viz-menu-toggle button exists',
      details: 'Error checking menu toggle: ' + e.message
    });
  }

  // 3. Theme button present
  try {
    var hasThemeBtn = await page.evaluate(() => {
      var buttons = [...document.querySelectorAll('button, [role="button"], a')];
      var menuArea = document.querySelector('.viz-menu') || document;
      var menuButtons = [...menuArea.querySelectorAll('button, [role="button"], a, [onclick]')];
      var allButtons = buttons.concat(menuButtons);
      for (var i = 0; i < allButtons.length; i++) {
        var text = (allButtons[i].textContent || '').toLowerCase();
        var onclick = allButtons[i].getAttribute('onclick') || '';
        if (text.includes('dark') || text.includes('light') || text.includes('theme')
            || onclick.includes('cycleTheme') || onclick.includes('toggleTheme')) {
          return true;
        }
      }
      return typeof window.cycleTheme === 'function';
    });
    results.push({
      name: 'theme-button-present',
      category: 'menu',
      passed: hasThemeBtn,
      weight: 2,
      message: 'Theme toggle button present in menu',
      details: hasThemeBtn ? '' : 'No theme toggle button found (looked for Dark/Light text or cycleTheme onclick)'
    });
  } catch (e) {
    results.push({
      name: 'theme-button-present',
      category: 'menu',
      passed: false,
      weight: 2,
      message: 'Theme toggle button present in menu',
      details: 'Error checking theme button: ' + e.message
    });
  }

  // 4. Download PNG button present
  try {
    var hasDownloadBtn = await page.evaluate(() => {
      var elems = document.querySelectorAll('button, [role="button"], a, [onclick]');
      for (var i = 0; i < elems.length; i++) {
        var text = (elems[i].textContent || '').toLowerCase();
        var onclick = elems[i].getAttribute('onclick') || '';
        if (text.includes('download') || text.includes('png') || text.includes('image')
            || onclick.includes('downloadImage') || onclick.includes('download')) {
          return true;
        }
      }
      return typeof window.downloadImage === 'function';
    });
    results.push({
      name: 'download-button-present',
      category: 'menu',
      passed: hasDownloadBtn,
      weight: 2,
      message: 'Download PNG button present in menu',
      details: hasDownloadBtn ? '' : 'No download button found (looked for Download/PNG text or downloadImage onclick)'
    });
  } catch (e) {
    results.push({
      name: 'download-button-present',
      category: 'menu',
      passed: false,
      weight: 2,
      message: 'Download PNG button present in menu',
      details: 'Error checking download button: ' + e.message
    });
  }

  // 5. Print/PDF button present
  try {
    var hasPrintBtn = await page.evaluate(() => {
      var elems = document.querySelectorAll('button, [role="button"], a, [onclick]');
      for (var i = 0; i < elems.length; i++) {
        var text = (elems[i].textContent || '').toLowerCase();
        var onclick = elems[i].getAttribute('onclick') || '';
        if (text.includes('print') || text.includes('pdf')
            || onclick.includes('window.print') || onclick.includes('print()')) {
          return true;
        }
      }
      return false;
    });
    results.push({
      name: 'print-button-present',
      category: 'menu',
      passed: hasPrintBtn,
      weight: 2,
      message: 'Print/PDF button present in menu',
      details: hasPrintBtn ? '' : 'No print button found (looked for Print/PDF text or window.print onclick)'
    });
  } catch (e) {
    results.push({
      name: 'print-button-present',
      category: 'menu',
      passed: false,
      weight: 2,
      message: 'Print/PDF button present in menu',
      details: 'Error checking print button: ' + e.message
    });
  }

  // 6. html-to-image CDN loaded
  try {
    var hasHtmlToImage = await page.evaluate(() => {
      var scripts = document.querySelectorAll('script[src]');
      for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src.includes('html-to-image')) {
          return true;
        }
      }
      return false;
    });
    results.push({
      name: 'html-to-image-loaded',
      category: 'menu',
      passed: hasHtmlToImage,
      weight: 1,
      message: 'html-to-image CDN script loaded',
      details: hasHtmlToImage ? '' : 'No <script src="...html-to-image..."> found'
    });
  } catch (e) {
    results.push({
      name: 'html-to-image-loaded',
      category: 'menu',
      passed: false,
      weight: 1,
      message: 'html-to-image CDN script loaded',
      details: 'Error checking html-to-image script: ' + e.message
    });
  }

  // 7. Menu opens on click
  try {
    var menuOpens = false;
    var toggleSelector = '.viz-menu-toggle';
    var toggleExists = await page.evaluate((sel) => {
      return document.querySelector(sel) !== null;
    }, toggleSelector);

    if (toggleExists) {
      await page.click(toggleSelector);
      // Small delay for transition
      await page.waitForTimeout(300);
      menuOpens = await page.evaluate(() => {
        var dropdown = document.querySelector('.viz-menu-dropdown');
        if (!dropdown) return false;
        return dropdown.classList.contains('open')
          || getComputedStyle(dropdown).display !== 'none'
          || getComputedStyle(dropdown).visibility !== 'hidden';
      });
    }
    results.push({
      name: 'menu-opens-on-click',
      category: 'menu',
      passed: menuOpens,
      weight: 2,
      message: 'Menu dropdown opens when toggle is clicked',
      details: menuOpens ? '' : (toggleExists ? 'Dropdown did not get .open class or become visible' : 'Toggle button not found')
    });
  } catch (e) {
    results.push({
      name: 'menu-opens-on-click',
      category: 'menu',
      passed: false,
      weight: 2,
      message: 'Menu dropdown opens when toggle is clicked',
      details: 'Error testing menu open: ' + e.message
    });
  }

  // 8. Menu closes on outside click
  try {
    var menuCloses = false;
    // First make sure menu is open
    var isCurrentlyOpen = await page.evaluate(() => {
      var dropdown = document.querySelector('.viz-menu-dropdown');
      if (!dropdown) return false;
      return dropdown.classList.contains('open')
        || (getComputedStyle(dropdown).display !== 'none'
            && getComputedStyle(dropdown).visibility !== 'hidden');
    });

    if (!isCurrentlyOpen) {
      // Try to open it first
      var canOpen = await page.evaluate(() => {
        return document.querySelector('.viz-menu-toggle') !== null;
      });
      if (canOpen) {
        await page.click('.viz-menu-toggle');
        await page.waitForTimeout(300);
      }
    }

    // Now click outside to close
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);

    menuCloses = await page.evaluate(() => {
      var dropdown = document.querySelector('.viz-menu-dropdown');
      if (!dropdown) return true; // No dropdown means nothing to close
      return !dropdown.classList.contains('open');
    });

    results.push({
      name: 'menu-closes-outside-click',
      category: 'menu',
      passed: menuCloses,
      weight: 1,
      message: 'Menu closes when clicking outside',
      details: menuCloses ? '' : '.viz-menu-dropdown still has .open class after clicking outside'
    });
  } catch (e) {
    results.push({
      name: 'menu-closes-outside-click',
      category: 'menu',
      passed: false,
      weight: 1,
      message: 'Menu closes when clicking outside',
      details: 'Error testing menu close: ' + e.message
    });
  }

  return results;
}
