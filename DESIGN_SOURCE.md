---
name: Neo-Admin E-Commerce
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434656'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004dea'
  primary: '#0041c8'
  on-primary: '#ffffff'
  primary-container: '#0055ff'
  on-primary-container: '#e3e6ff'
  inverse-primary: '#b6c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#415166'
  on-tertiary: '#ffffff'
  tertiary-container: '#596980'
  on-tertiary-container: '#dbe9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b3'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
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
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is built on a "Neo-Corporate" aesthetic: a synthesis of high-end enterprise reliability and cutting-edge developer tool precision. It targets a dual audience of high-volume consumers and professional administrators who require clarity and speed.

The visual language is characterized by:
- **Minimalist Technicality:** High information density without clutter, utilizing subtle grid lines and monospaced accents to evoke a "headless" and "API-first" feel.
- **Precision Professionalism:** A focus on alignment, consistent visual weight, and a lack of decorative flourish.
- **Action-Oriented:** Utilizing high-contrast focal points (Action Blue) to drive conversion in the storefront and efficiency in the dashboard.
- **Architectural Depth:** Using structural borders and tonal shifts rather than heavy shadows to define interface layers.

## Colors
This design system utilizes a structured, high-contrast palette to distinguish between interactive elements and organizational containers.

- **Action Blue (Primary):** A vibrant, high-saturation blue used exclusively for primary actions, progress indicators, and active states.
- **Deep Slate (Secondary/Neutral-Dark):** Used for primary text and sidebars to provide a grounded, professional foundation.
- **Surface Scale:** A range of cool-toned grays (Slates) from `#F8FAFC` to `#E2E8F0` defines the workspace.
- **Functional Accents:** Success and Error colors are used sparingly for status indicators within data tables and checkout flows.

## Typography
The typography system prioritizes legibility and hierarchy across dense data environments.

- **Headlines (Geist):** Used for page titles and section headers. The geometric construction provides a modern, engineered feel.
- **Body (Inter):** The workhorse for product descriptions, table data, and UI labels. High x-height ensures readability at small sizes.
- **Data/Labels (JetBrains Mono):** Used for SKU numbers, status tags, API keys, and table headers. This reinforces the "headless/technical" narrative.

## Layout & Spacing
The design system employs a **12-column fluid grid** for the storefront and a **fixed-sidebar / fluid-content** model for the administrative dashboard.

- **Rhythm:** An 8px linear scale is used for general layout, with a 4px "half-step" reserved for dense data components (tables, property lists).
- **Dashboard Layout:** Admin views utilize a 280px fixed sidebar. Content is grouped in logical modules with `24px` gaps.
- **Product Grids:** Storefront displays use a responsive grid that shifts from 1 column (mobile) to 4 columns (desktop) with a `20px` gutter to maximize product density.

## Elevation & Depth
Depth is communicated through **structural layering** rather than traditional shadows.

- **The Layering Model:**
  - **Level 0 (Background):** Neutral-50 (#F8FAFC) for the main canvas.
  - **Level 1 (Card/Surface):** Pure White (#FFFFFF) with a 1px Slate-200 border. This is the primary container for products and table rows.
  - **Level 2 (Popovers/Modals):** Pure White with a very soft, high-diffusion shadow (0px 10px 30px rgba(0,0,0,0.05)) and a 1px border.
- **Interactions:** Hover states on interactive cards or table rows do not lift; instead, they change the border color to Action Blue or shift the background to a subtle Slate-100.

## Shapes
In line with the "Neo-Corporate" style, shapes are disciplined and precise.
- **Standard Radius:** 4px (Soft) is applied to buttons, inputs, and cards to maintain a professional edge while avoiding the severity of 0px corners.
- **Inner Radius:** When nesting elements (e.g., a status badge inside a card), the inner radius should be 2px to maintain visual harmony.
- **Icons:** Use 20px or 24px bounding boxes with a 1.5px or 2px stroke weight to match the weight of the Geist typeface.

## Components
Consistent implementation of these core components ensures the system remains scalable.

- **Buttons:** 
  - *Primary:* Action Blue background, White text, no shadow. 
  - *Secondary:* White background, Slate-200 border, Deep Slate text.
- **Data Tables:** 
  - Headers use `label-sm` (JetBrains Mono) in uppercase with a subtle Slate-100 background. 
  - Rows are 48px height with a 1px bottom border. 
  - High-density toggle: Provide a "Compact" mode that reduces row height to 36px.
- **Input Fields:** 
  - 1px Slate-200 border that transitions to a 2px Action Blue border on focus. 
  - Use `body-sm` for input text and `label-sm` for field labels.
- **Status Badges:** 
  - Pill-shaped with a light background tint of the status color and a dark foreground text of the same hue (e.g., Light Green bg / Dark Green text).
- **Product Cards:** 
  - Minimalist; images are contained in a Slate-50 aspect-ratio box. Typography is left-aligned with the price highlighted in Geist Semibold.
- **Cart & Drawer:** 
  - Slides from the right. Uses a "Sticky Footer" for the total and checkout CTA to ensure the primary action is always visible.