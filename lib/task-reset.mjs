/**
 * Task Reset Functionality
 *
 * This module provides functionality to reset task completion status in tasks.json,
 * allowing users to restart development on completed tasks. It clears all completion
 * information while preserving the original task definitions and dependencies.
 *
 * Reset Operation:
 * - Loads tasks.json from project tasks/tasks.json directory
 * - Resets completion fields for all user stories:
 *   - passes: false (completion status)
 *   - completed: false (completion flag)
 *   - notes: "" (clears any notes)
 *   - started_at: null (removes start timestamp)
 *   - completed_at: null (removes completion timestamp)
 *   - output: null (removes execution results)
 * - Preserves all other task data (id, title, description, acceptanceCriteria, etc.)
 * - Saves modified tasks back to file
 * - Provides user feedback on the reset operation
 */

import fs from "fs-extra";
import path from "path";

/**
 * Reset Task Completion Status
 *
 * Clears all completion information from tasks.json, allowing users to restart
 * development on completed tasks. This operation preserves the task definitions
 * while resetting execution state.
 *
 * Reset Fields:
 * - passes: false - Reset completion status
 * - completed: false - Reset completion flag
 * - notes: "" - Clear any notes added during execution
 * - started_at: null - Remove execution start timestamp
 * - completed_at: null - Remove execution completion timestamp
 * - output: null - Remove execution results/output
 *
 * Preserved Fields:
 * - id, title, description, acceptanceCriteria, priority, dependencies, suggested_role
 * - created_at (file-level timestamp)
 *
 * @returns {Promise<{success: boolean, message: string, taskCount?: number}>}
 *         Success status, feedback message, and count of tasks reset
 */
export async function actionResetTasks() {
  try {
    // Path to tasks.json in project directory
    const tasksJsonPath = path.join(process.cwd(), "tasks", "tasks.json");

    // Check if tasks.json exists
    const exists = await fs.pathExists(tasksJsonPath);
    if (!exists) {
      return {
        success: false,
        message: "No tasks.json file found. Create tasks first using 'Create Tasks from PRD'.",
      };
    }

    // Load and parse tasks.json
    const tasksContent = await fs.readFile(tasksJsonPath, "utf8");
    const tasksData = JSON.parse(tasksContent);

    // Validate structure
    if (!tasksData.userStories || !Array.isArray(tasksData.userStories)) {
      return {
        success: false,
        message: "Invalid tasks.json structure. Missing or invalid userStories array.",
      };
    }

    const taskCount = tasksData.userStories.length;

    // Reset completion fields for all user stories
    tasksData.userStories = tasksData.userStories.map((task) => ({
      ...task, // Preserve all existing fields
      passes: false, // Reset completion status
      completed: false, // Reset completion flag
      notes: "", // Clear notes
      started_at: null, // Remove start timestamp
      completed_at: null, // Remove completion timestamp
      output: null, // Clear execution output
    }));

    // Save modified tasks back to file
    await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));

    return {
      success: true,
      message: `Successfully reset completion status for ${taskCount} task${taskCount !== 1 ? 's' : ''}.`,
      taskCount,
    };

  } catch (error) {
    // Handle various error conditions
    if (error.code === "ENOENT") {
      return {
        success: false,
        message: "Tasks directory not found. Create tasks first using 'Create Tasks from PRD'.",
      };
    } else if (error.name === "SyntaxError") {
      return {
        success: false,
        message: "Invalid JSON in tasks.json file. File may be corrupted.",
      };
    } else {
      return {
        success: false,
        message: `Error resetting tasks: ${error.message}`,
      };
    }
  }
}