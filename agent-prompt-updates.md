# Agent Prompt Updates

**Source:** Analysis of 28 task execution logs  
**Date:** 2026-01-26  
**Purpose:** System-level agent prompt improvements to be implemented separately from skills

---

## Overview

These are agent prompt/system-level updates recommended based on log analysis. These should be integrated into the agent system prompt or workflow instructions, separate from the skill implementations.

**Total Updates:** 12  
**High Priority:** 4  
**Medium Priority:** 7  
**Low Priority:** 1

---

## High Priority Updates

### 3.1 Mandatory Skill Discovery Workflow

**Priority:** High  
**Category:** Process Compliance

**Current Issue:**
Some agents skip skill discovery step, missing relevant skills.

**Recommended Addition:**

```markdown
MANDATORY WORKFLOW - DO NOT SKIP:

1. Read task file
2. Read progress.txt for context
3. Call search_skills("") to discover ALL available skills
4. Load required skills based on task type:
   - Phaser tasks: phaser-game-testing (MANDATORY)
   - Web tasks: agent-browser (MANDATORY)
   - TypeScript tasks: typescript-incremental-check
5. Review skill instructions before proceeding
6. Proceed with implementation
```

**Rationale:**

- Observed in US-002, US-004: Agents skipped skill discovery
- Pattern: Direct to implementation without skill loading
- Impact: Missing best practices and testing patterns

---

### 3.2 Pre-Implementation Verification Requirement

**Priority:** High  
**Category:** Workflow Efficiency

**Current Issue:**
Agents implement features that already exist, wasting time.

**Recommended Addition:**

```markdown
BEFORE IMPLEMENTING NEW FUNCTIONALITY:

1. Search codebase for existing implementations:
   - Use codebase_search() with relevant keywords
   - Use grep to find function/class names
   - Check test seam commands for feature indicators

2. Verify current state:
   - Run application if possible
   - Check test seams for existing functionality
   - Review progress.txt for recent implementations

3. Decision:
   - If feature exists: Switch to verification mode
   - Verify functionality meets requirements
   - Document findings in progress.txt
   - Only implement if feature is missing or incomplete
```

**Rationale:**

- Observed in US-030, US-036: Features already implemented
- Pattern: Implementation → Discovery of existing code
- Impact: 20-40% time waste on redundant work

---

### 3.3 Early TypeScript Validation Requirement

**Priority:** High  
**Category:** Code Quality

**Current Issue:**
TypeScript errors discovered late, requiring multiple fix cycles.

**Recommended Addition:**

```markdown
TYPESCRIPT VALIDATION WORKFLOW:

1. After making ANY TypeScript changes:
   - Run `npx tsc --noEmit` or `npm run type-check` IMMEDIATELY
   - Do NOT proceed to testing until compilation succeeds

2. Fix errors systematically:
   - Address one error type at a time
   - Re-run type-check after each fix
   - Verify compilation before moving forward

3. Common issues to check:
   - Missing exports for imported functions
   - Type conflicts (class vs type names)
   - Property initialization in constructors
   - Global type extensions (Window.**TEST**)
```

**Rationale:**

- Observed in US-007, US-012, US-025: 3-5 TypeScript fix cycles
- Pattern: Code → Test → Type check → Fix → Re-test
- Impact: 30-60 seconds wasted per task

---

### 3.4 Functional Verification Mandate

**Priority:** High  
**Category:** Quality Assurance

**Current Issue:**
Tasks marked complete without functional verification.

**Recommended Addition:**

```markdown
CRITICAL: Task is NOT complete until ALL of the following are verified:

1. TypeScript compilation succeeds (no errors)
2. Application runs without crashes
3. Functionality is verified in browser/runtime:
   - For web apps: Use agent-browser for testing
   - For backend: Run unit tests or manual verification
4. No errors in console/logs
5. Success criteria explicitly met and documented

If primary testing tool fails:

- Use fallback testing methods (manual browser, unit tests, console verification)
- Document verification method used
- Never mark complete without functional verification
```

**Rationale:**

- Observed in US-032: Task marked complete with 0/5 criteria met
- Pattern: Code implementation → Testing failure → Abandon testing → Complete
- Impact: Unverified functionality, quality risk

---

## Medium Priority Updates

### 3.5 Async Operation Best Practices

**Priority:** Medium  
**Category:** Performance

**Current Issue:**
Excessive polling and premature download attempts for async operations.

