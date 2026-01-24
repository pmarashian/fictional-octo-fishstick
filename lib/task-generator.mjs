/**
 * Task Breakdown from PRDs
 *
 * This module implements the task generation workflow, the second phase of the
 * Ralph orchestrator's development process. It converts Product Requirements
 * Documents into structured, actionable development tasks with dependencies,
 * priorities, and acceptance criteria.
 *
 * Task Generation Process:
 * 1. User selects existing PRD from project directory
 * 2. Agent analyzes PRD (can load skills, read reference files)
 * 3. Agent output is validated and converted to JSON using chat completion
 * 4. Interactive approval workflow allows refinement
 * 5. Tasks are saved as JSON with proper user story formatting
 *
 * Task Structure:
 * - Sequential IDs with dependency management
 * - Detailed descriptions with technical specifications
 * - 3-7 specific acceptance criteria per task
 * - Role assignments (backend, frontend-ui, frontend-logic)
 * - Priority levels (1-100, lower = higher priority)
 *
 * The system uses a two-phase approach:
 * - Agent phase: Enables skill loading and file reading capabilities
 * - Validation phase: Uses JSON schema validation to ensure consistent, machine-readable
 *   task structures that can be processed by the development execution engine.
 */

import prompts from "prompts";
import OpenAI from "openai";
import { exec } from "child_process";
import path from "path";
import fs from "fs-extra";
import { MODELS } from "./config.mjs";
import { loadPrompt } from "./file-ops.mjs";
import { selectExistingPRD, generateTaskFiles } from "./file-ops.mjs";
import { runAgent } from "./agent-runner.mjs";

/**
 * Play system beep sound to notify user
 * Uses macOS afplay command to play a system sound
 * Fails silently if sound cannot be played
 */
function playBeep() {
  exec("afplay /System/Library/Sounds/Glass.aiff", (error) => {
    // Fail silently - don't interrupt workflow if beep fails
    if (error) {
      // Silently ignore errors
    }
  });
}

/**
 * Validate task JSON structure
 * Checks that the parsed JSON matches the expected schema
 * @param {Object} parsed - Parsed JSON object
 * @returns {Object} { valid: boolean, hasInvalidTasks: boolean }
 */
function validateTaskStructure(parsed) {
  if (!parsed.userStories || !Array.isArray(parsed.userStories)) {
    return { valid: false, hasInvalidTasks: false };
  }

  let hasInvalidTasks = false;
  for (const task of parsed.userStories) {
    // Check required fields
    if (
      !task.id ||
      !task.description ||
      !task.success_criteria ||
      !Array.isArray(task.success_criteria) ||
      !task.dependencies ||
      !Array.isArray(task.dependencies) ||
      !task.suggested_role ||
      !task.priority
    ) {
      hasInvalidTasks = true;
      continue;
    }

    // Validate success_criteria count (3-5 items)
    if (
      task.success_criteria.length < 3 ||
      task.success_criteria.length > 5
    ) {
      console.error(
        `Task ${task.id || "unknown"} missing valid success_criteria array (must have 3-5 items, found ${task.success_criteria.length})`,
      );
      hasInvalidTasks = true;
    }

    // Validate suggested_role enum
    if (
      !["backend", "frontend-ui", "frontend-logic"].includes(
        task.suggested_role,
      )
    ) {
      hasInvalidTasks = true;
    }

    // Validate priority range
    if (typeof task.priority !== "number" || task.priority < 1 || task.priority > 100) {
      hasInvalidTasks = true;
    }
  }

  return { valid: !hasInvalidTasks, hasInvalidTasks };
}

