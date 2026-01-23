#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { CursorAgent } from "./cursor-agent-sdk/dist/index.js";
import OpenAI from "openai";
import prompts from "prompts";
import path from "path";
import fs from "fs-extra";
import { execSync } from "child_process";
import dotenv from "dotenv";

// Get script directory (for loading assets bundled with the script)
// NOTE: SCRIPT_DIR points to the orchestrator directory and is used for:
// - Loading prompts from prompts/ folder
// - Loading templates from prds/TEMPLATE.md
// - Loading example PRDs
// This is different from process.cwd() which points to the PROJECT directory
const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);

// Load .env file from orchestrator directory (not from process.cwd())
dotenv.config({ path: path.join(SCRIPT_DIR, ".env") });

// Token thresholds (from repo)
const WARN_THRESHOLD = 70000; // Bytes ~ tokens
const ROTATE_THRESHOLD = 80000;

// Clarification rounds
const MAX_CLARIFICATION_ROUNDS = 3;

// Progress tracking file (project-specific, relative to cwd)
// NOTE: These paths use process.cwd() to create folders in the PROJECT directory
// (where the command is run), NOT in the orchestrator directory (SCRIPT_DIR)
const PROGRESS_PATH = path.join(process.cwd(), "tasks/progress.txt");
// Next task file (single file updated before each task)
const NEXT_TASK_PATH = path.join(process.cwd(), "tasks/next_task.md");

// Logging configuration (project-specific, relative to cwd)
// NOTE: Logs are created in the project directory, not the orchestrator directory
const LOG_DIR = path.join(process.cwd(), "logs");
const RUN_ID = Date.now();

// Model configuration
const MODELS = {
  prd: "auto",
  clarification: "gpt-5.2-2025-12-11",
  taskBreakdown: "gpt-5.2-2025-12-11",
  devAgent: "grok",
  default: "auto",
};

// Helper function to load prompts from files (script assets, relative to script location)
// NOTE: Prompts are loaded from the orchestrator directory (SCRIPT_DIR), not the project directory
async function loadPrompt(filename) {
  const promptPath = path.join(SCRIPT_DIR, "prompts", filename);
  return await fs.readFile(promptPath, "utf8");
}

async function getMultiLineInput() {
  console.log("Enter your message to the PM (you can paste multi-line text):");

  const response = await prompts({
    type: "text",
    name: "message",
    message: "Your message to PM:",
  });

  if (!response.message) {
    throw new Error("User cancelled the prompt");
  }

  return response.message;
}

async function selectExistingPRD() {
  // PRDs are stored in the project directory (where command is run)
  const prdsDir = path.join(process.cwd(), "prds");

  // Read PRD files and filter out TEMPLATE.md
  const prdFiles = (await fs.readdir(prdsDir))
    .filter((file) => file.endsWith(".md") && file !== "TEMPLATE.md")
    .sort();

  if (prdFiles.length === 0) {
    console.log("No existing PRDs found in the prds folder.");
    return null;
  }

  const choices = prdFiles.map((file, _index) => ({
    title: file.replace("prd-", "").replace(".md", ""),
    value: file,
    description: `Select ${file}`,
  }));

  const response = await prompts({
    type: "select",
    name: "selectedPRD",
    message: "Choose an existing PRD:",
    choices: choices,
    initial: 0,
  });

  if (!response.selectedPRD) {
    console.log("No PRD selected.");
    return null;
  }

  const prdPath = path.join(prdsDir, response.selectedPRD);
  const prdContent = await fs.readFile(prdPath, "utf8");

  console.log(`✓ Selected PRD: ${response.selectedPRD}`);
  return { prdPath, prdContent };
}

async function selectExistingTasksFile() {
  // Tasks are stored in the project directory (where command is run)
  const tasksDir = path.join(process.cwd(), "tasks");

  // Check if tasks directory exists
  try {
    await fs.access(tasksDir);
  } catch {
    console.log("No tasks directory found.");
    return null;
  }

  // Read tasks.json files (could be multiple if stored with different names)
  // For now, we'll look for tasks.json files - could be enhanced to support multiple files
  const tasksFiles = (await fs.readdir(tasksDir))
    .filter((file) => file === "tasks.json" || file.endsWith("-tasks.json"))
    .sort();

  if (tasksFiles.length === 0) {
    console.log("No existing tasks.json files found in the tasks folder.");
    return null;
  }

  const choices = tasksFiles.map((file, _index) => ({
    title: file.replace("-tasks.json", "").replace("tasks.json", "tasks"),
    value: file,
    description: `Select ${file}`,
  }));

  const response = await prompts({
    type: "select",
    name: "selectedTasks",
    message: "Choose a tasks file:",
    choices: choices,
    initial: 0,
  });

  if (!response.selectedTasks) {
    console.log("No tasks file selected.");
    return null;
  }

  const tasksPath = path.join(tasksDir, response.selectedTasks);
  const tasksContent = await fs.readFile(tasksPath, "utf8");
  const tasksData = JSON.parse(tasksContent);

  console.log(`✓ Selected tasks file: ${response.selectedTasks}`);
  return { tasksPath, tasksData };
}

