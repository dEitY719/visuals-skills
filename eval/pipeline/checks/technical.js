// checks/technical.js — Technical checks (weight total ~15)
export async function runChecks(page) {
  var results = [];

  // 1. Zero console errors on load
  try {
    // Collect console messages that were captured before this check runs.
    // The caller should have set up console listeners, but we also check
    // by evaluating any errors stored on the page.
    var consoleErrors = await page.evaluate(() => {
      // If the pipeline has stored console messages, use those
      if (window.__consoleErrors) return window.__consoleErrors;
      // Otherwise, we can't retroactively capture them
      return null;
    });

    if (consoleErrors === null) {
      // Fallback: reload page and capture console errors
      var errors = [];
      var errorHandler = (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      };
      page.on('console', errorHandler);
      try {
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
      } catch (reloadErr) {
        // If reload fails, still report what we have
      }
      page.off('console', errorHandler);
      consoleErrors = errors;
    }

    var errorCount = Array.isArray(consoleErrors) ? consoleErrors.length : 0;
    results.push({
      name: 'zero-console-errors',
      category: 'technical',
      passed: errorCount === 0,
      weight: 3,
      message: 'Zero console errors on page load',
      details: errorCount === 0
        ? ''
        : errorCount + ' console error(s): ' + consoleErrors.slice(0, 3).join('; ')
    });
  } catch (e) {
    results.push({
      name: 'zero-console-errors',
      category: 'technical',
      passed: false,
      weight: 3,
      message: 'Zero console errors on page load',
      details: 'Error checking console: ' + e.message
    });
  }

  // 2. Zero console warnings on load
  try {
    var consoleWarnings = await page.evaluate(() => {
      if (window.__consoleWarnings) return window.__consoleWarnings;
      return null;
    });

    if (consoleWarnings === null) {
      // Use a heuristic: check if there were warnings during the reload above
      // Since we may have already reloaded, collect warnings now
      var warnings = [];
      var warningHandler = (msg) => {
        if (msg.type() === 'warning') {
          warnings.push(msg.text());
        }
      };
      page.on('console', warningHandler);
      await page.waitForTimeout(200);
      page.off('console', warningHandler);
      consoleWarnings = warnings;
    }

    var warningCount = Array.isArray(consoleWarnings) ? consoleWarnings.length : 0;
    results.push({
      name: 'zero-console-warnings',
      category: 'technical',
      passed: warningCount === 0,
      weight: 1,
      message: 'Zero console warnings on page load',
      details: warningCount === 0
        ? ''
        : warningCount + ' console warning(s): ' + consoleWarnings.slice(0, 3).join('; ')
    });
  } catch (e) {
    results.push({
      name: 'zero-console-warnings',
      category: 'technical',
      passed: false,
      weight: 1,
      message: 'Zero console warnings on page load',
      details: 'Error checking console warnings: ' + e.message
    });
  }

  // 3. All top-level JS uses var (no let/const at top level in script tags)
  try {
    var varCheck = await page.evaluate(() => {
      var scripts = [...document.querySelectorAll('script:not([src])')];
      var violations = [];

      for (var i = 0; i < scripts.length; i++) {
        var text = scripts[i].textContent;
        if (!text || text.trim().length === 0) continue;

        // Split by lines and check for let/const at the start of lines
        // that appear to be at top level (not inside function/class/if blocks)
        var lines = text.split('\n');
        var braceDepth = 0;
        var inFunction = false;

        for (var j = 0; j < lines.length; j++) {
          var line = lines[j];

          // Count brace depth to estimate scope level
          for (var k = 0; k < line.length; k++) {
            if (line[k] === '{') braceDepth++;
            if (line[k] === '}') braceDepth--;
          }

          // Check for let/const at top level (braceDepth <= 0 before this line's braces)
          var trimmed = line.trimStart();
          if (braceDepth <= 0 || (braceDepth === 1 && (trimmed.startsWith('let ') || trimmed.startsWith('const ')))) {
            if (trimmed.startsWith('let ') || trimmed.startsWith('const ')) {
              // Make sure it's not inside a template literal or string
              var keyword = trimmed.startsWith('let ') ? 'let' : 'const';
              violations.push({
                line: j + 1,
                keyword: keyword,
                snippet: trimmed.substring(0, 60)
              });
            }
          }
        }
      }

      return { violations: violations, scriptCount: scripts.length };
    });

    var noViolations = varCheck.violations.length === 0;
    results.push({
      name: 'top-level-var-only',
      category: 'technical',
      passed: noViolations,
      weight: 2,
      message: 'Top-level JS uses var (no let/const at top scope)',
      details: noViolations
        ? varCheck.scriptCount + ' inline script(s) checked'
        : varCheck.violations.length + ' violation(s): '
          + varCheck.violations.slice(0, 3).map(function(v) {
              return v.keyword + ' at line ' + v.line + ': ' + v.snippet;
            }).join('; ')
    });
  } catch (e) {
    results.push({
      name: 'top-level-var-only',
      category: 'technical',
      passed: false,
      weight: 2,
      message: 'Top-level JS uses var (no let/const at top scope)',
      details: 'Error: ' + e.message
    });
  }

  // 4. File size < 200KB
  try {
    var content = await page.content();
    var sizeKB = Math.round(content.length / 1024);
    results.push({
      name: 'file-size-limit',
      category: 'technical',
      passed: sizeKB < 200,
      weight: 2,
      message: 'Page content size is under 200KB',
      details: sizeKB < 200
        ? 'Page size: ' + sizeKB + 'KB'
        : 'Page size is ' + sizeKB + 'KB, expected < 200KB'
    });
  } catch (e) {
    results.push({
      name: 'file-size-limit',
      category: 'technical',
      passed: false,
      weight: 2,
      message: 'Page content size is under 200KB',
      details: 'Error: ' + e.message
    });
  }

  // 5. No external image URLs (img[src^="http"] count is 0)
  try {
    var externalImages = await page.evaluate(() => {
      var imgs = document.querySelectorAll('img');
      var external = [];
      for (var i = 0; i < imgs.length; i++) {
        var src = imgs[i].getAttribute('src') || '';
        if (src.startsWith('http://') || src.startsWith('https://')) {
          external.push(src);
        }
      }
      return external;
    });

    results.push({
      name: 'no-external-images',
      category: 'technical',
      passed: externalImages.length === 0,
      weight: 2,
      message: 'No external image URLs (all images inline or local)',
      details: externalImages.length === 0
        ? ''
        : externalImages.length + ' external image(s): ' + externalImages.slice(0, 3).join(', ')
    });
  } catch (e) {
    results.push({
      name: 'no-external-images',
      category: 'technical',
      passed: false,
      weight: 2,
      message: 'No external image URLs (all images inline or local)',
      details: 'Error: ' + e.message
    });
  }

  // 6. At least 1 type-specific interaction beyond menu
  try {
    var interactions = await page.evaluate(() => {
      var found = [];

      // Check for <details> elements
      var details = document.querySelectorAll('details');
      if (details.length > 0) found.push(details.length + ' <details> elements');

      // Check for onclick handlers outside menu
      var clickables = document.querySelectorAll('[onclick]:not(.viz-menu [onclick]):not(.viz-menu-toggle)');
      if (clickables.length > 0) found.push(clickables.length + ' onclick handlers');

      // Check for data-* interactive attributes
      var dataAttrs = document.querySelectorAll('[data-tab], [data-toggle], [data-target], [data-action], [data-filter], [data-sort]');
      if (dataAttrs.length > 0) found.push(dataAttrs.length + ' data-* interactive attributes');

      // Check for input/select elements
      var inputs = document.querySelectorAll('input, select, textarea');
      if (inputs.length > 0) found.push(inputs.length + ' form inputs');

      // Check for tabbed interfaces
      var tabs = document.querySelectorAll('[role="tab"], .tab, [data-tab]');
      if (tabs.length > 0) found.push(tabs.length + ' tab elements');

      // Check for addEventListener calls in scripts (heuristic)
      var scripts = [...document.querySelectorAll('script:not([src])')].map(s => s.textContent).join(' ');
      var hasEventListeners = scripts.includes('addEventListener') && !scripts.includes('// addEventListener');
      if (hasEventListeners) found.push('addEventListener calls in scripts');

      // Check for interactive CSS classes
      var interactive = document.querySelectorAll('.collapsible, .expandable, .sortable, .draggable, .filterable, .accordion');
      if (interactive.length > 0) found.push(interactive.length + ' interactive class elements');

      return { found: found, hasInteractions: found.length > 0 };
    });

    results.push({
      name: 'has-interactions',
      category: 'technical',
      passed: interactions.hasInteractions,
      weight: 2,
      message: 'At least 1 type-specific interaction beyond the menu',
      details: interactions.hasInteractions
        ? 'Found: ' + interactions.found.join(', ')
        : 'No interactive elements found beyond the menu (details, onclick, data-* attrs, inputs, tabs, addEventListener)'
    });
  } catch (e) {
    results.push({
      name: 'has-interactions',
      category: 'technical',
      passed: false,
      weight: 2,
      message: 'At least 1 type-specific interaction beyond the menu',
      details: 'Error: ' + e.message
    });
  }

  // 7. Entrance animations present (.animate classes or data-reveal attributes)
  try {
    var animations = await page.evaluate(() => {
      var found = [];

      // Check for .animate classes
      var animateEls = document.querySelectorAll('[class*="animate"], .fade-in, .slide-in, .slide-up, .fade-up');
      if (animateEls.length > 0) found.push(animateEls.length + ' elements with animate classes');

      // Check for data-reveal attributes
      var revealEls = document.querySelectorAll('[data-reveal], [data-animate], [data-aos], [data-scroll]');
      if (revealEls.length > 0) found.push(revealEls.length + ' elements with data-reveal/animate attributes');

      // Check stylesheets for @keyframes
      var styles = [...document.querySelectorAll('style')].map(s => s.textContent).join(' ');
      var hasKeyframes = styles.includes('@keyframes');
      if (hasKeyframes) found.push('@keyframes animations in CSS');

      // Check for CSS animation or transition on elements
      var hasAnimationClass = styles.includes('.animate') || styles.includes('animation:')
                              || styles.includes('animation-name');
      if (hasAnimationClass && found.length === 0) found.push('CSS animation rules present');

      // Check for IntersectionObserver (common for entrance animations)
      var scripts = [...document.querySelectorAll('script:not([src])')].map(s => s.textContent).join(' ');
      if (scripts.includes('IntersectionObserver')) found.push('IntersectionObserver for scroll animations');

      return { found: found, hasAnimations: found.length > 0 };
    });

    results.push({
      name: 'entrance-animations',
      category: 'technical',
      passed: animations.hasAnimations,
      weight: 2,
      message: 'Entrance animations present (.animate classes, data-reveal, or @keyframes)',
      details: animations.hasAnimations
        ? 'Found: ' + animations.found.join(', ')
        : 'No entrance animation patterns found'
    });
  } catch (e) {
    results.push({
      name: 'entrance-animations',
      category: 'technical',
      passed: false,
      weight: 2,
      message: 'Entrance animations present (.animate classes, data-reveal, or @keyframes)',
      details: 'Error: ' + e.message
    });
  }

  // 8. Hover states on interactive elements (check stylesheet for :hover rules)
  try {
    var hoverCheck = await page.evaluate(() => {
      var styles = [...document.querySelectorAll('style')].map(s => s.textContent).join(' ');
      var hoverCount = (styles.match(/:hover/g) || []).length;
      return { hasHover: hoverCount > 0, count: hoverCount };
    });

    results.push({
      name: 'hover-states',
      category: 'technical',
      passed: hoverCheck.hasHover,
      weight: 1,
      message: 'Hover states defined for interactive elements (:hover rules in CSS)',
      details: hoverCheck.hasHover
        ? hoverCheck.count + ' :hover rule(s) found in stylesheets'
        : 'No :hover rules found in <style> tags'
    });
  } catch (e) {
    results.push({
      name: 'hover-states',
      category: 'technical',
      passed: false,
      weight: 1,
      message: 'Hover states defined for interactive elements (:hover rules in CSS)',
      details: 'Error: ' + e.message
    });
  }

  return results;
}
