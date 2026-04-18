# Themes & styles

MDV's styling model is intentionally tiny. You pick a **theme**, optionally define a few **named styles**, and apply them with `:::` containers. There are no selectors, classes, or CSS to write.

## Themes

Set a theme in front-matter:

```yaml
---
theme: minimal     # default
---
```

v1 ships three built-in themes:

| Name | Feel | Font | Accent |
|---|---|---|---|
| `minimal` | Clean, neutral, high-density | System sans-serif | Blue `#2d6cdf` |
| `report` | Warm, editorial, long-form | Georgia serif | Dark red `#8c2f2f` |
| `slide` | Dark, high-contrast, presentation | Helvetica sans-serif | Amber `#ffce5c` |

A theme defines defaults for font family, base size, background, heading color, accent, chart color palette, spacing scale (`small`/`medium`/`large`), and border radius. All charts and stat cards pick up the theme's palette automatically — authors don't pick chart colors.

Setting an unknown theme name produces a yellow warning banner and falls back to `minimal`.

## Named styles

You define named styles in the front-matter `styles:` map. Each style is a flat map of keys → values.

```yaml
---
styles:
  callout:
    background: "#fff6e0"
    border: "1px solid #e0b84a"
    padding: medium
    radius: medium
  highlight:
    background: "#e8f1ff"
    padding: small
  kpi-card:
    background: "#fff"
    border: "1px solid rgba(0,0,0,0.12)"
    padding: medium
    radius: small
    align: center
---
```

Apply a style with a `:::` container:

```
::: callout
This paragraph is in the callout box.
:::
```

Each named style compiles to one CSS class (`.mdv-style-callout`) emitted once in `<head>`. You can nest containers freely.

## The full v1 style vocabulary

Every key that's allowed:

| Category | Keys | Values |
|---|---|---|
| Color | `color` | Any CSS color (`#fff`, `rgb(…)`, `rgba(…)`, named) |
| | `background` | Any CSS color or gradient |
| | `border` | A CSS border shorthand (`1px solid #ccc`) |
| Spacing | `padding`, `margin` | `small` / `medium` / `large` (theme-scaled) or a CSS length (`12px`, `1.5em`) |
| Typography | `font` | A font-family string |
| | `size` | `small` / `medium` / `large` or a CSS length |
| | `weight` | `normal` / `bold` or a numeric weight |
| | `align` | `left` / `center` / `right` |
| Layout | `width` | A CSS length or percent |
| | `radius` | `small` / `medium` / `large` or a CSS length |

**That's it.** There is no `display`, `position`, `flex`, `grid`, `transform`, `box-shadow`, or anything else. By design.

## What happens to unknown keys

An unknown key (e.g. `boxShadow`) produces a **yellow warning banner** at the top of the document with the offending style name and key. The container still renders with whatever other valid keys you provided.

## Resolution order

1. Theme defaults apply document-wide.
2. Named styles compile to CSS classes and apply when a matching `::: <name>` container wraps content.
3. There are **no per-block overrides** in v1. Want a differently-colored callout? Define a second named style.

## Why no per-element styling?

The design constraint is "non-technical authors." The moment authors can write `{color: red}` on a specific paragraph, they start treating MDV like CSS and the escape-hatch creep begins. Forcing named styles keeps the surface tiny and the output consistent.

## Example — a styled report

```yaml
---
title: Q3 Review
theme: report
styles:
  kpi:
    background: "#fff"
    border: "1px solid rgba(0,0,0,0.12)"
    padding: medium
    radius: small
    align: center
  summary:
    background: "#faf4e8"
    padding: large
    radius: medium
---
```

See [`examples/09-full-report.mdv`](../examples/09-full-report.mdv) for a fully-worked example combining every feature with the `report` theme.