async function runAgent(
  prompt,
  model = MODELS.default,
  cwd = process.cwd(),
  resume = null,
  logCallback = () => {},
  progressCallback = null,
) {
  const agentOptions = {
    cwd,
    defaultModel: model,
    sandbox: "enabled",
    approveMcps: true,
    forceWrites: true,
  };

  const agent = new CursorAgent(agentOptions);

  let response = "";
  let sessionId = null;
  let isThinkingActive = false;
  let accumulatedThinking = "";

  // Hang detection: track consecutive tool rejections
  const _consecutiveRejections = 0;

  for await (const event of agent.stream({
    prompt,
    model,
    chatId: resume,
    streamPartialOutput: true,
    sandbox: "enabled",
    approveMcps: true,
  })) {
    // Track session ID
    if (event.chatId) {
      sessionId = event.chatId;
    }

    // Log system and user messages with content
    if (event.type === "system" && event.message?.content) {
      const content =
        typeof event.message.content === "string"
          ? event.message.content
          : JSON.stringify(event.message.content);
      logCallback(`[SYSTEM] ${content.slice(0, 100)}...`);

      if (logCallback.activityLogger) {
        logCallback.activityLogger.log("system", "System prompt", {
          content: content,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (event.type === "user" && event.message?.content) {
      const content =
        typeof event.message.content === "string"
          ? event.message.content
          : JSON.stringify(event.message.content);
      logCallback(`[USER] ${content.slice(0, 100)}...`);

      if (logCallback.activityLogger) {
        logCallback.activityLogger.log("user", "User message", {
          content: content,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Capture thinking/reasoning content with streaming
    if (event.type === "thinking") {
      if (event.subtype === "delta") {
        // First delta: print prefix without newline
        if (!isThinkingActive) {
          process.stdout.write("[THINKING] ");
          isThinkingActive = true;
        }
        // Stream the text as it arrives
        if (event.text) {
          process.stdout.write(event.text);
          accumulatedThinking += event.text;
        }
      } else if (event.subtype === "completed") {
        // End the line
        process.stdout.write("\n");

        // Log accumulated thinking to activity logger
        if (logCallback.activityLogger && accumulatedThinking) {
          logCallback.activityLogger.log("thinking", "AI reasoning", {
            content: accumulatedThinking,
            timestamp: new Date().toISOString(),
          });
        }

        // Reset state
        isThinkingActive = false;
        accumulatedThinking = "";
      }
    }

    // Track tool calls with enhanced logging
    if ((event.type === "tool_use" || event.type === "tool_call") && 
        (!event.subtype || event.subtype === "started")) {
      let toolName =
        event.tool_name ||
        event.name ||
        event.tool?.name ||
        event.function?.name ||
        event.id ||
        "unknown";

      // Handle MCP function calls
      if (event.tool_call?.functionCall) {
        toolName = event.tool_call.functionCall.name;
      } else if (event.tool_call?.mcpToolCall) {
        // Handle MCP tool calls with nested structure
        toolName = "mcpToolCall";
      } else {
        Object.keys(event?.tool_call || {}).forEach((key) => {
          if (key !== "functionCall") {
            toolName = key;
          }
        });
      }

      let args =
        event?.tool_call?.[toolName]?.args ||
        event?.tool_call?.functionCall?.arguments;
      
      // Extract actual args from mcpToolCall nested structure
      if (toolName === "mcpToolCall" && event.tool_call?.mcpToolCall?.args?.args) {
        args = event.tool_call.mcpToolCall.args.args;
      }

      // Check if tool_call already has the desired format: {toolName: {args: {...}}}
      // This handles cases like {"load_skill": {"args": {"skill_id": "..."}}}
      let alreadyFormatted = false;
      if (event?.tool_call && toolName !== "unknown" && toolName !== "mcpToolCall") {
        const toolCallValue = event.tool_call[toolName];
        if (toolCallValue && typeof toolCallValue === "object" && toolCallValue.args) {
          // Already in the desired format
          alreadyFormatted = true;
          args = toolCallValue.args;
        }
      }

      let argsStr = "";
      if (args) {
        argsStr = typeof args === "string" ? args : JSON.stringify(args);
      }

      if (toolName === "readToolCall") {
        logCallback(`🔧 READING FILE: ${args?.path}`);
      } else if (toolName === "shellToolCall") {
        const command = args?.command;

        if (command) {
          logCallback(`🔧 SHELL COMMAND: ${command}`);
        } else {
          logCallback(`🔧 SHELL COMMAND: ${argsStr}`);
        }
      } else if (toolName === "execute_shell_command") {
        // MCP shell command execution
        const command =
          typeof args === "string" ? JSON.parse(args).command : args?.command;

        if (command) {
          logCallback(`🔧 SHELL COMMAND (via MCP): ${command}`);
        } else {
          logCallback(`🔧 SHELL COMMAND (via MCP): ${argsStr}`);
        }
      } else if (toolName === "editToolCall") {
        logCallback(`🔧 EDITING FILE: ${args?.path}`);
      } else if (toolName === "grepToolCall") {
        logCallback(`🔧 GREP: ${args?.pattern}`);
      } else if (toolName === "lsToolCall") {
        logCallback(`🔧 LS: ${args?.path}`);
      } else if (toolName === "updateTodosToolCall") {
        const todoCount = args?.todos?.length || 0;
        const merge = args?.merge ? "merging" : "replacing";
        logCallback(`🔧 UPDATING TODOS: ${merge} ${todoCount} todo(s)`);
      } else if (toolName === "deleteToolCall") {
        logCallback(`🔧 DELETING FILE: ${args?.path}`);
      } else if (toolName === "globToolCall") {
        logCallback(`🔧 GLOB: ${args?.globPattern}`);
      } else if (toolName === "get_isometric_tile") {
        const tileId = args?.tile_id;
        if (tileId) {
          logCallback(`🔧 GETTING ISOMETRIC TILE: ${tileId}`);
        } else {
          logCallback(`🔧 GETTING ISOMETRIC TILE: ${argsStr}`);
        }
      } else if (toolName === "load_skill") {
        const skillId = args?.skill_id;
        if (skillId) {
          logCallback(`🔧 LOADING SKILL: ${skillId}`);
        } else {
          logCallback(`🔧 LOADING SKILL: ${argsStr}`);
        }
      } else if (toolName === "mcpToolCall" && event.tool_call?.mcpToolCall) {
        // Handle MCP tool calls with nested structure
        const mcpCall = event.tool_call.mcpToolCall;
        const actualToolName = mcpCall.args?.toolName || mcpCall.args?.name || "unknown";
        const actualArgs = mcpCall.args?.args || {};
        const provider = mcpCall.args?.providerIdentifier || "unknown";
        
        // Format: {toolName: {args: {...}}}
        const formattedToolCall = { [actualToolName]: { args: actualArgs } };
        logCallback(`🔧 TOOL: ${JSON.stringify(formattedToolCall)}`);
      } else {
        // Format MCP and other tool calls properly
        // Structure: {toolName: {args: {...}}}
        // This handles tool calls like {"load_skill": {"args": {"skill_id": "..."}}}
        if (alreadyFormatted && event?.tool_call && toolName !== "unknown") {
          // If already in the correct format, use it directly
          const formattedToolCall = { [toolName]: event.tool_call[toolName] };
          logCallback(`🔧 TOOL: ${JSON.stringify(formattedToolCall)}`);
        } else if (toolName !== "unknown" && args) {
          // Format with extracted args
          const formattedToolCall = { [toolName]: { args } };
          logCallback(`🔧 TOOL: ${JSON.stringify(formattedToolCall)}`);
        } else if (event?.tool_call) {
          // Fallback: use the raw tool_call structure (may already be in correct format)
          logCallback(`🔧 TOOL: ${JSON.stringify(event.tool_call)}`);
        } else {
          logCallback(`🔧 TOOL: ${toolName}${args ? ` with args: ${argsStr}` : ""}`);
        }
      }

      // Log full tool parameters
      const params =
        event.input || event.tool_input || event.parameters || event.arguments;

      // Use actual tool name for mcpToolCall in activity logger
      let actualToolNameForLog = toolName;
      if (toolName === "mcpToolCall" && event.tool_call?.mcpToolCall?.args) {
        actualToolNameForLog = event.tool_call.mcpToolCall.args.toolName || 
                               event.tool_call.mcpToolCall.args.name || 
                               toolName;
      }

      if (params) {
        const paramsStr =
          typeof params === "string" ? params : JSON.stringify(params);
        logCallback(
          `     Args: ${paramsStr.slice(0, 300)}${paramsStr.length > 300 ? "..." : ""}`,
        );

        // Log to activity logger with full details
        if (logCallback.activityLogger) {
          logCallback.activityLogger.log("tool_call", `Tool: ${actualToolNameForLog}`, {
            tool: actualToolNameForLog,
            parameters: params,
            event_type: event.type,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Track tool results with enhanced logging
    if (event.type === "tool_result") {
      const toolName =
        event.tool_name || event.name || event.tool_id || "previous tool";
      const hasError = event.error || event.is_error;

      if (hasError) {
        logCallback(`  ❌ FAILED: ${toolName}`);
        const errorMsg = event.error || event.content;
        logCallback(`     Error: ${errorMsg}`);

        if (logCallback.activityLogger) {
          logCallback.activityLogger.log(
            "tool_result",
            `Tool failed: ${toolName}`,
            {
              tool: toolName,
              success: false,
              error: errorMsg,
              timestamp: new Date().toISOString(),
            },
          );
        }
      } else {
        logCallback(`  ✅ SUCCESS: ${toolName}`);

        const result =
          typeof event.content === "string"
            ? event.content
            : JSON.stringify(event.content);
        const preview = result.slice(0, 200);
        logCallback(
          `     Result: ${preview}${result.length > 200 ? "..." : ""}`,
        );

        if (logCallback.activityLogger) {
          logCallback.activityLogger.log(
            "tool_result",
            `Tool success: ${toolName}`,
            {
              tool: toolName,
              success: true,
              result: result,
              result_length: result.length,
              timestamp: new Date().toISOString(),
            },
          );
        }
      }
    }

    // Log ALL assistant messages with full content
    if (event.type === "assistant" && event.message?.content?.[0]?.text) {
      const text = event.message.content[0].text;
      response += text;

      // Always show preview in console
      const preview = text.replace(/\n/g, " ").slice(0, 150);

      if (event.message?.content[0]?.type !== "text") {
        console.log("Assistant event:", event?.message?.content);
        logCallback(`💬 ${preview}${text.length > 150 ? "..." : ""}`);
      }

      // Log full content to activity log
      if (logCallback.activityLogger) {
        logCallback.activityLogger.log("assistant", "AI response", {
          content: text,
          is_complete: text.includes("<ralph>COMPLETE</ralph>"),
          tokens: Buffer.byteLength(text, "utf8"),
          timestamp: new Date().toISOString(),
        });
      }

      if (progressCallback) {
        progressCallback({
          tokens: Buffer.byteLength(response, "utf8"),
          chunks: response.length,
        });
      }
    }
  }

  return { output: response, sessionId };
}

async function interactiveLoop(
  initialPrompt,
  model,
  stepName,
  maxIterations = 5,
  mcpConfig = null,
) {
  let prompt = initialPrompt;
  let iterations = 0;

  while (iterations < maxIterations) {
    const { output } = await runAgent(
      prompt,
      model,
      process.cwd(),
      null,
      () => {},
      null,
      mcpConfig,
    );
    console.log(
      `\n${stepName} Output: ============================\n${output}\n`,
    );
    console.log("================================================");
    const response = await prompts({
      type: "select",
      name: "choice",
      message: `Approve ${stepName}?`,
      choices: [
        { title: "Yes", value: "yes" },
        { title: "No (regenerate)", value: "no" },
        { title: "Edit with feedback", value: "edit" },
      ],
    });

    if (!response.choice) {
      throw new Error("User cancelled the prompt");
    }

    const trimmedFeedback = response.choice;

    if (trimmedFeedback === "yes") {
      return output;
    } else if (trimmedFeedback === "edit") {
      const editResponse = await prompts({
        type: "text",
        name: "feedback",
        message: "Enter your edits/feedback:",
      });

      if (!editResponse.feedback) {
        throw new Error("User cancelled the prompt");
      }

      const edits = editResponse.feedback;
      prompt = `Refine the previous ${stepName} based on this feedback: ${edits}\nPrevious output: ${output}`;
    } else {
      console.log("Regenerating...");
      prompt = initialPrompt;
    }

    iterations++;
  }
  throw new Error(`Max iterations reached for ${stepName} without approval.`);
}

async function generateTasksWithOpenAI(prdOutput, maxIterations = 5) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemMessage = {
    role: "system",
    content: await loadPrompt("task-breakdown-system.md"),
  };

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
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "task_breakdown",
            schema: {
              title: "task_breakdown",
              type: "object",
              properties: {
                tasks: {
                  type: "array",
                  description: "Array of tasks broken down from the PRD",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "integer",
                        description: "Sequential task ID starting from 1",
                      },
                      description: {
                        type: "string",
                        description: "Main task description",
                      },
                      success_criteria: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of success criteria for this task",
                      },
                      dependencies: {
                        type: "array",
                        items: { type: "integer" },
                        description:
                          "Array of task IDs this task depends on (empty if none)",
                      },
                      suggested_role: {
                        type: "string",
                        enum: ["backend", "frontend-ui", "frontend-logic"],
                        description: "Suggested role for this task",
                      },
                    },
                    required: [
                      "id",
                      "description",
                      "success_criteria",
                      "dependencies",
                      "suggested_role",
                    ],
                  },
                },
              },
              required: ["tasks"],
            },
          },
        },
      });

      const jsonOutput = completion.choices[0].message.content;
      const parsed = JSON.parse(jsonOutput);

      // Display the output
      console.log(`\nTask List Output:\n${JSON.stringify(parsed, null, 2)}\n`);

      const response = await prompts({
        type: "select",
        name: "choice",
        message: "Approve Task List?",
        choices: [
          { title: "Yes", value: "yes" },
          { title: "No (regenerate)", value: "no" },
          { title: "Edit with feedback", value: "edit" },
        ],
      });

      if (!response.choice) {
        throw new Error("User cancelled the prompt");
      }

      const trimmedFeedback = response.choice;

      if (trimmedFeedback === "yes") {
        return parsed.tasks; // Return the parsed tasks array
      } else if (trimmedFeedback === "edit") {
        const editResponse = await prompts({
          type: "text",
          name: "feedback",
          message: "Enter your edits/feedback:",
        });

        if (!editResponse.feedback) {
          throw new Error("User cancelled the prompt");
        }

        const edits = editResponse.feedback;
        // Add feedback to conversation
        messages.push(completion.choices[0].message);
        messages.push({
          role: "user",
          content: `Refine the task breakdown based on this feedback: ${edits}`,
        });
      } else {
        // Regenerate from scratch
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

async function generateClarificationQuestions(
  userMessage,
  previousClarifications = [],
  clarificationRound = 0,
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const clarificationsContext =
    previousClarifications.length > 0
      ? `\n\nPrevious clarifications:\n${previousClarifications
          .map(
            (c, i) =>
              `${i + 1}. [${c.category}] ${c.question}\n   Answer: ${c.answer}`,
          )
          .join("\n")}`
      : "";

  const systemMessage = {
    role: "system",
    content: await loadPrompt("clarification-system.md"),
  };

  const finalUserMessage = {
    role: "user",
    content: `User request: ${userMessage}${clarificationsContext}

Round ${clarificationRound + 1}: Do you need clarification to create a comprehensive PRD?`,
  };

  const completion = await openai.chat.completions.create({
    model: MODELS.clarification,
    messages: [systemMessage, finalUserMessage],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "clarification_questions",
        schema: {
          title: "clarification_questions",
          type: "object",
          properties: {
            has_questions: {
              type: "boolean",
              description: "Whether clarification questions are needed",
            },
            questions: {
              type: "array",
              description: "Array of clarification questions",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "Unique question identifier",
                  },
                  question: {
                    type: "string",
                    description: "The clarification question to ask",
                  },
                  category: {
                    type: "string",
                    enum: ["scope", "technical", "business", "constraints"],
                    description: "Question category",
                  },
                },
                required: ["id", "question", "category"],
              },
            },
          },
          required: ["has_questions", "questions"],
        },
      },
    },
  });

  const jsonOutput = completion.choices[0].message.content;
  return JSON.parse(jsonOutput);
}

async function collectClarifications(questions, round) {
  console.log(`\n--- Clarification Round ${round} ---\n`);

  // Group questions by category for better presentation
  const questionsByCategory = questions.reduce((acc, q) => {
    if (!acc[q.category]) {
      acc[q.category] = [];
    }
    acc[q.category].push(q);
    return acc;
  }, {});

  const clarifications = [];
  let userExited = false;

  for (const [category, categoryQuestions] of Object.entries(
    questionsByCategory,
  )) {
    console.log(`\n[${category.toUpperCase()}]`);

    for (const question of categoryQuestions) {
      console.log(`\n${question.question}`);

      const response = await prompts({
        type: "text",
        name: "answer",
        message:
          "Answer (or type 'skip' to skip this question, 'done' to finish clarifying):",
        initial: "",
      });

      // Handle cancellation
      if (response.answer === undefined) {
        console.log("Exiting clarification early...");
        userExited = true;
        break;
      }

      const answer = response.answer;
      const trimmedAnswer = answer.trim().toLowerCase();

      if (trimmedAnswer === "done") {
        console.log("Exiting clarification early...");
        userExited = true;
        break;
      } else if (trimmedAnswer === "skip") {
        console.log("Skipping question...");
        continue;
      } else {
        clarifications.push({
          question: question.question,
          answer: answer.trim(),
          category: question.category,
          round: round,
        });
      }
    }

    if (userExited) {
      break;
    }
  }

  return { clarifications, userExited };
}

async function runClarificationFlow(userMessage) {
  const allClarifications = [];

  console.log("\nAnalyzing request for clarification needs...\n");

  for (let round = 0; round < MAX_CLARIFICATION_ROUNDS; round++) {
    try {
      const result = await generateClarificationQuestions(
        userMessage,
        allClarifications,
        round,
      );

      if (!result.has_questions || result.questions.length === 0) {
        console.log("✓ No clarification needed - proceeding to PRD generation");
        break;
      }

      console.log(
        `\nRound ${round + 1}: Found ${result.questions.length} clarification questions`,
      );

      const { clarifications, userExited } = await collectClarifications(
        result.questions,
        round + 1,
      );

      allClarifications.push(...clarifications);

      if (userExited) {
        console.log("✓ User chose to finish clarifying early");
        break;
      }

      console.log(
        `✓ Round ${round + 1} complete - ${clarifications.length} answers collected`,
      );

      if (round < MAX_CLARIFICATION_ROUNDS - 1) {
        console.log("Analyzing if more clarification is needed...\n");
      }
    } catch (error) {
      console.error("Error in clarification round:", error.message);
      console.log("Continuing to PRD generation with available context...");
      break;
    }
  }

  if (allClarifications.length > 0) {
    console.log(
      `\n✓ Collected ${allClarifications.length} clarifications across ${Math.min(MAX_CLARIFICATION_ROUNDS, Math.ceil(allClarifications.length / 3))} rounds`,
    );
  }

  return allClarifications;
}

function formatClarifications(clarifications) {
  return clarifications
    .map(
      (c, i) =>
        `${i + 1}. [${c.category}] ${c.question}\n   Answer: ${c.answer}`,
    )
    .join("\n\n");
}

async function extractPRDDescription(prdOutput) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.clarification, // Use a fast model for this simple extraction
      messages: [
        {
          role: "system",
          content: "Extract a short, descriptive name for a PRD file from the Product Requirements Document. Return only a brief identifier (2-5 words) that describes what the PRD is about. Examples: 'user-authentication', 'payment-processing', 'dashboard-analytics'.",
        },
        {
          role: "user",
          content: `Extract a short filename-friendly description from this PRD:\n\n${prdOutput.substring(0, 2000)}`, // Limit to first 2000 chars for efficiency
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "prd_description",
          schema: {
            title: "prd_description",
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Short description suitable for a filename (2-5 words, lowercase, hyphenated)",
              },
            },
            required: ["description"],
          },
        },
      },
    });

    const jsonOutput = completion.choices[0].message.content;
    const parsed = JSON.parse(jsonOutput);
    return parsed.description;
  } catch (error) {
    console.error("Error extracting PRD description:", error.message);
    // Fallback to regex extraction
    const descriptionMatch = prdOutput.match(
      /^(.+?)\s*[—-]\s*Product Requirements Document/m,
    );
    if (descriptionMatch) {
      return descriptionMatch[1].trim();
    }
    // Final fallback: use timestamp
    return null;
  }
}

