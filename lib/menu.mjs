/**
 * User Interface Menu System
 *
 * This module provides the interactive menu interface for the Ralph orchestrator,
 * handling user navigation through the three-phase development workflow. It uses
 * the 'prompts' library to create a clean, keyboard-navigable CLI menu experience.
 *
 * Menu Structure:
 * - Create PRD: Phase 1 - Generate Product Requirements Documents
 * - Create Tasks from PRD: Phase 2 - Break down PRDs into structured tasks
 * - Run Dev on Tasks: Phase 3 - Execute development workflow with AI agents
 * - Exit: Gracefully terminate the orchestrator
 *
 * The menu system is designed to be intuitive and handles user cancellations
 * gracefully, allowing users to exit at any time without losing work.
 */

import prompts from "prompts";

/**
 * Display and handle the main orchestrator menu
 *
 * This function presents the primary user interface for the Ralph orchestrator,
 * showing all available workflow options in a clean, selectable menu format.
 * It uses the prompts library to provide keyboard navigation and selection.
 *
 * Menu Options:
 * - Create PRD: Initiates the PRD generation workflow for new projects
 * - Create Tasks from PRD: Converts existing PRDs into structured task files
 * - Run Dev on Tasks: Executes the development workflow on task files
 * - Exit: Terminates the orchestrator session
 *
 * The function handles user cancellation (Ctrl+C) by returning undefined,
 * which the main orchestrator loop interprets as an exit signal.
 *
 * @returns {Promise<string|undefined>} The selected menu choice value, or undefined if cancelled
 */
export async function showMainMenu() {
  // Configure and display the main menu using prompts library
  // Uses 'select' type for keyboard-navigable menu with arrow keys
  const response = await prompts({
    type: "select",              // Keyboard-navigable selection menu
    name: "choice",              // Response property name
    message: "What would you like to do?",  // Menu prompt text
    choices: [
      // Phase 1: PRD Generation - Interactive workflow to create detailed requirements
      {
        title: "Create PRD",
        value: "create_prd",
        description: "Generate a new PRD",
      },

      // Phase 2: Task Breakdown - Convert PRD requirements into structured development tasks
      {
        title: "Create Tasks from PRD",
        value: "create_tasks",
        description: "Select a PRD and generate tasks.json",
      },

      // Phase 3: Development Execution - Run AI agents to implement tasks with progress tracking
      {
        title: "Run Dev on Tasks",
        value: "run_dev",
        description: "Select a tasks.json file and start development",
      },

      // Streamlined Dev Option - Automatically resume tasks.json development
      {
        title: "Dev (resume tasks.json)",
        value: "dev",
        description: "Start/resume development on tasks.json",
      },

      // Restart Dev Option - Resume development after interruption with recovery logic
      {
        title: "Restart Dev (after interruption)",
        value: "restart_dev",
        description: "Resume development after interruption",
      },

      // Reset Tasks Option - Clear completion status from tasks.json
      {
        title: "Reset Tasks",
        value: "reset_tasks",
        description: "Clear completion status from tasks.json",
      },

      // Learn Skills Option - Extract learnings from progress.txt and create/update skills
      {
        title: "Learn Skills from Progress",
        value: "learn_skills",
        description: "Extract learnings from progress.txt and create/update skills",
      },

      // Analyze Logs Option - Analyze task execution logs for issues, insights, and feedback
      {
        title: "Analyze logs",
        value: "analyze_logs",
        description: "Analyze logs for issues, insights, and feedback",
      },

      // Create Recommendations Report Option - Generate combined recommendations from log-analysis files
      {
        title: "Create Recommendations Report",
        value: "create_recommendations",
        description: "Generate combined recommendations from log-analysis files",
      },

      // Exit option - Gracefully terminate the orchestrator session
      {
        title: "Exit",
        value: "exit",
        description: "Exit the orchestrator",
      },
    ],
    initial: 0,  // Start selection on first option (Create PRD)
  });

  // Return the selected choice value, or undefined if user cancelled (Ctrl+C)
  return response.choice;
}