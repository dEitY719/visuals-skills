// format-detect.js — Inspect the DOM of an HTML visualization to classify its format.
// Uses Playwright page.evaluate() to gather signals, then scores each known format.

var FORMAT_DEFINITIONS = {
  'slide-deck': {
    signals: [
      'hasSlideClass',
      'multipleSlides',
      'hasSlideCounter',
      'hasProgressBar',
      'hasKeyboardNav',
      'hasTranslateX',
      'slidesFullViewport',
    ],
    description: '100vw x 100vh slides with navigation',
  },
  'carousel': {
    signals: [
      'hasCarouselCards',
      'has1080Cards',
      'hasCardCounter',
      'hasSwipeHandler',
      'hasArrowNav',
    ],
    description: '1080x1080 cards with swipe navigation',
  },
  'poster-9x16': {
    signals: [
      'is1080x1920',
      'overflowHidden',
      'noScroll',
      'singleContainer',
    ],
    description: 'Portrait poster, 1080x1920',
  },
  'poster-1x1': {
    signals: [
      'is1080x1080',
      'overflowHidden',
      'noScroll',
      'singleContainer',
    ],
    description: 'Square poster, 1080x1080',
  },
  'dashboard': {
    signals: [
      'hasGrid',
      'multipleCards',
      'hasCanvas',
      'hasFilterToolbar',
      'hasStatNumbers',
    ],
    description: 'Grid of KPI cards + charts',
  },
  'infographic': {
    signals: [
      'multipleSections',
      'hasDataReveal',
      'hasStatNumbers',
      'tallDocument',
      'noSlideNav',
    ],
    description: 'Long scroll with sections',
  },
  'timeline': {
    signals: [
      'hasTimelineClass',
      'hasDateMarkers',
      'chronologicalOrder',
      'hasTimelineLayout',
    ],
    description: 'Chronological markers',
  },
  'comparison': {
    signals: [
      'hasTable',
      'hasComparisonClass',
      'hasMultipleColumns',
      'hasFeatureChecks',
    ],
    description: 'Side-by-side analysis',
  },
  'cheatsheet': {
    signals: [
      'multipleCodeBlocks',
      'hasSearchInput',
      'hasCopyButtons',
      'hasCollapsible',
    ],
    description: 'Reference/guide with code blocks',
  },
  'flowchart': {
    signals: [
      'hasMermaid',
      'hasSvgDiagram',
      'hasConnectionPaths',
      'hasLargeSvg',
    ],
    description: 'Process diagrams',
  },
};

/**
 * Gather all DOM signals from the page using page.evaluate().
 * Returns a flat object of raw measurements.
 */
