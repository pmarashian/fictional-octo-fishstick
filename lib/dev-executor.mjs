/**
 * Development Task Execution
 *
 * This module implements the development execution workflow, the third and final
 * phase of the Ralph orchestrator's development process. It manages sequential
 * task execution with progress tracking, git integration, and comprehensive
 * logging for debugging and analysis.
 *
 * Development Execution Process:
 * 1. User selects existing tasks.json file from project directory
 * 2. Initialize git repository and create feature branch
 * 3. Execute tasks sequentially using AI agents
 * 4. Track progress, statistics, and completion status
 * 5. Commit changes and provide merge instructions
 *
 * Key Features:
 * - Sequential task execution with dependency awareness
 * - Real-time progress tracking and human-readable progress files
 * - Comprehensive activity logging per task
 * - Git branch management for clean development workflow
 * - Detailed statistics and performance metrics
 * - Error handling with graceful degradation
 *
 * The execution engine uses the Ralph Loop for iterative development,
 * allowing AI agents to work through complex tasks with human-like
 * problem-solving capabilities.
 */

import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import { PROGRESS_PATH, NEXT_TASK_PATH } from "./config.mjs";
import { createActivityLogger, updateProgressWithTaskCompletion } from "./logger.mjs";
import { generateTaskFiles, selectExistingTasksFile } from "./file-ops.mjs";
import { ralphLoop } from "./agent-runner.mjs";

/**
 * Execute Development Tasks Sequentially
 *
 * Core development execution function that manages the complete workflow of
 * running AI agents through structured development tasks. Handles git setup,
 * progress tracking, logging, and sequential task processing.
 *
 * Execution Workflow:
 * 1. Generate/update tasks.json file from task data
 * 2. Initialize progress tracking and codebase patterns
 * 3. Set up git repository and create feature branch
 * 4. Process each task sequentially:
 *    - Create task-specific prompts and logging
 *    - Execute Ralph Loop for iterative development
 *    - Track statistics and update progress
 *    - Mark task as completed
 * 5. Provide summary and merge instructions
 *
 * Git Integration:
 * - Initializes git repo if not present
 * - Creates timestamped feature branch
 * - All changes committed to feature branch
 * - Provides merge instructions for integration
 *
 * Progress Tracking:
 * - Human-readable progress.txt with task completion status
 * - Structured JSONL logs for each task execution
 * - Real-time statistics and performance metrics
 *
 * @param {Array} tasks - Array of task objects from task breakdown phase
 * @param {string} projectPath - Absolute path to the project directory
 * @param {Object|null} mcpConfig - MCP configuration for tool integrations
 * @returns {Promise<Array>} Array of execution results for each completed task
 */
