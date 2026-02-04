#!/usr/bin/env node

/**
 * Ralph - Interactive Development Orchestrator
 *
 * This is the main entry point for the Ralph orchestrator system, an interactive
 * development workflow tool that guides users through the complete software
 * development lifecycle from concept to implementation.
 *
 * System Architecture:
 * - Interactive CLI interface with menu-driven navigation
 * - Three-phase workflow: PRD Generation → Task Breakdown → Development Execution
 * - Modular design with separate libraries for each major functionality
 * - MCP (Model Context Protocol) integration for agent communication
 * - Project-scoped operations within the current working directory
 *
 * Workflow Overview:
 * 1. PRD Generation: Clarify requirements and generate Product Requirements Documents
 * 2. Task Breakdown: Convert PRDs into structured, actionable development tasks
 * 3. Development Execution: Run agents to implement tasks with progress tracking
 *
 * The system is designed to be user-friendly, handling errors gracefully and
 * providing clear feedback throughout the development process.
 */

// Core UI imports - handle user interaction and menu display
import { showMainMenu } from "./lib/menu.mjs";

// Workflow phase imports - each handles a major step in the development process
import { actionCreatePRD } from "./lib/prd-generator.mjs";     // Phase 1: PRD generation from user requirements
import { actionCreateTasks, actionCreateTasksFromDescription } from "./lib/task-generator.mjs";  // Phase 2: Task breakdown from PRDs
import { actionRunDev, actionDev, actionRestartDev } from "./lib/dev-executor.mjs";  // Phase 3: Development execution with agents
import { actionResetTasks } from "./lib/task-reset.mjs";      // Task reset functionality
import { actionLearnSkills } from "./lib/skill-learner.mjs";  // Skill learning from progress
import { analyzeLogs } from "./lib/log-analyzer.mjs";          // Log analysis functionality
import { actionCreateRecommendationsReport } from "./lib/recommendations-generator.mjs";  // Recommendations report generation

/**
 * Main orchestrator entry point and menu loop controller
 *
 * This function initializes the orchestrator system and runs the main interactive
 * menu loop that guides users through the three-phase development workflow.
 *
 * Key responsibilities:
 * - Initialize project context (current working directory)
 * - Display welcome message and branding
 * - Run the interactive menu loop until user chooses to exit
 * - Route user selections to appropriate workflow actions
 * - Handle errors gracefully and return to menu for recovery
 * - Provide user feedback throughout the process
 *
 * The menu loop continues indefinitely until the user explicitly chooses to exit,
 * allowing for multiple workflow iterations within a single session.
 *
 * @returns {Promise<void>} Resolves when user chooses to exit the orchestrator
 */
