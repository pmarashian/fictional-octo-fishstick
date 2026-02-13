/**
 * User Input Handling and Interactive Workflows
 *
 * This module provides utilities for collecting user input and managing interactive
 * approval workflows throughout the Ralph orchestrator. It handles multi-line text
 * input and iterative refinement loops for AI-generated content.
 *
 * Key Functions:
 * - getMultiLineInput(): Collects user messages with multi-line support
 * - interactiveLoop(): Manages approve/regenerate/edit cycles for AI outputs
 *
 * Interactive Loop Pattern:
 * 1. AI generates content based on current prompt
 * 2. User reviews output and chooses: Approve / Regenerate / Edit
 * 3. If approved: Return final result
 * 4. If regenerate: Retry with original prompt
 * 5. If edit: Incorporate user feedback and regenerate
 * 6. Repeat until approved or max iterations reached
 *
 * This pattern ensures user control over AI-generated content while allowing
 * iterative refinement without losing the conversation context.
 */

import prompts from "prompts";
import fs from "fs-extra";
import path from "path";

/**
 * Check if running in non-interactive mode
 * @returns {boolean} True if non-interactive (no TTY or CI environment)
 */
function isNonInteractive() {
  return !process.stdin.isTTY || process.env.CI === 'true' || process.env.NON_INTERACTIVE === 'true';
}

/**
 * Collect Multi-Line User Input
 *
 * Prompts the user to enter a message that can span multiple lines. This is
 * typically used for initial project descriptions or feedback during interactive
 * workflows. The function provides clear instructions about multi-line support.
 *
 * Input Context:
 * - Used for initial project requirements input
 * - Supports pasting multi-line text from other sources
 * - Displays as "message to PM" (Product Manager) for clarity
 *
 * Error Handling:
 * - Throws "User cancelled the prompt" if user cancels (Ctrl+C)
 * - Allows empty input to be handled by caller if needed
 *
 * @returns {Promise<string>} The user's input message
 * @throws {Error} If user cancels the prompt
 */
export async function getMultiLineInput() {
  if (isNonInteractive()) {
    throw new Error("Non-interactive mode: cannot prompt for multi-line input");
  }

  console.log("Enter your message to the PM (you can paste multi-line text):");

  const response = await prompts({
  type: "text", // Free-form text input (supports multi-line)
  name: "message", // Response property name
  message: "Your message to PM:", // Prompt displayed to user
  });

  // Handle user cancellation (Ctrl+C) with consistent error message
  if (!response.message) {
  throw new Error("User cancelled the prompt");
  }

  return response.message;
}

/**
 * Interactive PRD File Selection
 *
 * Presents a menu of existing PRD files in the project's prds/ directory and
 * allows the user to select one. This function handles only the user interaction
 * aspect, returning the selected filename for file operations to be handled
 * elsewhere.
 *
 * PRD File Format:
 * - Location: project/prds/ directory
 * - Format: Markdown files with .md extension
 * - Excludes: TEMPLATE.md (reserved for generation template)
 *
 * @returns {Promise<string|null>} Selected PRD filename (without path), or null if none selected/no PRDs found
 */
