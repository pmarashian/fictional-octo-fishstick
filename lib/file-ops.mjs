/**
 * File Operations and Data Management
 *
 * This module provides file system utilities for the Ralph orchestrator, handling
 * the critical distinction between orchestrator assets and project-specific files.
 * It manages loading of system prompts, PRD selection/creation, and task file operations.
 *
 * Key Responsibilities:
 * - Loading system prompts from orchestrator assets (SCRIPT_DIR/prompts/)
 * - PRD file selection and content loading from project directory
 * - Task file generation and selection from project directory
 * - Directory creation and file management with proper error handling
 *
 * Directory Distinctions:
 * - SCRIPT_DIR: Orchestrator installation directory (contains prompts, templates)
 * - process.cwd(): User's project directory (contains PRDs, tasks, logs)
 *
 * File Format Support:
 * - PRDs: Markdown files in prds/ directory
 * - Tasks: JSON format with structured user story data
 * - Prompts: Text files loaded from orchestrator's prompts/ directory
 */

import fs from "fs-extra";
import path from "path";
import { SCRIPT_DIR } from "./config.mjs";

/**
 * Load System Prompt from Orchestrator Assets
 *
 * Loads prompt templates and system messages from the orchestrator's prompts directory.
 * These are static assets bundled with the orchestrator installation.
 *
 * Directory Context:
 * - Loads from: SCRIPT_DIR/prompts/filename (orchestrator installation)
 * - NOT from: process.cwd()/prompts/ (project directory)
 *
 * This separation ensures prompt consistency across different projects while
 * allowing the orchestrator to be updated independently of user projects.
 *
 * @param {string} filename - Name of the prompt file (e.g., "prd-generation.md")
 * @returns {Promise<string>} The prompt content as a UTF-8 string
 * @throws {Error} If the prompt file cannot be read
 */
export async function loadPrompt(filename) {
  const promptPath = path.join(path.dirname(SCRIPT_DIR), "prompts", filename);
  return await fs.readFile(promptPath, "utf8");
}

/**
 * Interactive PRD File Selection
 *
 * Presents a menu of existing PRD files in the project's prds/ directory and
 * allows the user to select one for further processing. PRDs are stored in
 * the project directory (process.cwd()) to keep them with the project files.
 *
 * PRD File Format:
 * - Location: project/prds/ directory
 * - Format: Markdown files with .md extension
 * - Naming: Typically "prd-[name].md" format
 * - Excludes: TEMPLATE.md (reserved for generation template)
 *
 * @returns {Promise<{prdPath: string, prdContent: string}|null>} Selected PRD path and content, or null if none selected/no PRDs found
 */
export async function selectExistingPRD() {
  // Import the user interaction function from prompts.mjs
  const { selectPRDFile } = await import("./prompts.mjs");

  // Get user selection through the prompts module
  const selectedPRD = await selectPRDFile();

  if (!selectedPRD) {
    return null;  // No selection made
  }

  // Load the selected PRD file content (file operations remain here)
  const prdsDir = path.join(process.cwd(), "prds");
  const prdPath = path.join(prdsDir, selectedPRD);
  const prdContent = await fs.readFile(prdPath, "utf8");

  console.log(`✓ Selected PRD: ${selectedPRD}`);
  return { prdPath, prdContent };
}

/**
 * Interactive Task File Selection
 *
 * Presents a menu of existing task JSON files in the project's tasks/ directory.
 * Tasks are stored in the project directory to keep development artifacts with the project.
 *
 * Task File Format:
 * - Location: project/tasks/ directory
 * - Format: JSON files containing structured task data
 * - Naming: "tasks.json" or "[name]-tasks.json"
 * - Structure: Array of user stories with id, description, acceptance criteria, etc.
 *
 * @returns {Promise<{tasksPath: string, tasksData: Object}|null>} Selected task file path and parsed data, or null if none selected/no files found
 */
