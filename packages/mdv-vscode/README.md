# MDV — Markdown Data & Visualization Preview

Live side-by-side preview for `.mdv` files — a **strict superset of Markdown** for writing documents, dashboards, and slides with charts, KPI cards, tables, and styled regions.

Every valid `.md` file is a valid `.mdv` file. Extra features are added through fenced code blocks and `:::` containers, so plain Markdown viewers still see something readable.

---

## Features

- **Live preview** side-by-side with the editor — auto-refreshes as you type (200 ms debounce).
- **Charts** rendered as inline SVG: bar, line, pie/donut. No external JS.
- **KPI cards** with color-coded deltas.
- **Tables** from inline CSV or from a local `.csv` / `.json` file.
- **Named styles** — define callouts/highlights once in front-matter, apply by name with `:::`.
- **Themes** — `minimal`, `report`, `slide` — set font, colors, and chart palette document-wide.
- **Auto TOC** — `::: toc` generates a contents list from `##` / `###` headings.
- **Refreshes** on data-file saves too — edit `sales.csv`, the preview catches up.
- **Zero runtime dependencies** — the bundle is self-contained (~207 KB).

---

## Quick example

Save this as `report.mdv`, open it, and press **Ctrl+Shift+V**:

````markdown
---
title: Q1 Sales Review
theme: report
styles:
  callout:
    background: "#fff6e0"
    border: "1px solid #e0b84a"
    padding: medium
    radius: medium
---

# Q1 Sales Review

::: toc
:::

## Headline metrics

```stat
label, value, delta
Total revenue, $2.06M, +14%
New customers, 1238, +8%
Churn rate, 2.1%, -0.4%
NPS, 62, +6
```

## Revenue by region

```chart type=bar x=region y=sales yFormat=currency title="Q1 revenue"
region, sales
North, 595000
South, 475000
East, 360000
West, 635000
```

## Monthly trend

```chart type=line x=month y=revenue series=region points title="Revenue by region"
month, revenue, region
Jan, 120, North
Feb, 140, North
Mar, 160, North
Jan, 90, South
Feb, 110, South
Mar, 130, South
```

## Executive summary

::: callout
Q1 came in **on plan** across all four regions. Northern and western
territories led growth; Eastern region requires attention.
:::
````

---

## Format at a glance

MDV is plain CommonMark **plus four additions**, nothing more.

### 1. YAML front-matter (optional)

A single `---`-fenced YAML block at the top of the file. Sets document-level
config: `title`, `theme`, `locale`, named `data` references, and named
`styles`.

```yaml
---
title: My Report
theme: minimal          # minimal | report | slide
data:
  sales: ./data/sales.csv
styles:
  callout:
    background: "#fff6e0"
    padding: medium
---
```

### 2. Fenced blocks for data & visualization

Same triple-backtick syntax as any Markdown fence, with a type and `key=value` options.

| Block | Purpose |
|---|---|
| `` ```chart type=bar x=... y=... `` | Bar chart |
| `` ```chart type=line x=... y=... `` | Line chart (add `series=column` for multi-line) |
| `` ```chart type=pie label=... value=... `` | Pie chart (add `donut` for donut variant) |
| `` ```table `` | Data table |
| `` ```stat `` | KPI cards (columns: `label`, `value`, optional `delta`) |

The **body** of the fence is CSV data by default. Use `format=json` for JSON, or `data=<name>` to reference a dataset declared in front-matter.

Common options on charts:

- `title="..."` — chart heading
- `yFormat=currency|percent|thousands` — axis + tooltip number formatting
- `width=<px>` / `height=<px>` — optional sizing

### 3. `:::` container directives

Named-style regions and layout:

```markdown
::: callout
**Note:** rendered with the "callout" style defined in front-matter.
:::

::: columns
::: col
Left content — can include any MDV blocks.
:::
::: col
Right content.
:::
:::
```

Reserved container names: `columns`, `col`, `toc`. Any other name must match
a key under `styles:` in front-matter.

### 4. Auto table of contents

```markdown
::: toc
:::
```

Generates a contents list from all `##` and `###` headings, with anchor links.

---

## More examples

### Inline CSV bar chart

````markdown
```chart type=bar x=fruit y=count title="Favorite fruit"
fruit, count
Apple, 12
Banana, 8
Cherry, 5
```
````