**Recommended Addition:**

```markdown
ASYNC OPERATION BEST PRACTICES:
When working with async operations (PixelLab, ElevenLabs, etc.):

1. Polling Strategy:
   - Use exponential backoff: 5s → 10s → 20s → 40s intervals
   - Respect API-provided ETAs when available
   - Don't poll more frequently than every 5 seconds
   - Stop polling when status === "completed"

2. Download Validation:
   - ALWAYS verify status === "completed" before download
   - Handle HTTP 423 (Locked) errors gracefully
   - Don't attempt download until resource is ready

3. Parallel Work:
   - Use waiting time for parallel work:
     - Code integration
     - Documentation
     - Test preparation
   - Don't wait idly for async operations

4. Timeout Handling:
   - Set maximum timeout (e.g., 5 minutes for character generation)
   - Log progress and ETA for transparency
   - Handle timeout errors gracefully
```

**Rationale:**

- Observed in US-033: 10 status checks with 1-2s intervals
- Pattern: Aggressive polling, premature downloads
- Impact: 15-30 seconds wasted per async operation

---

### 3.6 Browser Testing Optimization Guidance

**Priority:** Medium  
**Category:** Performance

**Current Issue:**
Excessive sequential browser commands, inefficient testing.

**Recommended Addition:**

```markdown
BROWSER TESTING OPTIMIZATION:

1. Use Test Seams Efficiently:
   - Create composite test functions for common flows
   - Batch independent checks with Promise.all()
   - Use simple property checks instead of Promise polling

2. Test Seam Readiness:
   - Check window.**TEST**?.sceneKey directly
   - Avoid Promise-based polling for readiness
   - Use Object.keys(window.**TEST**.commands) for verification

3. Command Batching:
   - Group related verifications in single calls
   - Use test seam composite functions when available
   - Reduce wait times between commands

4. Cache Management:
   - Always use hard refresh in development
   - Clear cache before testing code changes
   - Use cache-busting URL parameters when needed
```

**Rationale:**

- Observed in US-011, US-014, US-021: 20-80 browser commands
- Pattern: Sequential individual commands
- Impact: 40-50% of testing time could be saved

---

### 3.7 Completion Marker Protocol

**Priority:** Medium  
**Category:** System Efficiency

**Current Issue:**
Character-by-character streaming causes timeouts.

**Recommended Addition:**

```markdown
COMPLETION MARKER PROTOCOL:

1. Output Format:
   - Output <ralph>COMPLETE</ralph> as a SINGLE ATOMIC STRING
   - Include in your final assistant response text
   - Do NOT use shell echo commands
   - Do NOT stream character-by-character

2. Timing:
   - Output immediately after final verification passes
   - Do NOT perform cleanup operations after completion marker
   - Signal completion before resource cleanup

3. Validation Before Completion:
   - All success criteria met
   - Functional testing completed
   - TypeScript compilation passed
   - No console errors
   - Progress.txt updated
```

**Rationale:**

- Observed in US-025, US-028, US-036: Streaming caused timeouts
- Pattern: Character-by-character output, 15+ seconds
- Impact: Timeout issues, unnecessary retries

---

### 3.8 Tool Selection Decision Framework

**Priority:** Medium  
**Category:** Tool Usage

**Current Issue:**
Agents select inappropriate tools (e.g., text_to_speech for testing).

**Recommended Addition:**

```markdown
TOOL SELECTION DECISION FRAMEWORK:
Before calling any tool, ask:

1. Is this tool appropriate for the current task phase?
   - Testing phase → agent-browser, not text_to_speech
   - Audio task → text_to_speech, not agent-browser

2. Is this tool necessary for the task?
   - Explain reasoning before calling
   - Consider free alternatives first
   - Verify tool availability/capability

3. Has this tool failed recently?
   - After 3 consecutive failures, switch to alternative
   - Never retry the same failing tool indefinitely
   - Use circuit breaker pattern for tool failures
```

**Rationale:**

- Observed in US-031: 37 failed text_to_speech attempts
- Pattern: Wrong tool selection, infinite retries
- Impact: Task failures, time waste

---

### 3.9 Error Recovery Patterns

**Priority:** Medium  
**Category:** Reliability

**Current Issue:**
Agents abandon workflows when tools fail.

**Recommended Addition:**