async function generatePRDWithContext(
  userMessage,
  clarifications,
  mcpConfig = null,
) {
  // Load template and examples (script assets, relative to script location)
  // NOTE: Templates are loaded from the orchestrator directory (SCRIPT_DIR), not the project directory
  const template = await fs.readFile(path.join(SCRIPT_DIR, "prds", "TEMPLATE.md"), "utf8");
  const example1 = await fs.readFile(path.join(SCRIPT_DIR, "example_prd_1.md"), "utf8");
  const example2 = await fs.readFile(path.join(SCRIPT_DIR, "example_prd_2.md"), "utf8");

  const clarificationsContext =
    clarifications.length > 0
      ? `\n\nClarifications Provided:\n${formatClarifications(clarifications)}\n\n`
      : "";

  // Enhanced prompt with template structure and examples
  const prdPromptTemplate = await loadPrompt("prd-generation.md");
  const prdPrompt = prdPromptTemplate
    .replace("${template}", template)
    .replace("${example1}", example1)
    .replace("${example2}", example2)
    .replace("${userMessage}", userMessage)
    .replace("${clarificationsContext}", clarificationsContext);

  const prdOutput = await interactiveLoop(
    prdPrompt,
    MODELS.prd,
    "PRD",
    5,
    mcpConfig,
  );

  // Extract short description for filename using OpenAI
  console.log("\nExtracting description for filename...");
  let projectName = await extractPRDDescription(prdOutput);
  
  // If extraction failed, use timestamp-based fallback
  if (!projectName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    projectName = `prd-${timestamp}`;
  }
  
  const sanitized = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);

  // Write PRD to file
  // NOTE: PRD is saved to the project directory (where command is run), not the orchestrator directory
  const filename = `prd-${sanitized}.md`;
  const filepath = path.join(process.cwd(), "prds", filename);

  await fs.ensureDir(path.dirname(filepath));
  console.log(`Creating PRD directory: ${path.dirname(filepath)}`);
  await fs.writeFile(filepath, prdOutput, "utf8");

  console.log(`\n✓ PRD saved to ${filepath}\n`);

  return { prdOutput, prdPath: filepath };
}