/**
 * Generate Structured Task Breakdown from PRD using Agent + Validation
 *
 * Two-phase approach:
 * 1. Agent Phase: Uses AI agent to analyze PRD, load skills, read reference files
 * 2. Validation Phase: Uses chat completion with JSON schema to ensure valid JSON output
 *
 * This approach allows the agent to leverage skills and file reading capabilities
 * while ensuring the final output is valid JSON that can be processed downstream.
 *
 * Task Breakdown Process:
 * 1. Agent analyzes PRD file (can load skills, read reference files)
 * 2. Agent output is validated and converted to JSON using chat completion
 * 3. Parse and validate JSON response
 * 4. Present tasks for user approval
 * 5. Allow regeneration or feedback-based refinement
 * 6. Repeat until approved or max iterations reached
 *
 * JSON Schema Ensures:
 * - Sequential task IDs starting from 1
 * - Detailed, actionable descriptions
 * - 3-7 specific acceptance criteria per task
 * - Dependency relationships between tasks
 * - Role assignments and priority levels
 *
 * @param {string} prdFilePath - Absolute path to PRD file for agent to read
 * @param {string} prdContent - PRD content (kept for validation phase if needed)
 * @param {number} maxIterations - Maximum refinement iterations (default: 5)
 * @param {Object|null} mcpConfig - MCP configuration for skill loading
 * @returns {Promise<Array>} Array of structured task objects
 * @throws {Error} If max iterations reached without approval or API errors
 */
