# Snoonu B2B Branding Guidelines

## 1. Color Palette
- **Primary Colors**:
  - Main Brand Red: `#D90217` (Pantone 2035C)
  - White: `#FFFFFF` (Pantone White)
  - Black: `#000000` (Pantone Black 6C)
- **Additional Colors**:
  - Green: `#00B43C` (Pantone 2271C)
  - Yellow: `#FFD700` (Pantone Medium Yellow C)
  - Royal Blue: `#006EFF` (Pantone 285 C)
  - Orange: `#FF4600` (Pantone 172C)
  - Dark Red: `#640D37` (Pantone 222C)
  - Gold: `#BEA037` (Pantone 1245 C)
  - Electric Blue: `#00DFFF` (Pantone 286 C)

## 2. Typography
- **Primary Font for LatiN Text**: Altform
  - Weights: Regular, Bold, Black, Black Italic
  - Usage: All English text, headlines, body copy
- **Primary Font for Arabic Text**: Estedad
  - Weights: Regular, Medium, Semi Bold, Bold, Black, Extra Bold
  - Usage: All Arabic text, headlines, body copy
- **Alternative Fonts**:
  - Latin: Inter (for interfaces and web communications)
  - Arabic: Alexandria (where Estedad is not available)
  - System: Arial (when custom fonts cannot be loaded)
- **Font SizeS**:
  - H1: `2.5rem` (40px)
  - H2: `2rem` (32px)
  - H3: `1.5rem` (24px)
  - Body: `1rem` (16px)
  - Small: `0.875rem` (14px)
- **Line Heights**:
  - Headings: 1.2
  - Body: 1.5
- **Implementation**: Use Next.js font optimization with preloading

## 3. Logo Usage
- **Primary Logo**: Standard Snoonu logo on red background
- **Logo Variants**:
  - Standard logo (for most communications)
  - Logo in container (for contrast issues)
  - Arabic logo (for Arabic communications)
  - S icon (for limited space applications)
- **Co-branding**: Follow guidelines for logo placement with partner logos
  - Use proper spacing between logos
  - Maintain visual hierarchy
  - Use recommended dividers (line or "x" symbol) between logos
- **Safe Space**: Maintain minimum clear space around logo (½ height of the S mark)
- **Minimum Size**: 
  - Web/App: 100px width (20px height)
  - Print: 25mm width (5mm height)

## 4. UI Components
- **Button Styles**:
  - Primary: Red background (#D90217) with white text
  - Secondary: White background with red text
  - Tertiary: Black background with white text
- **Input Fields**:
  - Default: Light grey border, dark text
  - Focus: Red border
  - Error: Red border with error message
  - Disabled: Light grey background, grey text
- **Card Design**: White background with subtle shadow
- **Shadows & Elevation**: Subtle shadows for interactive elements
- **Spacing System**: Based on 4px grid (0.25rem increments)

## 5. Iconography & Illustrations
- **Icon Style**: Simple, bold icons with clean lines
- **Illustration Types**:
  - Pictogram-based abstract illustrations for backgrounds
  - Simple product/service illustrations
  - Character illustrations for user-focused content
- **Colors**: Use brand colors for illustrations, with red as dominant color
- **Usage**: Follow guidelines for proper placement and context

## 6. Responsive Design Guidelines
- **Breakpoints**:
  - Mobile: 320px - 767px
  - Tablet: 768px - 1023px
  - Desktop: 1024px - 1439px
  - Large Desktop: 1440px+
- **Adaptation Strategy**:
  - Mobile-First Approach: Design for mobile and scale up
  - Layout Changes:
    - Single column layout on mobile
    - Two columns on tablet
    - Three or more columns on desktop
  - Navigation: Hamburger menu on mobile, horizontal nav on larger screens
  - Images: Different crops/sizes based on viewport
  - Typography: Fluid typography system (smaller on mobile, larger on desktop)
- **Touch Targets**:
  - Minimum Size: 44px × 44px for all interactive elements on mobile
  - Spacing: Minimum 8px between touch targets 