// checks/typography.js — Typography checks (weight total ~15)
export async function runChecks(page) {
  var results = [];

  // Helper: get computed font sizes for common elements
  var fontData = null;
  try {
    fontData = await page.evaluate(() => {
      var parseSize = function(sizeStr) {
        return parseFloat(sizeStr) || 0;
      };

      var bodyEl = document.body;
      var h1 = document.querySelector('h1');
      var h2 = document.querySelector('h2');
      var h3 = document.querySelector('h3');

      var bodyStyle = getComputedStyle(bodyEl);
      var data = {
        bodyFontSize: parseSize(bodyStyle.fontSize),
        bodyFontWeight: parseInt(bodyStyle.fontWeight, 10) || 400,
        bodyFontFamily: bodyStyle.fontFamily,
        h1FontSize: 0,
        h1FontWeight: 400,
        h1LetterSpacing: 0,
        h2FontSize: 0,
        h2FontWeight: 400,
        h2LetterSpacing: 0,
        h3FontSize: 0,
        h3LetterSpacing: 0,
        hasH1: h1 !== null,
        hasH2: h2 !== null,
        hasH3: h3 !== null
      };

      if (h1) {
        var h1Style = getComputedStyle(h1);
        data.h1FontSize = parseSize(h1Style.fontSize);
        data.h1FontWeight = parseInt(h1Style.fontWeight, 10) || 400;
        data.h1LetterSpacing = parseSize(h1Style.letterSpacing);
      }
      if (h2) {
        var h2Style = getComputedStyle(h2);
        data.h2FontSize = parseSize(h2Style.fontSize);
        data.h2FontWeight = parseInt(h2Style.fontWeight, 10) || 400;
        data.h2LetterSpacing = parseSize(h2Style.letterSpacing);
      }
      if (h3) {
        var h3Style = getComputedStyle(h3);
        data.h3FontSize = parseSize(h3Style.fontSize);
        data.h3LetterSpacing = parseSize(h3Style.letterSpacing);
      }

      return data;
    });
  } catch (e) {
    // If we can't get font data, return all checks as failed
    var errorResult = {
      name: 'typography-data',
      category: 'typography',
      passed: false,
      weight: 3,
      message: 'Could not read typography data from page',
      details: 'Error: ' + e.message
    };
    return [errorResult];
  }

  // 1. Font size hierarchy: h1 > h2 > h3 > body
  try {
    var hierarchyValid = true;
    var hierarchyDetails = [];

    if (fontData.hasH1 && fontData.hasH2 && fontData.h1FontSize <= fontData.h2FontSize) {
      hierarchyValid = false;
      hierarchyDetails.push('h1 (' + fontData.h1FontSize + 'px) should be > h2 (' + fontData.h2FontSize + 'px)');
    }
    if (fontData.hasH2 && fontData.hasH3 && fontData.h2FontSize <= fontData.h3FontSize) {
      hierarchyValid = false;
      hierarchyDetails.push('h2 (' + fontData.h2FontSize + 'px) should be > h3 (' + fontData.h3FontSize + 'px)');
    }
    if (fontData.hasH3 && fontData.h3FontSize <= fontData.bodyFontSize) {
      hierarchyValid = false;
      hierarchyDetails.push('h3 (' + fontData.h3FontSize + 'px) should be > body (' + fontData.bodyFontSize + 'px)');
    }
    if (!fontData.hasH1 && !fontData.hasH2 && !fontData.hasH3) {
      hierarchyValid = false;
      hierarchyDetails.push('No heading elements (h1, h2, h3) found');
    }

    results.push({
      name: 'font-size-hierarchy',
      category: 'typography',
      passed: hierarchyValid,
      weight: 3,
      message: 'Clear font-size hierarchy: h1 > h2 > h3 > body',
      details: hierarchyValid ? '' : hierarchyDetails.join('; ')
    });
  } catch (e) {
    results.push({
      name: 'font-size-hierarchy',
      category: 'typography',
      passed: false,
      weight: 3,
      message: 'Clear font-size hierarchy: h1 > h2 > h3 > body',
      details: 'Error: ' + e.message
    });
  }

  // 2. Body font-size >= 14px
  results.push({
    name: 'body-font-size-minimum',
    category: 'typography',
    passed: fontData.bodyFontSize >= 14,
    weight: 2,
    message: 'Body font-size is at least 14px',
    details: fontData.bodyFontSize >= 14
      ? 'Body font-size: ' + fontData.bodyFontSize + 'px'
      : 'Body font-size is ' + fontData.bodyFontSize + 'px, expected >= 14px'
  });

  // 3. Heading (h1) font-size >= 20px
  if (fontData.hasH1) {
    results.push({
      name: 'h1-font-size-minimum',
      category: 'typography',
      passed: fontData.h1FontSize >= 20,
      weight: 2,
      message: 'h1 font-size is at least 20px',
      details: fontData.h1FontSize >= 20
        ? 'h1 font-size: ' + fontData.h1FontSize + 'px'
        : 'h1 font-size is ' + fontData.h1FontSize + 'px, expected >= 20px'
    });
  } else {
    results.push({
      name: 'h1-font-size-minimum',
      category: 'typography',
      passed: false,
      weight: 2,
      message: 'h1 font-size is at least 20px',
      details: 'No h1 element found in the document'
    });
  }

  // 4. Letter-spacing on headings is negative (tracking)
  try {
    var hasNegativeTracking = false;
    var trackingDetails = [];

    if (fontData.hasH1) {
      if (fontData.h1LetterSpacing < 0) {
        hasNegativeTracking = true;
      }
      trackingDetails.push('h1: ' + fontData.h1LetterSpacing + 'px');
    }
    if (fontData.hasH2) {
      if (fontData.h2LetterSpacing < 0) {
        hasNegativeTracking = true;
      }
      trackingDetails.push('h2: ' + fontData.h2LetterSpacing + 'px');
    }
    if (fontData.hasH3) {
      if (fontData.h3LetterSpacing < 0) {
        hasNegativeTracking = true;
      }
      trackingDetails.push('h3: ' + fontData.h3LetterSpacing + 'px');
    }

    results.push({
      name: 'heading-negative-tracking',
      category: 'typography',
      passed: hasNegativeTracking,
      weight: 2,
      message: 'Headings use negative letter-spacing (tight tracking)',
      details: hasNegativeTracking
        ? 'Letter-spacing: ' + trackingDetails.join(', ')
        : 'No headings have negative letter-spacing. ' + (trackingDetails.length > 0 ? trackingDetails.join(', ') : 'No headings found')
    });
  } catch (e) {
    results.push({
      name: 'heading-negative-tracking',
      category: 'typography',
      passed: false,
      weight: 2,
      message: 'Headings use negative letter-spacing (tight tracking)',
      details: 'Error: ' + e.message
    });
  }

  // 5. Font-weight hierarchy: h1 >= 600, h2 >= 500, body is 400
  try {
    var weightValid = true;
    var weightDetails = [];

    if (fontData.hasH1 && fontData.h1FontWeight < 600) {
      weightValid = false;
      weightDetails.push('h1 weight is ' + fontData.h1FontWeight + ', expected >= 600');
    }
    if (fontData.hasH2 && fontData.h2FontWeight < 500) {
      weightValid = false;
      weightDetails.push('h2 weight is ' + fontData.h2FontWeight + ', expected >= 500');
    }
    if (fontData.bodyFontWeight !== 400) {
      weightValid = false;
      weightDetails.push('body weight is ' + fontData.bodyFontWeight + ', expected 400');
    }
    if (!fontData.hasH1 && !fontData.hasH2) {
      weightValid = false;
      weightDetails.push('No heading elements found to check weight hierarchy');
    }

    results.push({
      name: 'font-weight-hierarchy',
      category: 'typography',
      passed: weightValid,
      weight: 3,
      message: 'Font-weight hierarchy: h1 >= 600, h2 >= 500, body = 400',
      details: weightValid ? '' : weightDetails.join('; ')
    });
  } catch (e) {
    results.push({
      name: 'font-weight-hierarchy',
      category: 'typography',
      passed: false,
      weight: 3,
      message: 'Font-weight hierarchy: h1 >= 600, h2 >= 500, body = 400',
      details: 'Error: ' + e.message
    });
  }

  // 6. Inter font family in use on body
  try {
    var hasInter = fontData.bodyFontFamily.toLowerCase().includes('inter');
    results.push({
      name: 'inter-font-in-use',
      category: 'typography',
      passed: hasInter,
      weight: 3,
      message: 'Inter font family is applied to body',
      details: hasInter
        ? 'font-family: ' + fontData.bodyFontFamily
        : 'Body font-family is "' + fontData.bodyFontFamily + '", expected Inter'
    });
  } catch (e) {
    results.push({
      name: 'inter-font-in-use',
      category: 'typography',
      passed: false,
      weight: 3,
      message: 'Inter font family is applied to body',
      details: 'Error: ' + e.message
    });
  }

  return results;
}
