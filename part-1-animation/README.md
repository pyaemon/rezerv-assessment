# Part 1 — UI Animation Challenge

A single scroll-driven landing page for a fictional fitness-nutrition brand,
built to exercise load, scroll, hover and resize animation.

**Live demo:** _add your deployed URL here_

The reference site was used for the *feel* of the motion, not its content. All
assets here are original: every fruit is drawn in CSS — gradients,
`border-radius` and pseudo-elements — so the page ships **no images at all**.

---

## Setup

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

Node 20+. No environment variables, no backend.

---

## The three sections

The brief asks for any 3 of roughly 7. I built the recommended set, because it
is the only trio that exercises all four required animation moments:

| # | Section | Covers |
| --- | --- | --- |
| 1 | **Loading screen** — activity ring + percentage counter | on load |
| 2 | **Hero** — masked headline reveal, floating fruit | on load, scroll, hover, resize |
| 3 | **Collection** — six meal/drink cards | on scroll, hover, resize |

---

## Libraries, and why

| Library | Why |
| --- | --- |
| **GSAP + ScrollTrigger** | Timelines with relative positioning, and `matchMedia`, which builds a separate set of animations per breakpoint and reverts the previous set automatically. That auto-revert is what makes resizing behave. |
| **Lenis** | Smooth scrolling. Small, and documented to integrate with ScrollTrigger — which matters more than the smoothing itself (see below). |
| **SCSS Modules** | Locally scoped class names with real nesting, plus `@use`/functions for the breakpoint mixins and the generated seed rings. |
| **Next.js + TypeScript** | Familiar tooling; the page is statically exported, so the framework mostly stays out of the way. |

**Deliberately not used: three.js or any WebGL.** The reference achieves its
depth with a full 3D scene. I reproduced the same *vocabulary* — parallax
layers, drifting objects, pointer-reactive motion — with DOM elements and GPU
transforms instead. That keeps the JS payload small and made the 60fps target
comfortably reachable rather than something to fight for.

---

## Approach

### Animation

Motion is split by cost, not by habit:

- **GSAP** for anything sequenced, scroll-linked, or pointer-driven
- **Plain CSS transitions** for hover states and the scroll cue

Hover doesn't need a JS animation library. Keeping it in CSS means those
interactions cost nothing at runtime and still work if GSAP never loads.

**The hero uses three nested DOM layers per fruit**, which is the one piece of
structure worth explaining:

```
.floater   entrance + scroll parallax
  .bob     idle drift (looping)
    fruit  pointer follow
```

Three animations all want the `transform` property. On a single element each
would overwrite the others, so each gets its own layer.

The same reasoning drove a subtler decision: **`transform` has exactly one
owner per element.** When GSAP animates an element it absorbs any CSS
`translate`/`scale` into its own matrix, after which a media query can no
longer change them. So responsive fruit sizing is a custom property
(`--fruit-scale`) rather than a `scale` transform, and the centring is GSAP's
`xPercent/yPercent` rather than CSS `translate`. Custom properties are
invisible to GSAP, so the breakpoints keep working.

**Reveals are not scrubbed.** Scrub ties an animation's playhead to scroll
position — right for parallax, wrong for a reveal, because stopping mid-scroll
leaves cards frozen half-faded. Reveals play once at their own pace and reverse
on the way back up.

### Smooth scroll

Lenis animates the scroll position itself, so two things have to be true or
scroll-linked animation visibly trails the content it's attached to:

```ts
lenis.on('scroll', ScrollTrigger.update);        // 1
gsap.ticker.add((time) => lenis.raf(time * 1000)); // 2
gsap.ticker.lagSmoothing(0);                       // 3
```

1. ScrollTrigger otherwise works off native scroll events, which arrive on a
   different cadence than Lenis's animation.
2. One rAF loop, not two — two can run in either order, so ScrollTrigger might
   read a position Lenis hasn't updated yet. (GSAP's ticker reports seconds;
   Lenis expects milliseconds.)
3. GSAP normally adjusts its clock after a long frame. Here that clock drives
   Lenis while ScrollTrigger reads the real scroll position, so an adjustment
   would desync them.

