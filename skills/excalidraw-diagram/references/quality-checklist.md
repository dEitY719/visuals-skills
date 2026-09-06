# Quality Checklist — verify before delivering a diagram

## Depth & Evidence (Check First for Technical Diagrams)

1. **Research done**: Did you look up actual specs, formats, event names?
2. **Evidence artifacts**: Are there code snippets, JSON examples, or real data?
3. **Multi-zoom**: Does it have summary flow + section boundaries + detail?
4. **Concrete over abstract**: Real content shown, not just labeled boxes?
5. **Educational value**: Could someone learn something concrete from this?

## Conceptual

6. **Isomorphism**: Does each visual structure mirror its concept's behavior?
7. **Argument**: Does the diagram SHOW something text alone couldn't?
8. **Variety**: Does each major concept use a different visual pattern?
9. **No uniform containers**: Avoided card grids and equal boxes?

## Container Discipline

10. **Minimal containers**: Could any boxed element work as free-floating text instead?
11. **Lines as structure**: Are tree/timeline patterns using lines + text rather than boxes?
12. **Typography hierarchy**: Are font size and color creating visual hierarchy (reducing need for boxes)?

## Structural

13. **Connections**: Every relationship has an arrow or line
14. **Flow**: Clear visual path for the eye to follow
15. **Hierarchy**: Important elements are larger/more isolated

## Technical

16. **Automated JSON checks**: run `render_excalidraw.py <file.excalidraw>` — it
    prints `[OK] quality N/N` (stdout, exit 0) or `[FAIL] quality M/N: <reason>`
    (stderr, exit 2) for text cleanliness, `fontFamily: 3`, `roughness: 0`
    (skipped with `--hand-drawn`, N drops to 4), `opacity: 100`, and <30%
    container ratio. Fix whatever it reports; do not eyeball these by hand.

## Visual Validation (Render Required)

17. **Rendered to PNG**: Diagram has been rendered and visually inspected
18. **No text overflow**: All text fits within its container
19. **No overlapping elements**: Shapes and text don't overlap unintentionally
20. **Even spacing**: Similar elements have consistent spacing
21. **Arrows land correctly**: Arrows connect to intended elements without crossing others
22. **Readable at export size**: Text is legible in the rendered PNG
23. **Balanced composition**: No large empty voids or overcrowded regions
