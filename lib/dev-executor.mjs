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
import {
  createActivityLogger,
  updateProgressWithTaskCompletion,
} from "./logger.mjs";
import { generateTaskFiles, selectExistingTasksFile } from "./file-ops.mjs";
import { promptTaskLimit } from "./prompts.mjs";
import {
  ralphLoop,
  ConnectionError,
  LoopError,
  ResourceExhaustionError,
  isRetryableConnectionError,
  isResourceExhaustionError,
} from "./agent-runner.mjs";
import { format } from "./log-format.mjs";

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
 * - Creates feature branch using branchName from tasks.json (required field)
 * - Validates branchName exists before execution
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
 * @param {number|null} maxTasksToComplete - Max tasks to complete this run (null = all)
 * @returns {Promise<Array>} Array of execution results for each completed task
 */
export async function runTasksSequentially(
  tasks,
  projectPath,
  mcpConfig = null,
  maxTasksToComplete = null,
) {
  // Determine tasks.json path
  const tasksDir = path.join(projectPath, "tasks");
  const tasksJsonPath = path.join(tasksDir, "tasks.json");

  let tasksData;

  // Check if tasks.json exists before generating
  if (await fs.pathExists(tasksJsonPath)) {
    // File exists: Load it and preserve completion status
    console.log(
      format(
        "git_ok",
        "✓ Found existing tasks.json, preserving completion status...",
      ),
    );
    const existingTasksData = JSON.parse(
      await fs.readFile(tasksJsonPath, "utf8"),
    );

    // Generate new task structure to compare
    await fs.ensureDir(tasksDir);
    const newTasksData = {
      created_at: existingTasksData.created_at || new Date().toISOString(),
      branchName: existingTasksData.branchName || null, // Preserve branchName from existing file
      userStories: tasks.map((task) => {
        // Validate success_criteria and warn if missing
        if (!task.success_criteria && !task.acceptanceCriteria) {
          console.warn(
            format(
              "warning",
              `Warning: Task ${task.id} missing success_criteria, using empty array`,
            ),
          );
        }
        return {
          id:
            typeof task.id === "string" && task.id.startsWith("US-")
              ? task.id
              : `US-${String(task.id).padStart(3, "0")}`,
          title:
            task.description.split(".")[0].substring(0, 60) ||
            task.description.substring(0, 60),
          description: task.description,
          acceptanceCriteria:
            task.acceptanceCriteria || task.success_criteria || [],
          priority: task.priority,
          dependencies: task.dependencies,
          suggested_role: task.suggested_role,
          passes: false,
          notes: "",
          completed: false,
          started_at: null,
          completed_at: null,
          output: null,
        };
      }),
    };

    // Merge: Preserve completion fields from existing tasks
    // Match tasks by ID to preserve their completion status
    const existingTasksMap = new Map(
      existingTasksData.userStories?.map((t) => [t.id, t]) || [],
    );

    tasksData = {
      ...newTasksData,
      userStories: newTasksData.userStories.map((newTask) => {
        const existingTask = existingTasksMap.get(newTask.id);
        if (existingTask) {
          // Preserve completion fields from existing task
          return {
            ...newTask,
            passes: existingTask.passes ?? false,
            notes: existingTask.notes ?? "",
            completed: existingTask.completed ?? false,
            started_at: existingTask.started_at ?? null,
            completed_at: existingTask.completed_at ?? null,
            output: existingTask.output ?? null,
            stats: existingTask.stats ?? undefined,
          };
        }
        // New task not in existing file - use defaults
        return newTask;
      }),
    };

    // Validate structure matches (same number of tasks)
    if (
      tasksData.userStories.length !== existingTasksData.userStories?.length
    ) {
      console.log(
        format(
          "warning",
          `⚠ Warning: Task count changed (${existingTasksData.userStories?.length || 0} → ${tasksData.userStories.length}). Completion status preserved for matching tasks.`,
        ),
      );
    }

    // Write merged data back to file
    await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));
    console.log(
      format(
        "git_ok",
        `✓ Preserved completion status for ${tasksData.userStories.filter((t) => t.completed).length} completed tasks`,
      ),
    );
  } else {
    // File doesn't exist: Generate new file
    const generatedPath = await generateTaskFiles(tasks);
    tasksData = JSON.parse(await fs.readFile(generatedPath, "utf8"));
  }

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
    console.log(format("git_ok", "Initialized new git repository"));
  }

  // Use branchName from tasks.json (required field)
  if (!tasksData.branchName) {
    throw new Error(
      "Error: tasks.json is missing required 'branchName' field. Please regenerate tasks from PRD.",
    );
  }
  const featureBranch = tasksData.branchName;

  console.log(
    format("orchestrator", "\n=== Starting Sequential Task Execution ==="),
  );
  console.log(
    format(
      "orchestrator",
      `Total user stories: ${tasksData.userStories.length}`,
    ),
  );
  console.log(format("orchestrator", `Feature branch: ${featureBranch}\n`));

  // === GIT BRANCH MANAGEMENT ===
  // Check if feature branch exists first; checkout existing or create from main (allows restarts without "branch already exists" error)
  try {
    let branchExists = false;
    try {
      execSync(`git rev-parse --verify refs/heads/${featureBranch}`, {
        cwd: projectPath,
        stdio: "ignore",
      });
      branchExists = true;
    } catch {
      // Branch does not exist
    }
    if (branchExists) {
      execSync(`git checkout ${featureBranch}`, {
        cwd: projectPath,
        stdio: "ignore",
      });
      console.log(
        format("git_ok", `✓ Switched to existing branch ${featureBranch}\n`),
      );
    } else {
      execSync("git checkout main", { cwd: projectPath, stdio: "ignore" });
      execSync(`git checkout -b ${featureBranch}`, { cwd: projectPath });
      console.log(
        format("git_ok", `✓ Created and switched to ${featureBranch}\n`),
      );
    }
  } catch (e) {
    console.error(
      format(
        "git_fail",
        `✗ Failed to create/switch to feature branch: ${e.message}`,
      ),
    );
    return []; // Return empty results on git failure
  }

  // === SEQUENTIAL TASK EXECUTION ===
  // Process each task in order, allowing for proper dependency management
  const results = [];
  let completedThisRun = 0;

  for (const task of tasksData.userStories) {
    // Skip already completed tasks (resumability feature)
    if (task.completed) {
      continue;
    }

    // Determine agent role for this task (defaults to generic developer)
    const role = task.suggested_role || "developer";

    // Display task information for user awareness
    console.log(
      format(
        "task",
        `\n--- User Story ${task.id}/${tasksData.userStories.length} ---`,
      ),
    );
    console.log(format("task", `Role: ${role}`));
    console.log(
      format("task", `Description: ${task.description.substring(0, 80)}...`),
    );

    // Check if this is a sequential iteration (restart scenario)
    // A task that has started_at but is not completed indicates a previous iteration was interrupted
    const isSequentialIteration = task.started_at && !task.completed;
    const previousStartedAt = task.started_at; // Save original value before overwriting

    // Mark task as started and persist to disk
    task.started_at = new Date().toISOString();
    await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));

    // === TASK PREPARATION ===
    // Create next_task.md file with task details for agent to read
    // Format success criteria as checkboxes for progress tracking
    const criteriaWithCheckboxes = (task.acceptanceCriteria || [])
      .map((c) => `[ ] ${c}`) // Unchecked checkboxes for each criterion
      .join("\n");

    const taskPrompt = `# Task ${task.id} (Role: ${task.suggested_role})

Description: ${task.description}

Success Criteria:
${criteriaWithCheckboxes}

Dependencies: ${task.dependencies.join(", ")}${
      isSequentialIteration
        ? `

