# Charts & stats reference

v1 ships five visualization blocks: **table**, **stat**, **bar**, **line**, **pie**.

All chart blocks share:

| Option | Values | Effect |
|---|---|---|
| `title` | any (quote if it has spaces) | Title shown above the chart |
| `data` | a name from `data:` front-matter | Use a named dataset instead of inline body |
| `format` | `csv` (default), `json` | Body format when not using `data=` |

## `table`

Renders a styled HTML table from CSV/JSON data.

````
```table
region, q1, q2, q3, q4, total
North, 120, 140, 160, 175, 595
South, 90, 110, 130, 145, 475
```

```table data=sales
```
````

No per-column options in v1. Column order follows the CSV header order.

## `stat` — KPI cards

Renders a responsive grid of cards, one per row. Expected columns:

| Column | Required | Shown as |
|---|---|---|
| `label` | yes | Small caption below the number |
| `value` | yes | Big headline (already formatted — e.g. `$2.06M`, `62`, `+14%`) |
| `delta` | no | Optional change indicator; green ▲ for non-negative, red ▼ for negative |

Delta sign detection: numeric content is parsed — `-0.4%` goes down (red), `+8%` goes up (green).

````
```stat
label, value, delta
Total revenue, $2.06M, +14%
New customers, 1238, +8%
Churn rate, 2.1%, -0.4%
NPS, 62, +6
```
````

## `chart type=bar`

| Option | Required | Values | Effect |
|---|---|---|---|
| `x` | yes | column name | X-axis (category) column |
| `y` | yes | column name | Y-axis (value) column |
| `yFormat` | no | `currency` \| `percent` \| `thousands` | Axis + tooltip number formatting |

````
```chart type=bar x=region y=revenue yFormat=currency title="Revenue by region"
region, revenue
North, 595000
South, 475000
```
````

- Bars are colored using the theme's first palette color.
- Y-axis auto-scales with "nice" ticks and includes 0.
- Negative values render below the zero baseline.

## `chart type=line`

| Option | Required | Values | Effect |
|---|---|---|---|
| `x` | yes | column name | X-axis column (alphabetical order, v1) |
| `y` | yes | column name | Y-axis column |
| `series` | no | column name | Group rows into multiple lines |
| `points` | no | flag | Draw circles at each data point |
| `yFormat` | no | `currency` \| `percent` \| `thousands` | Axis formatting |

````
```chart type=line x=month y=rate yFormat=percent title="Conversion rate"
month, rate
Jan, 0.032
Feb, 0.041
Mar, 0.053
```

```chart type=line x=month y=revenue series=region points
month, revenue, region
Jan, 120, North
Feb, 140, North
Jan, 90, South
Feb, 110, South
```
````

- Each series gets the next color from the theme palette.
- Legend auto-renders when `series=` is used.
- X-axis positions are derived from unique X values in source order.

## `chart type=pie`

| Option | Required | Values | Effect |
|---|---|---|---|
| `label` | yes | column name | Slice labels |
| `value` | yes | column name | Slice values (must be positive) |
| `donut` | no | flag | Render as donut instead of pie |

````
```chart type=pie label=product value=share donut title="Market share"
product, share
Alpha, 45
Beta, 30
Gamma, 15
Delta, 10
```
````

- Colors cycle through the theme palette.
- Tooltips (`<title>`) show label, value, and percentage.
- A legend is always rendered on the right.

## Error handling

If a chart block is misconfigured (unknown `type`, missing `x`/`y`, bad CSV), it renders a **red inline error banner** with the message. The rest of the document continues rendering. An unknown style key produces a **yellow warning banner** at the top of the document.

## Non-goals in v1

Explicitly **not** supported — don't try to shoehorn them in:

- Interactivity beyond native `<title>` hover tooltips.
- Data transformations (filter, group-by, compute, sort).
- Remote data (URLs, APIs, DBs).
- Scatter, area, stacked-bar, gantt, heatmap, sankey, or any other chart type.
- Per-block CSS overrides.
- Dual axes, secondary Y, log scale, annotations, trend lines.
