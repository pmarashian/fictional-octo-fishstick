/**
 * Logging and Progress Tracking System
 *
 * This module provides comprehensive logging and progress tracking capabilities
 * for the Ralph orchestrator's development workflow execution. It maintains
 * both human-readable progress files and structured JSON logs for analysis.
 *
 * Logging Architecture:
 * - Progress Tracking: Human-readable progress.txt with task completion status
 * - Activity Logging: Structured JSONL logs for each task execution
 * - File Locations: All logs stored in project directory (process.cwd()/logs/)
 * - Run Isolation: Each orchestrator run gets unique timestamp-based ID
 *
 * Log File Formats:
 * - progress.txt: Markdown-style progress updates with timestamps
 * - task-*.jsonl: JSON Lines format with structured log entries
 *
 * Key Functions:
 * - countUncheckedCheckboxes(): Parse task completion from markdown
 * - updateProgressWithTaskCompletion(): Update progress file on task completion
 * - createActivityLogger(): Create per-task loggers with structured output
 *
 * This dual logging approach enables both human monitoring during execution
 * and detailed analysis of the development workflow afterward.
 */

import fs from "fs-extra";
import path from "path";
import { LOG_DIR, RUN_ID, PROGRESS_PATH } from "./config.mjs";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Count Unchecked Checkboxes in Markdown Text
 *
 * Parses markdown text to count unchecked task checkboxes (e.g., "[ ]" or "[  ]").
 * This is used to determine how many tasks remain incomplete in task breakdowns
 * or progress tracking documents.
 *
 * Regex Pattern: /\[\s*\]/g
 * - \[ : Literal opening bracket
 * - \s* : Zero or more whitespace characters
 * - \] : Literal closing bracket
 *
 * Examples:
 * - "[ ] Task one" → counts as 1 unchecked
 * - "[x] Task two" → doesn't match (checked)
 * - "[  ] Task three" → counts as 1 unchecked
 *
 * @param {string} text - Markdown text to parse
 * @returns {number} Count of unchecked checkboxes found
 */
export function countUncheckedCheckboxes(text) {
  return (text.match(/\[\s*\]/g) || []).length;
}

/**
 * Update Progress File with Task Completion Information
 *
 * Updates the human-readable progress tracking file when a development task
 * is completed. The progress file provides real-time status updates that can
 * be monitored during execution or reviewed afterward.
 *
 * Progress File Format:
 * - Location: project/tasks/progress.txt (human-readable markdown)
 * - Structure: Timestamped entries with task status and summaries
 * - Updates: Either modifies existing "in progress" entries or creates new completion entries
 *
 * Update Logic:
 * 1. Read existing progress file (create if doesn't exist)
 * 2. Find most recent entry for this task ID
 * 3. If found: Replace "Work in progress" with completion details
 * 4. If not found: Append new completion entry
 * 5. Include task description and output summary
 *
 * @param {string|number} taskId - Unique identifier for the completed task
 * @param {string} description - Human-readable task description
 * @param {string} output - Full output/result of task execution
 * @returns {Promise<void>} Resolves when progress file is updated
 */
export async function updateProgressWithTaskCompletion(taskId, description, output) {
  // Progress file is created in the project directory (tasks/progress.txt)
  // This keeps progress tracking with the project being developed
  await fs.ensureFile(PROGRESS_PATH);

  // Read existing progress content, handle empty/non-existent files gracefully
  let progressContent = "";
  try {
    progressContent = await fs.readFile(PROGRESS_PATH, "utf8");
  } catch (e) {
    // File doesn't exist or is empty - that's fine, we'll create new content
  }

  // Find the most recent progress entry for this specific task
  // Regex pattern matches: "## [timestamp] - Task [taskId]" followed by content until next "##" or end
  const taskEntryRegex = new RegExp(
    `(## .* - Task ${taskId})([\\s\\S]*?)(?=## |$)`,  // Non-greedy match until next section
  );
  const match = progressContent.match(taskEntryRegex);

  if (match) {
    // Task entry exists - update it from "in progress" to "completed"
    const outputSummary = output.substring(0, 200).replace(/\n/g, " ");  // First 200 chars, flatten lines
    const updatedEntry = match[0].replace(
      /- Work in progress/,  // Replace the in-progress marker
      `- ✅ Completed: ${description.substring(0, 80)}\n- Summary: ${outputSummary}...`,  // With completion details
    );
    // Replace the matched entry with the updated version
    const updatedContent = progressContent.replace(
      taskEntryRegex,
      updatedEntry,
    );
    await fs.writeFile(PROGRESS_PATH, updatedContent, "utf8");

  } else {
    // No existing entry found - create new completion entry
    // This handles cases where tasks complete without prior "in progress" entries
    const timestamp = new Date().toISOString();
    const outputSummary = output.substring(0, 200).replace(/\n/g, " ");
    const newEntry = `\n## ${timestamp} - Task ${taskId}\n- ✅ Completed: ${description.substring(0, 80)}\n- Summary: ${outputSummary}...\n---\n`;
    await fs.appendFile(PROGRESS_PATH, newEntry, "utf8");
  }
}

/**
 * Create Structured Activity Logger for Task Execution
 *
 * Creates a JSONL (JSON Lines) logger specifically for tracking activity during
 * a single task execution. Each log entry is a complete JSON object on its own line,
 * making the logs easy to parse and analyze.
 *
 * Log File Naming: task-{taskId}-{role}-{runId}.jsonl
 * - taskId: Unique task identifier
 * - role: Agent role/type performing the task (e.g., "developer", "reviewer")
 * - runId: Unique orchestrator run identifier (timestamp-based)
 *
 * Log Entry Format (JSON):
 * {
 *   "timestamp": "2024-01-01T12:00:00.000Z",
 *   "level": "info|error|debug|warn",
 *   "message": "Human-readable log message",
 *   ...additionalData
 * }
 *
 * @param {string|number} taskId - Unique identifier for the task being logged
 * @param {string} role - Role/type of agent performing the task
 * @returns {Promise<{log: Function}>} Logger object with log method
 */
export async function createActivityLogger(taskId, role) {
  // Logs are created in the project directory (logs/), not the orchestrator directory
  // This keeps detailed execution logs with the project for debugging and analysis
  const logFile = path.join(LOG_DIR, `task-${taskId}-${role}-${RUN_ID}.jsonl`);

  // Check if logs directory exists, create informative message if creating
  try {
    await fs.access(LOG_DIR);
  } catch {
    // Directory doesn't exist yet - will be created by ensureDir below
    console.log(`Creating logs directory: ${LOG_DIR}`);
  }

  // Ensure directory and file exist
  await fs.ensureDir(LOG_DIR);
  await fs.ensureFile(logFile);

  // Return logger object with structured logging method
  return {
    /**
     * Log an activity entry to the JSONL file
     *
     * @param {string} level - Log level (info, error, debug, warn, etc.)
     * @param {string} message - Human-readable log message
     * @param {Object} data - Additional structured data to include in the log entry
     */
    log: (level, message, data = {}) => {
      // Create structured log entry with consistent format
      const entry = {
        timestamp: new Date().toISOString(),  // ISO 8601 timestamp
        level,                                // Log level for filtering
        message,                             // Human-readable message
        ...data,                             // Additional context data
      };

      // Append JSON line to log file (synchronous for immediate writes during execution)
      fs.appendFileSync(logFile, JSON.stringify(entry) + "\n");
    },
  };
}