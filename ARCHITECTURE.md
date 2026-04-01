# Architecture

## Source Code Directory Structure

```
src/
├── core/                   # Framework agnostic business logic
├── integrations/           # Integration points with the Grafana platform
├── components/             # React UI components
├── hooks/                  # React hooks
├── module.ts               # Plugin registration
└── types.ts                # Shared type definitions
```

## Design Principles

### Separation of Concerns

**Core (`src/core/`)**: Pure business logic for diagramming

- Graphviz DOT manipulation (parsing, rendering, validation)
- Graph CRUD operations (builder mode)
- Override rules for styling (nodes, edges, colors, labels)
- String interpolation and sanitization

**Integrations (`src/integrations/`)**: Grafana platform integration points

- DataFrame extraction (`grafanaData.ts`)
- Theme-aware SVG styling (`grafanaTheme.ts`)
- AI Assistant integration (`grafanaAssistant.ts`)

**Components (`src/components/`) & Hooks (`src/hooks`)**: React UI layer

- Editor interfaces (code, builder, query modes)
- Modal forms and overlays
- Panel rendering and empty states
- Lifecycle hooks for logic

### Benefits

1. **Portability**: Core logic can be extracted for CLI tools, web apps, or other frameworks
2. **Testability**: Business logic tests require no mocking of Grafana APIs
3. **Maintainability**: Platform updates are isolated to `integrations/`
4. **Clarity**: Clear boundaries between "what" (core) and "how" (integrations)

### Rendering Pipeline

The rendering pipeline transforms user DOT diagrams through multiple stages, each building on previous work without destroying it. Implemented in `src/hooks/useThemedDotSvg.ts`:

```
┌────────────────────────────┐
│    Start ..                │ ← String<DOT>
│    - User defines diagram  │
└────────────────────────────┘
          │
     String<DOT>
          ↓
┌──────────────────────────────────────────────────┐
│ 1. Diagram defaults                              │
│    - Sets: node [style="rounded,filled"]         │
└──────────────────────────────────────────────────┘
          │
     String<DOT>
          ↓
┌──────────────────────────────────────────────────┐
│ 2. Static overrides (panel options)              │ ← Panel options
│    - Edge stroke colors                          │
│    - Node stroke/fill colors                     │
└──────────────────────────────────────────────────┘
          │
     String<DOT>
          ↓
┌──────────────────────────────────────────────────┐
│ 3. Node/edge mappings (data-driven overrides)    │ ← Datasource
│    - Colors from thresholds                      │ ← Panel options
│    - Edge widths from data                       │
└──────────────────────────────────────────────────┘
          │
     String<DOT>
          ↓
┌──────────────────────────────────────────────────┐
│ 4. Labels (Interpolation)                        │ ← Dashboard variables
│    - Node/edge label templates                   │
│    - Dashboard variable substitution             │
└──────────────────────────────────────────────────┘
          │
     String<DOT>
          ↓
┌──────────────────────────────────────────────────┐
│ 5. Render diagram as SVG                         │
└──────────────────────────────────────────────────┘
          │
     String<SVG>
          ↓
┌──────────────────────────────────────────────────┐
│ 6. Post-Processing (gradient, glow SVG filters)  │
└──────────────────────────────────────────────────┘
          │
     SVG DOM
          ↓
┌──────────────────────────────────────────────────┐
│ 7. Render diagram in React component             │
└──────────────────────────────────────────────────┘
          │
         DOM
          ↓
┌────────────────┐
│     Finish!    │
└────────────────┘
```

**Pipeline Implementation:**

1. **Diagram defaults:** [`src/core/sanitization.ts`](src/core/sanitization.ts)
2. **Static overrides:** [`src/core/overrides/edge.ts`](src/core/overrides/edge.ts), [`src/core/overrides/node.ts`](src/core/overrides/node.ts)
3. **Data-driven overrides:** [`src/core/overrides/node.ts`](src/core/overrides/node.ts), [`src/core/overrides/edge.ts`](src/core/overrides/edge.ts)
4. **Label interpolation:** [`src/core/overrides/label.ts`](src/core/overrides/label.ts)
5. **SVG rendering:** [`src/core/dot.ts`](src/core/dot.ts)
6. **Post-processing:** [`src/core/utils/svgFilters.ts`](src/core/utils/svgFilters.ts), [`src/integrations/grafanaTheme.ts`](src/integrations/grafanaTheme.ts)
7. **React rendering:** [`src/hooks/useThemedDotSvg.ts`](src/hooks/useThemedDotSvg.ts)

## Guidelines for New Code

- **Adding Graphviz features?** → `core/`
- **Using Grafana APIs?** → `integrations/`
- **Building UI?** → `components/` or `hooks/`
- **Shared types?** → `types.ts`
