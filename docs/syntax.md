# Syntax reference

An `.mdv` file is **CommonMark Markdown** plus four additions. Every valid `.md` is a valid `.mdv`.

## 1. Front-matter (optional)

A single YAML block at the very top of the file, fenced by `---`:

```yaml
---
title: Q1 Report           # document title (shown in <title>, not the body)
theme: report              # one of: minimal | report | slide
locale: en-US              # (reserved; en-US today)
data:                      # named datasets (see Data guide)
  sales: ./data/sales.csv
  regions: ./data/regions.json
styles:                    # named styles (see Styles guide)
  callout:
    background: "#fff6e0"
    padding: medium
---
```

All keys are optional. If there's no front-matter, sensible defaults apply.

## 2. Fenced blocks (data & visualization)

```
```<lang> key=value key="with spaces" flag
<body>
```
```

Supported languages: `chart`, `table`, `stat`.

**Info-string rules:**
- The first word is the block language.
- Remaining tokens are either `key=value` pairs or bare `flag` booleans.
- Quote values that contain spaces: `title="Revenue by region"`.
- No JSON, no JS. No expressions.

**Examples:**

````
```chart type=bar x=region y=sales title="Revenue"
region, sales
North, 120
South, 95
```

```table data=sales
```

```stat
label, value, delta
Revenue, $2.06M, +14%
```
````

See [charts.md](charts.md) for the full per-block option list.

## 3. `:::` container directives

```
::: <name>
<content>
:::
```

Three classes of containers:

### Named-style containers

The `<name>` matches a key in front-matter `styles:`. The content is wrapped in a `<div class="mdv-style-<name>">` that applies the compiled CSS.

```
::: callout
**Heads up:** this is important.
:::
```

Containers can be nested.

### Layout containers

Two reserved names for layout:

```
::: columns
::: col
Left content, including any MDV blocks.
:::
::: col
Right content.
:::
:::
```

`columns` is a two-column CSS grid. `col` wraps each child column. No other layout primitives in v1.

### The TOC container

```
::: toc
:::
```

Renders at that position as an auto-generated contents list of `##` and `###` headings, with anchor links. The container body (if any) is ignored. Can appear anywhere in the document; typically right after the top-level heading.

## 4. Graceful degradation

When a `.mdv` file is opened in a plain Markdown viewer:

- Fenced `chart` / `table` / `stat` blocks render as syntax-highlighted code blocks.
- `:::` container lines render as visible `:::` text.
- All standard Markdown continues to render identically.

The example corpus is tested against plain `markdown-it` to verify this on every commit.

## Full grammar cheat sheet

```
FILE       := FRONTMATTER? BLOCK*
FRONTMATTER := '---' NEWLINE YAML NEWLINE '---' NEWLINE
BLOCK      := MD_BLOCK | FENCED_BLOCK | DIRECTIVE
FENCED_BLOCK := '```' LANG INFO_STRING NEWLINE BODY '```' NEWLINE
LANG       := 'chart' | 'table' | 'stat' | (standard CommonMark lang)
INFO_STRING := (KEY '=' VALUE | KEY)*
DIRECTIVE  := ':::' NAME NEWLINE BLOCK* ':::' NEWLINE
NAME       := 'columns' | 'col' | 'toc' | <style-name-from-frontmatter>
```
