/**
 * Vision Evaluation Helper (Layer 3)
 *
 * This module does NOT call any API directly. It generates the structured
 * prompt + screenshot paths that an AI agent (Claude Code, OpenClaw, etc.)
 * should use to perform Layer 3 visual evaluation.
 *
 * The agent running the self-improvement loop is responsible for:
 * 1. Reading the screenshots
 * 2. Evaluating them using the calibrated prompt
 * 3. Returning scores in the expected JSON format
 */

import { readdir } from 'fs/promises';
import { join, basename } from 'path';

var DIMENSIONS = [
  { id: 'first-impression', name: 'First Impression', weight: 0.15 },
  { id: 'typography', name: 'Typography', weight: 0.15 },
  { id: 'color', name: 'Color', weight: 0.10 },
  { id: 'layout', name: 'Layout', weight: 0.15 },
  { id: 'content', name: 'Content', weight: 0.15 },
  { id: 'information-architecture', name: 'Information Architecture', weight: 0.20 },
  { id: 'format-execution', name: 'Format Execution', weight: 0.10 },
];

var VISION_PROMPT = `You are evaluating an HTML visualization. Look at the screenshots provided and score each dimension 1-10.

CALIBRATION (use these as anchors — do not deviate):
- 10 = Apple keynote / Stripe dashboard level
- 9 = Linear, Vercel, Raycast level
- 8 = Polished SaaS product
- 7 = Good Bootstrap template
- 6 = Amateur but functional
- 5 = Multiple visible problems
- 4 = Poor, broken layout or clashing colors
- 3 = Bad, barely functional

DIMENSIONS:
D1. First Impression (15%) — Would you screenshot this? Does it feel premium?
D2. Typography (15%) — Clear hierarchy? Professional sizing/spacing? Inter font properly used?
D3. Color (10%) — Harmonious palette? Both themes look intentional? Good contrast?
D4. Layout (15%) — Good rhythm? Generous whitespace? Responsive mobile view?
D5. Content (15%) — Clear message? Real/realistic data? No filler or placeholder text?
D6. Information Architecture (20%) — Is content structured for the audience? Can you grasp the key message in 5 seconds? Logical flow?
D7. Format Execution (10%) — Does the chosen format serve this content well? Are format-specific conventions followed?

INSTRUCTIONS:
1. Look at ALL provided screenshots (dark theme, light theme, mobile view)
2. Score each dimension with a number 1-10 and a one-sentence justification
3. Be critical but fair — most outputs should score 6-8, not 9-10
4. A score of 9+ means it genuinely rivals professional design tools
5. A score of 5 or below means significant, obvious problems

Respond in this EXACT JSON format (no markdown, no code fences):
{
  "dimensions": {
    "first-impression": { "score": N, "justification": "..." },
    "typography": { "score": N, "justification": "..." },
    "color": { "score": N, "justification": "..." },
    "layout": { "score": N, "justification": "..." },
    "content": { "score": N, "justification": "..." },
    "information-architecture": { "score": N, "justification": "..." },
    "format-execution": { "score": N, "justification": "..." }
  },
  "overall_impression": "One paragraph summary of the visualization quality.",
  "top_issues": ["Issue 1", "Issue 2", "Issue 3"]
}`;

/**
 * Generate the vision evaluation instructions for a set of screenshots.
 * The AI agent running the loop should:
 * 1. Read each screenshot file
 * 2. Evaluate using the returned prompt
 * 3. Parse the JSON response
 * 4. Pass it back to calculateScore()
 *
 * @param {Object} screenshots - { dark1440: path, light1440: path, darkMobile: path }
 * @param {string} format - Detected format type
 * @param {string[]} [slideScreenshots] - Extra slide screenshots
 * @returns {Object} - { prompt, screenshotPaths, dimensions }
 */
export function prepareVisionEval(screenshots, format, slideScreenshots) {
  var paths = [];

  if (screenshots.dark1440) paths.push({ path: screenshots.dark1440, label: 'Dark theme, 1440px desktop' });
  if (screenshots.light1440) paths.push({ path: screenshots.light1440, label: 'Light theme, 1440px desktop' });
  if (screenshots.darkMobile) paths.push({ path: screenshots.darkMobile, label: 'Dark theme, 375px mobile' });

  if (slideScreenshots) {
    for (var i = 0; i < slideScreenshots.length; i++) {
      paths.push({ path: slideScreenshots[i], label: 'Slide ' + (i + 1) });
    }
  }

  return {
    prompt: VISION_PROMPT + '\n\nDetected format: ' + format,
    screenshotPaths: paths,
    dimensions: DIMENSIONS,
  };
}

/**
 * Calculate the weighted overall score from agent-provided dimension scores.
 *
 * @param {Object} agentResponse - Parsed JSON from the agent's vision eval
 * @returns {Object} - { dimensions, overall, issues }
 */
export function calculateScore(agentResponse) {
  var overall = 0;
  var dimensionResults = {};

  for (var dim of DIMENSIONS) {
    var dimData = agentResponse.dimensions ? agentResponse.dimensions[dim.id] : null;
    if (dimData) {
      var score = typeof dimData.score === 'number' ? dimData.score : parseFloat(dimData.score) || 5;
      score = Math.max(1, Math.min(10, score));
      overall += score * dim.weight;
      dimensionResults[dim.id] = {
        score: score,
        weight: dim.weight,
        justification: dimData.justification || '',
      };
    } else {
      overall += 5 * dim.weight;
      dimensionResults[dim.id] = {
        score: 5,
        weight: dim.weight,
        justification: 'Not evaluated',
      };
    }
  }

  return {
    dimensions: dimensionResults,
    overall: parseFloat(overall.toFixed(2)),
    overallImpression: agentResponse.overall_impression || '',
    issues: agentResponse.top_issues || [],
  };
}

/**
 * Export the prompt text for use in LOOP-PROMPT.md or other documentation.
 */
export var EVALUATION_PROMPT = VISION_PROMPT;
