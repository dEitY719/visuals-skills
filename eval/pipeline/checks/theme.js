// checks/theme.js — Theme & Styling checks (weight total ~20)
export async function runChecks(page) {
  var results = [];

  // 1. html element has a theme class (theme-dark or theme-light)
  // Note: headless Chromium defaults to prefers-color-scheme: light,
  // so the skeleton JS may auto-detect and apply theme-light. Both are valid.
  try {
    var themeClassResult = await page.evaluate(() => {
      var cl = document.documentElement.classList;
      var hasDark = cl.contains('theme-dark');
      var hasLight = cl.contains('theme-light');
      return { hasDark: hasDark, hasLight: hasLight, className: document.documentElement.className };
    });
    var hasThemeClass = themeClassResult.hasDark || themeClassResult.hasLight;
    results.push({
      name: 'theme-class-applied',
      category: 'theme',
      passed: hasThemeClass,
      weight: 4,
      message: 'html element has a theme class (theme-dark or theme-light)',
      details: hasThemeClass
        ? 'Active class: ' + (themeClassResult.hasDark ? 'theme-dark' : 'theme-light')
        : 'No theme class found on <html>. className: "' + themeClassResult.className + '"'
    });
  } catch (e) {
    results.push({
      name: 'theme-class-applied',
      category: 'theme',
      passed: false,
      weight: 4,
      message: 'html element has a theme class (theme-dark or theme-light)',
      details: 'Error checking theme class: ' + e.message
    });
  }

  // 2. .theme-light defined in CSS
  try {
    var stylesheetText = await page.evaluate(() => {
      return [...document.querySelectorAll('style')].map(s => s.textContent).join(' ');
    });
    var hasLightTheme = stylesheetText.includes('.theme-light');
    results.push({
      name: 'theme-light-defined',
      category: 'theme',
      passed: hasLightTheme,
      weight: 3,
      message: '.theme-light class defined in stylesheet',
      details: hasLightTheme ? '' : 'No .theme-light rule found in any <style> tag'
    });
  } catch (e) {
    results.push({
      name: 'theme-light-defined',
      category: 'theme',
      passed: false,
      weight: 3,
      message: '.theme-light class defined in stylesheet',
      details: 'Error reading stylesheets: ' + e.message
    });
  }

  // 3. CSS custom properties defined: --bg, --surface, --text, --accent, --border
  try {
    var cssVars = await page.evaluate(() => {
      var html = document.documentElement;
      var style = getComputedStyle(html);
      var vars = ['--bg', '--surface', '--text', '--accent', '--border'];
      var found = {};
      for (var i = 0; i < vars.length; i++) {
        var val = style.getPropertyValue(vars[i]).trim();
        found[vars[i]] = val !== '';
      }
      return found;
    });
    var allVarsDefined = Object.values(cssVars).every(Boolean);
    var missingVars = Object.entries(cssVars).filter(([, v]) => !v).map(([k]) => k);
    results.push({
      name: 'css-custom-properties',
      category: 'theme',
      passed: allVarsDefined,
      weight: 4,
      message: 'CSS custom properties defined (--bg, --surface, --text, --accent, --border)',
      details: allVarsDefined ? '' : 'Missing custom properties: ' + missingVars.join(', ')
    });
  } catch (e) {
    results.push({
      name: 'css-custom-properties',
      category: 'theme',
      passed: false,
      weight: 4,
      message: 'CSS custom properties defined (--bg, --surface, --text, --accent, --border)',
      details: 'Error checking CSS custom properties: ' + e.message
    });
  }

  // 4. Theme toggle works (click cycleTheme, verify class changes)
  try {
    var toggleResult = await page.evaluate(() => {
      var html = document.documentElement;
      var initialClass = html.className;
      // Look for the cycleTheme function or theme toggle button
      if (typeof window.cycleTheme === 'function') {
        window.cycleTheme();
      } else {
        // Try to find and click a theme toggle button
        var btn = document.querySelector('[onclick*="cycleTheme"]')
          || document.querySelector('[data-action="theme"]')
          || document.querySelector('.theme-toggle');
        if (btn) {
          btn.click();
        } else {
          return { toggled: false, reason: 'No cycleTheme function or theme toggle button found' };
        }
      }
      var newClass = html.className;
      var changed = initialClass !== newClass;
      // Toggle back to restore original state
      if (typeof window.cycleTheme === 'function') {
        window.cycleTheme();
      } else {
        var btn = document.querySelector('[onclick*="cycleTheme"]')
          || document.querySelector('[data-action="theme"]')
          || document.querySelector('.theme-toggle');
        if (btn) btn.click();
      }
      return { toggled: changed, initialClass: initialClass, newClass: newClass };
    });
    results.push({
      name: 'theme-toggle-works',
      category: 'theme',
      passed: toggleResult.toggled,
      weight: 3,
      message: 'Theme toggle changes html class',
      details: toggleResult.toggled
        ? ''
        : toggleResult.reason || 'Class did not change: "' + toggleResult.initialClass + '" -> "' + toggleResult.newClass + '"'
    });
  } catch (e) {
    results.push({
      name: 'theme-toggle-works',
      category: 'theme',
      passed: false,
      weight: 3,
      message: 'Theme toggle changes html class',
      details: 'Error testing theme toggle: ' + e.message
    });
  }

  // 5. Both themes render without broken colors (bg != text color in light theme)
  try {
    var colorCheck = await page.evaluate(() => {
      var html = document.documentElement;
      var wasDark = html.classList.contains('theme-dark');
      // Switch to light theme
      if (wasDark) {
        html.classList.remove('theme-dark');
        html.classList.add('theme-light');
      }
      var bodyStyle = getComputedStyle(document.body);
      var bgColor = bodyStyle.backgroundColor;
      var textColor = bodyStyle.color;
      var colorsDistinct = bgColor !== textColor;
      // Restore original theme
      if (wasDark) {
        html.classList.remove('theme-light');
        html.classList.add('theme-dark');
      }
      return { colorsDistinct: colorsDistinct, bgColor: bgColor, textColor: textColor };
    });
    results.push({
      name: 'theme-colors-distinct',
      category: 'theme',
      passed: colorCheck.colorsDistinct,
      weight: 3,
      message: 'Light theme background and text colors are distinct',
      details: colorCheck.colorsDistinct
        ? ''
        : 'Background (' + colorCheck.bgColor + ') matches text (' + colorCheck.textColor + ')'
    });
  } catch (e) {
    results.push({
      name: 'theme-colors-distinct',
      category: 'theme',
      passed: false,
      weight: 3,
      message: 'Light theme background and text colors are distinct',
      details: 'Error checking theme colors: ' + e.message
    });
  }

  // 6. Inter font loaded
  try {
    var cssText = await page.evaluate(() => {
      var styles = [...document.querySelectorAll('style')].map(s => s.textContent).join(' ');
      var links = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href).join(' ');
      return styles + ' ' + links;
    });
    var hasInterFont = cssText.includes('Inter') || cssText.includes('fonts.googleapis');
    results.push({
      name: 'inter-font-loaded',
      category: 'theme',
      passed: hasInterFont,
      weight: 3,
      message: 'Inter font is referenced in stylesheets',
      details: hasInterFont ? '' : 'No reference to "Inter" or Google Fonts found in stylesheets'
    });
  } catch (e) {
    results.push({
      name: 'inter-font-loaded',
      category: 'theme',
      passed: false,
      weight: 3,
      message: 'Inter font is referenced in stylesheets',
      details: 'Error checking font references: ' + e.message
    });
  }

  return results;
}
