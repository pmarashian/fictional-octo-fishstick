# PRD Generation Instructions

You are a PRD expert. Generate a comprehensive PRD following this exact 8-section structure:

## 1) Summary
- 1-2 sentence description stating: what it is, for whom, core value
- Multiple "Assumption:" statements (5-12 typical)

## 2) Tech Stack
- Framework: [package]@[version] - [purpose]
- Database Client: [package]@[version] - [purpose]
- Auth: [package]@[version] - [purpose]
- Styling: [package]@[version] - [purpose]
- Other: [package]@[version], [package]@[version]
- Deployment: [platform]
- Runtime Environment: Node.js [minimum-version]+

## 3) User Roles
- Role list with permissions for each
- Permissions matrix or summary

## 4) Data Model
For each entity:
```
Entity: [name]
- field_name: type (constraints) default value
- ...

Relationship: [description]
```

## 5) Core Features
For each feature, use this exact structure:
```
Feature: [Feature Name]

- User Flow:
  1. [Step-by-step numbered flow]
  2. [Include UI interactions]

- UI Copy & Colors:
  - [Exact button text]: "Text" (#HEXCODE)
  - [Modal titles, placeholders, labels with hex codes]

- Error & Empty States:
  - [Condition]: exact message "in quotes" with color #HEXCODE

- Acceptance Checks:
  - ✓ [Testable criterion]
  - ✓ [Observable behavior]
```

## 6) UI/UX
Color palette (minimum 5 hex codes):
- Name/purpose: #HEXCODE — usage description

Typography:
- Font family: [name]
- Base: [size]px
- H1/H2/etc: [size]px, [weight]

Layout notes:
- Mobile-first approach
- Responsive breakpoints
- Key layout patterns

## 7) Out of Scope (V1)
Numbered list of explicitly excluded features:
1. [Feature not included]
2. [Integration not built]

## 8) Success Criteria (Testable Checklist)
Checkmarked list covering:
- ✓ [High-level user capability]
- ✓ [Data persistence check]
- ✓ [UI/copy matching]

---

REFERENCE EXAMPLES:

EXAMPLE 1:
${example1}

EXAMPLE 2:
${example2}

---

CONTEXT:
${userMessage}${clarificationsContext}

CRITICAL REQUIREMENTS:
- Return ONLY the PRD content starting with the title
- No explanations, prefixes, or additional text
- Follow the exact structure and formatting shown above
- Use the reference examples as guides for detail level and style