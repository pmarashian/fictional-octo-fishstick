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
 * 2. AI analyzes PRD and generates structured task breakdown
 * 3. Interactive approval workflow allows refinement
 * 4. Tasks are saved as JSON with proper user story formatting
 *
 * Task Structure:
 * - Sequential IDs with dependency management
 * - Detailed descriptions with technical specifications
 * - 3-5 specific acceptance criteria per task
 * - Role assignments (backend, frontend-ui, frontend-logic)
 * - Priority levels (1-100, lower = higher priority)
 *
 * The system uses JSON schema validation to ensure consistent, machine-readable
 * task structures that can be processed by the development execution engine.
 */

import prompts from "prompts";
import OpenAI from "openai";
import { MODELS } from "./config.mjs";
import { loadPrompt } from "./file-ops.mjs";
import { selectExistingPRD, generateTaskFiles } from "./file-ops.mjs";

/**
 * Generate Structured Task Breakdown from PRD
 *
 * Uses OpenAI with JSON schema validation to convert PRD content into
 * structured, actionable development tasks. Implements an interactive
 * approval loop allowing users to refine the task breakdown iteratively.
 *
 * Task Breakdown Process:
 * 1. Load specialized task breakdown system prompt
 * 2. Send PRD content to AI with structured JSON schema
 * 3. Parse and validate JSON response
 * 4. Present tasks for user approval
 * 5. Allow regeneration or feedback-based refinement
 * 6. Repeat until approved or max iterations reached
 *
 * JSON Schema Ensures:
 * - Sequential task IDs starting from 1
 * - Detailed, actionable descriptions
 * - 3-5 specific acceptance criteria per task
 * - Dependency relationships between tasks
 * - Role assignments and priority levels
 *
 * @param {string} prdOutput - Complete PRD content to break down
 * @param {number} maxIterations - Maximum refinement iterations (default: 5)
 * @returns {Promise<Array>} Array of structured task objects
 * @throws {Error} If max iterations reached without approval or API errors
 */
async function generateTasksWithOpenAI(prdOutput, maxIterations = 5) {
  // === OPENAI INTEGRATION SETUP ===
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Load specialized system prompt for task breakdown generation
  const systemMessage = {
    role: "system",
    content: await loadPrompt("task-breakdown-system.md"),
  };

  // Initialize conversation with system prompt and PRD content
  let messages = [
    systemMessage,
    {
      role: "user",
      content: `Break this PRD into tasks:\n\n${prdOutput}`,
    },
  ];

  let iterations = 0;

  while (iterations < maxIterations) {
    try {
      console.log("\nGenerating task breakdown...");

      const completion = await openai.chat.completions.create({
        model: MODELS.taskBreakdown,
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
                      description: {
                        type: "string",
                        description: "Specific, actionable task description with file paths and technical details",
                      },

                      // === ACCEPTANCE CRITERIA ===
                      success_criteria: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of 3-5 specific, testable acceptance criteria",
                        minItems: 3,  // Minimum 3 criteria for thorough testing
                        maxItems: 5,  // Maximum 5 to avoid over-specification
                      },

                      // === DEPENDENCY MANAGEMENT ===
                      dependencies: {
                        type: "array",
                        items: { type: "integer" },
                        description: "Array of task IDs this task depends on (empty if none)",
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
                        description: "Priority level 1-100 (1 = highest priority)",
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
      const parsed = JSON.parse(jsonOutput);

      // === INTERACTIVE APPROVAL LOOP ===
      // Display structured task breakdown for user review
      console.log(`\nTask List Output:\n${JSON.stringify(parsed, null, 2)}\n`);

      // Present approval options with clear user interface
      const response = await prompts({
        type: "select",
        name: "choice",
        message: "Approve Task List?",
        choices: [
          { title: "Yes", value: "yes" },              // Accept tasks as final
          { title: "No (regenerate)", value: "no" },  // Regenerate from scratch
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

        // Add AI response and user feedback to conversation for context
        messages.push(completion.choices[0].message);  // AI's task breakdown
        messages.push({
          role: "user",
          content: `Refine the task breakdown based on this feedback: ${userFeedback}`,
        });
      }

      // === REGENERATE PATH ===
      else {
        // Reset conversation to original state for fresh generation
        console.log("Regenerating...");
        messages = [
          systemMessage,
          {
            role: "user",
            content: `Break this PRD into tasks:\n\n${prdOutput}`,
          },
        ];
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

  // Generate tasks using OpenAI API with JSON mode
  const tasks = await generateTasksWithOpenAI(selectedPRD.prdContent);

  // Generate tasks.json file
  const tasksJsonPath = await generateTaskFiles(tasks);

  console.log(`\n✓ Tasks created: ${tasksJsonPath}`);
  return { tasks, tasksJsonPath };
}