async function ralphLoop(
  model,
  completionPromise = "<ralph>COMPLETE</ralph>",
  maxIterations = 20,
  logCallback = () => {},
  mcpConfig = null,
) {
  // ────────────────────────────────────────────────
  // Updated prompt: Agent reads files directly, no template replacements
  const ralphPromptTemplate = await loadPrompt("ralph-loop.md");
  let prompt = ralphPromptTemplate;

  let iterations = 0;
  let fullOutput = "";
  let tokenCount = 0;
  const iterationTimings = [];
  let iterationStartTime = Date.now();

  while (iterations < maxIterations) {
    // Record timing
    if (iterations > 0) {
      iterationTimings.push(Date.now() - iterationStartTime);
    }
    iterationStartTime = Date.now();

    logCallback(`Iteration ${iterations + 1}: Starting...`);

    // ────────────────────────────────────────────────
    // runAgent streams output — MCP tool calls will appear in the stream
    // (e.g. agent says "Calling search_skills..." or structured tool invocation)
    const { output } = await runAgent(
      prompt,
      model,
      process.cwd(),
      null,
      logCallback,
      (progress) => {
        // Throttled token count updates during streaming - log every 500 tokens or at start
        const currentTokens = tokenCount + progress.tokens;
        if (currentTokens % 500 === 0 || currentTokens < 50) {
          logCallback(
            `Iteration ${iterations + 1}: Running... Tokens: ${currentTokens}`,
          );
        }
      },
      mcpConfig,
    );

    fullOutput += output;
    tokenCount += Buffer.byteLength(output, "utf8");

    logCallback(
      `Iteration ${iterations + 1} complete. Token count: ${tokenCount}`,
    );

    // Track success criteria progress
    // Read task file to check progress
    let taskContent = "";
    try {
      taskContent = await fs.readFile(NEXT_TASK_PATH, "utf8");
    } catch (e) {
      // Task file might not exist yet, continue
    }
    const criteriaRegex = /\[([x ])\]\s*(.+?)(?=\n|$)/gi;
    const allCriteria = [...(taskContent + fullOutput).matchAll(criteriaRegex)];
    const checkedCount = allCriteria.filter(
      (m) => m[1].toLowerCase() === "x",
    ).length;
    const totalCount = allCriteria.length;

    if (totalCount > 0) {
      logCallback(
        `  📊 Progress: ${checkedCount}/${totalCount} criteria (${Math.round((checkedCount / totalCount) * 100)}%)`,
      );

      // Show next unchecked criterion
      const unchecked = allCriteria.find((m) => m[1] === " ");
      if (unchecked) {
        logCallback(`  📋 Next: ${unchecked[2].slice(0, 60)}...`);
      }
    }

    // Log iteration timing
    const iterationTime = Date.now() - iterationStartTime;
    logCallback(
      `  ⏱️  Iteration ${iterations + 1} took ${(iterationTime / 1000).toFixed(1)}s`,
    );

    // Log tool-related activity if visible in output (helps debug)
    if (output.includes("search_skills") || output.includes("load_skill")) {
      logCallback("→ Detected MCP/Skill usage in output");
    }

    // Read task file to check completion
    let taskContentForCompletion = "";
    try {
      taskContentForCompletion = await fs.readFile(NEXT_TASK_PATH, "utf8");
    } catch (e) {
      // Task file might not exist yet, continue
    }

    if (
      output.includes(completionPromise) ||
      countUncheckedCheckboxes(taskContentForCompletion + fullOutput) === 0
    ) {
      logCallback("Completion detected.");
      break;
    }

    if (tokenCount > WARN_THRESHOLD) {
      logCallback(
        "Warning: Approaching token limit. Agent should check progress.txt for context.",
      );
    }

    // Agent directly manages progress.txt - no extraction needed
    // Don't accumulate prompt - agent reads from progress.txt for context
    iterations++;
  }

  if (iterations >= maxIterations) {
    logCallback("Max iterations reached without completion.");
  }

  return { fullOutput };
}

