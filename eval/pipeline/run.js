#!/usr/bin/env node

/**
 * Visualize Eval Pipeline — Orchestrator
 *
 * Automated evaluation pipeline for HTML visualizations:
 *   Layer 1: Format detection (deterministic, DOM-based)
 *   Layer 2: Structural quality (0-100, 45 deterministic DOM checks)
 *   Layer 3: Visual & IA quality (done by the AI agent, not this script)
 *
 * This script handles Layers 1 & 2 and captures screenshots.
 * Layer 3 is performed by the AI agent running the self-improvement loop
 * using the screenshots and the calibrated prompt from vision-eval.js.
 *
 * Usage:
 *   node run.js --file path/to/file.html
 *   node run.js --dir path/to/dir/
 *   node run.js --dir path/to/dir/ --round 40
 */

import { chromium } from 'playwright';
import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import { resolve, join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Check modules
import { runChecks as themeChecks } from './checks/theme.js';
import { runChecks as menuChecks } from './checks/menu.js';
import { runChecks as typographyChecks } from './checks/typography.js';
import { runChecks as layoutChecks } from './checks/layout.js';
import { runChecks as accessibilityChecks } from './checks/accessibility.js';
import { runChecks as chartsChecks } from './checks/charts.js';
import { runChecks as technicalChecks } from './checks/technical.js';

// Format detection
import { detectFormat } from './format-detect.js';

var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);

// ============================================================
// CLI argument parsing
// ============================================================

function parseArgs(args) {
  var opts = {
    file: null,
    dir: null,
    round: null,
    outDir: null,
  };

  for (var i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--file':
        opts.file = args[++i];
        break;
      case '--dir':
        opts.dir = args[++i];
        break;
      case '--round':
        opts.round = parseInt(args[++i], 10);
        break;
      case '--out':
        opts.outDir = args[++i];
        break;
      default:
        // positional: treat as file or dir
        if (!opts.file && !opts.dir) {
          opts.file = args[i];
        }
    }
  }

  return opts;
}

// ============================================================
// Layer 2: Run all DOM checks
// ============================================================

async function runLayer2(page) {
  var allChecks = [];

  var modules = [
    themeChecks,
    menuChecks,
    typographyChecks,
    layoutChecks,
    accessibilityChecks,
    chartsChecks,
    technicalChecks,
  ];

  for (var mod of modules) {
    try {
      var checks = await mod(page);
      allChecks = allChecks.concat(checks);
    } catch (err) {
      allChecks.push({
        name: 'module-error',
        category: 'error',
        passed: false,
        weight: 1,
        message: 'Check module threw: ' + err.message,
        details: err.stack,
      });
    }
  }

  // Calculate Layer 2 score (0-100)
  var totalWeight = 0;
  var passedWeight = 0;

  for (var check of allChecks) {
    totalWeight += check.weight;
    if (check.passed) {
      passedWeight += check.weight;
    }
  }

  var score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;

  return {
    score: score,
    totalChecks: allChecks.length,
    passed: allChecks.filter(function (c) { return c.passed; }).length,
    failed: allChecks.filter(function (c) { return !c.passed; }).length,
    checks: allChecks,
    failedChecks: allChecks.filter(function (c) { return !c.passed; }),
  };
}

// ============================================================
// Screenshot capture
// ============================================================

async function captureScreenshots(page, htmlFilePath, outDir) {
  var screenshots = {};
  var name = basename(htmlFilePath, '.html');

  await mkdir(outDir, { recursive: true });

  // Dark theme at 1440px
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(function () {
    if (typeof applyTheme === 'function') applyTheme('dark');
    else document.documentElement.className = 'theme-dark';
  });
  await page.waitForTimeout(500);
  var darkPath = join(outDir, name + '-dark-1440.png');
  await page.screenshot({ path: darkPath, fullPage: true });
  screenshots.dark1440 = darkPath;

  // Light theme at 1440px
  await page.evaluate(function () {
    if (typeof applyTheme === 'function') applyTheme('light');
    else document.documentElement.className = 'theme-light';
  });
  await page.waitForTimeout(500);
  var lightPath = join(outDir, name + '-light-1440.png');
  await page.screenshot({ path: lightPath, fullPage: true });
  screenshots.light1440 = lightPath;

  // Dark theme at 375px (mobile)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(function () {
    if (typeof applyTheme === 'function') applyTheme('dark');
    else document.documentElement.className = 'theme-dark';
  });
  await page.waitForTimeout(500);
  var mobilePath = join(outDir, name + '-dark-375.png');
  await page.screenshot({ path: mobilePath, fullPage: true });
  screenshots.darkMobile = mobilePath;

  // Reset to dark 1440 for further checks
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(function () {
    if (typeof applyTheme === 'function') applyTheme('dark');
    else document.documentElement.className = 'theme-dark';
  });

  return screenshots;
}

