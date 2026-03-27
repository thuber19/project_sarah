---
name: pencil-design
description: >
  This skill should be used when the user asks to "design in Pencil",
  "open a .pen file", "design-to-code", "create a UI design", or
  "sync design tokens". Guides the complete Pencil MCP workflow: reading
  .pen files, creating designs, generating code from designs, syncing
  design tokens, and maintaining consistency between design and code.
  Use when any design work involves .pen files or the Pencil MCP tools.
version: 1.0.0
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
  - ToolSearch
category: ui-design
auto_activate: true
priority: 7
triggers:
  - 'pencil'
  - '.pen file'
  - 'design-to-code'
  - 'design in pencil'
  - 'open pen file'
  - 'update design'
  - 'style guide'
  - 'design tokens sync'
  - 'design system'
tags: design, ui, pen, frontend
quality-score: 75
---

# Pencil Design Workflow

## Purpose

Guide all Pencil MCP interactions: reading and editing `.pen` files, creating UI designs,
generating React/Tailwind code from designs, syncing design tokens with CSS variables,
and maintaining visual consistency between design files and production code.

## Activation Triggers

Activate this skill when:

- Opening, reading, or editing `.pen` files
- Creating new UI designs or screens
- Design-to-code generation (`.pen` to React components)
- Code-to-design import (React components to `.pen`)
- Syncing design tokens / CSS variables with Pencil variables
- Using any Pencil MCP tool (`batch_design`, `batch_get`, `get_screenshot`, etc.)
- Referencing style guides or UI kits

## Core Workflow: 6-Step Process

### Step 1: Check Editor State (ALWAYS FIRST)

Before any `.pen` work, determine what is currently open:

```
Tool: get_editor_state()
Purpose: Current active .pen file, selection, canvas state
```

If no file is open:

```
Tool: open_document(filePathOrNew)
- Pass 'new' to create an empty .pen file
- Pass file path to open an existing .pen file
```

### Step 2: Read Design Content

Use `batch_get` to discover and understand `.pen` file structure:

```
Tool: batch_get(patterns, nodeIds)
- patterns: Search for nodes by name/type patterns
- nodeIds: Read specific nodes by ID
```

**Discovery patterns:**
- Search all frames: `batch_get(patterns=["frame"])`
- Search by name: `batch_get(patterns=["Dashboard"])`
- Read specific nodes: `batch_get(nodeIds=["node-id-1", "node-id-2"])`

### Step 3: Get Visual Context

Use screenshots and layout snapshots to understand the current state:

```
Tool: get_screenshot()
Purpose: Visual preview of a node — use to validate design decisions

Tool: snapshot_layout()
Purpose: Computed layout rectangles — use to decide placement
```

**Rule:** Take a screenshot after every significant `batch_design` call to verify visual output.

### Step 4: Load Design Guidelines

Load relevant guidelines BEFORE designing:

```
Tool: get_guidelines(topic)
Available topics:
- code          → Code component patterns
- table         → Table/data grid design
- tailwind      → Tailwind CSS integration
- landing-page  → Landing page layouts
- slides        → Presentation design
- design-system → Design system foundations
- mobile-app    → Mobile app patterns
- web-app       → Web application patterns
```

**Recommended by page type:**
- Dashboard pages: `get_guidelines(topic="web-app")`
- Data tables: `get_guidelines(topic="table")`
- Landing/marketing pages: `get_guidelines(topic="landing-page")`
- Design token work: `get_guidelines(topic="design-system")`
- Code generation: `get_guidelines(topic="code")` + `get_guidelines(topic="tailwind")`

### Step 5: Get Style Guide (Optional)

For consistent visual design across screens:

```
Tool: get_style_guide_tags()
Purpose: Get available style guide tags for filtering

Tool: get_style_guide(tags, name)
Purpose: Load a style guide by tags or name
```

Use style guides when:
- Designing new screens without an existing design system
- Need visual inspiration for component layouts
- Creating marketing/landing pages