## Sequential Iteration Notice

**This is a sequential iteration of this task.** A previous iteration was started but did not complete (started: ${new Date(previousStartedAt).toLocaleString()}).

**Important:**
- Files from the previous iteration may already exist in the codebase
- Review existing files before creating new ones to avoid duplicates
- Check \`tasks/progress.txt\` for details about what was attempted in previous iterations
- Build upon or fix existing work rather than starting completely from scratch
- Verify what files were created/modified in the previous iteration before proceeding`
        : ""
    }`;

    // Write task prompt to file for agent to read
    await fs.writeFile(NEXT_TASK_PATH, taskPrompt);

    // === STATISTICS TRACKING ===
    // Initialize comprehensive tracking for performance analysis and debugging
    const taskStats = {
      startTime: Date.now(), // Execution start timestamp
      iterations: 0, // Number of Ralph Loop iterations
      toolCalls: 0, // Total tool calls made
      filesModified: new Set(), // Unique files modified (placeholder)
      commandsRun: [], // Shell commands executed (placeholder)
      errors: [], // Error messages encountered
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

    console.log(format("task", `\nStarting work on task ${task.id}...`));

    // === ENHANCED LOGGING WITH STATISTICS TRACKING ===
    // Create logging callback that provides both console output and statistics tracking
    const enhancedLogCallback = (text, kind) => {
      // Display log message with indentation and formatting by kind
      console.log(format(kind || "agent", `  ${text}`));

      // === STATISTICS EXTRACTION FROM LOGS ===
      // Parse log messages to extract performance and debugging metrics

      if (text.includes("Iteration") && text.includes("complete")) {
        taskStats.iterations++; // Count completed Ralph Loop iterations
      }

      if (text.includes("TOOL:")) {
        taskStats.toolCalls++; // Count tool calls made by agent
      }

      if (
        text.includes("FAILED") ||
        text.includes("ERROR") ||
        text.includes("❌")
      ) {
        taskStats.errors.push(text); // Track error conditions
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
    // Wrapped in try-catch to handle connection errors and loop errors gracefully
    let fullOutput = "";
    try {
      const result = await ralphLoop(
        "grok", // model - using MODELS.devAgent (hardcoded for now)
        "<ralph>COMPLETE</ralph>", // Special completion token
        20, // maxIterations for development work
        enhancedLogCallback, // Enhanced logging with statistics
        mcpConfig, // MCP tool configuration
      );
      fullOutput = result.fullOutput;
    } catch (error) {
      // Handle loop errors at task level
      if (error instanceof LoopError) {
        console.log(
          format(
            "error",
            `\n✗ Task ${task.id} failed due to loop error: ${error.message}`,
          ),
        );
        console.log(
          format(
            "error",
            `  Stopping execution (tasks must be done in order).`,
          ),
        );

        // Log error to activity logger
        activityLogger.log("error", "Task failed due to loop error", {
          taskId: task.id,
          error: error.message,
          iteration: error.iteration,
          retryCount: error.retryCount,
          runtimeMs: error.runtimeMs,
          originalError: error.originalError?.message,
        });

        // Mark task with error state
        task.completed = false;
        task.notes = `Loop error: ${error.message}`;
        task.completed_at = new Date().toISOString();

        // Save updated task data
        await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));

        // Stop execution - do not continue to next task (tasks must be done in order)
        console.log(format("error", `\n=== Execution Stopped ===`));
        console.log(
          format("error", `Task ${task.id} failed due to loop detection.`),
        );
        console.log(
          format(
            "error",
            `Tasks must be completed in order, so execution has been stopped.`,
          ),
        );
        console.log(
          format(
            "error",
            `Please review the error and restart development when ready.`,
          ),
        );
        return results; // Return current results and exit
      }

      // Handle connection errors at task level
      // Connection errors should be caught here if they weren't retried successfully
      // in ralphLoop() (e.g., after max retries exceeded)
      if (
        error instanceof ConnectionError ||
        isRetryableConnectionError(error)
      ) {
        console.log(
          format(
            "error",
            `\n✗ Task ${task.id} failed due to connection error: ${error.message}`,
          ),
        );
        console.log(
          format(
            "error",
            `  Error details: ${error.originalError?.message || error.message}`,
          ),
        );
        if (error.code || error.originalError?.code) {
          console.log(
            format(
              "error",
              `  Error code: ${error.code || error.originalError?.code}`,
            ),
          );
        }
        console.log(format("orchestrator", `  Continuing to next task...`));

        // Log error to activity logger with comprehensive details
        activityLogger.log("error", "Task failed due to connection error", {
          taskId: task.id,
          error: error.message,
          errorCode: error.code || error.originalError?.code,
          originalError: error.originalError?.message,
          hasPartialResponse: !!(
            error.partialResponse ||
            (error instanceof ConnectionError && error.partialResponse)
          ),
        });

        // Mark task with error state
        task.completed = false;
        task.notes = `Connection error: ${error.message}`;
        task.completed_at = new Date().toISOString();

        // Save updated task data
        await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));

        // Continue to next task instead of crashing
        // Connection errors are transient and shouldn't stop the entire workflow
        continue;
      }

      // Handle resource exhaustion errors - trigger automatic restart
      if (isResourceExhaustionError(error)) {
        console.log(
          format(
            "error",
            `\n💥 Task ${task.id} failed due to resource exhaustion: ${error.message}`,
          ),
        );
        console.log(
          format(
            "error",
            `  This usually indicates context window limits exceeded during task execution.`,
          ),
        );

        // Log error to activity logger
        activityLogger.log("error", "Task failed due to resource exhaustion", {
          taskId: task.id,
          error: error.message,
          errorCode: error.code || error.originalError?.code,
          originalError: error.originalError?.message,
          contextSizeBytes: contextSizeBytes || 'unknown',
          iterations: taskStats.iterations,
        });

        // Mark task with error state and track resource exhaustion attempts
        task.completed = false;
        task.notes = `Resource exhaustion: ${error.message} (context likely too large)`;
        task.completed_at = new Date().toISOString();

        // Track resource exhaustion failures for this task
        task.resourceExhaustionCount = (task.resourceExhaustionCount || 0) + 1;

        // Save updated task data
        await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));

        // Trigger automatic restart of the entire development workflow
        console.log(
          format(
            "warning",
            `\n🔄 Automatically restarting development workflow due to resource exhaustion...`,
          ),
        );
        console.log(
          format(
            "orchestrator",
            `This will start fresh conversations to avoid context accumulation.`,
          ),
        );

        // Return current results and let the caller handle restart
        // The restart should be handled at a higher level (menu system)
        const resourceError = new ResourceExhaustionError(
          `Resource exhaustion during task ${task.id}: ${error.message}`,
          error,
          fullOutput,
          {
            contextSizeBytes: contextSizeBytes,
            iteration: iterations + 1,
            runtimeMs: Date.now() - taskStats.startTime,
            sessionId: currentSessionId,
          }
        );
        throw resourceError;
      } else {
        // Re-throw non-connection, non-loop, non-resource-exhaustion errors
        throw error;
      }
    }

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

    console.log(
      format(
        "git_ok",
        `