export async function selectPRDFile() {
  if (isNonInteractive()) {
    // In non-interactive mode, try to find the most recent PRD file
    const prdsDir = path.join(process.cwd(), "prds");
    try {
      const prdFiles = (await fs.readdir(prdsDir))
        .filter((file) => file.endsWith(".md") && file !== "TEMPLATE.md")
        .sort()
        .reverse(); // Most recent first

      if (prdFiles.length > 0) {
        console.log(`Non-interactive mode: using most recent PRD: ${prdFiles[0]}`);
        return prdFiles[0];
      }
    } catch (error) {
      // Directory does not exist
    }
    console.log("Non-interactive mode: no PRD files found");
    return null;
  }
  // PRDs are stored in the project directory (where command is run)
  // This keeps project requirements with the project files
  const prdsDir = path.join(process.cwd(), "prds");

  try {
  // Read and filter PRD files - only include actual PRDs, exclude templates
  // PRD files are markdown documents containing project requirements
  const prdFiles = (await fs.readdir(prdsDir))
  .filter((file) => file.endsWith(".md") && file !== "TEMPLATE.md") // Exclude template
  .sort(); // Alphabetical sorting for consistent menu order

  if (prdFiles.length === 0) {
  console.log("No existing PRDs found in the prds folder.");
  return null;
  }

  // Format PRD filenames for menu display - remove "prd-" prefix and ".md" extension
  // This makes the menu more user-friendly (e.g., "pixel-maze" instead of "prd-pixel-maze.md")
  const choices = prdFiles.map((file, _index) => ({
  title: file.replace("prd-", "").replace(".md", ""), // Clean display name
  value: file, // Keep full filename for file operations
  description: `Select ${file}`,
  }));

  const response = await prompts({
  type: "select",
  name: "selectedPRD",
  message: "Choose an existing PRD:",
  choices: choices,
  initial: 0, // Start selection on first PRD
  });

  // Handle user cancellation or no selection
  if (!response.selectedPRD) {
  console.log("No PRD selected.");
  return null;
  }

  return response.selectedPRD;
  } catch (error) {
  // Handle case where prds directory doesn't exist
  console.log("No PRDs directory found.");
  return null;
  }
}

/**
 * Interactive File Selection from PRDs Folder
 *
 * Presents a menu of all files in the project's prds/ directory (any file type)
 * and allows the user to select one. This function handles only the user interaction
 * aspect, returning the selected filename for file operations to be handled
 * elsewhere.
 *
 * File Format:
 * - Location: project/prds/ directory
 * - Format: Any file type (not limited to .md)
 * - Excludes: TEMPLATE.md (reserved for generation template)
 *
 * @returns {Promise<string|null>} Selected filename (without path), or null if none selected/no files found
 */
export async function selectFileFromPRDsFolder() {
  if (isNonInteractive()) {
    // In non-interactive mode, try to find the most recent file
    const prdsDir = path.join(process.cwd(), "prds");
    try {
      const files = (await fs.readdir(prdsDir))
        .filter((file) => file !== "TEMPLATE.md")
        .sort()
        .reverse(); // Most recent first

      if (files.length > 0) {
        console.log(`Non-interactive mode: using most recent file: ${files[0]}`);
        return files[0];
      }
    } catch (error) {
      // Directory does not exist
    }
    console.log("Non-interactive mode: no files found in prds folder");
    return null;
  }
  // PRDs are stored in the project directory (where command is run)
  // This keeps project requirements with the project files
  const prdsDir = path.join(process.cwd(), "prds");

  try {
  // Read all files - include any file type, not just .md
  // PRD files are markdown documents containing project requirements
  const files = (await fs.readdir(prdsDir))
  .filter((file) => file !== "TEMPLATE.md") // Exclude template
  .sort(); // Alphabetical sorting for consistent menu order

  if (files.length === 0) {
  console.log("No files found in the prds folder.");
  return null;
  }

  // Format filenames for menu display - show full filename
  const choices = files.map((file, _index) => ({
  title: file, // Display full filename
  value: file, // Keep full filename for file operations
  description: `Select ${file}`,
  }));

  const response = await prompts({
  type: "select",
  name: "selectedFile",
  message: "Choose a file from prds folder:",
  choices: choices,
  initial: 0, // Start selection on first file
  });

  // Handle user cancellation or no selection
  if (!response.selectedFile) {
  console.log("No file selected.");
  return null;
  }

  return response.selectedFile;
  } catch (error) {
  // Handle case where prds directory doesn't exist
  console.log("No PRDs directory found.");
  return null;
  }
}

