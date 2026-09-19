// checks/accessibility.js — Accessibility checks (weight total ~15)
export async function runChecks(page) {
  var results = [];

  // 1. Semantic HTML: <main> element exists
  try {
    var hasMain = await page.evaluate(() => {
      return document.querySelector('main') !== null;
    });
    results.push({
      name: 'semantic-main',
      category: 'accessibility',
      passed: hasMain,
      weight: 3,
      message: 'Semantic HTML: <main> element exists',
      details: hasMain ? '' : 'No <main> element found in the document'
    });
  } catch (e) {
    results.push({
      name: 'semantic-main',
      category: 'accessibility',
      passed: false,
      weight: 3,
      message: 'Semantic HTML: <main> element exists',
      details: 'Error: ' + e.message
    });
  }

  // 2. Semantic HTML: <section> elements exist
  try {
    var sectionCount = await page.evaluate(() => {
      return document.querySelectorAll('section').length;
    });
    results.push({
      name: 'semantic-sections',
      category: 'accessibility',
      passed: sectionCount > 0,
      weight: 2,
      message: 'Semantic HTML: <section> elements are used',
      details: sectionCount > 0
        ? sectionCount + ' <section> elements found'
        : 'No <section> elements found in the document'
    });
  } catch (e) {
    results.push({
      name: 'semantic-sections',
      category: 'accessibility',
      passed: false,
      weight: 2,
      message: 'Semantic HTML: <section> elements are used',
      details: 'Error: ' + e.message
    });
  }

  // 3. @media print styles present in stylesheet
  try {
    var hasPrintStyles = await page.evaluate(() => {
      var styles = [...document.querySelectorAll('style')].map(s => s.textContent).join(' ');
      return styles.includes('@media print');
    });
    results.push({
      name: 'print-styles',
      category: 'accessibility',
      passed: hasPrintStyles,
      weight: 3,
      message: '@media print styles defined in stylesheet',
      details: hasPrintStyles ? '' : 'No @media print rules found in <style> tags'
    });
  } catch (e) {
    results.push({
      name: 'print-styles',
      category: 'accessibility',
      passed: false,
      weight: 3,
      message: '@media print styles defined in stylesheet',
      details: 'Error: ' + e.message
    });
  }

  // 4. @media (prefers-reduced-motion) present in stylesheet
  try {
    var hasReducedMotion = await page.evaluate(() => {
      var styles = [...document.querySelectorAll('style')].map(s => s.textContent).join(' ');
      return styles.includes('prefers-reduced-motion');
    });
    results.push({
      name: 'reduced-motion',
      category: 'accessibility',
      passed: hasReducedMotion,
      weight: 3,
      message: '@media (prefers-reduced-motion) styles defined',
      details: hasReducedMotion ? '' : 'No prefers-reduced-motion media query found in <style> tags'
    });
  } catch (e) {
    results.push({
      name: 'reduced-motion',
      category: 'accessibility',
      passed: false,
      weight: 3,
      message: '@media (prefers-reduced-motion) styles defined',
      details: 'Error: ' + e.message
    });
  }

  // 5. Charts wrapped in role="img" with aria-label (if canvas elements exist)
  try {
    var chartA11y = await page.evaluate(() => {
      var canvases = document.querySelectorAll('canvas');
      if (canvases.length === 0) {
        return { hasCanvases: false, allAccessible: true };
      }

      var accessible = 0;
      var total = canvases.length;
      var issues = [];

      for (var i = 0; i < canvases.length; i++) {
        var canvas = canvases[i];
        // Check the canvas itself or its parent wrapper
        var wrapper = canvas.closest('[role="img"]') || canvas.parentElement;
        var hasRole = canvas.getAttribute('role') === 'img'
                      || (wrapper && wrapper.getAttribute('role') === 'img');
        var hasAriaLabel = canvas.getAttribute('aria-label')
                          || (wrapper && wrapper.getAttribute('aria-label'));

        if (hasRole && hasAriaLabel) {
          accessible++;
        } else {
          var missing = [];
          if (!hasRole) missing.push('role="img"');
          if (!hasAriaLabel) missing.push('aria-label');
          issues.push('Canvas ' + (i + 1) + ' missing: ' + missing.join(', '));
        }
      }

      return { hasCanvases: true, allAccessible: accessible === total, accessible: accessible, total: total, issues: issues };
    });

    if (!chartA11y.hasCanvases) {
      results.push({
        name: 'chart-accessibility',
        category: 'accessibility',
        passed: true,
        weight: 2,
        message: 'Charts have role="img" and aria-label',
        details: 'No canvas elements found (check not applicable)'
      });
    } else {
      results.push({
        name: 'chart-accessibility',
        category: 'accessibility',
        passed: chartA11y.allAccessible,
        weight: 2,
        message: 'Charts have role="img" and aria-label',
        details: chartA11y.allAccessible
          ? chartA11y.total + ' canvas elements all have proper ARIA attributes'
          : chartA11y.issues.join('; ')
      });
    }
  } catch (e) {
    results.push({
      name: 'chart-accessibility',
      category: 'accessibility',
      passed: false,
      weight: 2,
      message: 'Charts have role="img" and aria-label',
      details: 'Error: ' + e.message
    });
  }

  // 6. Skip-to-content link or landmark roles present
  try {
    var hasLandmarks = await page.evaluate(() => {
      var hasRoleMain = document.querySelector('[role="main"]') !== null;
      var hasRoleNav = document.querySelector('[role="navigation"]') !== null;
      var hasSkipLink = document.querySelector('a[href="#main"], a[href="#main-content"], a[href="#content"]') !== null;
      var hasMainElement = document.querySelector('main') !== null;
      var hasNavElement = document.querySelector('nav') !== null;

      return {
        found: hasRoleMain || hasRoleNav || hasSkipLink || hasMainElement || hasNavElement,
        details: {
          roleMain: hasRoleMain,
          roleNav: hasRoleNav,
          skipLink: hasSkipLink,
          mainElement: hasMainElement,
          navElement: hasNavElement
        }
      };
    });

    var landmarkList = [];
    if (hasLandmarks.details.mainElement) landmarkList.push('<main>');
    if (hasLandmarks.details.navElement) landmarkList.push('<nav>');
    if (hasLandmarks.details.roleMain) landmarkList.push('[role="main"]');
    if (hasLandmarks.details.roleNav) landmarkList.push('[role="navigation"]');
    if (hasLandmarks.details.skipLink) landmarkList.push('skip-to-content link');

    results.push({
      name: 'landmarks-present',
      category: 'accessibility',
      passed: hasLandmarks.found,
      weight: 2,
      message: 'Landmark roles or skip-to-content link present',
      details: hasLandmarks.found
        ? 'Found: ' + landmarkList.join(', ')
        : 'No landmark roles ([role="main"], [role="navigation"]), <main>, <nav>, or skip-to-content link found'
    });
  } catch (e) {
    results.push({
      name: 'landmarks-present',
      category: 'accessibility',
      passed: false,
      weight: 2,
      message: 'Landmark roles or skip-to-content link present',
      details: 'Error: ' + e.message
    });
  }

  return results;
}
