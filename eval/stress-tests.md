# Stress Test Suite

40 test cases covering every visualization type, edge case, data format, and real-world scenario. Each test specifies the input prompt, expected output type, and specific quality criteria.

## How to Run

For each test:
1. Feed the prompt to Claude Code with the visualize skill active
2. Evaluate the output using the visualize-eval skill
3. Log score in eval-results.md
4. Fix and re-run any score < 8.5

Run in batches of 5-10. Fix systemic issues in SKILL.md between batches.

---

## Category 1: Slide Decks (10 tests)

### T01: Minimal Slide Deck
**Prompt:** "Create a 5-slide presentation about why sleep is important"
**Expect:** Simple, clean deck. Title + 3 content + closing. No data needed.
**Tests:** Basic slide navigation, theme toggle, typography hierarchy, animations.

### T02: Data-Heavy Presentation
**Prompt:** "Make a deck showing global smartphone market share: Apple 27%, Samsung 20%, Xiaomi 14%, Oppo 9%, Others 30%. Include a chart slide and key takeaways."
**Expect:** Pie/donut chart via Chart.js, stat callouts, clean data presentation.
**Tests:** Chart rendering, data accuracy, chart + text balance.

### T03: Long Presentation (15+ slides)
**Prompt:** "Create a comprehensive presentation about the history of artificial intelligence, from Turing to ChatGPT. Cover key milestones, breakthroughs, and future predictions. Make it at least 15 slides."
**Expect:** Sustained design quality across many slides. Section dividers. Timeline elements.
**Tests:** Design consistency across slides, navigation perf, progress bar accuracy.

### T04: Bilingual/Korean Content
**Prompt:** "Create a presentation in Korean about 실리콘밸리 취업 전략 (Silicon Valley job search strategies). 5 key tips with explanations."
**Expect:** Korean text renders properly, fonts support Korean, layout handles CJK characters.
**Tests:** Unicode rendering, font fallbacks, text wrapping with Korean.

### T05: Technical/Code Presentation
**Prompt:** "Make a developer talk about React Server Components. Include code snippets, architecture diagrams, and performance comparisons."
**Expect:** Syntax-highlighted code blocks, architecture diagram (SVG/Mermaid), comparison table.
**Tests:** Code block styling, monospace fonts, diagram clarity.

### T06: Pitch Deck
**Prompt:** "Create a startup pitch deck for an AI-powered recipe app called 'CookAI'. Include: problem, solution, market size ($300B food industry), business model, team, and ask ($2M seed round)."
**Expect:** Professional pitch format, big numbers, clean story flow.
**Tests:** Persuasive structure, stat prominence, CTA on closing slide.

### T07: Image-Heavy Slides (no actual images)
**Prompt:** "Make a presentation about sustainable architecture. Since we can't use photos, use creative CSS/SVG visuals to illustrate concepts like green buildings, solar panels, and water recycling."
**Expect:** Creative SVG illustrations, CSS art, visual storytelling without photos.
**Tests:** SVG quality, visual creativity, whether it compensates for lack of photos.

### T08: Single Slide
**Prompt:** "Create just ONE impactful slide that summarizes: 'Our team shipped 47 features this quarter, a 3x increase over Q2, with zero P0 incidents.'"
**Expect:** Big, bold, single impactful visual. Not a full deck.
**Tests:** Information design, impact, works as a standalone screenshot.

### T09: Presentation from URL
**Prompt:** "Summarize this article as a 5-slide presentation: https://paulgraham.com/greatwork.html"
**Expect:** Key points extracted, properly attributed, visual summary of the essay.
**Tests:** Content extraction, summarization quality, attribution.

### T10: Comparison Presentation
**Prompt:** "Create a deck comparing AWS vs GCP vs Azure for a startup. Cover pricing, ease of use, AI/ML services, free tier, and recommendation."
**Expect:** Comparison tables, feature matrices, clear recommendation.
**Tests:** Table layout, fairness of comparison, visual clarity of differences.

---

## Category 2: Dashboards (8 tests)