/**
 * Interactive Task File Selection
 *
 * Presents a menu of existing task JSON files in the project's tasks/ directory.
 * This function handles only the user interaction aspect, returning the selected
 * filename for file operations to be handled elsewhere.
 *
 * Task File Format:
 * - Location: project/tasks/ directory
 * - Format: JSON files containing structured task data
 * - Naming: "tasks.json" or "[name]-tasks.json"
 * - Structure: Array of user stories with id, description, acceptance criteria, etc.
 *
 * @returns {Promise<string|null>} Selected task filename, or null if none selected/no files found
 */
export async function selectTasksFile() {
  if (isNonInteractive()) {
    // In non-interactive mode, use "tasks.json" if it exists
    const tasksDir = path.join(process.cwd(), "tasks");
    const defaultTasksFile = path.join(tasksDir, "tasks.json");

    try {
      await fs.access(defaultTasksFile);
      console.log("Non-interactive mode: using tasks.json");
      return "tasks.json";
    } catch (error) {
      console.log("Non-interactive mode: tasks.json not found");
      return null;
    }
  }

  // Tasks are stored in the project directory (where command is run)
  // This keeps development artifacts with the project being developed
  const tasksDir = path.join(process.cwd(), "tasks");

  try {
  // Verify tasks directory exists before attempting to read files
  // Gracefully handle case where no development workflow has been run yet
  await fs.access(tasksDir);
  } catch {
  console.log("No tasks directory found.");
  return null;
  }

  try {
  // Find all task JSON files - support both standard naming and custom names
  // Standard: tasks.json, Custom: [project-name]-tasks.json
  // This allows multiple projects or iterations to coexist
  const tasksFiles = (await fs.readdir(tasksDir))
  .filter((file) => file === "tasks.json" || file.endsWith("-tasks.json"))
  .sort(); // Alphabetical sorting for consistent menu order

  if (tasksFiles.length === 0) {
  console.log("No existing tasks.json files found in the tasks folder.");
  return null;
  }

  // Format task filenames for menu display - clean up the names for readability
  // "tasks.json" becomes "tasks", "pixel-maze-tasks.json" becomes "pixel-maze"
  const choices = tasksFiles.map((file, _index) => ({
  title: file.replace("-tasks.json", "").replace("tasks.json", "tasks"), // Clean display
  value: file, // Keep full filename for file operations
  description: `Select ${file}`,
  }));

  const response = await prompts({
  type: "select",
  name: "selectedTasks",
  message: "Choose a tasks file:",
  choices: choices,
  initial: 0, // Start selection on first tasks file
  });

  // Handle user cancellation or no selection
  if (!response.selectedTasks) {
  console.log("No tasks file selected.");
  return null;
  }

  return response.selectedTasks;
  } catch (error) {
  console.log("Error reading tasks directory.");
  return null;
  }
}

/**
 * Prompt for how many tasks to complete this run.
 *
 * @param {number} incompleteCount - Number of incomplete tasks (for display)
 * @returns {Promise<{ limit: number|null, cancelled: boolean }>} limit: null = "all", number = max tasks; cancelled: true = user cancelled
 */
export async function promptTaskLimit(incompleteCount) {
  if (isNonInteractive()) {
    console.log(`Non-interactive mode: completing all ${incompleteCount} tasks`);
    return { limit: null, cancelled: false }; // null = all tasks
  }

  const response = await prompts({
  type: "text",
  name: "limit",
  message: `How many tasks to complete this run? (${incompleteCount} incomplete)`,
  initial: "all",
  });

  if (response.limit === undefined) {
  return { limit: null, cancelled: true };
  }

  const raw = String(response.limit ?? "").trim().toLowerCase();
  if (raw === "" || raw === "all") {
  return { limit: null, cancelled: false };
  }

  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) {
  return { limit: null, cancelled: false }; // Invalid → treat as "all"
  }
  return { limit: n, cancelled: false };
}