// Helpers
function countUncheckedCheckboxes(text) {
  return (text.match(/\[\s*\]/g) || []).length;
}

async function updateProgressWithTaskCompletion(taskId, description, output) {
  // Progress file is created in the project directory (tasks/progress.txt)
  await fs.ensureFile(PROGRESS_PATH);

  let progressContent = "";
  try {
    progressContent = await fs.readFile(PROGRESS_PATH, "utf8");
  } catch (e) {
    // File might be empty, that's okay
  }

  // Find the most recent entry for this task
  const taskEntryRegex = new RegExp(
    `(## .* - Task ${taskId})([\\s\\S]*?)(?=## |$)`,
  );
  const match = progressContent.match(taskEntryRegex);

  if (match) {
    // Update the entry with completion info
    const summary = output.substring(0, 200).replace(/\n/g, " ");
    const updatedEntry = match[0].replace(
      /- Work in progress/,
      `- ✅ Completed: ${description.substring(0, 80)}\n- Summary: ${summary}...`,
    );
    const updatedContent = progressContent.replace(
      taskEntryRegex,
      updatedEntry,
    );
    await fs.writeFile(PROGRESS_PATH, updatedContent, "utf8");
  } else {
    // Create a new entry for completion
    const timestamp = new Date().toISOString();
    const summary = output.substring(0, 200).replace(/\n/g, " ");
    const newEntry = `\n## ${timestamp} - Task ${taskId}\n- ✅ Completed: ${description.substring(0, 80)}\n- Summary: ${summary}...\n---\n`;
    await fs.appendFile(PROGRESS_PATH, newEntry, "utf8");
  }
}