async function gatherSignals(page) {
  var raw = await page.evaluate(() => {
    var html = document.documentElement.outerHTML;
    var styles = [...document.querySelectorAll('style')].map(s => s.textContent).join(' ');
    var body = document.body;
    var bodyStyle = getComputedStyle(body);
    var htmlStyle = getComputedStyle(document.documentElement);

    // Collect computed dimensions of slide-like elements
    var slideEls = document.querySelectorAll('.slide, [data-slide], section');
    var slideElDimensions = [...slideEls].map(el => {
      var cs = getComputedStyle(el);
      return {
        width: el.offsetWidth,
        height: el.offsetHeight,
        hasTranslateX: cs.transform.includes('matrix') || /translateX/i.test(el.style.transform || ''),
      };
    });

    // Collect card-like element dimensions
    var cardEls = document.querySelectorAll('.card, [class*="card"]');
    var cardDimensions = [...cardEls].map(el => ({
      width: el.offsetWidth,
      height: el.offsetHeight,
    }));

    // Check for table columns
    var tables = document.querySelectorAll('table');
    var maxTableCols = 0;
    tables.forEach(t => {
      var firstRow = t.querySelector('tr');
      if (firstRow) {
        var cols = firstRow.querySelectorAll('th, td').length;
        if (cols > maxTableCols) maxTableCols = cols;
      }
    });

    // Check for feature check marks (checkmarks, x marks, bullet comparisons)
    var featureCheckPatterns = /[\u2713\u2714\u2715\u2716\u2717\u2718\u2705\u274C]|class=".*?(check|tick|cross|yes|no).*?"/gi;
    var featureCheckCount = (html.match(featureCheckPatterns) || []).length;

    // Check for chronological ordering (years in ascending/descending order)
    var yearEls = document.querySelectorAll('time, [class*="date"], [class*="year"]');
    var years = [...yearEls].map(el => {
      var match = el.textContent.match(/\b(1[89]\d{2}|2[01]\d{2})\b/);
      return match ? parseInt(match[1], 10) : null;
    }).filter(Boolean);
    var isChronological = years.length >= 2 && (
      years.every((y, i) => i === 0 || y >= years[i - 1]) ||
      years.every((y, i) => i === 0 || y <= years[i - 1])
    );

    // Check for timeline layout (alternating left/right or vertical line)
    var hasTimelineLayout = !!styles.match(/timeline|::(before|after).*?(border-left|border-right|width:\s*[1-4]px)/s) ||
      !!document.querySelector('[class*="timeline"] [class*="left"], [class*="timeline"] [class*="right"]');

    // SVG analysis for flowchart detection
    var svgs = document.querySelectorAll('svg');
    var totalSvgPaths = 0;
    var hasSvgDiagram = false;
    svgs.forEach(svg => {
      var paths = svg.querySelectorAll('path, line, polyline');
      totalSvgPaths += paths.length;
      // A diagram SVG typically has multiple paths plus text/rect elements
      var rects = svg.querySelectorAll('rect, circle, ellipse');
      var texts = svg.querySelectorAll('text');
      if (paths.length >= 3 && (rects.length >= 2 || texts.length >= 2)) {
        hasSvgDiagram = true;
      }
    });

    // Container dimensions for poster detection
    var mainContainer = document.querySelector('main, [class*="container"], [class*="wrapper"]') || body;
    var containerStyle = getComputedStyle(mainContainer);
    var containerWidth = mainContainer.offsetWidth;
    var containerHeight = mainContainer.offsetHeight;

    return {
      // Dimensions
      bodyWidth: body.offsetWidth,
      bodyHeight: body.offsetHeight,
      containerWidth: containerWidth,
      containerHeight: containerHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      overflowHidden: bodyStyle.overflow === 'hidden' || bodyStyle.overflowY === 'hidden' ||
        htmlStyle.overflow === 'hidden' || htmlStyle.overflowY === 'hidden',

      // Element counts
      sectionCount: document.querySelectorAll('section').length,
      canvasCount: document.querySelectorAll('canvas').length,
      cardCount: document.querySelectorAll('.card, [class*="card"]').length,
      codeBlockCount: document.querySelectorAll('pre, code').length,
      preCount: document.querySelectorAll('pre').length,
      detailsCount: document.querySelectorAll('details').length,
      svgCount: document.querySelectorAll('svg').length,

      // Slide indicators
      hasSlideClass: !!document.querySelector('.slide, [data-slide], .slides'),
      slideCount: document.querySelectorAll('.slide, [data-slide]').length,
      hasSlideCounter: !!html.match(/\d+\s*\/\s*\d+/) || !!document.querySelector('[class*="counter"], [class*="slide-num"]'),
      hasProgressBar: !!document.querySelector('[class*="progress"]'),
      slideElDimensions: slideElDimensions,

      // Carousel indicators
      hasSwipeHandler: !!html.match(/touch(start|move|end)|swipe/i),
      hasArrowNav: !!document.querySelector('[class*="arrow"], [class*="nav-btn"], [class*="prev"], [class*="next"]'),
      cardDimensions: cardDimensions,
      hasCardCounter: !!document.querySelector('[class*="counter"], [class*="indicator"], [class*="dot"]'),

      // Dashboard indicators
      hasGrid: !!styles.match(/display\s*:\s*grid/) || bodyStyle.display === 'grid' ||
        containerStyle.display === 'grid',
      hasFlex: !!styles.match(/display\s*:\s*flex/) || bodyStyle.display === 'flex',
      hasFilterToolbar: !!document.querySelector('input[type="search"], select, [class*="filter"], [class*="toolbar"]'),
      statNumberCount: document.querySelectorAll('[data-count], [class*="stat"], [class*="kpi"], [class*="metric"]').length,

      // Timeline indicators
      hasTimelineClass: !!document.querySelector('[class*="timeline"]'),
      dateMarkerCount: document.querySelectorAll('time, [class*="date"], [class*="year"]').length,
      isChronological: isChronological,
      hasTimelineLayout: hasTimelineLayout,

      // Comparison indicators
      hasTable: !!document.querySelector('table'),
      hasComparisonClass: !!document.querySelector('[class*="compare"], [class*="comparison"], [class*="versus"], [class*="vs"]'),
      maxTableCols: maxTableCols,
      featureCheckCount: featureCheckCount,

      // Cheatsheet indicators
      hasSearchInput: !!document.querySelector('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]'),
      hasCopyButtons: !!html.match(/copy|clipboard/i),

      // Flowchart indicators
      hasMermaid: !!document.querySelector('.mermaid, [class*="mermaid"]'),
      totalSvgPaths: totalSvgPaths,
      hasSvgDiagram: hasSvgDiagram,

      // Scroll animation
      dataRevealCount: document.querySelectorAll('[data-reveal], [data-animate], [data-scroll]').length,

      // Keyboard nav
      hasKeyboardNav: !!html.match(/addEventListener.*key(down|up)|ArrowLeft|ArrowRight/),

      // TranslateX in styles
      hasTranslateX: !!styles.match(/translateX/) || !!html.match(/translateX/),
    };
  });

  return raw;
}

