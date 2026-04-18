# Data

Every visualization block needs data. You have three options, in order of simplicity.

## 1. Inline CSV (default)

The fence body is a CSV with a header row.

````
```chart type=bar x=region y=sales
region, sales
North, 120
South, 95
```
````

**Parsing:**
- Comma-separated. Whitespace around values is trimmed.
- Quoted fields handle commas and embedded quotes: `"Smith, J."`, `"He said ""hi"""`.
- Types auto-detected per cell: numbers → `number`, `true`/`false`/`null` → their literals, everything else → `string`.
- No type declarations are needed or supported.

## 2. Inline JSON

Opt in with `format=json`. The body must be a JSON array of objects.

````
```chart type=pie label=name value=share format=json
[
  {"name": "Alpha", "share": 45},
  {"name": "Beta",  "share": 30}
]
```
````

Use JSON when your data is already structured that way (e.g. pasted from an API response you've pre-aggregated). CSV is more convenient for most typing-by-hand cases.

## 3. Named datasets (file references)

Declare once in front-matter, reuse everywhere.

```yaml
---
data:
  sales: ./data/sales.csv
  regions: ./data/regions.json
  q1: ./data/q1.tsv
---
```

Then reference by name:

````
```chart type=line data=sales x=month y=revenue series=region
```

```table data=sales
```
````

**File resolution rules:**
- Paths are **always relative to the `.mdv` file**.
- Absolute paths and URLs are **not supported** in v1 — a hard line to keep docs portable.
- Supported extensions: `.csv`, `.tsv` (parsed like CSV), `.json`.
- Each file is read **once per render** and cached by absolute path.
- Missing or unreadable files render an inline **error banner** but the rest of the document continues.

## Error cases

| Situation | What happens |
|---|---|
| Unknown `data=` name | Block renders as a red error banner; other blocks still render. |
| Missing file | Block renders as a red error banner naming the path. |
| Malformed CSV | Block renders as a red error banner. |
| Empty dataset | Block renders as a red "no data rows" banner. |
| Column referenced by `x=`/`y=` that doesn't exist | Treated as `undefined` → numerical cells become `NaN`; usually visible as blank bars/flat lines. |

## What's not supported

MDV v1 is deliberately small. These are **not** data features:

- **No transformations.** No filter, group-by, aggregate, compute, or sort. Pre-aggregate your data.
- **No URLs or APIs.** Only local files.
- **No queries.** You can't say `data=sales where region=North`. That's code, which v1 explicitly avoids.
- **No parametrization.** No `{{ }}` templating of info strings with data values.

If you find yourself wanting these, pre-process the data in your tool of choice and save the result as a new CSV/JSON.
