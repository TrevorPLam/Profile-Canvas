/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#3B2A1E',
    tint: '#D9603B',

    // Core surfaces — warm cork/paper board
    background: '#F7EFDF',
    foreground: '#3B2A1E',

    // Cards / elevated surfaces — index-card paper
    card: '#FFFCF5',
    cardForeground: '#3B2A1E',

    // Primary action color (buttons, links, active states) — pushpin coral
    primary: '#D9603B',
    primaryForeground: '#FFFCF5',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#EADCC0',
    secondaryForeground: '#3B2A1E',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EDE2CB',
    mutedForeground: '#8C7A5E',

    // Accent highlights (badges, selected items, focus rings) — sticky-note teal
    accent: '#4C7A6B',
    accentForeground: '#FFFCF5',

    // Destructive actions (delete, error states)
    destructive: '#C1443C',
    destructiveForeground: '#FFFCF5',

    // Borders and input outlines
    border: '#DFCEA6',
    input: '#DFCEA6',
  },

  // Border radius (in px) — cozy sticky-note rounding, not fully rounded.
  radius: 14,
};

export default colors;