### T11: KPI Dashboard
**Prompt:** "Create a marketing dashboard with these KPIs: Monthly Revenue $124.5K (↑12%), Active Users 8,429 (↑5.7%), Conversion Rate 3.2% (↓0.4%), CAC $47.80 (↑2.1%). Add a revenue trend line chart and traffic source donut chart."
**Expect:** KPI cards + charts, responsive grid, professional look.
**Tests:** Number formatting, chart accuracy, responsive layout, up/down indicators.

### T12: Minimal Dashboard (2 metrics)
**Prompt:** "Show me a simple dashboard with just two numbers: 1,247 signups this week and 89% retention rate."
**Expect:** Clean, not over-designed for minimal data. Should NOT look empty.
**Tests:** Appropriate scale for small data, visual balance.

### T13: Dense Dashboard (20+ metrics)
**Prompt:** "Create a comprehensive SaaS dashboard with: MRR, ARR, churn rate, LTV, CAC, NPS score, daily active users, weekly active users, monthly active users, signup conversion, trial-to-paid conversion, average session duration, page views, bounce rate, support tickets open, CSAT score, revenue by plan tier, geographic distribution, and feature adoption rates. Use realistic numbers."
**Expect:** Dense but readable. Multiple chart types. Good information hierarchy.
**Tests:** Layout under density, scrollability, visual grouping, doesn't feel overwhelming.

### T14: Real-Time Style Dashboard
**Prompt:** "Create a server monitoring dashboard showing: CPU 73%, Memory 4.2/8 GB, Disk 67%, Network In 1.2 Mbps / Out 340 Kbps, 3 active alerts, uptime 99.97%. Include gauges and sparklines."
**Expect:** Gauge charts (CSS or SVG), sparklines, alert indicators, "live" feel.
**Tests:** Gauge rendering, visual urgency for alerts, status colors.

### T15: Dashboard from CSV Data
**Prompt:** "Visualize this data as a dashboard:\n\nMonth,Revenue,Users,Churn\nJan,45000,1200,2.1\nFeb,52000,1350,1.8\nMar,48000,1280,2.5\nApr,61000,1500,1.6\nMay,73000,1820,1.3\nJun,68000,1750,1.9"
**Expect:** Auto-detect CSV, render appropriate charts, calculate trends.
**Tests:** Data parsing, chart type selection, trend calculation, labels.

---

## Category 3: Infographics (7 tests)

### T16: Statistics Infographic
**Prompt:** "Create an infographic about remote work in 2025: 58% of workers hybrid, 27% fully remote, 15% fully in-office. Average remote worker saves 72 minutes/day commuting. 67% report better work-life balance. Companies save $11,000/year per remote worker."
**Expect:** Big numbers, icon-card sections, visual flow, scroll-triggered animations.
**Tests:** Number prominence, visual storytelling, scroll behavior, mobile layout.

### T17: Process/How-To Infographic
**Prompt:** "Create an infographic showing 'How to Make Pour-Over Coffee' in 7 steps, with timing for each step."
**Expect:** Sequential steps, numbered, with timing callouts. Visual progression.
**Tests:** Step clarity, visual sequence, timing display.

### T18: Comparison Infographic
**Prompt:** "Create an infographic comparing iPhone 16 Pro vs Samsung Galaxy S25 Ultra: camera, battery, display, price, AI features."
**Expect:** Side-by-side layout, feature comparison with visual indicators.
**Tests:** Fair visual treatment, easy scanning, clear winner indicators.

### T19: Long Infographic (lots of content)
**Prompt:** "Create a comprehensive infographic about the history of the internet, from ARPANET (1969) to AI (2025). Cover at least 15 major milestones."
**Expect:** Long scrolling infographic, timeline, consistent design across length.
**Tests:** Design consistency over length, scroll performance, section breaks.

---

## Category 4: Flowcharts & Diagrams (5 tests)

### T20: Simple Flowchart
**Prompt:** "Create a flowchart for a user signup flow: Start → Enter Email → Valid? → Yes: Create Account → Verify Email → Done / No: Show Error → Back to Enter Email"
**Expect:** Clean flowchart with decision diamond, clear paths, labeled arrows.
**Tests:** Node shapes, arrow clarity, layout logic, readability.