/**
 * Interactive Approval and Refinement Loop
 *
 * Manages an iterative workflow where AI generates content, user reviews it,
 * and can request regeneration or provide feedback for refinement. This pattern
 * ensures user control over AI outputs while allowing multiple improvement cycles.
 *
 * Workflow Steps:
 * 1. AI generates content using current prompt
 * 2. Display output for user review
 * 3. User chooses: Approve / Regenerate / Edit with feedback
 * 4. If approved: Return final result and exit
 * 5. If regenerate: Retry with original prompt
 * 6. If edit: Incorporate feedback and regenerate
 * 7. Repeat until approved or max iterations reached
 *
 * Use Cases:
 * - PRD generation with clarification rounds
 * - Task breakdown refinement
 * - Any scenario requiring user approval of AI-generated content
 *
 * @param {string} initialPrompt - The base prompt for AI generation
 * @param {string} model - AI model to use for generation
 * @param {string} stepName - Name of the workflow step (e.g., "PRD", "Tasks")
 * @param {number} maxIterations - Maximum refinement cycles (default: 5)
 * @param {Object|null} mcpConfig - MCP configuration for agent communication
 * @returns {Promise<string>} The approved final output
 * @throws {Error} If max iterations reached without approval or user cancels
 */
export async function interactiveLoop(
  initialPrompt,
  model,
  stepName,
  maxIterations = 5,
  mcpConfig = null,
) {
  if (isNonInteractive()) {
    throw new Error(`Non-interactive mode: cannot run interactive approval loop for ${stepName}`);
  }

  // Dynamic import to avoid circular dependency with agent-runner.mjs
  // agent-runner imports prompts for user interaction, creating potential cycles
  const { runAgent } = await import("./agent-runner.mjs");

  // Initialize loop state - start with original prompt, track iterations
  let prompt = initialPrompt; // Current prompt (original or modified with feedback on iterations)
  let iterations = 0; // Track number of refinement cycles

  // Main interactive loop - continue until approved or max iterations reached
  while (iterations < maxIterations) {
  // Generate content using AI agent with current prompt
  const { output } = await runAgent(
  prompt, // Current prompt (original or refined)
  model, // AI model for generation
  process.cwd(), // Project directory context
  null, // No custom system message
  () => {}, // Empty progress callback (no progress tracking needed)
  null, // No specific tools required
  mcpConfig, // MCP configuration if provided
  );

  // Display generated output for user review with clear formatting
  console.log(
  `\n${stepName} Output: ============================\n${output}\n`,
  );
  console.log("================================================");

  // Present approval options to user
  const response = await prompts({
  type: "select",
  name: "choice",
  message: `Approve ${stepName}?`,
  choices: [
  { title: "Yes", value: "yes" }, // Accept the output as final
  { title: "No (regenerate)", value: "no" }, // Regenerate with original prompt
  { title: "Edit with feedback", value: "edit" }, // Provide feedback for refinement
  ],
  });

  // Handle user cancellation of the approval prompt
  if (!response.choice) {
  throw new Error("User cancelled the prompt");
  }

  const userChoice = response.choice; // "yes", "no", or "edit"

  // === APPROVAL PATH ===
  if (userChoice === "yes") {
  return output; // Return approved content and exit loop
  }

  // === EDIT WITH FEEDBACK PATH ===
  else if (userChoice === "edit") {
  // Collect user feedback for refinement
  const editResponse = await prompts({
  type: "text",
  name: "feedback",
  message: "Enter your edits/feedback:",
  });

  if (!editResponse.feedback) {
  throw new Error("User cancelled the prompt");
  }

  // Construct refined prompt incorporating user feedback
  const userFeedback = editResponse.feedback;
  prompt = `Refine the previous ${stepName} based on this feedback: ${userFeedback}\nPrevious output: ${output}`;
  }

  // === REGENERATE PATH ===
  else {
  // Reset to original prompt for fresh generation attempt
  console.log("Regenerating...");
  prompt = initialPrompt;
  }

  iterations++; // Increment iteration counter
  }

  // Loop exited without approval - max iterations reached
  throw new Error(`Max iterations reached for ${stepName} without approval.`);
}
