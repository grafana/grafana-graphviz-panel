# Changelog

## 0.0.7 [2026-07-30]

### Features

- Upgrade `@grafana/ui` to 13.x, enabling use of the `Combobox` component.
- Replace shape `Select` with `Combobox` in node builder modals, supporting freeform input of any valid Graphviz shape name with validation.
- Expand node shape picker to include all polygon-based Graphviz shapes with human-readable labels.

### Bug Fixes

- Fix `plaintext`, `none`, and `underline` node shapes rendering with an unwanted filled box due to graph-level `style=filled` default being applied.
- Fix `doublecircle`, `doubleoctagon`, and `tripleoctagon` shapes rendering as single circles — outer concentric ellipses are now correctly left unfilled.
- Fix `lightgrey` (Graphviz default fill) not being recognised as a default color during SVG theming.

## 0.0.6 [2026-07-17]

### Bug Fixes

- Fix numeric inputs in panel options not allowing deletion of `0` to type a new value.
- Fix RGB colour inputs in node/edge override and threshold editors triggering render errors mid-typing.

## 0.0.5 [2026-04-30]

### Bug Fixes

- Fix default settings for Network, Force Directed, and Circular layout engines.

## 0.0.4 [2026-04-20]

### Bug Fixes

- Fix node overrides not applying to nodes inside subgraph clusters.

## 0.0.3 [2026-04-10]

### Bug Fixes

- Fix clearing labels via node/edge builder modals (#104).

### Documentation

- Add Private Preview release status notice to README files.

## 0.0.2 [2026-04-09]

### Bug Fixes

- Fix Grafana 13.x showing "Run a query to visualize it here" message for panels without query data. Graphviz panels can now display static diagrams in Code and Builder modes without triggering Grafana's empty state UI when no data source queries are configured.

## 0.0.1 [2026-04-08]

Initial release.