/**
 * Derive boolean signal flags from raw DOM measurements.
 * Each flag name corresponds to a signal referenced in FORMAT_DEFINITIONS.
 */
function deriveFlags(raw) {
  var TOLERANCE = 80; // px tolerance for dimension matching

  var flags = {};

  // --- Slide-deck signals ---
  flags.hasSlideClass = raw.hasSlideClass;
  flags.multipleSlides = raw.slideCount >= 2;
  flags.hasSlideCounter = raw.hasSlideCounter;
  flags.hasProgressBar = raw.hasProgressBar;
  flags.hasKeyboardNav = raw.hasKeyboardNav;
  flags.hasTranslateX = raw.hasTranslateX;
  // Check if slide elements roughly fill the viewport
  flags.slidesFullViewport = raw.slideElDimensions.length >= 2 &&
    raw.slideElDimensions.some(d =>
      Math.abs(d.width - raw.viewportWidth) < TOLERANCE &&
      Math.abs(d.height - raw.viewportHeight) < TOLERANCE
    );

  // --- Carousel signals ---
  var squareCards1080 = raw.cardDimensions.filter(d =>
    Math.abs(d.width - 1080) < TOLERANCE && Math.abs(d.height - 1080) < TOLERANCE
  );
  flags.hasCarouselCards = raw.cardDimensions.length >= 2 &&
    raw.cardDimensions.every(d =>
      Math.abs(d.width - d.height) < TOLERANCE
    );
  flags.has1080Cards = squareCards1080.length >= 2;
  flags.hasCardCounter = raw.hasCardCounter;
  flags.hasSwipeHandler = raw.hasSwipeHandler;
  flags.hasArrowNav = raw.hasArrowNav;

  // --- Poster 9:16 signals ---
  var bodyIs1080x1920 = Math.abs(raw.bodyWidth - 1080) < TOLERANCE &&
    Math.abs(raw.bodyHeight - 1920) < TOLERANCE;
  var containerIs1080x1920 = Math.abs(raw.containerWidth - 1080) < TOLERANCE &&
    Math.abs(raw.containerHeight - 1920) < TOLERANCE;
  flags.is1080x1920 = bodyIs1080x1920 || containerIs1080x1920;

  // --- Poster 1:1 signals ---
  var bodyIs1080x1080 = Math.abs(raw.bodyWidth - 1080) < TOLERANCE &&
    Math.abs(raw.bodyHeight - 1080) < TOLERANCE;
  var containerIs1080x1080 = Math.abs(raw.containerWidth - 1080) < TOLERANCE &&
    Math.abs(raw.containerHeight - 1080) < TOLERANCE;
  flags.is1080x1080 = bodyIs1080x1080 || containerIs1080x1080;

  // --- Shared poster signals ---
  flags.overflowHidden = raw.overflowHidden;
  flags.noScroll = raw.scrollHeight <= raw.viewportHeight + 10;
  flags.singleContainer = raw.sectionCount <= 1;

  // --- Dashboard signals ---
  flags.hasGrid = raw.hasGrid;
  flags.multipleCards = raw.cardCount >= 3;
  flags.hasCanvas = raw.canvasCount >= 1;
  flags.hasFilterToolbar = raw.hasFilterToolbar;
  flags.hasStatNumbers = raw.statNumberCount >= 1;

  // --- Infographic signals ---
  flags.multipleSections = raw.sectionCount >= 3;
  flags.hasDataReveal = raw.dataRevealCount >= 1;
  // reuse hasStatNumbers from dashboard
  flags.tallDocument = raw.scrollHeight > raw.viewportHeight * 2;
  flags.noSlideNav = !raw.hasKeyboardNav && !raw.hasSlideClass;

  // --- Timeline signals ---
  flags.hasTimelineClass = raw.hasTimelineClass;
  flags.hasDateMarkers = raw.dateMarkerCount >= 3;
  flags.chronologicalOrder = raw.isChronological;
  flags.hasTimelineLayout = raw.hasTimelineLayout;

  // --- Comparison signals ---
  flags.hasTable = raw.hasTable;
  flags.hasComparisonClass = raw.hasComparisonClass;
  flags.hasMultipleColumns = raw.maxTableCols >= 3;
  flags.hasFeatureChecks = raw.featureCheckCount >= 2;

  // --- Cheatsheet signals ---
  flags.multipleCodeBlocks = raw.preCount >= 3 || raw.codeBlockCount >= 5;
  flags.hasSearchInput = raw.hasSearchInput;
  flags.hasCopyButtons = raw.hasCopyButtons;
  flags.hasCollapsible = raw.detailsCount >= 1;

  // --- Flowchart signals ---
  flags.hasMermaid = raw.hasMermaid;
  flags.hasSvgDiagram = raw.hasSvgDiagram;
  // Require more paths for connection detection — small icon SVGs have 1-3 paths each
  flags.hasConnectionPaths = raw.totalSvgPaths >= 15;
  // A large SVG (diagram) has many rect+text elements, not just icon strokes
  flags.hasLargeSvg = raw.hasSvgDiagram && raw.totalSvgPaths >= 10;

  return flags;
}