✓ Task ${task.id} complete in ${(duration / 1000).toFixed(1)}s
  - Iterations: ${taskStats.iterations}
  - Tool calls: ${taskStats.toolCalls}
  - Errors encountered: ${taskStats.errors.length}
`,
      ),
    );

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

    // === GIT COMMIT AFTER TASK COMPLETION ===
    try {
      const gitStatus = execSync("git status --porcelain", {
        cwd: projectPath,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });

      if (gitStatus.trim()) {
        execSync("git add -A", { cwd: projectPath, stdio: "ignore" });
        const commitMessage = `feat: TASK-${task.id} - ${task.description}`;
        // Use JSON.stringify to safely escape special characters in commit message
        execSync(`git commit -m ${JSON.stringify(commitMessage)}`, {
          cwd: projectPath,
          stdio: "ignore",
        });
        console.log(
          format("git_ok", `✓ Committed changes for task ${task.id}`),
        );
      } else {
        console.log(
          format("git", `⊘ No changes to commit for task ${task.id}`),
        );
      }
    } catch (error) {
      console.log(
        format(
          "warning",
          `⚠ Warning: Failed to commit changes for task ${task.id}: ${error.message}`,
        ),
      );
      // Continue execution - don't fail the task due to commit failure
    }

    results.push({
      task_id: task.id,
      role: role,
      result: fullOutput,
    });

    completedThisRun += 1;
    if (
      maxTasksToComplete != null &&
      completedThisRun >= maxTasksToComplete
    ) {
      console.log(
        format(
          "orchestrator",
          `\nReached limit of ${maxTasksToComplete} task(s) this run. Stopping.`,
        ),
      );
      break;
    }
  }

  console.log(format("orchestrator", "\n=== Execution Complete ==="));
  console.log(format("orchestrator", `Feature branch: ${featureBranch}`));
  console.log(
    format(
      "orchestrator",
      `User stories completed: ${results.length}/${tasksData.userStories.length}`,
    ),
  );
  console.log(
    format(
      "git",
      `\nTo merge to main: git checkout main && git merge ${featureBranch}`,
    ),
  );

  return results;
}

export async function actionRunDev(projectPath, mcpConfigForAgent) {
  console.log(format("orchestrator", "\nSelecting a tasks file to run..."));
  const selectedTasks = await selectExistingTasksFile();

  if (!selectedTasks) {
    console.log(format("task", "No tasks file selected. Returning to menu."));
    return null;
  }

  const incompleteCount = selectedTasks.tasksData.userStories.filter(
    (t) => !t.completed,
  ).length;
  const choice = await promptTaskLimit(incompleteCount);
  if (choice.cancelled) {
    console.log(format("task", "Cancelled. Returning to menu."));
    return null;
  }

  const devResults = await runTasksSequentially(
    selectedTasks.tasksData.userStories,
    projectPath,
    mcpConfigForAgent,
    choice.limit,
  );

  // All completion details are already logged by runTasksSequentially
  console.log(format("git_ok", "\n✓ Development execution complete!"));
  return devResults;
}

/**
 * Streamlined Development Action - Auto-load tasks.json
 *
 * This function provides a streamlined development workflow that automatically
 * assumes tasks.json exists in the project root and starts execution from the
 * first incomplete task. No user prompting for file selection is required.
 *
 * @param {string} projectPath - Absolute path to the project directory
 * @param {Object|null} mcpConfig - MCP configuration for tool integrations
 * @returns {Promise<Array>} Array of execution results for completed tasks
 */
export async function actionDev(projectPath, mcpConfig = null) {
  console.log(
    format(
      "orchestrator",
      "\nStarting streamlined development on tasks.json...",
    ),
  );

  // Auto-load tasks.json from project root
  const tasksPath = path.join(projectPath, "tasks", "tasks.json");

  try {
    // Check if tasks.json exists
    const tasksContent = await fs.readFile(tasksPath, "utf8");
    const tasksData = JSON.parse(tasksContent);

    // Validate branchName exists
    if (!tasksData.branchName) {
      console.error(
        format(
          "error",
          "\n✗ Error: tasks.json is missing required 'branchName' field.",
        ),
      );
      console.log(
        format(
          "task",
          "Please regenerate tasks from PRD to get a branchName field.",
        ),
      );
      return [];
    }

    console.log(
      format(
        "git_ok",
        `✓ Found tasks.json with ${tasksData.userStories?.length || 0} tasks`,
      ),
    );

    // Count incomplete tasks for user feedback
    const incompleteTasks =
      tasksData.userStories?.filter((task) => !task.completed) || [];
    console.log(
      format(
        "orchestrator",
        `Starting from first incomplete task (${incompleteTasks.length} remaining)`,
      ),
    );

    const choice = await promptTaskLimit(incompleteTasks.length);
    if (choice.cancelled) {
      console.log(format("task", "Cancelled. Returning to menu."));
      return [];
    }

    const devResults = await runTasksSequentially(
      tasksData.userStories,
      projectPath,
      mcpConfig,
      choice.limit,
    );

    console.log(
      format("git_ok", "\n✓ Streamlined development execution complete!"),
    );
    return devResults;
  } catch (error) {
    if (error.message?.startsWith("RESOURCE_EXHAUSTION_RESTART:")) {
      throw error;
    }
    if (error.code === "ENOENT") {
      console.error(
        format("error", `\n✗ Error: tasks.json not found at ${tasksPath}`),
      );
      console.log(
        format(
          "task",
          "Please run 'Create Tasks from PRD' first or use 'Run Dev on Tasks' to select an existing tasks file.",
        ),
      );
    } else {
      console.error(
        format("error", "\n✗ Error loading tasks.json:", error.message),
      );
    }
    return [];
  }
}

/**
 * Restart Development Action - Resume after interruption
 *
 * This function provides enhanced recovery logic for resuming development
 * after an interruption. It includes additional checks and recovery features
 * beyond the standard resumability provided by runTasksSequentially().
 *
 * Recovery features:
 * - Validates tasks.json integrity
 * - Provides detailed status information on resume
 * - Enhanced error handling for partial task states
 * - Recovery suggestions for common interruption scenarios
 *
 * @param {string} projectPath - Absolute path to the project directory
 * @param {Object|null} mcpConfig - MCP configuration for tool integrations
 * @returns {Promise<Array>} Array of execution results for completed tasks
 */
export async function actionRestartDev(projectPath, mcpConfig = null) {
  console.log(
    format("orchestrator", "\nRestarting development after interruption..."),
  );

  // Auto-load tasks.json from project root
  const tasksPath = path.join(projectPath, "tasks", "tasks.json");

  try {
    // Check if tasks.json exists
    const tasksContent = await fs.readFile(tasksPath, "utf8");
    const tasksData = JSON.parse(tasksContent);

    // Validate branchName exists
    if (!tasksData.branchName) {
      console.error(
        format(
          "error",
          "\n✗ Error: tasks.json is missing required 'branchName' field.",
        ),
      );
      console.log(
        format(
          "task",
          "Please regenerate tasks from PRD to get a branchName field.",
        ),
      );
      return [];
    }

    console.log(
      format(
        "git_ok",
        `✓ Found tasks.json with ${tasksData.userStories?.length || 0} tasks`,
      ),
    );

    // Enhanced status reporting for restart scenarios
    const totalTasks = tasksData.userStories?.length || 0;
    const completedTasks =
      tasksData.userStories?.filter((task) => task.completed) || [];
    const incompleteTasks =
      tasksData.userStories?.filter((task) => !task.completed) || [];
    const inProgressTasks =
      tasksData.userStories?.filter(
        (task) => task.started_at && !task.completed,
      ) || [];

    console.log(format("task", `\n--- Development Status ---`));
    console.log(format("task", `Total tasks: ${totalTasks}`));
    console.log(format("task", `Completed: ${completedTasks.length}`));
    console.log(format("task", `Incomplete: ${incompleteTasks.length}`));
    console.log(format("task", `In progress: ${inProgressTasks.length}`));

    if (inProgressTasks.length > 0) {
      console.log(format("task", `\nTasks that were in progress:`));
      inProgressTasks.forEach((task) => {
        console.log(
          format(
            "task",
            `  - ${task.id}: ${task.title} (started: ${new Date(task.started_at).toLocaleString()})`,
          ),
        );
      });
      console.log(
        format(
          "orchestrator",
          "\nNote: In-progress tasks will be resumed from where they left off.",
        ),
      );
    }

    if (incompleteTasks.length === 0) {
      console.log(format("git_ok", "\n✓ All tasks are already completed!"));
      return [];
    }

    console.log(
      format(
        "orchestrator",
        `\nResuming execution from first incomplete task...`,
      ),
    );

    const devResults = await runTasksSequentially(
      tasksData.userStories,
      projectPath,
      mcpConfig,
    );

    console.log(format("git_ok", "\n✓ Development restart complete!"));
    return devResults;
  } catch (error) {
    if (error.message?.startsWith("RESOURCE_EXHAUSTION_RESTART:")) {
      throw error;
    }
    if (error.code === "ENOENT") {
      console.error(
        format("error", `\n✗ Error: tasks.json not found at ${tasksPath}`),
      );
      console.log(
        format(
          "task",
          "Please run 'Create Tasks from PRD' first to generate a tasks file.",
        ),
      );
    } else {
      console.error(
        format("error", "\n✗ Error loading tasks.json:", error.message),
      );
      console.log(
        format(
          "task",
          "The tasks file may be corrupted. Consider regenerating tasks from your PRD.",
        ),
      );
    }
    return [];
  }
}
