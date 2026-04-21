import { createTheme, rem } from "@mantine/core";

export const theme = createTheme({
  // ── Accent ─────────────────────────────────────────────────────────────────
  primaryColor: "indigo",
  primaryShade: { light: 6, dark: 7 },

  // ── Shape ──────────────────────────────────────────────────────────────────
  defaultRadius: "md",
  cursorType: "pointer",

  // ── Typography ─────────────────────────────────────────────────────────────
  fontFamily: "Manrope, sans-serif",
  headings: {
    fontFamily: "Manrope, sans-serif",
    fontWeight: "700",
    sizes: {
      h1: { fontSize: rem(26), lineHeight: "1.3" },
      h2: { fontSize: rem(20), lineHeight: "1.35" },
      h3: { fontSize: rem(17), lineHeight: "1.4" },
      h4: { fontSize: rem(15), lineHeight: "1.45" },
    },
  },

  fontSizes: {
    xs: rem(11),
    sm: rem(13),
    md: rem(14),
    lg: rem(16),
    xl: rem(18),
  },

  lineHeights: {
    xs: "1.4",
    sm: "1.45",
    md: "1.5",
    lg: "1.55",
    xl: "1.6",
  },

  // ── Shadows ────────────────────────────────────────────────────────────────
  shadows: {
    xs: "0 1px 2px rgba(0,0,0,0.04)",
    sm: "0 1px 4px rgba(0,0,0,0.07)",
    md: "0 2px 8px rgba(0,0,0,0.09)",
    lg: "0 4px 16px rgba(0,0,0,0.11)",
    xl: "0 8px 28px rgba(0,0,0,0.13)",
  },

  // ── Component defaults ─────────────────────────────────────────────────────
  components: {
    // Inputs — uniform size and radius
    Button: {
      defaultProps: { size: "sm", radius: "md" },
    },
    TextInput: {
      defaultProps: { size: "sm" },
    },
    Select: {
      defaultProps: { size: "sm" },
    },
    MultiSelect: {
      defaultProps: { size: "sm" },
    },
    NumberInput: {
      defaultProps: { size: "sm" },
    },
    Textarea: {
      defaultProps: { size: "sm", radius: "md" },
    },
    PasswordInput: {
      defaultProps: { size: "sm" },
    },
    NativeSelect: {
      defaultProps: { size: "sm" },
    },
    Autocomplete: {
      defaultProps: { size: "sm" },
    },
    TagsInput: {
      defaultProps: { size: "sm" },
    },

    // Badges — light variant, tighter radius
    Badge: {
      defaultProps: { variant: "light", radius: "sm", size: "sm" },
    },

    // Icon buttons — subtle by default
    ActionIcon: {
      defaultProps: { variant: "subtle", radius: "md" },
    },

    // Tooltips — always with arrow, slight delay
    Tooltip: {
      defaultProps: { withArrow: true, openDelay: 150 },
    },

    // Modals — centered, blurred backdrop
    Modal: {
      defaultProps: {
        radius: "lg",
        centered: true,
        overlayProps: { blur: 4, backgroundOpacity: 0.4 },
      },
    },

    // Drawers — subtle backdrop
    Drawer: {
      defaultProps: {
        overlayProps: { blur: 2, backgroundOpacity: 0.3 },
      },
    },

    // Menus & popovers
    Menu: {
      defaultProps: { shadow: "md", radius: "md" },
    },
    Popover: {
      defaultProps: { shadow: "md", radius: "md" },
    },

    // Surfaces
    Paper: {
      defaultProps: { radius: "md" },
    },
    Card: {
      defaultProps: { radius: "md" },
    },

    // Notifications
    Notification: {
      defaultProps: { radius: "md" },
    },

    // Tables — slightly more breathing room
    Table: {
      defaultProps: {
        verticalSpacing: "sm",
        horizontalSpacing: "md",
        highlightOnHover: true,
      },
    },

    // Tabs
    Tabs: {
      defaultProps: { variant: "default" },
    },

    // Alerts
    Alert: {
      defaultProps: { radius: "md" },
    },
  },
});