Skip style guides when:
- Project design system already defines the visual language
- Making small edits to existing designs

### Step 6: Design with batch_design

Execute design operations. Maximum 25 operations per call:

```
Tool: batch_design(operations)

Operation types:
- Insert:  foo=I("parent", { ... })
- Copy:    baz=C("nodeid", "parent", { ... })
- Replace: foo2=R("nodeid1/nodeid2", { ... })
- Update:  U(foo+"/nodeid", { ... })
- Delete:  D("dfFAeg2")
- Move:    M("nodeid3", "parent", 2)
- Image:   G("baz", "ai", "prompt text")
```

## Design-to-Code Pipeline

### From .pen to React Component

1. **Read the design**: `batch_get` to extract node structure, properties, layout
2. **Screenshot for reference**: `get_screenshot` on the target frame
3. **Get code guidelines**: `get_guidelines(topic="code")` + `get_guidelines(topic="tailwind")`
4. **Map Pencil properties to Tailwind** (see mapping table below)
5. **Generate component** using project patterns:
   - Use shadcn/ui components where applicable
   - Use semantic color tokens (never hardcoded hex)
   - Follow project typography scale
   - WCAG 2.1 AA compliance (focus states, contrast, touch targets)

### From React Component to .pen

1. Read the React component source
2. `open_document('new')` or open existing `.pen` file
3. Use `batch_design` to recreate the component visually
4. Map Tailwind classes to Pencil properties
5. Use Pencil variables that match CSS custom properties

### Pencil to Tailwind Mapping

| Pencil Property | Tailwind Equivalent |
| --- | --- |
| `layout: "horizontal"` | `flex flex-row` |
| `layout: "vertical"` | `flex flex-col` |
| `gap: 8` | `gap-2` |
| `gap: 16` | `gap-4` |
| `gap: 24` | `gap-6` |
| `gap: 32` | `gap-8` |
| `padding: 8` | `p-2` |
| `padding: 16` | `p-4` |
| `padding: 24` | `p-6` |
| `padding: 32` | `p-8` |
| `cornerRadius: 4` | `rounded` |
| `cornerRadius: 8` | `rounded-lg` |
| `cornerRadius: 12` | `rounded-xl` |
| `cornerRadius: 9999` | `rounded-full` |
| `justifyContent: "between"` | `justify-between` |
| `justifyContent: "center"` | `justify-center` |
| `alignItems: "center"` | `items-center` |
| `alignItems: "stretch"` | `items-stretch` |
| `fontSize: 12` | `text-xs` |
| `fontSize: 14` | `text-sm` |
| `fontSize: 16` | `text-base` |
| `fontSize: 20` | `text-xl` |
| `fontSize: 24` | `text-2xl` |
| `fontSize: 30` | `text-3xl` |
| `fontWeight: 400` | `font-normal` |
| `fontWeight: 500` | `font-medium` |
| `fontWeight: 600` | `font-semibold` |
| `fontWeight: 700` | `font-bold` |

## Design Token Synchronization

### Reading Pencil Variables

```
Tool: get_variables()
Purpose: Extract current variables and themes from .pen file
```

### Setting Pencil Variables

```
Tool: set_variables()
Purpose: Add or update variables in .pen file
```

### Sync Workflow: CSS to Pencil

1. Read project's `globals.css` for CSS custom properties
2. Read project's design system config (if exists)
3. Use `set_variables` to update Pencil variables to match

### Sync Workflow: Pencil to CSS

1. Use `get_variables()` to read current Pencil variables
2. Update `globals.css` with new/changed values
3. Run `pnpm typecheck` to verify no breakage

## Additional Tools

### Finding Empty Space

```
Tool: find_empty_space_on_canvas(direction, width, height)
Purpose: Find unoccupied canvas area for new frames
```

### Property Audit and Bulk Replace

