---
title: AI Agent Guidelines
purpose: Instructions for AI agents contributing to this codebase
last_updated: 2026-04-01
applies_to: All AI-assisted development (code generation, refactoring, documentation)
---

# AI Agent Guidelines

This document provides guidance for AI agents working on the Grafana Graphviz Panel codebase.

## Quick Reference

### Essential Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Code organization, design principles, and where to add new features
- **[README.md](./README.md)** - Development setup, testing, and build commands

### Key Commands

```bash
npm run dev          # Development mode with watch
npm run build        # Production build
npm run test         # Run tests with watch
npm run test:ci      # Run all tests with coverage
npm run lint         # Check code style
npm run lint:fix     # Auto-fix code style issues
npm run server       # Spin up local Grafana instance
```

## Code Organization Principles

### Directory Structure Decision Tree

**Q: What am I building?**

1. **Business Logic (Graphviz diagramming operations)**

   - Pure functions, no Grafana dependencies
   - Location: `src/core/`
   - Examples: DOT parsing, graph manipulation, validation

2. **Grafana Integration**

   - Uses `@grafana/*` packages
   - Location: `src/integrations/`
   - Examples: DataFrame extraction, theme styling, AI Assistant

3. **UI Components**

   - **Builder modals?** → `src/components/modals/`
   - **Panel configuration editors?** → `src/components/panel-options/`
   - **Empty/error states?** → `src/components/states/`
   - **AI Assistant features?** → `src/components/assistant/`
   - **Main panel logic?** → `src/components/Panel.tsx` or `BuilderModeOverlay.tsx`

4. **React Hooks**

   - Location: `src/hooks/`
   - Use barrel export: `src/hooks/index.ts`

5. **Type Definitions**
   - Shared types: `src/types.ts`

### The Litmus Test

**"If Grafana releases a major version update, would this file need changes?"**

- **YES** → `src/integrations/` (platform-coupled)
- **NO** → `src/core/` (framework-agnostic)

## Common Patterns & Best Practices

### Import Rules

```typescript
// ✅ Good - Use barrel exports
import { NodeFormModal, EdgeFormModal } from './modals';
import { useGraphvizRenderPipeline } from '../hooks';

// ❌ Bad - Individual imports when barrel exists
import { NodeFormModal } from './modals/NodeFormModal';

// ✅ Good - Core stays pure
import { fromDot, toDot } from 'ts-graphviz';

// ❌ Bad - Never import Grafana in core
import { PanelData } from '@grafana/data';
```

### File Placement Examples

**Example 1: Adding a new Graphviz layout algorithm**

```
Location: src/core/
Why: Pure business logic, no Grafana dependencies
```

**Example 2: Adding a new panel configuration option**

```
Component: src/components/panel-options/MyNewEditor.tsx
Registration: src/module.ts (add to setPanelOptions builder)
Export: Add to src/components/panel-options/index.ts
```

**Example 3: Adding a new builder mode tool**

```
Component: src/components/BuilderModeOverlay.tsx (or new modal)
Logic: src/core/builderMode.ts
Types: src/types.ts (add to BuilderTool enum)
```

## Testing Guidelines

### Running Tests

```bash
npm run test:ci      # Jest unit tests with coverage
npm run e2e          # Playwright E2E tests in Docker (HTML report)
npm run e2e:llm      # E2E tests with verbose list output (LLM-friendly)
npm run e2e:ui       # Playwright UI mode (local only, not in Docker)
npm run coverage     # Combined Jest + Playwright coverage report
```

### When to Run Which Tests

**After modifying source code (`src/`):**

- ✅ Run `npm run test:ci` - Validates your changes don't break unit tests
- ✅ Run `npm run build` - Ensures code compiles without errors
- ⚠️ Run `npm run e2e` - Only if you modified code that E2E tests depend on

**After adding/modifying E2E tests (`e2e/specs/`):**

- ✅ Run `npx tsc --noEmit e2e/specs/your-test.spec.ts` - Quick TypeScript check
- ✅ Run `npm run build` - Build the plugin
- ✅ Run single test during development:
  ```bash
  npm run e2e:llm e2e/specs/your-test.spec.ts
  ```
- ✅ Run `npm run e2e:llm` before committing - All tests with verbose output
- ⚠️ Do NOT run only `npm run test:ci` - This won't validate E2E tests!

**After modifying dashboard JSON (`provisioning/dashboards/`):**

- ✅ Run `npm run e2e` - Dashboard changes require full E2E validation
- ❌ Do NOT assume unit tests validate dashboard changes

**Quick validation workflow for E2E work:**