### T21: Complex System Architecture
**Prompt:** "Visualize a microservices architecture with: API Gateway → Auth Service, User Service, Payment Service, Notification Service. Each connects to its own database. Payment connects to Stripe API. Notification connects to SendGrid and Firebase."
**Expect:** System diagram with service boxes, database cylinders, external API indicators, connection lines.
**Tests:** Diagram complexity handling, label clarity, visual grouping.

### T22: Decision Tree
**Prompt:** "Create a decision tree for 'What programming language should I learn?' with branches for: goal (web/mobile/data/AI), experience level (beginner/intermediate), and preference (speed/simplicity/jobs)."
**Expect:** Multi-level decision tree, clear paths to recommendations.
**Tests:** Tree layout, branch clarity, terminal node recommendations.

### T23: Org Chart
**Prompt:** "Create an org chart: CEO at top, then CTO, CFO, CPO. Under CTO: VP Engineering (3 teams: Frontend, Backend, Infrastructure), VP Data. Under CFO: Finance, Legal. Under CPO: Design, Product Management."
**Expect:** Hierarchical layout, clear reporting lines, role labels.
**Tests:** Hierarchy clarity, line connections, responsive behavior.

### T24: Mermaid Diagram
**Prompt:** "Create a sequence diagram showing an OAuth2 authorization code flow between User, Client App, Auth Server, and Resource Server."
**Expect:** Mermaid-rendered sequence diagram, properly labeled interactions.
**Tests:** Mermaid rendering, diagram accuracy, readability.

---

## Category 5: Timelines (3 tests)

### T25: Simple Timeline
**Prompt:** "Create a timeline of SpaceX milestones: 2002 Founded, 2008 Falcon 1 orbit, 2012 Dragon ISS, 2015 First landing, 2018 Falcon Heavy, 2020 Crew Dragon, 2023 Starship launch."
**Expect:** Clean vertical or horizontal timeline, event cards, dates prominent.
**Tests:** Date layout, event card design, visual flow.

### T26: Project Roadmap
**Prompt:** "Create a product roadmap for Q1-Q4 2026. Q1: Auth system, API v2. Q2: Mobile app, Analytics dashboard. Q3: AI features, Integrations. Q4: Enterprise tier, Scale infrastructure. Show current quarter highlighted."
**Expect:** Gantt-style or lane-based roadmap, current quarter highlighted.
**Tests:** Quarter layout, current marker, item grouping, visual timeline.

---

## Category 6: Data Visualizations (4 tests)

### T27: Bar Chart from Data
**Prompt:** "Visualize top programming languages by popularity: Python 28%, JavaScript 17%, Java 14%, C++ 10%, TypeScript 8%, Go 7%, Rust 5%, Others 11%"
**Expect:** Horizontal or vertical bar chart, sorted, labeled, with percentages.
**Tests:** Bar proportions, sorting, label clarity, color coding.

### T28: Multi-Series Line Chart
**Prompt:** "Show quarterly revenue for 3 products over 2 years: Product A (10, 15, 22, 30, 35, 42, 48, 55), Product B (5, 8, 12, 18, 25, 30, 28, 32), Product C (2, 3, 5, 8, 12, 18, 25, 35). Label in millions."
**Expect:** Multi-line chart with legend, proper axis labels, all three series distinguishable.
**Tests:** Legend, line distinction (color/dash), axis formatting, data accuracy.

### T29: Geographic Data
**Prompt:** "Show our top 5 customer locations on a map: San Francisco (450 customers), New York (380), London (290), Tokyo (210), São Paulo (165)."
**Expect:** Leaflet map with markers, sized by customer count, labels.
**Tests:** Map rendering, marker sizing, popup labels, geographic accuracy.

### T30: Mixed Chart Dashboard
**Prompt:** "Create a financial overview: Revenue bar chart by month, expense pie chart by category (Engineering 40%, Marketing 25%, Sales 20%, Operations 15%), and a profit margin line chart trending upward from 12% to 23%."
**Expect:** Multiple chart types in dashboard layout, coherent color scheme.
**Tests:** Chart variety, color consistency, layout harmony.