// ============================================================
// Slide deck screenshots (extra)
// ============================================================

async function captureSlideScreenshots(page, htmlFilePath, outDir) {
  var screenshots = [];
  var name = basename(htmlFilePath, '.html');

  // Try to get total slide count
  var slideCount = await page.evaluate(function () {
    var slides = document.querySelectorAll('.slide, [data-slide]');
    return slides.length;
  });

  if (slideCount < 2) return screenshots;

  var slidesToCapture = [0, 2, slideCount - 1]; // slides 1, 3, and last (0-indexed)
  var unique = [...new Set(slidesToCapture.filter(function (i) { return i < slideCount; }))];

  for (var idx of unique) {
    // Navigate to slide
    await page.evaluate(function (slideIdx) {
      // Common patterns for slide navigation
      if (typeof goToSlide === 'function') {
        goToSlide(slideIdx);
      } else if (typeof showSlide === 'function') {
        showSlide(slideIdx);
      } else {
        var slides = document.querySelectorAll('.slide, [data-slide]');
        slides.forEach(function (s, i) {
          s.style.display = i === slideIdx ? '' : 'none';
          s.style.opacity = i === slideIdx ? '1' : '0';
        });
      }
    }, idx);

    await page.waitForTimeout(600);
    var slidePath = join(outDir, name + '-slide-' + (idx + 1) + '.png');
    await page.screenshot({ path: slidePath });
    screenshots.push(slidePath);
  }

  return screenshots;
}

// ============================================================
// Evaluate a single HTML file
// ============================================================

