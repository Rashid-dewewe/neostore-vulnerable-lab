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

---

## Color System

This design system utilizes a structured, high-contrast palette to distinguish between interactive elements and organizational containers.

### Primary Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#0041c8` | Primary actions, buttons, active states |
| `--color-primary-container` | `#0055ff` | Hover states, primary containers |
| `--color-on-primary` | `#ffffff` | Text on primary backgrounds |

### Surface Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface` | `#f7f9fb` | Main background |
| `--color-surface-container-lowest` | `#ffffff` | Cards, elevated surfaces |
| `--color-surface-container-low` | `#f2f4f6` | Subtle backgrounds |
| `--color-surface-container` | `#eceef0` | Section backgrounds |

### Text Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-on-surface` | `#191c1e` | Primary text |
| `--color-on-surface-variant` | `#434656` | Secondary text, labels |
| `--color-on-primary` | `#ffffff` | Text on primary backgrounds |

### Status Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#1a7f37` | Success states, delivered badges |
| `--color-warning` | `#f39c12` | Warning states, pending badges |
| `--color-error` | `#ba1a1a` | Error states, cancelled badges |

---

## Typography

The typography system prioritizes legibility and hierarchy across dense data environments.

### Font Families
| Font | Usage |
|------|-------|
| **Geist** | Headlines, display text, navigation |
| **Inter** | Body text, descriptions, UI labels |
| **JetBrains Mono** | SKU numbers, status tags, API keys, table headers |

### Type Scale
| Style | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| Display | Geist | 48px | 700 | 56px | Hero headlines |
| Headline LG | Geist | 32px | 600 | 40px | Page titles |
| Headline MD | Geist | 24px | 600 | 32px | Section headers |
| Body LG | Inter | 18px | 400 | 28px | Lead paragraphs |
| Body MD | Inter | 16px | 400 | 24px | General content |
| Body SM | Inter | 14px | 400 | 20px | Descriptions, labels |
| Label MD | JetBrains Mono | 14px | 500 | 20px | Table headers, SKUs |
| Label SM | JetBrains Mono | 12px | 500 | 16px | Badges, small labels |

---

## Layout & Spacing

The design system employs a **12-column fluid grid** for the storefront and a **fixed-sidebar / fluid-content** model for the administrative dashboard.

### Spacing Scale
| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 4px | Dense data components |
| `--spacing-sm` | 8px | Tight spacing, icons |
| `--spacing-md` | 16px | Standard spacing |
| `--spacing-lg` | 24px | Card padding, section spacing |
| `--spacing-xl` | 32px | Large spacing |
| `--spacing-2xl` | 48px | Section separation |

### Layout Models
- **Dashboard Layout:** 280px fixed sidebar + fluid content area
- **Storefront Layout:** 12-column fluid grid with 20px gutter
- **Product Grids:** Responsive grid (1→2→4 columns)

---

## Components

### Navigation
The unified navigation system (`renderNav()` in `api.js`) provides consistent navigation across all pages.

#### Desktop Navigation
- Fixed header at top (64px height)
- Left: Logo + navigation links (Shop, Categories, Deals, Support)
- Right: Search bar + cart + auth buttons
- Active states: Blue underline for current page

#### Mobile Navigation (NEW)
- Responsive hamburger menu (hidden on desktop)
- Touch-friendly hit targets (min 44px)
- Slide-out drawer for navigation links

### Buttons
| Type | Background | Text | Border | Usage |
|------|------------|------|--------|-------|
| Primary | `#0041c8` | White | None | Primary actions |
| Secondary | Transparent | `#191c1e` | `#e0e3e5` | Secondary actions |
| Danger | `#ffdad6` | `#93000a` | None | Destructive actions |

**States:**
- Hover: Primary → `#0055ff`, Secondary → `#f2f4f6`
- Active: Scale down slightly
- Disabled: Opacity 0.5

### Cards
Standard cards with consistent styling across all pages:
- Background: White (`#ffffff`)
- Border: 1px solid `#e0e3e5`
- Border radius: 12px
- Hover: Border turns `#0041c8` with subtle shadow

#### Product Cards (Storefront)
- Hover: Elevate 4px with shadow
- Image container: Aspect ratio 1:1
- Price: Geist font, blue accent
- Add to cart button on hover

