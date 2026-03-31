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

### Functional Diagram Rendering Pipeline

The control flow of this panel's sanitization, overrides, and rendering of diagrams is orchestrated by `src/components/Panel.tsx` at the top level. This panel is a functional pipeline consistent with React's model of uni-directional data flow,to make this panel plugin simple to reason about and maintain.

## Guidelines for New Code

- **Adding Graphviz features?** → `core/`
- **Using Grafana APIs?** → `integrations/`
- **Building UI?** → `components/` or `hooks/`
- **Shared types?** → `types.ts`