```
Tool: search_all_unique_properties(parentIds)
Purpose: Find all unique property values in a node subtree

Tool: replace_all_matching_properties(parentIds, match, replace)
Purpose: Bulk-replace matching properties across nodes
WARNING: Escapes $ in variable references — use batch_design U() instead
```

## Known Bugs & Workarounds

### `replace_all_matching_properties` escapes variable references
- When replacing colors with `$--foreground`, the tool stores them as `\$--foreground` (escaped backslash)
- Variables with escaped backslash prefix are NOT resolved by the rendering engine
- **Workaround**: Use `batch_design` with individual `U("nodeId", {fill: "$--foreground"})` operations
- See `references/known-bugs.md` for details

### `search_all_unique_properties` returns resolved values
- Results show computed/resolved values, not raw property values
- A hex color in results does NOT necessarily mean it's hardcoded — it may be a resolved variable
- **Workaround**: Use `batch_get` with specific nodeIds to see raw property values

## Design States (Recommended)

Every screen design should include frames for:

| State | Frame Suffix | Purpose |
| --- | --- | --- |
| Default | `/Default` | Normal loaded state with data |
| Loading | `/Loading` | Skeleton loading state |
| Empty | `/Empty` | Empty state with CTA |
| Error | `/Error` | Error boundary state |
| Mobile | `/Mobile` | 360px viewport |

## Anti-Patterns

| Wrong | Right |
| --- | --- |
| Read `.pen` with `Read` tool | Use `batch_get` (binary/encrypted format) |
| Grep inside `.pen` files | Use `batch_get(patterns=...)` |
| Design without `get_editor_state` first | Always check editor state first |
| Skip `get_screenshot` after changes | Always verify visually |
| Hardcode hex colors in designs | Use Pencil variables (`$--variable-name`) |
| >25 operations in one `batch_design` | Split into multiple calls |
| Design without loading guidelines | Call `get_guidelines` first |
| `replace_all_matching_properties` for variables | Use `batch_design` with `U()` ops (bug: escapes `$`) |

## Quick Reference: Tool Decision Matrix

| I want to... | Tool |
| --- | --- |
| See what's currently open | `get_editor_state` |
| Open a .pen file | `open_document(path)` |
| Create a new .pen file | `open_document('new')` |
| Search for design elements | `batch_get(patterns=[...])` |
| Read specific nodes | `batch_get(nodeIds=[...])` |
| Create/edit design elements | `batch_design(operations)` |
| Take a visual screenshot | `get_screenshot` |
| Check layout positions | `snapshot_layout` |
| Load design guidelines | `get_guidelines(topic=...)` |
| Browse style guide options | `get_style_guide_tags` |
| Load a style guide | `get_style_guide(tags, name)` |
| Read design tokens | `get_variables` |
| Update design tokens | `set_variables` |
| Find empty canvas space | `find_empty_space_on_canvas` |
| Audit properties | `search_all_unique_properties` |
| Bulk-replace properties | `replace_all_matching_properties` |

## MCP Configuration

Pencil MCP is **built into the Pencil application**. No `.mcp.json` entry needed.

**Prerequisites:**
1. Pencil app must be installed (https://pencil.dev)
2. Pencil app must be **open** when using MCP tools
3. The MCP server starts automatically when Pencil launches

**Troubleshooting:**
- If Pencil MCP tools are not available, verify Pencil is running
- Restart Pencil if the connection drops
- Check IDE MCP settings to confirm Pencil appears in the server list

## Reference Documentation

- Pencil Docs: https://docs.pencil.dev
- .pen Format: https://docs.pencil.dev/for-developers/the-pen-format
- AI Integration: https://docs.pencil.dev/getting-started/ai-integration
- Design-to-Code: https://docs.pencil.dev/design-and-code/design-to-code

---

**Version**: 1.1.0
**Category**: ui-design
**Priority**: 7
**Auto-Activate**: Yes
**Last Updated**: 2026-03-04