#### Admin Cards (Dashboard)
- Hover: Border color change only
- Stats display with labels
- Progress bars with fill animation

### Input Fields
| State | Border | Background | Shadow |
|-------|--------|------------|--------|
| Default | `#e0e3e5` | `#f2f4f6` | None |
| Focus | `#0041c8` | White | 0 0 0 3px rgba(0,65,200,0.1) |
| Disabled | `#e0e3e5` | `#e9ecef` | None |

### Badges
| Type | Background | Text Color |
|------|------------|------------|
| Success | `#d4edda` | `#155724` |
| Warning | `#fff3cd` | `#856404` |
| Danger | `#f8d7da` | `#721c24` |
| Info | `#d1ecf1` | `#0c5460` |
| Neutral | `#e9ecef` | `#495057` |

#### Status Badges (Order/Admin)
| Status | Background | Text Color |
|--------|------------|------------|
| Delivered | `#d4edda` | `#155724` |
| Paid | `#d1ecf1` | `#0c5460` |
| Processing | `#cce5ff` | `#004085` |
| Pending | `#fff3cd` | `#856404` |
| Shipped | `#d6d8db` | `#383d41` |
| Cancelled | `#f8d7da` | `#721c24` |

---

## Pages & Layouts (NEW)

### Customer-Facing Pages

#### Homepage (`index.html`)
- Hero section with gradient background
- Category grid (6 categories)
- Featured products grid (4 columns)
- Newsletter signup section

#### Product Detail (`product.html`)
- Image gallery (1:1 aspect ratio)
- Product info (name, description, price)
- Quantity selector + Add to cart button
- Stock status indicator

#### Cart (`cart.html`)
- Product list with images
- Quantity controls (+/- buttons)
- Remove item button
- Order summary sidebar
- Secure checkout badge

#### Checkout (`checkout.html`) - NEW Multi-Step Flow
- **Step 1: Shipping Information** - Address form
- **Step 2: Shipping Method** - Radio selection (Standard/Express/Overnight)
- **Step 3: Payment Method** - Credit card/PayPal with form
- **Step 4: Review & Place Order** - Order summary + place order button

#### Categories (`categories.html`) - NEW
- Grid of all categories with icons
- Click to filter products by category
- Hover animation: Scale + border color change

#### Deals (`deals.html`) - NEW
- Hero banner with call-to-action
- Product grid with discount badges
- Display sale prices + original prices

#### Support (`support.html`) - NEW
- Support options grid (FAQs, Live Chat, Email, Phone)
- Ticket submission form
- Responsive layout

#### Orders (`orders.html`)
- Order history list
- Status badges
- Order details view

#### Profile (`profile.html`)
- User avatar + name/email
- Role badge
- Metrics cards (Phone, Loyalty Points, Member Since, Status)

### Admin Dashboard (`admin/dashboard.html`)

#### Sidebar Navigation
- **Main:** Dashboard, Inventory, Orders, Customers, Analytics
- **System:** Settings, Log Out

#### Dashboard Tab
- KPI cards: Total Revenue, Active Orders, New Customers
- Recent Transaction Log table
- Inventory Distribution (progress bars)
- Low Stock Alert + Restock button
- Cloud Sync Status

#### Inventory Tab
- Stats: Total SKU, Low Stock Alerts, Inventory Value, Restock Pending
- Search by name/SKU
- Product table with stock indicators

#### Orders Tab
- Stats: Total Orders, Pending Fulfillment, Revenue This Month
- Search orders, customers, or items
- Orders table with status badges

#### Customers Tab
- Stats: Total Customers, Active This Month, New Signups, Average LTV
- Search by name/email/ID
- Customer table with role badges

#### Analytics Tab
- KPI cards: Revenue, Orders, Customers, Conversion Rate
- Top Products list
- Regional Sales placeholder

#### Settings Tab
- Personal Information form
- Security: Password change form

---

## Elevation & Depth

Depth is communicated through **structural layering** rather than traditional shadows.

### The Layering Model
| Level | Element | Style |
|-------|---------|-------|
| Level 0 | Background | `#f7f9fb` |
| Level 1 | Cards/Surfaces | White + 1px border |
| Level 2 | Popovers/Modals | White + soft shadow + border |