/**
 * Score each format against the derived boolean flags.
 * Returns sorted array of { format, confidence, evidence } objects.
 */
function scoreFormats(flags) {
  var results = [];

  for (var [format, def] of Object.entries(FORMAT_DEFINITIONS)) {
    var matched = [];
    var missed = [];

    for (var signal of def.signals) {
      if (flags[signal]) {
        matched.push(signal);
      } else {
        missed.push(signal);
      }
    }

    var total = def.signals.length;
    var confidence = total > 0 ? matched.length / total : 0;

    // Round to 2 decimal places
    confidence = Math.round(confidence * 100) / 100;

    results.push({
      format,
      confidence,
      matched: matched.length,
      total,
      evidence: matched,
      missed,
    });
  }

  // Sort by confidence descending, then by number of matched signals descending
  results.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.matched - a.matched;
  });

  return results;
}

/**
 * Detect the format of an HTML visualization loaded in a Playwright page.
 *
 * @param {import('playwright').Page} page - A Playwright page with the HTML loaded
 * @returns {Promise<{ format: string, confidence: number, evidence: string[] }>}
 */
export async function detectFormat(page) {
  try {
    var raw = await gatherSignals(page);
    var flags = deriveFlags(raw);
    var scored = scoreFormats(flags);

    // Handle ambiguity: if top two formats have very similar confidence,
    // apply tiebreaker rules
    if (scored.length >= 2) {
      var first = scored[0];
      var second = scored[1];

      // Poster disambiguation: if both poster formats match, pick the one
      // whose dimension flag actually fired
      if (first.format.startsWith('poster-') && second.format.startsWith('poster-') &&
          first.confidence === second.confidence) {
        if (flags.is1080x1920 && !flags.is1080x1080) {
          scored = reorderFirst(scored, 'poster-9x16');
        } else if (flags.is1080x1080 && !flags.is1080x1920) {
          scored = reorderFirst(scored, 'poster-1x1');
        }
      }

      // Slide-deck vs infographic: slides need keyboard nav or slide classes
      if (first.format === 'infographic' && second.format === 'slide-deck' &&
          first.confidence === second.confidence) {
        if (flags.hasSlideClass || flags.hasKeyboardNav) {
          scored = reorderFirst(scored, 'slide-deck');
        }
      }

      // Dashboard vs infographic: dashboard needs canvas or grid
      if (first.format === 'infographic' && second.format === 'dashboard' &&
          first.confidence === second.confidence) {
        if (flags.hasCanvas && flags.hasGrid) {
          scored = reorderFirst(scored, 'dashboard');
        }
      }
    }

    var best = scored[0];

    // If best confidence is too low, fall back to generic
    if (best.confidence < 0.3) {
      return {
        format: 'generic',
        confidence: 0,
        evidence: [],
      };
    }

    return {
      format: best.format,
      confidence: best.confidence,
      evidence: best.evidence,
    };
  } catch (err) {
    // If page.evaluate fails (e.g., page crashed, navigation error), return generic
    return {
      format: 'generic',
      confidence: 0,
      evidence: ['detection-error: ' + (err.message || String(err))],
    };
  }
}

/**
 * Move a specific format to the front of the scored results array.
 */
function reorderFirst(scored, targetFormat) {
  var target = scored.find(s => s.format === targetFormat);
  if (!target) return scored;
  return [target, ...scored.filter(s => s.format !== targetFormat)];
}