```markdown
ERROR RECOVERY PATTERNS:
When a tool fails:

1. Assess the failure:
   - Is the tool appropriate for the task?
   - Is this a transient error or permanent failure?
   - How many times has it failed?

2. Recovery Strategy:
   - If inappropriate tool: Switch immediately
   - If transient: Retry max 2 more times (3 total)
   - If permanent: Use alternative approach
   - After 3 failures: Never retry, use fallback

3. Fallback Methods:
   - Browser automation fails → Manual browser + checklist
   - Build fails → Type check first, incremental fixes
   - Test execution fails → Simplify test, verify prerequisites

4. Documentation:
   - Log which tool failed and why
   - Document fallback method used
   - Update progress.txt with learnings
```

**Rationale:**

- Observed in US-032: Testing abandoned after 2 failures
- Pattern: Single failure → Complete abandonment
- Impact: Unverified functionality, quality risk

---

### 3.10 Test Seam Planning Workflow

**Priority:** Medium  
**Category:** Workflow Efficiency

**Current Issue:**
Test seam commands added mid-testing, causing rebuilds.

**Recommended Addition:**

```markdown
TEST SEAM PLANNING WORKFLOW:
Before starting implementation:

1. Review task requirements
2. Identify testing needs
3. Check existing test seam commands in codebase
4. Plan additional test seam commands needed
5. Implement feature + test seam commands together
6. Build once
7. Test comprehensively

This prevents:

- Multiple rebuild cycles
- Mid-testing code changes
- Incomplete test coverage
```

**Rationale:**

- Observed in US-016: 4 rebuilds due to test seam additions
- Pattern: Add test seams reactively during testing
- Impact: 30-40 seconds wasted on rebuilds

---

## Low Priority Updates

### 3.11 Progress Tracking Requirements

**Priority:** Low  
**Category:** Observability

**Current Issue:**
Progress shows 0% despite successful completion.

**Recommended Addition:**

```markdown
PROGRESS TRACKING:

1. Update progress.txt incrementally:
   - After major milestones
   - When patterns are discovered
   - Before task completion

2. Document Learnings:
   - Use "Learnings for future iterations:" section
   - Include codebase patterns discovered
   - Document successful approaches
   - Note common pitfalls

3. Success Criteria Validation:
   - Explicitly verify each success criterion
   - Document verification method used
   - Update progress before completion marker
```

**Rationale:**

- Observed across multiple tasks: 0% progress despite completion
- Pattern: Progress tracking not synchronized with completion
- Impact: Reduced observability, tracking issues

---

### 3.12 File Context Management

**Priority:** Low  
**Category:** Performance

**Current Issue:**
Excessive file re-reading during implementation.

**Recommended Addition:**

```markdown
FILE CONTEXT MANAGEMENT:

1. After reading a file:
   - Maintain its contents in your context
   - Only re-read if you suspect external modifications
   - Use targeted reads (line ranges) when checking specific sections

2. File Reading Strategy:
   - Read files once at the start of implementation phase
   - Cache file contents mentally
   - Re-read only when necessary (external changes, verification)

3. Optimization:
   - Batch file reads when possible
   - Read only necessary sections of large files
   - Use codebase search before deep file reading
```

**Rationale:**

- Observed in US-018: 8+ reads of same file
- Pattern: Read before each edit, not maintaining context
- Impact: 2-5 seconds wasted per task

---

## Implementation Notes

### Integration Approach

These prompt updates should be integrated into:

1. **Agent System Prompt** - Core workflow instructions
2. **Task Execution Guidelines** - Per-task workflow rules
3. **Tool Usage Guidelines** - Tool-specific best practices
4. **Error Handling System** - Recovery and fallback patterns

### Priority Implementation Order

1. **High Priority (4 updates)** - Implement first for immediate impact
2. **Medium Priority (7 updates)** - Implement next for optimization
3. **Low Priority (1 update)** - Nice to have, implement when time permits

### Expected Impact

**Performance Improvements:**

- Reduce task execution time by 20-30% on average
- Eliminate timeout issues on completion
- Reduce testing overhead by 40-50%
- Prevent redundant implementation work

**Quality Improvements:**

- Ensure 100% functional verification coverage
- Catch type errors 50-60% earlier
- Standardize testing patterns
- Improve error handling consistency

**Reliability Improvements:**

- Provide fallback strategies for tool failures
- Prevent premature task completion
- Improve tool selection accuracy
- Enhance error recovery capabilities