### Line chart with multiple series

````markdown
```chart type=line x=month y=revenue series=region points title="Revenue trend"
month, revenue, region
Jan, 120, North
Feb, 140, North
Mar, 160, North
Jan, 90, South
Feb, 110, South
Mar, 130, South
```
````

### Donut chart

````markdown
```chart type=pie label=product value=share donut title="Market share"
product, share
Alpha, 45
Beta, 30
Gamma, 15
Delta, 10
```
````

### KPI stat cards with deltas

````markdown
```stat
label, value, delta
Revenue, $2.06M, +14%
Churn, 2.1%, -0.4%
```
````

Deltas are colored automatically: green ▲ for non-negative, red ▼ for negative.

### Table from a data file

Declare the dataset once:

```yaml
---
data:
  sales: ./data/sales.csv
---
```

…then reuse in any block:

````markdown
```table data=sales
```

```chart type=line data=sales x=month y=revenue series=region points
```
````

### Styled regions

Define a style, apply it by name:

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
---
```

```markdown
::: callout
Renders with the warm background and border.
:::

::: highlight
Renders with the cool background.
:::
```

### Two-column layout

```markdown
::: columns

::: col
### Left
Some prose.
:::

::: col
### Right
A chart, a table, or more prose.
:::

:::
```

---

## Using the extension

### Commands

- **MDV: Open Preview** — preview replaces the current tab.
- **MDV: Open Preview to the Side** — preview opens in the adjacent column.

Both appear in the Command Palette (Ctrl+Shift+P / Cmd+Shift+P) when an `.mdv` file is active.

### Keyboard shortcut

- **Ctrl+Shift+V** (Windows/Linux) / **Cmd+Shift+V** (macOS) when editing a `.mdv` file.

### Editor title bar

A preview icon appears in the top-right of any `.mdv` editor tab.

### Auto-refresh

The preview re-renders as you type (200 ms debounce). It also refreshes when
a `.csv` / `.tsv` / `.json` in the same folder is saved — so editing your
dataset updates the charts without a reload.

### Errors

Block-level errors (unknown chart type, missing `x=`, missing dataset) render
as a **red inline banner** where the block would have been. The rest of the
document keeps rendering. Unknown themes or style keys produce a **yellow
warning** at the top.

---

## What MDV is **not**

Deliberately out of scope — MDV is small on purpose.

- No interactivity beyond hover tooltips.
- No data transformations (no filter, group-by, compute, sort). Pre-aggregate your data.
- No remote data (no URLs, APIs, databases). Local files only.
- No chart types beyond bar / line / pie / table / stat.
- No per-block CSS overrides. Style via named styles only.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Command 'MDV: Open Preview' not found" | Make sure the file's language id is `mdv` (shown in the status bar). |
| Preview is blank | Check the Extensions panel — any error messages from "MDV" show there. Usually a bad path in front-matter `data:`. |
| Chart shows "Dataset 'X' not declared" | Add an entry to `data:` in front-matter with a relative path. |
| Chart shows "Unknown chart type" | Valid types: `bar`, `line`, `pie`. Check spelling of `type=`. |
| Preview doesn't refresh | Confirm the file extension is `.mdv`. `.md` files aren't watched by this extension. |

---

## Full documentation

The [project repository](https://github.com/drasimwagan/mdv) includes:

- Full [syntax reference](https://github.com/drasimwagan/mdv/blob/main/docs/syntax.md).
- Complete [charts & stats reference](https://github.com/drasimwagan/mdv/blob/main/docs/charts.md).
- [Themes & styles guide](https://github.com/drasimwagan/mdv/blob/main/docs/themes-and-styles.md).
- [Data guide](https://github.com/drasimwagan/mdv/blob/main/docs/data.md) (inline + file references).
- [CLI usage](https://github.com/drasimwagan/mdv/blob/main/docs/cli.md) (`mdv render`, `mdv preview`, `mdv export --pdf`).
- 10 [worked example files](https://github.com/drasimwagan/mdv/tree/main/examples) covering every feature.

---

## License

MIT © Asim Wagan. See [LICENSE](https://github.com/drasimwagan/mdv/blob/main/LICENSE).