Lenis is **skipped entirely** under `prefers-reduced-motion` — hijacked
scrolling is the opposite of what that setting asks for, and native scrolling
is the accessible fallback.

### Responsiveness

Breakpoints are `tablet: 768px`, `desktop: 1024px`, used mobile-first.

Responsive here meant changing the **composition**, not just the scale:

- **Hero fruit** carries two sets of coordinates. On desktop it sits either
  side of the copy; below that the copy column is nearly full-bleed, so there
  is no room beside it and the fruit moves into the bands above and below.
- **Collection** is a three-column grid on desktop and a natively swipeable,
  scroll-snapping strip below it, so touch scrolling is never intercepted.
- **Pointer-driven effects** (hero mouse-follow, card 3D tilt) are built only
  at desktop widths. There is no cursor to follow on a touch device; those
  sizes get a CSS `:hover` lift instead.

`gsap.matchMedia` holds all of this. Each query owns its animations, and GSAP
reverts them — tweens killed, inline styles removed — when the query stops
matching.

---

## Performance notes

Measured in Chrome on an M-series Mac, scrolling the full page:

| | |
| --- | --- |
| Median frame time | **16.6 ms** (≈60fps) |
| 95th percentile | 17.6 ms |
| Worst frame | 18.7 ms |
| Dropped frames (>33 ms) | **0** |
| CLS | 0.00 |

What gets it there:

- **Only `transform` and `opacity` are animated.** Both are composited;
  neither triggers layout.
- **No layout reads in event handlers.** The hero and each card measure their
  bounds on `pointerenter` (and on resize / `ScrollTrigger.refresh`), never
  inside `pointermove` — calling `getBoundingClientRect` per move forces a
  reflow every frame.
- **`gsap.quickTo` for pointer-driven motion**, which reuses one tween per
  property instead of allocating a new one on every mousemove.
- **Function-based ScrollTrigger values** with `invalidateOnRefresh`, so
  distances are recomputed on resize rather than going stale.
- **No images.** Nothing to download, decode, or lazy-load; the entire visual
  is CSS, which also means no layout shift as assets arrive.

`prefers-reduced-motion` is honoured throughout: Lenis is skipped, the
preloader hands straight over, and every `matchMedia` block has a `reduce`
branch that sets the finished state without animating.

---

## Accessibility

- Decorative fruit is `aria-hidden`; the loader exposes its percentage through
  a `role="status"` region and unmounts completely when finished.
- Card tones are the **lightest** values that still clear WCAG AA (4.5:1)
  against white text. The more saturated versions looked better in isolation
  but put the 13–14px card text at roughly 3:1.
- Buttons are real `<button>` elements with visible focus states.

---

## Assumptions

- **"Clone the reference" means match the feel, not the pixels.** The brief
  says branding and artwork can be swapped, so I kept the motion vocabulary and
  built an original nutrition-themed page around it — which also lets the two
  assessment parts share one product world.
- **Content is illustrative.** No CTA navigates anywhere, per the brief.
- **The loader's progress is real but modest.** With no images, there is no
  byte-weight to measure, so progress tracks the two signals that genuinely
  affect first paint — webfont readiness and the window `load` event — eased
  toward 90% while they resolve. A minimum on-screen time stops it flashing on
  a warm cache. It is not dressed up as asset loading it isn't.

## Tradeoffs

- **No pinned horizontal scroll in the collection.** It was the most eye-
  catching option, but pinning fights native touch scrolling and interacts
  awkwardly with Lenis. The hero parallax already satisfies the scroll-driven
  requirement, so the complexity wasn't worth the risk. A grid on desktop and a
  swipe rail on mobile is simpler and behaves better on touch.
- **Fruit is CSS rather than illustration.** It caps how detailed the artwork
  can be, but buys zero network cost, no licensing questions, and shapes that
  scale to any size without assets.
- **No tests.** Within the time budget the effort went into the motion and its
  behaviour across breakpoints. Everything was verified manually in Chrome at
  390 / 834 / 1440px, including frame timings and reduced-motion.
