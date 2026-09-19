// checks/charts.js — Chart.js checks (weight total ~10, only if charts present)
export async function runChecks(page) {
  var results = [];

  // First, check if there are any canvas elements
  var canvasCount = await page.evaluate(() => {
    return document.querySelectorAll('canvas').length;
  });

  // If no canvas elements, return all checks as passed with note
  if (canvasCount === 0) {
    var noChartsNote = 'No charts detected';
    results.push({
      name: 'chart-animation-disabled',
      category: 'charts',
      passed: true,
      weight: 2,
      message: 'Chart.defaults.animation is false',
      details: noChartsNote
    });
    results.push({
      name: 'chart-tooltips-enabled',
      category: 'charts',
      passed: true,
      weight: 2,
      message: 'Chart tooltips are not disabled',
      details: noChartsNote
    });
    results.push({
      name: 'chart-container-dimensions',
      category: 'charts',
      passed: true,
      weight: 2,
      message: 'Chart container has explicit dimensions (height >= 300px)',
      details: noChartsNote
    });
    results.push({
      name: 'chart-maintain-aspect-ratio',
      category: 'charts',
      passed: true,
      weight: 2,
      message: 'maintainAspectRatio is false on chart instances',
      details: noChartsNote
    });
    results.push({
      name: 'chart-theme-colors',
      category: 'charts',
      passed: true,
      weight: 2,
      message: 'Charts use theme-aware colors',
      details: noChartsNote
    });
    return results;
  }

  // 1. Chart.defaults.animation is false
  try {
    var animationDisabled = await page.evaluate(() => {
      if (typeof Chart === 'undefined') return { hasChart: false };
      var animValue = Chart.defaults.animation;
      return {
        hasChart: true,
        disabled: animValue === false,
        value: String(animValue)
      };
    });

    if (!animationDisabled.hasChart) {
      results.push({
        name: 'chart-animation-disabled',
        category: 'charts',
        passed: false,
        weight: 2,
        message: 'Chart.defaults.animation is false',
        details: 'Chart.js global object not found (Chart is undefined)'
      });
    } else {
      results.push({
        name: 'chart-animation-disabled',
        category: 'charts',
        passed: animationDisabled.disabled,
        weight: 2,
        message: 'Chart.defaults.animation is false',
        details: animationDisabled.disabled
          ? ''
          : 'Chart.defaults.animation is ' + animationDisabled.value + ', expected false'
      });
    }
  } catch (e) {
    results.push({
      name: 'chart-animation-disabled',
      category: 'charts',
      passed: false,
      weight: 2,
      message: 'Chart.defaults.animation is false',
      details: 'Error: ' + e.message
    });
  }

  // 2. Tooltips not disabled
  try {
    var tooltipCheck = await page.evaluate(() => {
      if (typeof Chart === 'undefined') return { hasChart: false };

      // Check global defaults
      var globalTooltipEnabled = true;
      if (Chart.defaults.plugins && Chart.defaults.plugins.tooltip) {
        globalTooltipEnabled = Chart.defaults.plugins.tooltip.enabled !== false;
      }

      // Check individual chart instances
      var instances = Object.values(Chart.instances || {});
      var allEnabled = true;
      var disabledCount = 0;

      for (var i = 0; i < instances.length; i++) {
        var chart = instances[i];
        if (chart.config && chart.config.options && chart.config.options.plugins
            && chart.config.options.plugins.tooltip
            && chart.config.options.plugins.tooltip.enabled === false) {
          allEnabled = false;
          disabledCount++;
        }
      }

      return {
        hasChart: true,
        globalEnabled: globalTooltipEnabled,
        allInstancesEnabled: allEnabled,
        disabledCount: disabledCount,
        instanceCount: instances.length
      };
    });

    if (!tooltipCheck.hasChart) {
      results.push({
        name: 'chart-tooltips-enabled',
        category: 'charts',
        passed: false,
        weight: 2,
        message: 'Chart tooltips are not disabled',
        details: 'Chart.js global object not found'
      });
    } else {
      var tooltipsPassed = tooltipCheck.globalEnabled && tooltipCheck.allInstancesEnabled;
      results.push({
        name: 'chart-tooltips-enabled',
        category: 'charts',
        passed: tooltipsPassed,
        weight: 2,
        message: 'Chart tooltips are not disabled',
        details: tooltipsPassed
          ? ''
          : (!tooltipCheck.globalEnabled ? 'Tooltips disabled globally. ' : '')
            + (!tooltipCheck.allInstancesEnabled ? tooltipCheck.disabledCount + ' of ' + tooltipCheck.instanceCount + ' chart instances have tooltips disabled' : '')
      });
    }
  } catch (e) {
    results.push({
      name: 'chart-tooltips-enabled',
      category: 'charts',
      passed: false,
      weight: 2,
      message: 'Chart tooltips are not disabled',
      details: 'Error: ' + e.message
    });
  }

  // 3. Chart container has explicit dimensions (parent div height >= 300px)
  try {
    var containerCheck = await page.evaluate(() => {
      var canvases = document.querySelectorAll('canvas');
      var issues = [];
      var allGood = true;

      for (var i = 0; i < canvases.length; i++) {
        var parent = canvases[i].parentElement;
        if (!parent) {
          issues.push('Canvas ' + (i + 1) + ' has no parent element');
          allGood = false;
          continue;
        }
        var rect = parent.getBoundingClientRect();
        if (rect.height < 300) {
          issues.push('Canvas ' + (i + 1) + ' container height: ' + Math.round(rect.height) + 'px');
          allGood = false;
        }
      }

      return { allGood: allGood, issues: issues, count: canvases.length };
    });

    results.push({
      name: 'chart-container-dimensions',
      category: 'charts',
      passed: containerCheck.allGood,
      weight: 2,
      message: 'Chart container has explicit dimensions (height >= 300px)',
      details: containerCheck.allGood
        ? containerCheck.count + ' chart containers all >= 300px height'
        : containerCheck.issues.join('; ')
    });
  } catch (e) {
    results.push({
      name: 'chart-container-dimensions',
      category: 'charts',
      passed: false,
      weight: 2,
      message: 'Chart container has explicit dimensions (height >= 300px)',
      details: 'Error: ' + e.message
    });
  }

  // 4. maintainAspectRatio is false on chart instances
  try {
    var aspectRatioCheck = await page.evaluate(() => {
      if (typeof Chart === 'undefined') return { hasChart: false };

      var instances = Object.values(Chart.instances || {});
      if (instances.length === 0) return { hasChart: true, noInstances: true };

      var allFalse = true;
      var issues = [];

      for (var i = 0; i < instances.length; i++) {
        var chart = instances[i];
        var maintainAR = true; // Chart.js default is true
        if (chart.config && chart.config.options) {
          maintainAR = chart.config.options.maintainAspectRatio !== false;
        }
        if (maintainAR) {
          allFalse = false;
          issues.push('Chart instance ' + (i + 1) + ' has maintainAspectRatio !== false');
        }
      }

      return { hasChart: true, noInstances: false, allFalse: allFalse, issues: issues, count: instances.length };
    });

    if (!aspectRatioCheck.hasChart) {
      results.push({
        name: 'chart-maintain-aspect-ratio',
        category: 'charts',
        passed: false,
        weight: 2,
        message: 'maintainAspectRatio is false on chart instances',
        details: 'Chart.js global object not found'
      });
    } else if (aspectRatioCheck.noInstances) {
      results.push({
        name: 'chart-maintain-aspect-ratio',
        category: 'charts',
        passed: false,
        weight: 2,
        message: 'maintainAspectRatio is false on chart instances',
        details: 'Canvas elements found but no Chart.js instances detected'
      });
    } else {
      results.push({
        name: 'chart-maintain-aspect-ratio',
        category: 'charts',
        passed: aspectRatioCheck.allFalse,
        weight: 2,
        message: 'maintainAspectRatio is false on chart instances',
        details: aspectRatioCheck.allFalse
          ? aspectRatioCheck.count + ' chart instances all have maintainAspectRatio: false'
          : aspectRatioCheck.issues.join('; ')
      });
    }
  } catch (e) {
    results.push({
      name: 'chart-maintain-aspect-ratio',
      category: 'charts',
      passed: false,
      weight: 2,
      message: 'maintainAspectRatio is false on chart instances',
      details: 'Error: ' + e.message
    });
  }

  // 5. Theme-aware colors (check if chart colors use CSS var values or reasonable colors)
  try {
    var colorCheck = await page.evaluate(() => {
      if (typeof Chart === 'undefined') return { hasChart: false };

      var instances = Object.values(Chart.instances || {});
      if (instances.length === 0) return { hasChart: true, noInstances: true };

      // Check script content for var(-- patterns or getComputedStyle usage
      var scripts = [...document.querySelectorAll('script')].map(s => s.textContent).join(' ');
      var styles = [...document.querySelectorAll('style')].map(s => s.textContent).join(' ');

      var usesCSSVars = scripts.includes('var(--') || scripts.includes('getComputedStyle')
                        || scripts.includes('getPropertyValue');

      // Also check if the chart datasets use colors that could be theme-aware
      var colorsFound = [];
      for (var i = 0; i < instances.length; i++) {
        var datasets = instances[i].data.datasets || [];
        for (var j = 0; j < datasets.length; j++) {
          var bg = datasets[j].backgroundColor;
          var border = datasets[j].borderColor;
          if (bg) colorsFound.push(String(Array.isArray(bg) ? bg[0] : bg));
          if (border) colorsFound.push(String(Array.isArray(border) ? border[0] : border));
        }
      }

      // Heuristic: if colors contain var( references, rgba with reasonable values, or hsl
      var hasReasonableColors = colorsFound.some(function(c) {
        return c.includes('var(') || c.includes('rgba') || c.includes('hsl')
               || c.includes('rgb') || c.includes('#');
      });

      return {
        hasChart: true,
        noInstances: false,
        usesCSSVars: usesCSSVars,
        hasReasonableColors: hasReasonableColors,
        colorsFound: colorsFound.slice(0, 5)
      };
    });

    if (!colorCheck.hasChart) {
      results.push({
        name: 'chart-theme-colors',
        category: 'charts',
        passed: false,
        weight: 2,
        message: 'Charts use theme-aware colors',
        details: 'Chart.js global object not found'
      });
    } else if (colorCheck.noInstances) {
      results.push({
        name: 'chart-theme-colors',
        category: 'charts',
        passed: false,
        weight: 2,
        message: 'Charts use theme-aware colors',
        details: 'No Chart.js instances found'
      });
    } else {
      var themeAware = colorCheck.usesCSSVars || colorCheck.hasReasonableColors;
      results.push({
        name: 'chart-theme-colors',
        category: 'charts',
        passed: themeAware,
        weight: 2,
        message: 'Charts use theme-aware colors',
        details: themeAware
          ? (colorCheck.usesCSSVars ? 'Uses CSS custom properties for colors. ' : '')
            + 'Sample colors: ' + colorCheck.colorsFound.join(', ')
          : 'No evidence of theme-aware colors. Colors found: ' + colorCheck.colorsFound.join(', ')
      });
    }
  } catch (e) {
    results.push({
      name: 'chart-theme-colors',
      category: 'charts',
      passed: false,
      weight: 2,
      message: 'Charts use theme-aware colors',
      details: 'Error: ' + e.message
    });
  }

  return results;
}
