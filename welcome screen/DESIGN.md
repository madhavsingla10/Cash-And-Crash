---
name: Cyber-Velocity
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#ffb3b2'
  on-secondary: '#680012'
  secondary-container: '#ff525c'
  on-secondary-container: '#5b000f'
  tertiary: '#fffa9e'
  on-tertiary: '#343200'
  tertiary-container: '#e6df00'
  on-tertiary-container: '#656100'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b2'
  on-secondary-fixed: '#410008'
  on-secondary-fixed-variant: '#92001e'
  tertiary-fixed: '#f0e800'
  tertiary-fixed-dim: '#d2cc00'
  on-tertiary-fixed: '#1e1c00'
  on-tertiary-fixed-variant: '#4b4900'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  stats-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.15em
spacing:
  unit: 4px
  gutter: 16px
  margin-screen: 32px
  safe-area-car: 120px
---

## Brand & Style
The design system embodies a high-stakes, high-energy racing environment where digital precision meets industrial grit. The aesthetic is a hybrid of **Cyberpunk** and **Industrial Futurism**, characterized by deep shadows, luminous neon interfaces, and tactical overlays.

The UI should feel like a Heads-Up Display (HUD) integrated into a high-performance racing machine. It prioritizes immediate readability of critical data (speed, currency, damage) through high-contrast accents and glowing elements. Surfaces utilize **Glassmorphism** to maintain a sense of depth and layered complexity, suggesting a sophisticated OS running beneath a rugged exterior.

## Colors
This design system utilizes a high-contrast, dark-mode-only palette to simulate a low-light racing cockpit.

*   **Primary (Electric Cyan):** Used for interactive elements, primary navigation, and "safe" status indicators.
*   **Secondary (Cyber Red):** Reserved for high-alert notifications, "Crash" events, and destructive actions.
*   **Accent (Hazard Yellow):** Used for tactical warnings, currency (CASH) displays, and technical highlights.
*   **Background & Surface:** The core background is a void black. Surfaces use a semi-transparent dark tint with a heavy backdrop blur to create a glass-like layering effect that lets the 3D car environment bleed through subtly.

## Typography
The typography system uses a mix of aggressive geometric sans-serifs for branding and monospaced technical fonts for data.

*   **Headlines:** Utilize **Space Grotesk**. Its geometric cuts feel mechanical and futuristic. For primary headings, use a slight italic skew to imply forward motion and speed.
*   **Data & Labels:** Utilize **JetBrains Mono**. This font provides an industrial, developer-centric feel that is essential for race stats, coordinates, and system logs.
*   **Hierarchical Rule:** Large-scale stats (like current speed or total cash) should always be rendered in high-weight Space Grotesk, while metadata (lap times, engine temperature) should be JetBrains Mono.

## Layout & Spacing
The layout follows a **Tactical HUD** model. Instead of a standard flow, elements are pinned to the edges and corners of the screen to maximize the visibility of the central 3D racing environment.

*   **Grid:** A tight 4px baseline grid ensures technical alignment.
*   **Margins:** A generous 32px safety margin from the screen edge prevents UI elements from feeling cramped.
*   **Central Focal Point:** The "Safe Area" in the center is strictly reserved for the 3D car model and track, with no persistent UI blocking the middle third of the screen.
*   **Responsive Reflow:** On mobile, the corner modules (top-left, bottom-right) stack into two primary vertical bars on the edges of the screen to accommodate thumb-based controls.

## Elevation & Depth
Depth is achieved through transparency and light emission rather than traditional shadows.

*   **Tonal Layers:** UI panels use `surface_glass_rgba` with a `20px` backdrop blur. This creates a frosted tech look that separates the UI from the fast-moving background.
*   **Neon Outlines:** Elevation level is indicated by border intensity. A top-level modal has a `1px` solid Primary Cyan border with a `4px` outer glow (box-shadow).
*   **Z-Index Hierarchy:** 
    1.  3D Car/World (Base)
    2.  Passive HUD overlays (Flat, no border)
    3.  Active Control Panels (Glassmorphism + Neon border)
    4.  Alerts/Modals (Glassmorphism + Pulsing Secondary Red border)

## Shapes
The shape language is strictly **Brutalist and Industrial**. 

*   **Corner Treatment:** All main containers and buttons use sharp 0px corners. 
*   **Beveled Accents:** To enhance the "tech" feel, use 45-degree clipped corners (dog-ears) on primary panels and buttons to mimic military hardware design.
*   **Dividers:** Use dashed lines or "scanning" progress bars rather than solid lines to maintain the digital interface aesthetic.

## Components
Consistent application of the industrial-cyber aesthetic across all elements:

*   **Industrial Buttons:** Large, rectangular blocks. Default state has a subtle Primary Cyan border. Hover state triggers a full Cyan fill with black text and a strong neon glow effect. 
*   **Tactical Chips:** Small labels for "Active Perks" or "Car Specs." These should feature a small icon on the left and be encased in a semi-transparent gray box with a hazard-yellow accent line on the left edge.
*   **HUD Input Fields:** Monospaced text entry with a "blinking underscore" cursor. The border is only on the bottom, glowing when focused.
*   **Glass Panels:** Used for "Garage" and "Settings" menus. These are large-scale containers with a 1px Primary Cyan border and a 60% opacity background.
*   **Progress Bars:** Segmented bars (reminiscent of battery levels) rather than smooth fills. When "Cashing Out," the bar should pulse in Hazard Yellow.
*   **Icons:** Thin-stroke, geometric icons. Avoid rounded ends; use square terminals for all icon lines to match the sharp shape language.