```bash
# 1. TypeScript check (fast, catches syntax errors)
npx tsc --noEmit e2e/specs/your-test.spec.ts

# 2. Build source (E2E tests run against built plugin)
npm run build

# 3. Run only your test with verbose output (fastest iteration)
npm run e2e:llm e2e/specs/your-test.spec.ts

# 4. Before committing: Run all E2E tests
npm run e2e:llm
```

### Test Strategy: Pure Unit Tests vs E2E

This project has **merged coverage reporting** combining Jest unit tests and Playwright E2E tests. Because of this:

**Prefer PURE unit tests:**

- ✅ Test `core/` business logic (no Grafana dependencies)
- ✅ Test utility functions with simple inputs/outputs
- ✅ Test React hooks in isolation
- ✅ Minimal mocking required

**Use E2E tests when:**

- ⚠️ Heavy mocking is required (many `jest.mock()` statements)
- ⚠️ Brittle mocks that break with minor changes
- ⚠️ Testing complex UI interactions
- ⚠️ Testing Grafana integration points
- ⚠️ Testing full user workflows

**Heuristic:** If you're writing more mock code than test code, it's probably better as an E2E test.

### Test File Location

- Co-locate test files with the code they test, one source file per test file
- Use `.test.tsx` or `.test.ts` extension for Jest unit tests
- Use `.spec.ts` extension for Playwright E2E tests (in `e2e/specs/`)
- Test files follow the same directory structure as source files

### Common Test Patterns

```typescript
// ✅ Good - Pure unit test (core logic)
import { validateDot } from './validation';

test('should validate DOT syntax', () => {
  expect(validateDot('digraph {}')).toBe(true);
});

// ⚠️ Consider E2E instead - Many mocks mean fragile tests
jest.mock('../../integrations/grafanaData', () => ({
  extractDotFromQuery: jest.fn(),
}));
jest.mock('../../integrations/grafanaTheme', () => ({
  applyTheme: jest.fn(),
}));
```

### E2E Test Development Workflow

**Fast iteration loop:**

```bash
# 1. TypeScript check (catches syntax errors instantly)
npx tsc --noEmit e2e/specs/your-test.spec.ts

# 2. Build plugin (E2E tests run against built artifacts)
npm run build

# 3. Run ONLY your test with verbose output
npm run e2e:llm e2e/specs/your-test.spec.ts
```

**Key debugging tips:**

- The `list` reporter shows exactly which line failed
- Error context files (`error-context.md`) show the actual page structure
- Use `page.getByText()` or `page.getByRole()` instead of complex CSS selectors
- When selectors fail, check the error context to see the actual UI structure
- Add `data-testid` attributes to components for reliable selectors

**Common E2E patterns:**

```typescript
// ✅ Good - Use test.step() for grouping related actions
test('should display tooltip on hover', async ({ page }) => {
  await test.step('Hover over element', async () => {
    const node = page.locator('g.node').first();
    await node.hover();
  });

  await test.step('Verify tooltip appears', async () => {
    const tooltip = page.locator('[data-portal="tooltip"]');
    await expect(tooltip).toBeVisible(); // Auto-waits up to 5s
  });
});

// ✅ Good - Let Playwright auto-wait, no manual timeouts
await element.click();
await expect(page.locator('.result')).toBeVisible(); // Waits automatically

// ❌ Bad - Arbitrary timeouts are unnecessary
await element.click();
await page.waitForTimeout(500); // Don't do this!
await expect(page.locator('.result')).toBeVisible();
```

**Additional patterns:**

- Use `getSvg(page)` helper for SVG assertions
- Use `.last()` when selecting from dynamic lists (overrides, thresholds)
- Use `getByRole('option')` for dropdown selections after clicking
- Use `getByText('Select nodes...')` for Grafana multiselect/combobox inputs
- Check `e2e/helpers/` for reusable functions before writing custom selectors

**When tests fail:**

1. Read the error message - it shows the exact line and what was expected
2. Check screenshots/videos in `test-results/` directory
3. Read `error-context.md` to see the actual page structure
4. Update selectors to match the actual UI (not what you assumed)
5. **Don't change test requirements** - fix the test implementation

**Provisioned dashboard tips:**

- TestData datasource CSV format: each row must have all fields or use empty strings
- Bad: `Server1,25,45,healthy,,,` (trailing commas may cause "No data")
- Good: `Server1,25,45,healthy` (omit unused fields entirely)
- Each panel needs `datasource`, `targets`, and `options` configured
- Copy from working panels when adding new test fixtures

**Choosing the right E2E command:**