async function createActivityLogger(taskId, role) {
  // Logs are created in the project directory (logs/), not the orchestrator directory
  const logFile = path.join(LOG_DIR, `task-${taskId}-${role}-${RUN_ID}.jsonl`);
  try {
    await fs.access(LOG_DIR);
  } catch {
    // Directory doesn't exist, will be created by ensureDir
    console.log(`Creating logs directory: ${LOG_DIR}`);
  }
  await fs.ensureDir(LOG_DIR);
  await fs.ensureFile(logFile);

  return {
    log: (level, message, data = {}) => {
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...data,
      };
      fs.appendFileSync(logFile, JSON.stringify(entry) + "\n");
    },
  };
}

async function generateTaskFiles(tasks) {
  // Tasks are created in the project directory (where command is run), not the orchestrator directory
  const tasksDir = path.join(process.cwd(), "tasks");
  await fs.ensureDir(tasksDir);
  console.log(`Creating tasks directory: ${tasksDir}`);

  const tasksData = {
    created_at: new Date().toISOString(),
    tasks: tasks.map((task) => ({
      id: task.id,
      description: task.description,
      suggested_role: task.suggested_role,
      success_criteria: task.success_criteria,
      dependencies: task.dependencies,
      completed: false,
      started_at: null,
      completed_at: null,
      output: null,
    })),
  };

  const tasksJsonPath = path.join(tasksDir, "tasks.json");
  await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));

  console.log(`✓ Generated tasks.json with ${tasks.length} tasks`);

  return tasksJsonPath;
}