async function generateTasksWithAgent(
  prdFilePath,
  prdContent,
  maxIterations = 5,
  mcpConfig = null,
) {
  // === OPENAI INTEGRATION SETUP ===
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Load specialized system prompt for task breakdown generation
  const systemMessage = {
    role: "system",
    content: await loadPrompt("task-breakdown-system.md"),
  };

  let iterations = 0;
  let agentOutput = null;

  while (iterations < maxIterations) {
    try {
      // === PHASE 1: AGENT-BASED ANALYSIS ===
      if (!agentOutput) {
        console.log(
          "\n[Phase 1] Agent analyzing PRD and generating task breakdown...",
        );

        const agentPrompt = `Load the task-generation skill using load_skill("task-generation") to understand all rules and requirements, including the User Story Format Examples section.

Read and analyze the PRD file: ${prdFilePath}

**CRITICAL: Task descriptions MUST be in user story format: "As a [role], I need/want [capability] so [benefit]"**

The task-generation skill contains comprehensive examples of proper user story format. Descriptions should be user stories, NOT technical instructions. Technical details belong in acceptance criteria, not descriptions.

**CRITICAL: Do NOT include generic compilation/verification checks in success_criteria**

Generic checks like "TypeScript compilation succeeds without errors" or "Code compiles without errors" are handled automatically by the dev agent prompt and skills. Only include task-specific success criteria that test the specific functionality being implemented in that task.

Break it down into structured development tasks. You can:
- Load other relevant skills if needed
- Search the codebase for patterns

**IMPORTANT: Write the task breakdown directly to \`tasks/tasks.json\` file in valid JSON format.**

The JSON structure must be:
{
  "userStories": [
    {
      "id": 1,
      "description": "As a [role], I need/want [capability] so [benefit]",
      "success_criteria": ["criterion 1", "criterion 2", "criterion 3"],
      "dependencies": [],
      "suggested_role": "backend" | "frontend-ui" | "frontend-logic",
      "priority": 1-100
    }
  ]
}

Requirements:
- Create the \`tasks\` directory if it doesn't exist
- Each task must have sequential IDs starting from 1
- Each task must have 3-5 items in success_criteria array
- All required fields must be present (id, description, success_criteria, dependencies, suggested_role, priority)
- Write valid JSON that can be parsed directly
- Exclude generic compilation/verification checks from success_criteria (these are handled by dev agent)

Remember: descriptions = user stories, acceptance criteria = technical details (but NOT generic compilation checks).`;

        const agentResult = await runAgent(
          agentPrompt,
          MODELS.taskBreakdown,
          process.cwd(),
          null,
          (msg) => console.log(msg),
          null,
          mcpConfig,
        );

        agentOutput = agentResult.output;
        console.log("\n[Phase 1] Agent analysis complete.");
      }

      // === CHECK FOR DIRECT FILE WRITE ===
      // The agent may have written directly to tasks/tasks.json
      // Check if file exists and validate JSON structure
      const tasksJsonPath = path.join(process.cwd(), "tasks", "tasks.json");
      let parsed = null;
      let needsValidation = true;

      try {
        if (await fs.pathExists(tasksJsonPath)) {
          console.log("\n[Phase 1] Found tasks/tasks.json file, validating...");
          const fileContent = await fs.readFile(tasksJsonPath, "utf8");
          parsed = JSON.parse(fileContent);

          // Validate structure
          const validation = validateTaskStructure(parsed);
          if (validation.valid) {
            console.log(
              "\n[Phase 1] File contains valid JSON structure. Skipping Phase 2.",
            );
            needsValidation = false;
          } else {
            console.log(
              "\n[Phase 1] File exists but structure is invalid. Using fallback validation.",
            );
            // Will use file content in validation prompt
            agentOutput = fileContent;
          }
        } else {
          console.log(
            "\n[Phase 1] tasks/tasks.json not found. Using agent output for validation.",
          );
        }
      } catch (error) {
        // File doesn't exist or JSON parsing failed
        if (error.code === "ENOENT") {
          console.log(
            "\n[Phase 1] tasks/tasks.json not found. Using agent output for validation.",
          );
        } else {
          console.log(
            `\n[Phase 1] Error reading/parsing tasks/tasks.json: ${error.message}. Using fallback validation.`,
          );
          // Try to read file content if it exists for fallback
          try {
            if (await fs.pathExists(tasksJsonPath)) {
              agentOutput = await fs.readFile(tasksJsonPath, "utf8");
            }
          } catch (readError) {
            // Use original agent output
          }
        }
      }

      // === PHASE 2: JSON VALIDATION (CONDITIONAL) ===
      if (needsValidation) {
        console.log("\n[Phase 2] Validating and converting to JSON format...");

        const validationPrompt = `Convert this task breakdown analysis into valid JSON format following the exact schema.

${agentOutput || "No agent output available"}

Ensure all tasks have:
- Sequential IDs starting from 1
- success_criteria array with 3-5 items
- All required fields present
- Valid JSON structure

**CRITICAL: Remove any generic compilation/verification checks from success_criteria**

If you see generic items like "TypeScript compilation succeeds without errors" or "Code compiles without errors" in success_criteria, REMOVE them. These are handled by the dev agent prompt/skills, not task-specific success criteria. Only keep task-specific, observable, testable criteria that verify the specific functionality being implemented.`;

        // Initialize conversation with system prompt and validation request
        let messages = [
          systemMessage,
          {
            role: "user",
            content: validationPrompt,
          },
        ];

        const completion = await openai.chat.completions.create({
          model: MODELS.taskBreakdownFormatter,
          messages: messages,
          // === JSON SCHEMA VALIDATION ===
          // Structured schema ensures consistent, machine-readable task format
          // Required for automated processing by development execution engine
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "task_breakdown",
              schema: {
                title: "task_breakdown",
                type: "object",
                properties: {
                  userStories: {
                    type: "array",
                    description: "Array of user stories broken down from the PRD",
                    items: {
                      type: "object",
                      properties: {
                        // === TASK IDENTIFICATION ===
                        id: {
                          type: "integer",
                          description: "Sequential task ID starting from 1",
                        },

                        // === TASK DESCRIPTION ===
                        // MUST BE IN USER STORY FORMAT: "As a [role], I need/want [capability] so [benefit]"
                        // Examples:
                        // - "As a developer, I need a Next.js backend API project scaffolded so I have a foundation for all API endpoints."
                        // - "As a user, I want to create a clan so I can start a private sharing group."
                        // - "As a user, I want to see a combined feed of all my clans so I can view everything at once."
                        // DO NOT use technical implementation language in descriptions - put technical details in acceptance criteria instead.
                        // Reference the task-generation skill's "User Story Format Examples" section for comprehensive format examples.
                        description: {
                          type: "string",
                          description:
                            "User story format: 'As a [role], I need/want [capability] so [benefit]'. Must follow user story structure, not technical instructions. Technical details belong in acceptance criteria.",
                        },

                        // === ACCEPTANCE CRITERIA ===
                        success_criteria: {
                          type: "array",
                          items: { type: "string" },
                          description:
                            "Array of 3-5 specific, testable acceptance criteria",
                          minItems: 3, // Minimum 3 criteria for thorough testing
                          maxItems: 5, // Maximum 5 to avoid over-specification
                        },

                        // === DEPENDENCY MANAGEMENT ===
                        dependencies: {
                          type: "array",
                          items: { type: "integer" },
                          description:
                            "Array of task IDs this task depends on (empty if none)",
                        },

                        // === ROLE ASSIGNMENT ===
                        suggested_role: {
                          type: "string",
                          enum: ["backend", "frontend-ui", "frontend-logic"],
                          description: "Suggested role for this task",
                        },

                        // === PRIORITY LEVEL ===
                        priority: {
                          type: "integer",
                          description:
                            "Priority level 1-100 (1 = highest priority)",
                          minimum: 1,
                          maximum: 100,
                        },
                      },

                      // === REQUIRED FIELDS ===
                      // All fields must be present for task execution engine
                      required: [
                        "id",
                        "description",
                        "success_criteria",
                        "dependencies",
                        "suggested_role",
                        "priority",
                      ],
                    },
                  },
                },

                // === ROOT LEVEL REQUIREMENTS ===
                required: ["userStories"],
              },
            },
          },
        });

        const jsonOutput = completion.choices[0].message.content;
        parsed = JSON.parse(jsonOutput);
      }

      // === VALIDATE SUCCESS CRITERIA ===
      // Ensure every task has success_criteria array with 3-5 items
      if (!parsed || !parsed.userStories || !Array.isArray(parsed.userStories)) {
        throw new Error(
          "Invalid response: missing or invalid userStories array",
        );
      }

      const validation = validateTaskStructure(parsed);
      if (validation.hasInvalidTasks) {
        console.log("Some tasks missing valid structure. Regenerating...");
        continue; // Continue the loop to regenerate
      }

      // === INTERACTIVE APPROVAL LOOP ===
      // Display structured task breakdown for user review
      console.log(`\nTask List Output:\n${JSON.stringify(parsed, null, 2)}\n`);

      // Play beep sound to notify user that approval is needed
      playBeep();

      // Present approval options with clear user interface
      const response = await prompts({
        type: "select",
        name: "choice",
        message: "Approve Task List?",
        choices: [
          { title: "Yes", value: "yes" }, // Accept tasks as final
          { title: "No (regenerate)", value: "no" }, // Regenerate from scratch
          { title: "Edit with feedback", value: "edit" }, // Provide refinement feedback
        ],
      });

      // Handle user cancellation
      if (!response.choice) {
        throw new Error("User cancelled the prompt");
      }

      const userChoice = response.choice;

      // === APPROVAL PATH ===
      if (userChoice === "yes") {
        return parsed.userStories; // Return validated task array
      }

      // === EDIT WITH FEEDBACK PATH ===
      else if (userChoice === "edit") {
        // Collect user feedback for task refinement
        const editResponse = await prompts({
          type: "text",
          name: "feedback",
          message: "Enter your edits/feedback:",
        });

        if (!editResponse.feedback) {
          throw new Error("User cancelled the prompt");
        }

        const userFeedback = editResponse.feedback;

        // Regenerate agent output with feedback
        console.log("\nRegenerating with feedback...");
        agentOutput = null; // Force regeneration
        iterations--; // Don't count this as a new iteration
      }

      // === REGENERATE PATH ===
      else {
        // Reset to force fresh agent generation
        console.log("Regenerating...");
        agentOutput = null; // Force regeneration
        iterations--; // Don't count this as a new iteration
      }
    } catch (error) {
      console.error("Error calling OpenAI API:", error.message);
      throw error;
    }

    iterations++;
  }

  throw new Error("Max iterations reached for Task List without approval.");
}

export async function actionCreateTasks(mcpConfigForAgent) {
  console.log("\nSelecting a PRD to generate tasks from...");
  const selectedPRD = await selectExistingPRD();

  if (!selectedPRD) {
    console.log("No PRD selected. Returning to menu.");
    return null;
  }

  console.log(`PRD available at: ${selectedPRD.prdPath}`);

  // Convert relative path to absolute path for agent
  const prdAbsolutePath = path.isAbsolute(selectedPRD.prdPath)
    ? selectedPRD.prdPath
    : path.resolve(process.cwd(), selectedPRD.prdPath);

  // Generate tasks using agent-based approach with JSON validation
  const tasks = await generateTasksWithAgent(
    prdAbsolutePath,
    selectedPRD.prdContent,
    5,
    mcpConfigForAgent,
  );

  // Generate tasks.json file
  const tasksJsonPath = await generateTaskFiles(tasks);

  console.log(`\n✓ Tasks created: ${tasksJsonPath}`);
  return { tasks, tasksJsonPath };
}