- **During development** - Run single test with verbose output:

  ```bash
  npm run e2e:llm e2e/specs/your-test.spec.ts
  ```

  - Fastest iteration (only runs your test)
  - Verbose list reporter shows exactly what failed
  - Serial execution (predictable, easier to debug)
  - **Always use npm scripts** so the command is clear and standardized

- `npm run e2e:ui` - **Interactive UI mode for visual debugging (LOCAL ONLY)**

  - ⚠️ **Cannot run in Docker** - Requires local Playwright installation
  - To use: Install dependencies locally (`npm install`) then run `npx playwright test --ui`
  - Opens Playwright UI with time travel debugging
  - Watch tests run step-by-step
  - Inspect DOM at any point in the test
  - Best for understanding test failures visually
  - Note: You'll need to run Grafana separately (`npm run server`)

- `npm run e2e:llm` - **Run all tests with verbose output**

  - Same verbose list reporter as above
  - Runs all E2E tests serially
  - Use before committing changes

- `npm run e2e` - **Full test suite with coverage**
  - Parallel execution (faster)
  - HTML report for visual inspection
  - Coverage reports included
  - Use for final validation

## Git & Commit Guidelines

### ⚠️ CRITICAL: Git Operations

**NEVER run git commands unless explicitly requested by the user!**

The user handles ALL git operations manually:

- ❌ `git add`, `git commit`, `git push`
- ❌ `git checkout`, `git merge`, `git rebase`
- ✅ Only run git commands when explicitly asked

### Workflow

```bash
# ✅ Your job: Make changes, test, show results
npm run test:ci
npm run build

# ❌ NOT your job: Committing
# Instead, tell user:
# "Ready to commit. Suggested command:"
# git add src/components/MyComponent.tsx
# git commit -m "feat: add new component"
```

## Common Maintenance Tasks

### Adding a New Component

1. **Determine the right location** (see Directory Structure Decision Tree above)
2. **Create the component file** in the appropriate subdirectory
3. **Create the test file** next to the component
4. **Add to barrel export** (`index.ts`) if in a subdirectory
5. **Update imports** in files that use the component
6. **Run tests** - `npm run test:ci`
7. **Verify build** - `npm run build`

### Refactoring Components

1. **Read the component** to understand its dependencies
2. **Check imports** in other files that use it
3. **Make changes** preserving all functionality
4. **Update tests** if test structure changes
5. **Run full test suite** - `npm run test:ci`
6. **Verify no TypeScript errors** - `npx tsc --noEmit`

### Moving Files

1. **Move the file** to new location
2. **Update all imports** in consuming files
3. **Update barrel exports** (`index.ts`) if applicable
4. **Update test imports** (especially `jest.mock()` paths and `require()`)
5. **Run tests** to verify - `npm run test:ci`

## Code Style

### General Rules

- ✅ Write self documenting code with semantically meaningful names
- ❌ **DO NOT add inline code comments** unless explicitly asked
- ✅ Use existing patterns and conventions in the codebase
- ✅ Follow TypeScript strict mode (no `any` without good reason)
- ✅ Use functional components with hooks (React)
- ✅ Keep `core/` pure (no side effects, no Grafana imports)

### Import Order (convention)

```typescript
// 1. External libraries
import React from 'react';
import { PanelProps } from '@grafana/data';

// 2. Internal absolute imports (core, integrations)
import { validateDot } from '../core/validation';
import { extractDotFromQuery } from '../integrations/grafanaData';

// 3. Local relative imports
import { MyComponent } from './MyComponent';
import { useMyHook } from '../hooks';
```

## Questions to Ask Yourself

Before implementing a feature:

1. **Where does this code belong?** (Use the Litmus Test)
2. **What patterns exist?** (Look at similar existing code)
3. **What tests exist?** (Check test files for patterns)
4. **What will break?** (Search for imports of files you're changing)
5. **How do I verify it works?** (`npm run test:ci` and `npm run build`)

## Getting Help

- **Architecture questions?** Read [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Build/test questions?** Read [README.md](./README.md)
- **Git workflow questions?** See "Git & Commit Guidelines" section above
- **Unclear requirements?** Ask the user for clarification before implementing

## Summary: The Golden Rules

1. 🏗️ **Architecture** - Follow the separation of concerns (`core/` vs `integrations/`)
2. 📁 **Organization** - Put components in the right semantic directory
3. 🧪 **Testing** - Run `npm run test:ci` before finishing any task
4. 🚫 **Git** - NEVER commit unless explicitly asked
5. 💬 **Communication** - Ask questions when requirements are unclear
6. 📝 **Documentation** - Update ARCHITECTURE.md for structural changes
7. 🎨 **Style** - Follow existing functional patterns, no redundant comments unless asked