async function evaluateFile(browser, htmlFilePath, opts) {
  var page = await browser.newPage();
  var consoleMessages = [];
  var consoleErrors = [];

  // Capture console messages
  page.on('console', function (msg) {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', function (err) {
    consoleErrors.push(err.message);
  });

  // Open file
  var fileUrl = 'file://' + resolve(htmlFilePath);
  await page.setViewportSize({ width: 1440, height: 900 });

  try {
    await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (err) {
    await page.close();
    return {
      file: basename(htmlFilePath),
      path: htmlFilePath,
      error: 'Failed to load: ' + err.message,
      layer1: { format: 'unknown', passed: false },
      layer2: { score: 0, checks: [] },
      layer3: null,
      overall: 0,
    };
  }

  // Wait for animations to settle
  await page.waitForTimeout(1000);

  // Store console errors on page for technical checks
  await page.evaluate(function (errors) {
    window.__evalConsoleErrors = errors;
  }, consoleErrors);

  // === Layer 1: Format Detection ===
  var formatResult = await detectFormat(page);

  // === Layer 2: DOM Checks ===
  var layer2 = await runLayer2(page);

  // === Screenshots ===
  var screenshotDir = opts.outDir || join(__dirname, '..', 'rounds', 'round-' + (opts.round || 'latest'), 'screenshots');
  var screenshots = await captureScreenshots(page, htmlFilePath, screenshotDir);

  // Extra slide screenshots if slide deck
  var slideScreenshots = [];
  if (formatResult.format === 'slide-deck') {
    slideScreenshots = await captureSlideScreenshots(page, htmlFilePath, screenshotDir);
  }

  await page.close();

  // === Calculate Overall (Layer 2 only for now, Layer 3 added separately) ===
  var layer2Normalized = layer2.score / 10; // 0-100 → 0-10

  return {
    file: basename(htmlFilePath),
    path: htmlFilePath,
    format: formatResult,
    layer1: {
      format: formatResult.format,
      confidence: formatResult.confidence,
      passed: true, // Format appropriateness requires prompt context (Layer 1 judgment done externally)
    },
    layer2: layer2,
    layer3: null, // Filled in by vision-eval.js if --vision flag
    screenshots: screenshots,
    slideScreenshots: slideScreenshots,
    consoleErrors: consoleErrors,
    overall: layer2Normalized, // Updated with Layer 3 when available
  };
}

// ============================================================
// Main
// ============================================================

async function main() {
  var args = process.argv.slice(2);
  var opts = parseArgs(args);

  if (!opts.file && !opts.dir) {
    console.log('Usage:');
    console.log('  node run.js --file path/to/file.html');
    console.log('  node run.js --dir path/to/dir/');
    console.log('  node run.js --dir path/to/dir/ --round 40');
    console.log('');
    console.log('Options:');
    console.log('  --file <path>    Evaluate a single HTML file');
    console.log('  --dir <path>     Evaluate all HTML files in directory');
    console.log('  --round <N>      Round number for organizing output');
    console.log('  --out <path>     Output directory for screenshots/results');
    console.log('');
    console.log('Layer 3 (vision) is done by the AI agent running the loop.');
    console.log('Screenshots are saved for the agent to evaluate.');
    process.exit(1);
  }

  // Collect files to evaluate
  var files = [];
  if (opts.file) {
    files.push(resolve(opts.file));
  } else if (opts.dir) {
    var dirPath = resolve(opts.dir);
    var entries = await readdir(dirPath);
    for (var entry of entries) {
      if (extname(entry) === '.html') {
        files.push(join(dirPath, entry));
      }
    }
  }

  if (files.length === 0) {
    console.error('No HTML files found.');
    process.exit(1);
  }

  console.log('Evaluating ' + files.length + ' file(s)...\n');

  // Launch browser
  var browser = await chromium.launch({ headless: true });
  var results = [];

  for (var filePath of files) {
    console.log('  Evaluating: ' + basename(filePath));
    var result = await evaluateFile(browser, filePath, opts);
    results.push(result);

    // Print summary
    var l2 = result.layer2;
    console.log('    Format: ' + result.format.format + ' (confidence: ' + (result.format.confidence * 100).toFixed(0) + '%)');
    console.log('    Layer 2: ' + l2.score + '/100 (' + l2.passed + '/' + l2.totalChecks + ' checks passed)');
    if (l2.failedChecks.length > 0) {
      console.log('    Failed checks:');
      for (var fc of l2.failedChecks.slice(0, 5)) {
        console.log('      - ' + fc.name + ': ' + fc.message);
      }
      if (l2.failedChecks.length > 5) {
        console.log('      ... and ' + (l2.failedChecks.length - 5) + ' more');
      }
    }
    if (result.consoleErrors.length > 0) {
      console.log('    Console errors: ' + result.consoleErrors.length);
    }
    console.log('');
  }

  await browser.close();

  // === Summary ===
  console.log('═══════════════════════════════════════════');
  console.log('EVALUATION SUMMARY');
  console.log('═══════════════════════════════════════════\n');

  var overallSum = 0;
  var minScore = 10;

  for (var r of results) {
    var overall = r.overall;
    overallSum += overall;
    if (overall < minScore) minScore = overall;

    console.log(r.file);
    console.log('  Format: ' + (r.format ? r.format.format : 'unknown'));
    console.log('  Layer 2 (structural): ' + r.layer2.score + '/100');
    console.log('  Screenshots: ' + Object.keys(r.screenshots || {}).length + ' captured');
    console.log('');
  }

  var avg = results.length > 0 ? overallSum / results.length : 0;

  // Determine gate
  var gate = 'FAIL';
  if (avg >= 9.5 && minScore >= 9) gate = 'VIRAL';
  else if (avg >= 9.0 && minScore >= 8) gate = 'SHIP';
  else if (avg >= 8.0 && minScore >= 7) gate = 'ACCEPTABLE';
  else if (avg >= 7.0) gate = 'NEEDS WORK';

  console.log('───────────────────────────────────────────');
  console.log('Layer 2 Average: ' + avg.toFixed(2) + '/10 (structural only)');
  console.log('Layer 2 Min:     ' + minScore.toFixed(2) + '/10');
  console.log('Gate (L2 only):  ' + gate);
  console.log('');
  console.log('Layer 3 (visual/IA) must be evaluated by the AI agent.');
  console.log('Screenshots saved for agent review.');
  console.log('───────────────────────────────────────────\n');

  // === Save results ===
  var roundDir = opts.outDir || join(__dirname, '..', 'rounds', 'round-' + (opts.round || 'latest'));
  await mkdir(roundDir, { recursive: true });

  var scoresOutput = {
    round: opts.round,
    timestamp: new Date().toISOString(),
    filesEvaluated: results.length,
    average: parseFloat(avg.toFixed(2)),
    minScore: parseFloat(minScore.toFixed(2)),
    gate: gate,
    results: results.map(function (r) {
      return {
        file: r.file,
        format: r.format ? r.format.format : 'unknown',
        layer2Score: r.layer2.score,
        layer3Score: r.layer3 ? r.layer3.overall : null,
        overall: parseFloat(r.overall.toFixed(2)),
        failedChecks: r.layer2.failedChecks.map(function (c) {
          return { name: c.name, message: c.message };
        }),
        consoleErrors: r.consoleErrors,
      };
    }),
  };

  var scoresPath = join(roundDir, 'scores.json');
  await writeFile(scoresPath, JSON.stringify(scoresOutput, null, 2));
  console.log('Results saved to: ' + scoresPath);

  return scoresOutput;
}

main().catch(function (err) {
  console.error('Pipeline error:', err);
  process.exit(1);
});