export async function runTasksSequentially(tasks, projectPath, mcpConfig = null) {
  const tasksJsonPath = await generateTaskFiles(tasks);

  // Load tasks data
  const tasksData = JSON.parse(await fs.readFile(tasksJsonPath, "utf8"));

  // Initialize progress.txt with Codebase Patterns section
  // Progress file is created in the project directory (tasks/progress.txt)
  await fs.ensureFile(PROGRESS_PATH);
  let progressContent = await fs.readFile(PROGRESS_PATH, "utf8");

  // If progress.txt is empty or doesn't have Codebase Patterns section, initialize it
  if (!progressContent.includes("## Codebase Patterns")) {
    // Initialize with Codebase Patterns section
    const codebasePatternsHeader = "## Codebase Patterns\n\n";
    const initialContent =
      codebasePatternsHeader +
      "(No patterns yet - will be populated as work progresses)\n\n";

    await fs.writeFile(PROGRESS_PATH, initialContent, "utf8");
    progressContent = initialContent;
  }

  // === GIT REPOSITORY MANAGEMENT ===
  // Ensure project has git repository for version control and branching

  try {
    execSync("git status", { cwd: projectPath });
  } catch {
    // Initialize git repository if it doesn't exist
    execSync("git init", { cwd: projectPath });
    console.log("Initialized new git repository");
  }

  // Create unique feature branch for this development session
  // Timestamp-based naming ensures uniqueness across multiple runs
  const featureBranch = `ralph-implementation-${Date.now()}`;

  console.log("\n=== Starting Sequential Task Execution ===");
  console.log(`Total user stories: ${tasksData.userStories.length}`);
  console.log(`Feature branch: ${featureBranch}\n`);

  // === GIT BRANCH MANAGEMENT ===
  // Create and switch to feature branch from main branch
  try {
    execSync("git checkout main", { cwd: projectPath, stdio: "ignore" });
    execSync(`git checkout -b ${featureBranch}`, { cwd: projectPath });
    console.log(`✓ Created and switched to ${featureBranch}\n`);
  } catch (e) {
    console.error(`✗ Failed to create feature branch: ${e.message}`);
    return [];  // Return empty results on git failure
  }

  // === SEQUENTIAL TASK EXECUTION ===
  // Process each task in order, allowing for proper dependency management
  const results = [];

  for (const task of tasksData.userStories) {
    // Skip already completed tasks (resumability feature)
    if (task.completed) {
      console.log(`\n⊘ Skipping completed task ${task.id}`);
      continue;
    }

    // Determine agent role for this task (defaults to generic developer)
    const role = task.suggested_role || "developer";

    // Display task information for user awareness
    console.log(`\n--- User Story ${task.id}/${tasksData.userStories.length} ---`);
    console.log(`Role: ${role}`);
    console.log(`Description: ${task.description.substring(0, 80)}...`);

    // Mark task as started and persist to disk
    task.started_at = new Date().toISOString();
    await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));

    // === TASK PREPARATION ===
    // Create next_task.md file with task details for agent to read
    // Format success criteria as checkboxes for progress tracking
    const criteriaWithCheckboxes = task.success_criteria
      .map((c) => `[ ] ${c}`)  // Unchecked checkboxes for each criterion
      .join("\n");

    const taskPrompt = `# Task ${task.id} (Role: ${task.suggested_role})

Description: ${task.description}

Success Criteria:
${criteriaWithCheckboxes}

Dependencies: ${task.dependencies.join(", ")}`;

    // Write task prompt to file for agent to read
    await fs.writeFile(NEXT_TASK_PATH, taskPrompt);

    // === STATISTICS TRACKING ===
    // Initialize comprehensive tracking for performance analysis and debugging
    const taskStats = {
      startTime: Date.now(),      // Execution start timestamp
      iterations: 0,              // Number of Ralph Loop iterations
      toolCalls: 0,               // Total tool calls made
      filesModified: new Set(),   // Unique files modified (placeholder)
      commandsRun: [],            // Shell commands executed (placeholder)
      errors: [],                 // Error messages encountered
    };

    // === ACTIVITY LOGGING ===
    // Create structured logger for this specific task execution
    const activityLogger = await createActivityLogger(task.id, role);

    // Log task start with metadata
    activityLogger.log("info", "Task started", {
      taskId: task.id,
      description: task.description,
      role: role,
    });

    console.log(`\nStarting work on task ${task.id}...`);

    // === ENHANCED LOGGING WITH STATISTICS TRACKING ===
    // Create logging callback that provides both console output and statistics tracking
    const enhancedLogCallback = (text) => {
      // Display log message with indentation for task context
      console.log(`  ${text}`);

      // === STATISTICS EXTRACTION FROM LOGS ===
      // Parse log messages to extract performance and debugging metrics

      if (text.includes("Iteration") && text.includes("complete")) {
        taskStats.iterations++;  // Count completed Ralph Loop iterations
      }

      if (text.includes("TOOL:")) {
        taskStats.toolCalls++;  // Count tool calls made by agent
      }

      if (
        text.includes("FAILED") ||
        text.includes("ERROR") ||
        text.includes("❌")
      ) {
        taskStats.errors.push(text);  // Track error conditions
      }

      // === STRUCTURED LOGGING ===
      // Log to JSONL file with appropriate event type classification
      if (text.startsWith("[")) {
        // Extract event type from bracketed prefixes (e.g., [SYSTEM], [THINKING])
        const eventType =
          text.match(/\[([A-Z_]+)\]/)?.[1]?.toLowerCase() || "agent";
        activityLogger.log(eventType, text);
      } else {
        // Default to agent event type for general messages
        activityLogger.log("agent", text);
      }
    };

    // Attach activity logger reference for use by other components
    enhancedLogCallback.activityLogger = activityLogger;

    // === RALPH LOOP EXECUTION ===
    // Execute the iterative development workflow for this task
    // Agent reads from next_task.md file created above
    const { fullOutput } = await ralphLoop(
      "grok", // model - using MODELS.devAgent (hardcoded for now)
      "<ralph>COMPLETE</ralph>", // Special completion token
      20, // maxIterations for development work
      enhancedLogCallback, // Enhanced logging with statistics
      mcpConfig, // MCP tool configuration
    );

    // === TASK COMPLETION PROCESSING ===
    // Update progress tracking and mark task as completed

    // Update human-readable progress file with completion details
    await updateProgressWithTaskCompletion(
      task.id,
      task.description,
      fullOutput,
    );

    // Mark task as completed with metadata
    task.completed = true;
    task.completed_at = new Date().toISOString();
    task.output = fullOutput.substring(0, 500); // Store truncated output for reference

    // === STATISTICS REPORTING ===
    // Calculate and display comprehensive task execution statistics
    const duration = Date.now() - taskStats.startTime;

    console.log(`
✓ Task ${task.id} complete in ${(duration / 1000).toFixed(1)}s
  - Iterations: ${taskStats.iterations}
  - Tool calls: ${taskStats.toolCalls}
  - Errors encountered: ${taskStats.errors.length}
  - Output length: ${fullOutput.length} chars
`);

    // Persist detailed statistics with task data
    task.stats = {
      duration_ms: duration,
      iterations: taskStats.iterations,
      tool_calls: taskStats.toolCalls,
      error_count: taskStats.errors.length,
    };

    // Log completion event with statistics to activity log
    activityLogger.log("info", "Task completed", {
      taskId: task.id,
      stats: task.stats,
    });

    // Save updated task data to disk
    await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));

    results.push({
      task_id: task.id,
      role: role,
      result: fullOutput,
    });
  }

  console.log("\n=== Execution Complete ===");
  console.log(`Feature branch: ${featureBranch}`);
  console.log(`User stories completed: ${results.length}/${tasksData.userStories.length}`);
  console.log(
    `\nTo merge to main: git checkout main && git merge ${featureBranch}`,
  );

  return results;
}

export async function actionRunDev(projectPath, mcpConfigForAgent) {
  console.log("\nSelecting a tasks file to run...");
  const selectedTasks = await selectExistingTasksFile();

  if (!selectedTasks) {
    console.log("No tasks file selected. Returning to menu.");
    return null;
  }

  const devResults = await runTasksSequentially(
    selectedTasks.tasksData.userStories,
    projectPath,
    mcpConfigForAgent,
  );

  // All completion details are already logged by runTasksSequentially
  console.log("\n✓ Development execution complete!");
  return devResults;
}