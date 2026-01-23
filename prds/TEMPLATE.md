# PRD Template - Product Requirements Document

## Overview

This template ensures consistent, comprehensive PRDs that can be directly used for task generation. All PRDs must follow this exact 8-section structure.

## Template Structure

### Header Format
```
[Product Name] — Product Requirements Document
```

### 1) Summary
- **1-2 sentence description** stating: what it is, for whom, core value
- **Multiple "Assumption:" statements** (5-12 typical)
  - Technical constraints, scope boundaries, data/integration limitations
  - User environment assumptions

### 2) Tech Stack

**Core Dependencies** (must specify npm package names and versions):
- Framework: [npm-package-name]@[version] - [purpose]
- UI/Components: [npm-package-name]@[version] - [purpose]
- Database Client: [npm-package-name]@[version] - [purpose]
- Auth: [npm-package-name]@[version] - [purpose]
- Styling: [npm-package-name]@[version] - [purpose]
- Other: [npm-package-name]@[version], [npm-package-name]@[version]

**Development Dependencies** (optional):
- Testing: [npm-package-name]@[version] - [purpose]
- Build/Linting: [npm-package-name]@[version] - [purpose]

**Deployment:** [platform]

**Runtime Environment:** Node.js [minimum-version]+

### 3) User Roles
- **Role list** with permissions for each
- **Permissions matrix or summary** showing who can do what
- Include unauthenticated/anonymous states if applicable

### 4) Data Model
For each entity:
```
Entity: [name]

- field_name: type (constraints) default value
- ...

Relationship: [description]
```
- Include enums, indexes, unique constraints
- Show relationships explicitly
- Notes section for clarifications

### 5) Core Features
For each feature, use this **exact structure**:

```
Feature: [Feature Name]

- User Flow:
  1. [Step-by-step numbered flow]
  2. [Include UI interactions]
  3. [State changes]

- UI Copy & Colors:
  - [Exact button text]: "Text" (#HEXCODE)
  - [Modal titles, placeholders, labels with hex codes]
  - [All user-facing text specified]

- Error & Empty States:
  - [Condition]: exact message "in quotes" with color #HEXCODE
  - [Empty state messages and CTAs]

- Acceptance Checks:
  - ✓ [Testable criterion]
  - ✓ [Observable behavior]
  - ✓ [Specific outcome]
```

### 6) UI/UX

**Color palette (minimum 5 hex codes)**
```
- Name/purpose: #HEXCODE — usage description
- [Include at least primary, success, danger, background, text colors]
```

**Typography**
```
- Font family: [name]
- Base: [size]px
- H1/H2/etc: [size]px, [weight]
- [Other text styles]
```

**Layout notes**
- Mobile-first approach
- Responsive breakpoints
- Key layout patterns

### 7) Out of Scope (V1)
Numbered list of explicitly excluded features:
1. [Feature not included]
2. [Integration not built]
3. [Nice-to-have deferred]

### 8) Success Criteria (Testable Checklist)
Checkmarked list covering:
- ✓ [High-level user capability]
- ✓ [Data persistence check]
- ✓ [UI/copy matching]
- ✓ [Error handling verification]
- ✓ [No console errors in core flows]

## Formatting Rules

### Critical Rules
- **Extreme specificity** - Every button label, error message, color must be exact
- **Hex codes everywhere** - All colors specified as hex with usage
- **Numbered user flows** - Step-by-step interactions
- **Checkmarked criteria** - Use ✓ for all acceptance checks
- **Exact copy in quotes** - UI text always in "quotes"
- **Error states mandatory** - Every feature must define error and empty states

### Minimum Requirements
- Color palette: 5+ hex codes with usage descriptions
- Success criteria: At least 3 ✓ items per major feature
- Error states: Defined for every user flow
- Empty states: Handled for all data-dependent views

## Implementation Notes

- **Section 2 (Tech Stack)** package specifications create verification tasks where agents check for packages and prompt users if missing
- **Section 5 (Core Features)** maps directly to tasks in task generation
- **Section 4 (Data Model)** helps identify backend vs frontend tasks
- **The format is deterministic** - enables reliable LLM parsing for task extraction
- **Package versions must be explicit** (e.g., next@15.0.0, not "Next.js 15") for dependency verification
- **Users must install dependencies manually** - agents will detect missing packages and pause for user installation

## Example Title Format
- "SimpleBoard — Product Requirements Document"
- "RecipeShare — Product Requirements Document"
- "PixelLab Asset Creator — Product Requirements Document"