async function runTasksSequentially(tasks, projectPath, mcpConfig = null) {
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

  // Ensure git repo exists
  try {
    execSync("git status", { cwd: projectPath });
  } catch {
    execSync("git init", { cwd: projectPath });
    console.log("Initialized new git repository");
  }

  // Create single feature branch for all tasks
  const featureBranch = `ralph-implementation-${Date.now()}`;

  console.log("\n=== Starting Sequential Task Execution ===");
  console.log(`Total tasks: ${tasksData.tasks.length}`);
  console.log(`Feature branch: ${featureBranch}\n`);

  // Checkout new branch from main
  try {
    execSync("git checkout main", { cwd: projectPath, stdio: "ignore" });
    execSync(`git checkout -b ${featureBranch}`, { cwd: projectPath });
    console.log(`✓ Created and switched to ${featureBranch}\n`);
  } catch (e) {
    console.error(`✗ Failed to create feature branch: ${e.message}`);
    return [];
  }

  const results = [];

  for (const task of tasksData.tasks) {
    if (task.completed) {
      console.log(`\n⊘ Skipping completed task ${task.id}`);
      continue;
    }

    const role = task.suggested_role || "developer";

    console.log(`\n--- Task ${task.id}/${tasksData.tasks.length} ---`);
    console.log(`Role: ${role}`);
    console.log(`Description: ${task.description.substring(0, 80)}...`);

    // Mark as started
    task.started_at = new Date().toISOString();
    await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));

    // Create/update next_task.md file for agent to read
    const criteriaWithCheckboxes = task.success_criteria
      .map((c) => `[ ] ${c}`)
      .join("\n");
    const taskPrompt = `# Task ${task.id} (Role: ${task.suggested_role})

Description: ${task.description}

Success Criteria:
${criteriaWithCheckboxes}

Dependencies: ${task.dependencies.join(", ")}`;

    await fs.writeFile(NEXT_TASK_PATH, taskPrompt);

    // Track task statistics
    const taskStats = {
      startTime: Date.now(),
      iterations: 0,
      toolCalls: 0,
      filesModified: new Set(),
      commandsRun: [],
      errors: [],
    };

    // Create activity logger for this task
    const activityLogger = await createActivityLogger(task.id, role);

    activityLogger.log("info", "Task started", {
      taskId: task.id,
      description: task.description,
      role: role,
    });

    console.log(`\nStarting work on task ${task.id}...`);

    // Enhanced log callback that tracks stats
    const enhancedLogCallback = (text) => {
      console.log(`  ${text}`);

      // Track statistics from log messages
      if (text.includes("Iteration") && text.includes("complete")) {
        taskStats.iterations++;
      }
      if (text.includes("TOOL:")) {
        taskStats.toolCalls++;
      }
      if (
        text.includes("FAILED") ||
        text.includes("ERROR") ||
        text.includes("❌")
      ) {
        taskStats.errors.push(text);
      }

      // Log to file with structured data based on message type
      if (text.startsWith("[")) {
        const eventType =
          text.match(/\[([A-Z_]+)\]/)?.[1]?.toLowerCase() || "agent";
        activityLogger.log(eventType, text);
      } else {
        activityLogger.log("agent", text);
      }
    };

    // Attach activity logger so event handlers can access it
    enhancedLogCallback.activityLogger = activityLogger;

    // Agent reads from tasks/next_task.md (written above)
    const { fullOutput } = await ralphLoop(
      MODELS.devAgent, // model
      "<ralph>COMPLETE</ralph>", // completionPromise
      20, // maxIterations
      enhancedLogCallback, // logCallback
      mcpConfig, // mcpConfig
    );

    // Task file persists - agent reads it directly, no cleanup needed

    // Update progress.txt with task completion
    await updateProgressWithTaskCompletion(
      task.id,
      task.description,
      fullOutput,
    );

    // Mark as completed
    task.completed = true;
    task.completed_at = new Date().toISOString();
    task.output = fullOutput.substring(0, 500); // Store summary

    const duration = Date.now() - taskStats.startTime;
    console.log(`
✓ Task ${task.id} complete in ${(duration / 1000).toFixed(1)}s
  - Iterations: ${taskStats.iterations}
  - Tool calls: ${taskStats.toolCalls}
  - Errors encountered: ${taskStats.errors.length}
  - Output length: ${fullOutput.length} chars
`);

    // Save stats to task
    task.stats = {
      duration_ms: duration,
      iterations: taskStats.iterations,
      tool_calls: taskStats.toolCalls,
      error_count: taskStats.errors.length,
    };

    // Log completion to activity log
    activityLogger.log("info", "Task completed", {
      taskId: task.id,
      stats: task.stats,
    });

    await fs.writeFile(tasksJsonPath, JSON.stringify(tasksData, null, 2));

    results.push({
      task_id: task.id,
      role: role,
      result: fullOutput,
    });
  }

  console.log("\n=== Execution Complete ===");
  console.log(`Feature branch: ${featureBranch}`);
  console.log(`Tasks completed: ${results.length}/${tasksData.tasks.length}`);
  console.log(
    `\nTo merge to main: git checkout main && git merge ${featureBranch}`,
  );

  return results;
}