---

## Category 7: Edge Cases & Stress Tests (10 tests)

### T31: Minimal Input
**Prompt:** "Visualize: AI is the future"
**Expect:** Should still produce something visually compelling from minimal input. Creative interpretation.
**Tests:** How well it handles vague/minimal prompts. Should NOT produce an empty-looking page.

### T32: Massive Data
**Prompt:** "Create a bar chart with 50 data points: [provide 50 month-value pairs]"
**Expect:** Handles dense data gracefully — maybe grouped, scrollable, or summarized.
**Tests:** Layout under data density, label handling, scroll/zoom if needed.

### T33: Special Characters & Unicode
**Prompt:** "Create an infographic with these stats: Revenue: ¥1.2億, Growth: ±15%, Temperature: 72°F → 85°F, Rating: ★★★★☆, Formula: E=mc²"
**Expect:** All special characters render correctly.
**Tests:** Unicode rendering, font support, layout integrity.

### T34: Dark Theme Only
**Prompt:** "Create a cyberpunk-themed dashboard. Dark mode only, neon accents."
**Expect:** Respects the specific theme request, no light mode needed.
**Tests:** Whether skill adapts to specific design requests vs forcing defaults.

### T35: Mobile-First Request
**Prompt:** "Create an infographic optimized for viewing on a phone"
**Expect:** Narrow layout, large touch targets, vertical scroll, no horizontal overflow.
**Tests:** Mobile layout quality, touch target sizes, viewport handling.

### T36: Print-First Request
**Prompt:** "Create a one-page report I can print and hand out at a meeting. Topic: Q4 sales results."
**Expect:** Designed for print — good @media print, fits A4/Letter, no interactive elements needed.
**Tests:** Print preview quality, page breaks, color accuracy in print.

### T37: Animation-Heavy
**Prompt:** "Create an animated infographic about the water cycle with animated arrows showing flow between evaporation, condensation, precipitation, and collection."
**Expect:** CSS animations for flow arrows, smooth cycling animations.
**Tests:** Animation performance, visual clarity while animated, reduced-motion fallback.

### T38: Existing Data Integration
**Prompt:** "Here's our JSON data, create a dashboard: {\"users\":{\"total\":15420,\"active\":8930,\"new_today\":147},\"revenue\":{\"mtd\":89400,\"target\":120000,\"growth\":0.12},\"tickets\":{\"open\":23,\"resolved_today\":45,\"avg_resolution_hrs\":4.2}}"
**Expect:** Parses JSON, renders appropriate visualizations for each metric type.
**Tests:** JSON parsing, metric type detection, appropriate chart selection.

### T39: Rapid Iteration
**Prompt:** "Create a simple bar chart. Then I'll ask you to change it 5 times."
**Follow-ups:** "Make it horizontal" → "Add a trend line" → "Change to dark theme" → "Add animation" → "Make it a dashboard with this chart plus 3 KPI cards"
**Expect:** Each iteration builds on the previous without breaking.
**Tests:** Incremental modification quality, state preservation.

### T40: The "Wow" Test
**Prompt:** "Create the most visually impressive single-page visualization you can about the scale of the universe — from quarks to the observable universe. Make it something people would share on social media."
**Expect:** Creative, surprising, visually stunning. This is the viral test.
**Tests:** Pure wow factor. Would YOU share this? Would it get likes on Twitter?

---

## Scoring Template

```markdown
## Eval Results: [Date]

| Test | Type | Visual | Content | Technical | UX | Wow | Overall | Gate |
|------|------|--------|---------|-----------|-----|-----|---------|------|
| T01  | Deck | /10    | /10     | /10       | /10 | /10 | /10     | ?    |
| ...  |      |        |         |           |     |     |         |      |

### Systemic Issues Found
- Issue 1 → Fix in SKILL.md
- Issue 2 → Fix in references/

### Improvements Made
- Change 1
- Change 2

### Re-eval After Fixes
| Test | Before | After | Delta |
|------|--------|-------|-------|
| T01  | 7.2    | 8.6   | +1.4  |
```
