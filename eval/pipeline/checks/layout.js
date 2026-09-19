// checks/layout.js — Layout checks (weight total ~15)
export async function runChecks(page) {
  var results = [];

  // Helper to check horizontal overflow at a given viewport width
  async function checkOverflow(width) {
    var originalViewport = page.viewportSize();
    await page.setViewportSize({ width: width, height: originalViewport.height });
    // Wait for layout to settle
    await page.waitForTimeout(200);
    var overflow = await page.evaluate((viewportWidth) => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: viewportWidth,
        overflows: document.documentElement.scrollWidth > viewportWidth
      };
    }, width);
    // Restore original viewport
    await page.setViewportSize(originalViewport);
    return overflow;
  }

  // 1. No horizontal overflow at 1440px
  try {
    var overflow1440 = await checkOverflow(1440);
    results.push({
      name: 'no-overflow-1440',
      category: 'layout',
      passed: !overflow1440.overflows,
      weight: 3,
      message: 'No horizontal overflow at 1440px viewport width',
      details: overflow1440.overflows
        ? 'scrollWidth (' + overflow1440.scrollWidth + 'px) exceeds viewport (' + overflow1440.viewportWidth + 'px)'
        : ''
    });
  } catch (e) {
    results.push({
      name: 'no-overflow-1440',
      category: 'layout',
      passed: false,
      weight: 3,
      message: 'No horizontal overflow at 1440px viewport width',
      details: 'Error: ' + e.message
    });
  }

  // 2. No horizontal overflow at 768px
  try {
    var overflow768 = await checkOverflow(768);
    results.push({
      name: 'no-overflow-768',
      category: 'layout',
      passed: !overflow768.overflows,
      weight: 3,
      message: 'No horizontal overflow at 768px viewport width (tablet)',
      details: overflow768.overflows
        ? 'scrollWidth (' + overflow768.scrollWidth + 'px) exceeds viewport (' + overflow768.viewportWidth + 'px)'
        : ''
    });
  } catch (e) {
    results.push({
      name: 'no-overflow-768',
      category: 'layout',
      passed: false,
      weight: 3,
      message: 'No horizontal overflow at 768px viewport width (tablet)',
      details: 'Error: ' + e.message
    });
  }

  // 3. No horizontal overflow at 375px
  try {
    var overflow375 = await checkOverflow(375);
    results.push({
      name: 'no-overflow-375',
      category: 'layout',
      passed: !overflow375.overflows,
      weight: 3,
      message: 'No horizontal overflow at 375px viewport width (mobile)',
      details: overflow375.overflows
        ? 'scrollWidth (' + overflow375.scrollWidth + 'px) exceeds viewport (' + overflow375.viewportWidth + 'px)'
        : ''
    });
  } catch (e) {
    results.push({
      name: 'no-overflow-375',
      category: 'layout',
      passed: false,
      weight: 3,
      message: 'No horizontal overflow at 375px viewport width (mobile)',
      details: 'Error: ' + e.message
    });
  }

  // 4. Uses CSS Grid or Flexbox
  try {
    var usesModernLayout = await page.evaluate(() => {
      var styles = [...document.querySelectorAll('style')].map(s => s.textContent).join(' ');
      var hasFlex = styles.includes('display: flex') || styles.includes('display:flex')
                    || styles.includes('display: inline-flex') || styles.includes('display:inline-flex');
      var hasGrid = styles.includes('display: grid') || styles.includes('display:grid')
                    || styles.includes('display: inline-grid') || styles.includes('display:inline-grid');

      // Also check computed styles on elements if stylesheet text search fails
      if (!hasFlex && !hasGrid) {
        var allElements = document.querySelectorAll('*');
        for (var i = 0; i < Math.min(allElements.length, 200); i++) {
          var display = getComputedStyle(allElements[i]).display;
          if (display === 'flex' || display === 'inline-flex') {
            hasFlex = true;
            break;
          }
          if (display === 'grid' || display === 'inline-grid') {
            hasGrid = true;
            break;
          }
        }
      }

      return { hasFlex: hasFlex, hasGrid: hasGrid };
    });
    var usesEither = usesModernLayout.hasFlex || usesModernLayout.hasGrid;
    results.push({
      name: 'uses-modern-layout',
      category: 'layout',
      passed: usesEither,
      weight: 2,
      message: 'Uses CSS Flexbox or Grid for layout',
      details: usesEither
        ? 'Found: ' + (usesModernLayout.hasFlex ? 'Flexbox' : '') + (usesModernLayout.hasFlex && usesModernLayout.hasGrid ? ' + ' : '') + (usesModernLayout.hasGrid ? 'Grid' : '')
        : 'No "display: flex" or "display: grid" found in stylesheets or computed styles'
    });
  } catch (e) {
    results.push({
      name: 'uses-modern-layout',
      category: 'layout',
      passed: false,
      weight: 2,
      message: 'Uses CSS Flexbox or Grid for layout',
      details: 'Error: ' + e.message
    });
  }

  // 5. Section spacing >= 48px between major sections
  try {
    var sectionSpacing = await page.evaluate(() => {
      var sections = document.querySelectorAll('section');
      if (sections.length < 2) {
        return { hasSections: sections.length > 0, sufficient: true, gaps: [], sectionCount: sections.length };
      }

      var gaps = [];
      for (var i = 1; i < sections.length; i++) {
        var prevRect = sections[i - 1].getBoundingClientRect();
        var currRect = sections[i].getBoundingClientRect();
        var gap = currRect.top - prevRect.bottom;
        gaps.push(Math.round(gap));
      }

      var allSufficient = gaps.every(function(g) { return g >= 48; });
      // Also check margin/padding on sections as an alternative measure
      if (!allSufficient) {
        var marginCheck = true;
        for (var j = 0; j < sections.length; j++) {
          var style = getComputedStyle(sections[j]);
          var topSpace = parseFloat(style.marginTop) + parseFloat(style.paddingTop);
          var bottomSpace = parseFloat(style.marginBottom) + parseFloat(style.paddingBottom);
          if (j > 0 && j < sections.length - 1) {
            if (topSpace + bottomSpace < 48) {
              marginCheck = false;
            }
          }
        }
        allSufficient = marginCheck;
      }

      return { hasSections: true, sufficient: allSufficient, gaps: gaps, sectionCount: sections.length };
    });

    if (sectionSpacing.sectionCount < 2) {
      results.push({
        name: 'section-spacing',
        category: 'layout',
        passed: sectionSpacing.hasSections,
        weight: 2,
        message: 'Adequate spacing between major sections (>= 48px)',
        details: sectionSpacing.hasSections
          ? 'Only ' + sectionSpacing.sectionCount + ' section found, cannot measure gaps'
          : 'No <section> elements found'
      });
    } else {
      results.push({
        name: 'section-spacing',
        category: 'layout',
        passed: sectionSpacing.sufficient,
        weight: 2,
        message: 'Adequate spacing between major sections (>= 48px)',
        details: sectionSpacing.sufficient
          ? 'Section gaps: ' + sectionSpacing.gaps.join('px, ') + 'px'
          : 'Insufficient gaps between sections: ' + sectionSpacing.gaps.join('px, ') + 'px (need >= 48px)'
      });
    }
  } catch (e) {
    results.push({
      name: 'section-spacing',
      category: 'layout',
      passed: false,
      weight: 2,
      message: 'Adequate spacing between major sections (>= 48px)',
      details: 'Error: ' + e.message
    });
  }

  // 6. Card padding >= 24px (if .card elements exist)
  try {
    var cardPadding = await page.evaluate(() => {
      var cards = document.querySelectorAll('.card');
      if (cards.length === 0) {
        return { hasCards: false, sufficient: true };
      }

      var minPadding = Infinity;
      for (var i = 0; i < cards.length; i++) {
        var style = getComputedStyle(cards[i]);
        var paddings = [
          parseFloat(style.paddingTop),
          parseFloat(style.paddingRight),
          parseFloat(style.paddingBottom),
          parseFloat(style.paddingLeft)
        ];
        var min = Math.min.apply(null, paddings);
        if (min < minPadding) {
          minPadding = min;
        }
      }

      return { hasCards: true, sufficient: minPadding >= 24, minPadding: Math.round(minPadding), cardCount: cards.length };
    });

    if (!cardPadding.hasCards) {
      results.push({
        name: 'card-padding',
        category: 'layout',
        passed: true,
        weight: 2,
        message: 'Card elements have sufficient padding (>= 24px)',
        details: 'No .card elements found (check not applicable)'
      });
    } else {
      results.push({
        name: 'card-padding',
        category: 'layout',
        passed: cardPadding.sufficient,
        weight: 2,
        message: 'Card elements have sufficient padding (>= 24px)',
        details: cardPadding.sufficient
          ? cardPadding.cardCount + ' cards found, minimum padding: ' + cardPadding.minPadding + 'px'
          : cardPadding.cardCount + ' cards found, minimum padding is ' + cardPadding.minPadding + 'px (expected >= 24px)'
      });
    }
  } catch (e) {
    results.push({
      name: 'card-padding',
      category: 'layout',
      passed: false,
      weight: 2,
      message: 'Card elements have sufficient padding (>= 24px)',
      details: 'Error: ' + e.message
    });
  }

  return results;
}
