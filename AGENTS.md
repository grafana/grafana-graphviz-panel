---
title: AI Agent Guidelines
purpose: Instructions for AI agents contributing to this codebase
last_updated: 2026-03-26
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
import { useThemedDotSvg } from '../hooks';

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
npm run e2e          # Playwright E2E tests in Docker
npm run coverage     # Combined Jest + Playwright coverage report
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