export async function selectExistingTasksFile() {
  // Import the user interaction function from prompts.mjs
  const { selectTasksFile } = await import("./prompts.mjs");

  // Get user selection through the prompts module
  const selectedTasks = await selectTasksFile();

  if (!selectedTasks) {
    return null;  // No selection made
  }

  // Load and parse the selected tasks JSON file (file operations remain here)
  const tasksDir = path.join(process.cwd(), "tasks");
  const tasksPath = path.join(tasksDir, selectedTasks);
  const tasksContent = await fs.readFile(tasksPath, "utf8");
  const tasksData = JSON.parse(tasksContent);

  console.log(`✓ Selected tasks file: ${selectedTasks}`);
  return { tasksPath, tasksData };
}

/**
 * Generate Task Files from Task Breakdown Data
 *
 * Converts raw task breakdown data into structured JSON task files for development execution.
 * Creates the tasks directory in the project folder and generates a tasks.json file
 * with proper user story formatting and metadata.
 *
 * Task Data Structure:
 * - created_at: ISO timestamp of generation
 * - branchName: Git branch name for this task set (required)
 * - userStories[]: Array of structured tasks with:
 *   - id: "US-001", "US-002", etc. (User Story format)
 *   - title: Short title derived from description
 *   - description: Full task description
 *   - acceptanceCriteria: Success criteria for completion
 *   - priority: Task priority level
 *   - dependencies: Array of dependent task IDs
 *   - suggested_role: Recommended agent type for execution
 *   - passes: Boolean completion status
 *   - notes: Additional task notes
 *   - completed: Boolean completion flag
 *   - started_at/completed_at: Timestamps for tracking
 *   - output: Results of task execution
 *
 * @param {Array} tasks - Raw task data from task breakdown phase
 * @param {string|null} branchName - Git branch name for this task set
 * @returns {Promise<string>} Path to the generated tasks.json file
 */
export async function generateTaskFiles(tasks, branchName = null) {
  // Tasks are created in the project directory (where command is run), not the orchestrator directory
  // This keeps development artifacts with the project being developed
  const tasksDir = path.join(process.cwd(), "tasks");
  await fs.ensureDir(tasksDir);  // Create directory if it doesn't exist
  console.log(`Creating tasks directory: ${tasksDir}`);

  // Transform raw task data into structured user story format
  // Each task becomes a user story with standardized fields for development tracking
  const tasksData = {
    created_at: new Date().toISOString(),  // Timestamp when tasks were generated
    branchName: branchName,  // Git branch name for this task set
    userStories: tasks.map((task) => {
      // Validate success_criteria and warn if missing
      if (!task.success_criteria || !Array.isArray(task.success_criteria)) {
        console.warn(`Warning: Task ${task.id} missing success_criteria, using empty array`);
      }
      return {
      id: typeof task.id === 'string' && task.id.startsWith('US-') ? task.id : `US-${String(task.id).padStart(3, '0')}`,  // Handle both integer and pre-formatted string IDs
      title: task.description.split('.')[0].substring(0, 60) || task.description.substring(0, 60),  // Extract first sentence or truncate to 60 chars
      description: task.description,              // Full task description
      acceptanceCriteria: task.acceptanceCriteria || task.success_criteria || [],  // Success criteria for completion (default to empty array)
      priority: task.priority,                    // Task priority level
      dependencies: task.dependencies,            // Dependent task IDs
      suggested_role: task.suggested_role,        // Recommended agent type
      passes: false,                              // Completion status (initially false)
      notes: "",                                  // Additional notes (initially empty)
      completed: false,                           // Completion flag (initially false)
      started_at: null,                           // Execution start timestamp
      completed_at: null,                         // Execution completion timestamp
      output: null,                               // Task execution results
      };
    }),
  };

  // Write the structured tasks data to JSON file with pretty formatting
  const tasksJsonPath = path.join(tasksDir, "tasks.json");
  await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));  // 2-space indentation

  console.log(`✓ Generated tasks.json with ${tasks.length} tasks`);

  return tasksJsonPath;
}