### Interaction States
- **Hover on Cards:** Border color changes to `#0041c8` (no lift)
- **Hover on Buttons:** Background darkens or changes color
- **Hover on Links:** Color changes to `#0041c8`
- **Hover on Table Rows:** Background changes to `#f2f4f6`

---

## Shapes & Radius

In line with the "Neo-Corporate" style, shapes are disciplined and precise.

| Element | Radius |
|---------|--------|
| Buttons, Inputs, Cards | 8px |
| Badges, Pills | 20px (full) |
| Product Images | 8px |
| Icons | 2px |
| Notifications | 8px |

---

## Icons & Imagery

### Material Symbols
- Primary icon set: `material-symbols-outlined`
- Consistent 24px size
- Uses font-variation-settings for weight/grade control
- Vertical alignment: `vertical-align: middle`

### Product Images
- Aspect ratio: 1:1 (square)
- Object-fit: cover
- Hover effect: Scale 1.05
- Placeholder: `#f2f4f6` background

### Avatars
- Circular (full radius)
- 40px default, 64px for profile
- Background: `#0041c8` or `#dae2fd`
- Initials for fallback

---

## Animations & Transitions

### Duration & Easing
- Transitions: 0.2s ease
- Hover animations: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- Toast notifications: slideUp 0.3s ease
- Float animation: 6s infinite (hero images)

### Key Animations
| Animation | Usage |
|-----------|-------|
| Float | Hero product images |
| Scale | Product card hover |
| Slide Up | Toast notifications |
| Border Color | Card hover states |

---

## Responsive Breakpoints

| Breakpoint | Min Width | Max Width | Changes |
|------------|-----------|-----------|---------|
| Mobile | - | 480px | Single column, smaller fonts, compact spacing |
| Tablet | 481px | 768px | 2-3 columns, medium spacing |
| Desktop | 769px | 1024px | Standard layout, 4 columns |
| Wide | 1025px+ | - | Full layout, max-width containers |

### Mobile Adjustments
- Navigation links collapse to hamburger menu
- Product grid: 1 column → 2 columns → 4 columns
- Admin sidebar: Collapsible/hidden
- Step circles: Smaller (32px)
- Typography: Reduced sizes

---

## Implementation Notes

### CSS Files
| File | Purpose |
|------|---------|
| `tokens.css` | Design tokens (colors, spacing, typography) |
| `main.css` | Unified component styles (no duplicates) |
| Tailwind CDN | Utility classes for rapid development |

### JavaScript
| File | Purpose |
|------|---------|
| `api.js` | API client, auth helpers, navigation renderer |
| `renderNav()` | Unified navigation system across all pages |
| `toast()` | Global notification system |

### HTML Structure
All pages follow this pattern:
```html
<!DOCTYPE html>
<html>
<head>
    <!-- Head includes: -->
    <!-- 1. Google Fonts -->
    <!-- 2. Tailwind CDN -->
    <!-- 3. tokens.css -->
    <!-- 4. main.css -->
</head>
<body>
    <nav id="site-nav"></nav>
    <main><!-- Page content --></main>
    <script src="/js/api.js"></script>
    <script>
        renderNav();
        // Page-specific JavaScript
    </script>
</body>
</html>
```

---

## Accessibility Considerations

- Semantic HTML (nav, main, header, footer, section)
- Proper heading hierarchy (h1-h4)
- Focus indicators on interactive elements
- Sufficient color contrast (WCAG AA)
- ARIA labels where needed
- Keyboard navigation support
- Touch-friendly hit targets (44px minimum)
- Screen reader support

---

## Future Enhancements (Design V2)

1. **Dark Mode** - Toggle between light/dark themes
2. **Advanced Search** - Faceted search with filters
3. **Wishlist** - Save favorite products
4. **Product Reviews** - User ratings and reviews
5. **Live Chat** - Real-time customer support
6. **Order Tracking** - Visual order progress
7. **Multi-language** - i18n support
8. **PWA** - Progressive Web App capabilities

---

## Design File Reference

- Original design source: `DESIGN_SOURCE.md` (this file)
- Color tokens: `frontend/css/tokens.css`
- Component styles: `frontend/css/main.css`
- UI mockups: `frontend/design/*.png` (if available)

---

*Last updated: June 2026*