// ────────────────────────────────────────────────
// Action Functions
// ────────────────────────────────────────────────

async function actionCreatePRD(mcpConfigForAgent) {
  const userMessage = await getMultiLineInput();
  console.log("\nStarting PM workflow with message:\n" + userMessage);

  const clarifications = await runClarificationFlow(userMessage);
  const result = await generatePRDWithContext(
    userMessage,
    clarifications,
    mcpConfigForAgent,
  );

  console.log(`\n✓ PRD created: ${result.prdPath}`);
  return result;
}

async function actionCreateTasks(mcpConfigForAgent) {
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

async function actionRunDev(projectPath, mcpConfigForAgent) {
  console.log("\nSelecting a tasks file to run...");
  const selectedTasks = await selectExistingTasksFile();

  if (!selectedTasks) {
    console.log("No tasks file selected. Returning to menu.");
    return null;
  }

  const devResults = await runTasksSequentially(
    selectedTasks.tasksData.tasks,
    projectPath,
    mcpConfigForAgent,
  );

  // All completion details are already logged by runTasksSequentially
  console.log("\n✓ Development execution complete!");
  return devResults;
}

async function showMainMenu() {
  const response = await prompts({
    type: "select",
    name: "choice",
    message: "What would you like to do?",
    choices: [
      {
        title: "Create PRD",
        value: "create_prd",
        description: "Generate a new PRD",
      },
      {
        title: "Create Tasks from PRD",
        value: "create_tasks",
        description: "Select a PRD and generate tasks.json",
      },
      {
        title: "Run Dev on Tasks",
        value: "run_dev",
        description: "Select a tasks.json file and start development",
      },
      {
        title: "Exit",
        value: "exit",
        description: "Exit the orchestrator",
      },
    ],
    initial: 0,
  });

  return response.choice;
}

// ────────────────────────────────────────────────
async function main() {
  const projectPath = process.cwd();
  const mcpConfigForAgent = null;

  console.log("\n=== Interactive Orchestrator ===\n");

  // Menu loop
  while (true) {
    try {
      const choice = await showMainMenu();

      if (!choice || choice === "exit") {
        console.log("\nExiting orchestrator. Goodbye!");
        break;
      }

      switch (choice) {
        case "create_prd":
          await actionCreatePRD(mcpConfigForAgent);
          break;

        case "create_tasks":
          await actionCreateTasks(mcpConfigForAgent);
          break;

        case "run_dev":
          await actionRunDev(projectPath, mcpConfigForAgent);
          break;

        default:
          console.log("Unknown option. Returning to menu.");
      }

      // Add a small pause before showing menu again
      console.log("\n");
    } catch (error) {
      if (error.message === "User cancelled the prompt") {
        console.log("\nOperation cancelled. Returning to menu.");
      } else {
        console.error("\nError:", error.message);
        console.log("Returning to menu.\n");
      }
    }
  }
}

main().catch(console.error);
