---
name: Refined Archival
colors:
  surface: '#F9F8F6'
  surface-dim: '#F0EFE9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#43474d'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#496080'
  primary: '#132c4a'
  on-primary: '#ffffff'
  primary-container: '#2b4261'
  on-primary-container: '#98afd3'
  inverse-primary: '#b1c8ed'
  secondary: '#20695a'
  on-secondary: '#ffffff'
  secondary-container: '#a7eeda'
  on-secondary-container: '#266e5e'
  tertiary: '#422400'
  on-tertiary: '#ffffff'
  tertiary-container: '#5c3912'
  on-tertiary-container: '#d5a373'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#b1c8ed'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#314867'
  secondary-fixed: '#aaf0dc'
  secondary-fixed-dim: '#8ed4c1'
  on-secondary-fixed: '#00201a'
  on-secondary-fixed-variant: '#005143'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#f0bd8b'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#623f18'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
  ink: '#1C1D1F'
  ink-muted: '#525457'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1200px
---

## Brand & Style

This design system evolves the "Archival Blueprint" into a contemporary, high-end editorial experience. It transitions from a rigid, technical ledger to a sophisticated digital journal that balances academic rigor with modern luxury. The aesthetic is **Corporate / Modern** with a strong **Minimalist** influence, emphasizing clarity, intellectual authority, and tactile premium quality. 

The target audience consists of researchers, curators, and professionals who value precision but expect the fluidity of modern interface standards. The emotional response is one of calm focus, reliability, and "quiet luxury." By softening the geometry and introducing subtle depth, the UI feels less like a static document and more like a responsive, living archive.

## Colors

The palette is a modernized "Paper & Ink" scheme. The stark blacks and whites are replaced with nuanced off-whites and charcoal tones to reduce eye strain and increase perceived value.

- **Primary (Deep Slate Blue):** Used for primary actions, navigation states, and key interactive elements. It provides a dignified, trustworthy anchor.
- **Secondary (Refined Emerald):** Used for success states, secondary highlights, or specific specialized action categories.
- **Surface & Neutrals:** The base surface uses a sophisticated warm off-white (`#F9F8F6`). Neutrals are desaturated grays with a slight warm bias to maintain the paper-like quality.
- **Ink:** Content is set in a deep charcoal (`#1C1D1F`) rather than pure black to soften the contrast while maintaining accessibility.

## Typography

This system uses a traditional-meets-modern pairing. **Source Serif 4** provides the scholarly "printed" authority for headlines and display text, while **Inter** ensures maximum legibility for functional body copy. **Hanken Grotesk** is used for UI labels and metadata to provide a clean, contemporary edge to functional elements.

Scale transitions should be smooth. Large display headings should utilize the high-contrast features of the serif, while labels remain tight and all-caps or medium-weight for clear identification of data fields.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop, creating a focused, "manuscript" feel.

- **Grid:** 12-column grid with a 24px gutter.
- **Rhythm:** An 8px base unit (derived from 2x 4px units) governs all vertical spacing and component heights.
- **Adaptivity:** Desktop layouts prioritize generous white space and wide margins (48px+) to frame content. Mobile layouts shift to a 4-column grid with 16px margins, prioritizing vertical stack order and density over horizontal expansion.

## Elevation & Depth

Moving away from flat "ledger" lines, this system uses **Ambient Shadows** and **Tonal Layers** to signify hierarchy.

- **Surface Levels:** The primary background is the off-white paper. Surfaces that need to stand out (cards, modals) are set on the brightest white substrate.
- **Shadows:** Use extremely soft, diffused shadows with a slight blue-gray tint (e.g., `rgba(43, 66, 97, 0.08)`).
- **Z-Axis:** 
    - **Level 1 (Cards):** Low-offset shadow (4px Y-axis, 12px blur).
    - **Level 2 (Popovers/Dropdowns):** Medium-offset (8px Y-axis, 20px blur).
    - **Level 3 (Modals):** High-offset (16px Y-axis, 32px blur) with a subtle backdrop blur.

## Shapes

The design system adopts a **Rounded (2)** shape language, utilizing a 12px (0.75rem) base radius for primary containers. This change humanizes the "Archival" look, making it feel more like a modern software tool rather than a vintage document.

- **Standard (Base):** 8px for buttons and input fields.
- **Large (Containers):** 12px for cards and large sections.
- **Extra Large:** 24px for top-level modal containers.
- **Pill:** Reserved for status chips and tags.

## Components

- **Buttons:** Primary buttons feature a solid Deep Slate Blue fill with white Hanken Grotesk text and 8px corners. Secondary buttons use an outline of the primary color or a light gray ghost style.
- **Cards:** White backgrounds with 12px rounding and a subtle ambient shadow. Use a very light border (`#E9E8E7`) for additional definition on light backgrounds.
- **Input Fields:** Fully enclosed 8px rounded boxes. The background should be a step darker than the card surface (`#F0EFE9`). On focus, use a 2px Deep Slate Blue border.
- **Chips:** Pill-shaped with a light tint of the primary or secondary color. Text should be uppercase Hanken Grotesk.
- **Lists:** Rows are separated by soft, low-contrast horizontal lines (`#E9E8E7`). Active or selected items use a subtle side-accent of the primary color.
- **Checkboxes & Radios:** 4px rounded corners for checkboxes (not sharp) and standard circles for radios. Both use the Deep Slate Blue for the active state.
- **Data Tables:** Use Inter for numerical data for clarity. Headers should use Hanken Grotesk in a bold weight to differentiate from the data.