async function main() {
  // Initialize project context - operations will be scoped to current working directory
  const projectPath = process.cwd();

  // MCP configuration for agent integration - currently null (placeholder for future MCP setup)
  // This will be passed to workflow actions that may need agent communication
  const mcpConfigForAgent = null;

  // Display welcome message and system branding
  console.log("\n=== Interactive Orchestrator ===\n");

  // Track automatic restart attempts to prevent infinite loops
  const MAX_AUTOMATIC_RESTARTS = 3;
  let automaticRestartCount = 0;

  // Main interactive menu loop - continues until user chooses to exit
  // This loop provides the primary user interface, allowing multiple workflow
  // iterations and graceful error recovery
  while (true) {
    try {
      // Display main menu and await user selection
      // showMainMenu() handles all menu rendering and input validation
      const choice = await showMainMenu();

      // Exit condition - user selected exit or cancelled menu
      if (!choice || choice === "exit") {
        console.log("\nExiting orchestrator. Goodbye!");
        break;
      }

      // Reset automatic restart counter on successful action
      automaticRestartCount = 0;

      // Route user selection to appropriate workflow action
      // Each case represents one phase of the development workflow
      switch (choice) {
        case "create_prd":
          // Phase 1: Generate Product Requirements Document
          // Interactive clarification process to create detailed PRDs
          await actionCreatePRD(mcpConfigForAgent);
          break;

        case "create_tasks":
          // Phase 2: Break down PRD into structured development tasks
          // Convert requirements into actionable, prioritized tasks
          await actionCreateTasks(mcpConfigForAgent);
          break;

        case "create_tasks_quick":
          // Phase 2: Quick task generation from bugs/changes description
          // Generate tasks without requiring a full PRD document
          await actionCreateTasksFromDescription(mcpConfigForAgent);
          break;

        case "run_dev":
          // Phase 3: Execute development tasks using AI agents
          // Run the development workflow with progress tracking
          await actionRunDev(projectPath, mcpConfigForAgent);
          break;

        case "dev":
          // Streamlined Dev: Auto-load tasks.json and start/resume development
          // No user prompting - assumes tasks.json exists and starts from first incomplete task
          await actionDev(projectPath, mcpConfigForAgent);
          break;

        case "restart_dev":
          // Restart Dev: Resume development after interruption with recovery logic
          // Enhanced recovery features and detailed status reporting
          await actionRestartDev(projectPath, mcpConfigForAgent);
          break;

        case "reset_tasks":
          // Reset Tasks: Clear completion status from tasks.json
          // Allows users to restart development on completed tasks
          await actionResetTasks();
          break;

        case "learn_skills":
          // Learn Skills: Extract learnings from progress.txt and create/update skills
          // Converts project learnings into reusable Agent Skills
          const learnResult = await actionLearnSkills();
          if (learnResult.success) {
            console.log(`\n✓ ${learnResult.message}`);
            if (learnResult.stats) {
              console.log(`  Created: ${learnResult.stats.created}, Updated: ${learnResult.stats.updated}`);
            }
          } else {
            console.log(`\n✗ ${learnResult.message}`);
          }
          break;

        case "analyze_logs":
          // Analyze Logs: Analyze task execution logs for issues, insights, and feedback
          // Provides comprehensive analysis of development workflow execution
          await analyzeLogs();
          break;

        case "create_recommendations":
          // Create Recommendations Report: Generate combined recommendations from log-analysis files
          // Analyzes all log-analysis markdown files and creates a comprehensive recommendations report
          await actionCreateRecommendationsReport(mcpConfigForAgent);
          break;

        default:
          // Handle unexpected menu choices (shouldn't happen with proper validation)
          console.log("Unknown option. Returning to menu.");
      }

      // Brief pause for visual separation before showing menu again
      // This provides better UX by preventing menu spam after actions complete
      console.log("\n");

    } catch (error) {
      // Comprehensive error handling for the menu loop
      // The orchestrator is designed to be resilient - errors shouldn't crash the system

      if (error.message === "User cancelled the prompt") {
        // Expected cancellation (user pressed Ctrl+C or chose to cancel)
        // This is normal user behavior, not an error condition
        console.log("\nOperation cancelled. Returning to menu.");

      } else if (error.message.startsWith("RESOURCE_EXHAUSTION_RESTART:")) {
        // Automatic restart triggered by resource exhaustion
        // Check if we've exceeded maximum restart attempts
        if (automaticRestartCount >= MAX_AUTOMATIC_RESTARTS) {
          console.log(`\n❌ Maximum automatic restart attempts (${MAX_AUTOMATIC_RESTARTS}) exceeded.`);
          console.log("Please check your system resources and try again manually.");
          console.log("Returning to menu.\n");
          automaticRestartCount = 0; // Reset counter
          continue;
        }

        // Extract the original error message for logging
        const originalError = error.message.replace("RESOURCE_EXHAUSTION_RESTART:", "");
        automaticRestartCount++;
        console.log(`\n🔄 Resource exhaustion detected: ${originalError}`);
        console.log(`Automatically restarting development workflow (attempt ${automaticRestartCount}/${MAX_AUTOMATIC_RESTARTS})...\n`);

        // Automatically trigger restart_dev action
        try {
          await actionRestartDev(projectPath, mcpConfigForAgent);
          // If restart succeeds, reset the counter
          automaticRestartCount = 0;
        } catch (restartError) {
          console.error("\nError during automatic restart:", restartError.message);
          console.log("Returning to menu.\n");
        }

      } else {
        // Unexpected error occurred during workflow execution
        // Log the error for debugging but continue running the orchestrator
        // Users can retry operations or exit gracefully
        console.error("\nError:", error.message);
        console.log("Returning to menu.\n");
      }
    }
  }
}

main().catch(console.error);