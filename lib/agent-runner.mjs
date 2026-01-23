/**
 * Core Agent Execution Engine
 *
 * This module provides the heart of the Ralph orchestrator's AI agent integration,
 * enabling seamless communication with AI models through the Cursor Agent SDK.
 * It handles streaming responses, tool call execution, progress tracking, and
 * iterative development workflows.
 *
 * Key Capabilities:
 * - Streaming AI responses with real-time output
 * - Tool call execution (file operations, shell commands, MCP integrations)
 * - Structured logging and progress tracking
 * - Iterative development loops with completion detection
 * - Token usage monitoring and context management
 *
 * Architecture:
 * - runAgent(): Core agent execution with event streaming
 * - ralphLoop(): Iterative development workflow with progress tracking
 *
 * The agent integrates with multiple tool systems:
 * - File system operations (read, write, edit, delete)
 * - Shell command execution
 * - MCP (Model Context Protocol) tools
 * - Custom development tools (todo management, etc.)
 *
 * Event Streaming:
 * Processes various event types from the agent:
 * - system/user messages: Conversation context
 * - thinking: AI reasoning (displayed in real-time)
 * - tool_use/tool_call: Tool execution requests
 * - tool_result: Tool execution results
 * - assistant: Final AI responses
 */

import fs from "fs-extra";
import { CursorAgent } from "../cursor-agent-sdk/dist/index.js";
import { MODELS, WARN_THRESHOLD, NEXT_TASK_PATH, PROGRESS_PATH, MAX_CONSECUTIVE_FAILURES } from "./config.mjs";
import { countUncheckedCheckboxes } from "./logger.mjs";

/**
 * Execute AI Agent with Streaming Response Processing
 *
 * Core function for running AI agents with comprehensive event streaming,
 * tool call handling, and progress tracking. This function manages the
 * complete lifecycle of an AI agent interaction from prompt to response.
 *
 * Agent Capabilities:
 * - Processes streaming events (thinking, tool calls, responses)
 * - Executes various tools (file ops, shell commands, MCP tools)
 * - Provides real-time logging and progress updates
 * - Handles conversation resumption with chatId
 * - Manages token usage and context limits
 *
 * Event Processing:
 * - system/user: Logs conversation messages
 * - thinking: Streams AI reasoning in real-time
 * - tool_use/tool_call: Executes requested tools and logs results
 * - tool_result: Processes tool execution outcomes
 * - assistant: Accumulates final AI responses
 *
 * Tool Integration:
 * Supports multiple tool types with specialized handling:
 * - File operations (read, edit, delete, search)
 * - Shell command execution (with MCP support)
 * - Custom development tools (todo management, etc.)
 * - MCP protocol tools for external integrations
 *
 * @param {string} prompt - The prompt/instruction for the AI agent
 * @param {string} model - AI model to use (defaults to MODELS.default)
 * @param {string} cwd - Working directory for file operations (defaults to process.cwd())
 * @param {string|null} resume - Chat session ID to resume previous conversation
 * @param {Function} logCallback - Callback for logging events (signature: (message, activityLogger?) => void)
 * @param {Function|null} progressCallback - Callback for progress updates (signature: ({tokens, chunks}) => void)
 * @param {Object|null} mcpConfig - MCP configuration for external tool integrations
 * @returns {Promise<{output: string, sessionId: string|null}>} Final response and session ID
 */
export async function runAgent(
  prompt,
  model = MODELS.default,
  cwd = process.cwd(),
  resume = null,
  logCallback = () => {},
  progressCallback = null,
  mcpConfig = null,
) {
  // Initialize Cursor Agent with sandboxed environment and tool permissions
  const agentOptions = {
    cwd,                    // Working directory for file operations
    defaultModel: model,    // AI model selection
    sandbox: "enabled",     // Enable sandboxed execution for safety
    approveMcps: true,      // Auto-approve MCP tool calls
    forceWrites: true,      // Allow file write operations
  };

  const agent = new CursorAgent(agentOptions);

  // State tracking for streaming response processing
  let response = "";              // Accumulated final AI response
  let sessionId = null;           // Chat session ID for conversation resumption
  let isThinkingActive = false;   // Whether AI thinking is currently being streamed
  let accumulatedThinking = "";   // Buffer for AI reasoning content

  // Hang detection for consecutive tool call failures
  let consecutiveFailures = 0;    // Track consecutive tool failures to detect hangs

  // Main event streaming loop - processes all agent events in real-time
  // This async iterator yields events as the agent thinks, calls tools, and responds
  for await (const event of agent.stream({
    prompt,                  // The user's prompt/instruction
    model,                   // AI model to use
    chatId: resume,          // Resume previous conversation if provided
    streamPartialOutput: true, // Enable streaming for real-time output
    sandbox: "enabled",      // Maintain sandboxed execution
    approveMcps: true,       // Auto-approve MCP integrations
  })) {
    // Capture session ID for potential conversation resumption
    if (event.chatId) {
      sessionId = event.chatId;
    }

    // === CONVERSATION MESSAGE LOGGING ===
    // Log system prompts and user messages for debugging and audit trails

    if (event.type === "system" && event.message?.content) {
      // System messages contain prompts, instructions, or context
      const content =
        typeof event.message.content === "string"
          ? event.message.content
          : JSON.stringify(event.message.content);

      // Log preview to console (first 100 chars)
      logCallback(`[SYSTEM] ${content.slice(0, 100)}...`);

      // Log full content to structured activity log if available
      if (logCallback.activityLogger) {
        logCallback.activityLogger.log("system", "System prompt", {
          content: content,
          timestamp: new Date().toISOString(),
        });
      }

    } else if (event.type === "user" && event.message?.content) {
      // User messages contain prompts or responses in conversations
      const content =
        typeof event.message.content === "string"
          ? event.message.content
          : JSON.stringify(event.message.content);

      // Log preview to console
      logCallback(`[USER] ${content.slice(0, 100)}...`);

      // Log to activity logger for detailed audit trail
      if (logCallback.activityLogger) {
        logCallback.activityLogger.log("user", "User message", {
          content: content,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // === AI THINKING/REASONING STREAMING ===
    // Display AI's internal reasoning process in real-time for transparency

    if (event.type === "thinking") {
      if (event.subtype === "delta") {
        // Streaming delta: AI thinking content arriving incrementally
        // Print "[THINKING]" prefix only on first delta chunk
        if (!isThinkingActive) {
          process.stdout.write("[THINKING] ");
          isThinkingActive = true;
        }

        // Stream the thinking text directly to console as it arrives
        if (event.text) {
          process.stdout.write(event.text);
          accumulatedThinking += event.text;  // Buffer for logging
        }

      } else if (event.subtype === "completed") {
        // Thinking phase complete - add newline to end the line
        process.stdout.write("\n");

        // Log complete thinking content to activity logger
        if (logCallback.activityLogger && accumulatedThinking) {
          logCallback.activityLogger.log("thinking", "AI reasoning", {
            content: accumulatedThinking,
            timestamp: new Date().toISOString(),
          });
        }

        // Reset thinking state for next reasoning phase
        isThinkingActive = false;
        accumulatedThinking = "";
      }
    }

    // === TOOL CALL HANDLING ===
    // Process tool execution requests from the AI agent
    // Supports file operations, shell commands, MCP tools, and custom development tools
    // Each tool call is logged with parameters and execution results tracked

    if ((event.type === "tool_use" || event.type === "tool_call") &&
        (!event.subtype || event.subtype === "started")) {
      let toolName =
        event.tool_name ||
        event.name ||
        event.tool?.name ||
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

    // Track tool results with enhanced logging and hang detection
    if (event.type === "tool_result") {
      const toolName =
        event.tool_name || event.name || event.tool_id || "previous tool";
      const hasError = event.error || event.is_error;

      if (hasError) {
        consecutiveFailures++;
        logCallback(`  ❌ FAILED: ${toolName} (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} consecutive failures)`);
        const errorMsg = event.error || event.content;
        logCallback(`     Error: ${errorMsg}`);

        // Hang detection: Terminate if too many consecutive failures
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          const hangError = `Agent hang detected: ${consecutiveFailures} consecutive tool failures. Terminating to prevent infinite loop.`;
          logCallback(`  🚨 ${hangError}`);

          if (logCallback.activityLogger) {
            logCallback.activityLogger.log(
              "agent_hang",
              "Agent terminated due to consecutive failures",
              {
                consecutive_failures: consecutiveFailures,
                threshold: MAX_CONSECUTIVE_FAILURES,
                last_tool: toolName,
                timestamp: new Date().toISOString(),
              },
            );
          }

          // Terminate the agent execution by throwing an error
          throw new Error(hangError);
        }

        if (logCallback.activityLogger) {
          logCallback.activityLogger.log(
            "tool_result",
            `Tool failed: ${toolName}`,
            {
              tool: toolName,
              success: false,
              error: errorMsg,
              consecutive_failures: consecutiveFailures,
              timestamp: new Date().toISOString(),
            },
          );
        }
      } else {
        // Reset consecutive failures counter on successful tool execution
        if (consecutiveFailures > 0) {
          logCallback(`  ✅ SUCCESS: ${toolName} (reset failure counter)`);
          consecutiveFailures = 0;
        } else {
          logCallback(`  ✅ SUCCESS: ${toolName}`);
        }

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

/**
 * Iterative Development Workflow with Progress Tracking
 *
 * Core orchestration loop that manages iterative AI agent execution with
 * automatic progress tracking, completion detection, and token management.
 * This function implements the "Ralph Loop" - an iterative development
 * process where the AI agent works through tasks until completion.
 *
 * Workflow Process:
 * 1. Load Ralph prompt template from orchestrator assets
 * 2. Execute agent iteration with current prompt
 * 3. Track progress through task completion checkboxes
 * 4. Check for completion criteria (special token or all tasks done)
 * 5. Continue iterations until completion or max iterations reached
 *
 * Progress Tracking:
 * - Monitors task completion via checkbox parsing ([x] vs [ ])
 * - Tracks token usage and warns near limits
 * - Logs iteration timing and progress percentages
 * - Accumulates full conversation output
 *
 * Completion Detection:
 * - Special completion token: <ralph>COMPLETE</ralph>
 * - All task checkboxes marked complete
 * - Reads from progress files and current output
 *
 * @param {string} model - AI model to use for agent execution
 * @param {string} completionPromise - Special token indicating completion (default: "<ralph>COMPLETE</ralph>")
 * @param {number} maxIterations - Maximum iterations before giving up (default: 20)
 * @param {Function} logCallback - Logging callback for progress updates
 * @param {Object|null} mcpConfig - MCP configuration for tool integrations
 * @returns {Promise<{fullOutput: string}>} Complete accumulated output from all iterations
 */
export async function ralphLoop(
  model,
  completionPromise = "<ralph>COMPLETE</ralph>",
  maxIterations = 20,
  logCallback = () => {},
  mcpConfig = null,
) {
  // === INITIALIZATION ===
  // Load the Ralph Loop prompt template from orchestrator assets
  // The Ralph Loop is designed for iterative development with file-based context
  const { loadPrompt } = await import("./file-ops.mjs");
  const ralphPromptTemplate = await loadPrompt("ralph-loop.md");
  let prompt = ralphPromptTemplate;  // Current prompt (remains constant across iterations)

  // Iteration tracking and performance monitoring
  let iterations = 0;              // Current iteration count
  let fullOutput = "";             // Accumulated output from all iterations
  let tokenCount = 0;              // Total token usage across iterations
  const iterationTimings = [];     // Performance tracking for each iteration
  let iterationStartTime = Date.now();  // Timing for current iteration

  // === MAIN ITERATION LOOP ===
  // Continue until completion detected or max iterations reached
  while (iterations < maxIterations) {
    // Track iteration performance - record timing for previous iteration
    if (iterations > 0) {
      iterationTimings.push(Date.now() - iterationStartTime);
    }
    iterationStartTime = Date.now();  // Start timing current iteration

    logCallback(`Iteration ${iterations + 1}: Starting...`);

    // Execute agent iteration with streaming progress updates
    // The agent will read from progress.txt and other files for context
    // Tool calls (including MCP) will be executed and logged in real-time
    const { output } = await runAgent(
      prompt,              // Ralph Loop prompt (constant across iterations)
      model,               // AI model for this iteration
      process.cwd(),       // Project directory context
      null,                // No conversation resumption
      logCallback,         // Real-time logging callback
      (progress) => {
        // Throttled progress updates during streaming (every 500 tokens)
        const currentTokens = tokenCount + progress.tokens;
        if (currentTokens % 500 === 0 || currentTokens < 50) {
          logCallback(
            `Iteration ${iterations + 1}: Running... Tokens: ${currentTokens}`,
          );
        }
      },
      mcpConfig,           // MCP tool configuration
    );

    // Accumulate output and track token usage
    fullOutput += output;
    tokenCount += Buffer.byteLength(output, "utf8");  // Approximate token count

    logCallback(
      `Iteration ${iterations + 1} complete. Token count: ${tokenCount}`,
    );

    // === PROGRESS TRACKING ===
    // Monitor task completion progress by parsing markdown checkboxes
    // Reads from task files and accumulated output to track completion status

    let taskContent = "";
    try {
      taskContent = await fs.readFile(NEXT_TASK_PATH, "utf8");
    } catch (e) {
      // Task file might not exist yet - continue without task-specific progress
    }

    // Parse markdown checkboxes from both task file and accumulated output
    // Regex matches: [x] Completed task or [ ] Incomplete task
    const criteriaRegex = /\[([x ])\]\s*(.+?)(?=\n|$)/gi;
    const allCriteria = [...(taskContent + fullOutput).matchAll(criteriaRegex)];
    const checkedCount = allCriteria.filter(
      (m) => m[1].toLowerCase() === "x",  // Count checked ([x]) items
    ).length;
    const totalCount = allCriteria.length;

    // Display progress statistics if criteria found
    if (totalCount > 0) {
      logCallback(
        `  📊 Progress: ${checkedCount}/${totalCount} criteria (${Math.round((checkedCount / totalCount) * 100)}%)`,
      );

      // Show next incomplete task for user awareness
      const unchecked = allCriteria.find((m) => m[1] === " ");
      if (unchecked) {
        logCallback(`  📋 Next: ${unchecked[2].slice(0, 60)}...`);
      }
    }

    // Log iteration performance metrics
    const iterationTime = Date.now() - iterationStartTime;
    logCallback(
      `  ⏱️  Iteration ${iterations + 1} took ${(iterationTime / 1000).toFixed(1)}s`,
    );

    // Debug logging for MCP/Skill tool usage detection
    if (output.includes("search_skills") || output.includes("load_skill")) {
      logCallback("→ Detected MCP/Skill usage in output");
    }

    // === COMPLETION DETECTION ===
    // Check multiple completion criteria to determine if workflow is done

    let taskContentForCompletion = "";
    try {
      taskContentForCompletion = await fs.readFile(NEXT_TASK_PATH, "utf8");
    } catch (e) {
      // Task file might not exist yet - continue checking other criteria
    }

    // Completion detected if:
    // 1. Special completion token found in output, OR
    // 2. All task checkboxes are marked complete
    if (
      output.includes(completionPromise) ||
      countUncheckedCheckboxes(taskContentForCompletion + fullOutput) === 0
    ) {
      logCallback("Completion detected.");
      break;  // Exit iteration loop
    }

    // Token limit warning - approaching context window limits
    if (tokenCount > WARN_THRESHOLD) {
      logCallback(
        "Warning: Approaching token limit. Agent should check progress.txt for context.",
      );
    }

    // Continue to next iteration
    // Note: Agent reads progress.txt directly for context, no prompt accumulation needed
    iterations++;
  }

  if (iterations >= maxIterations) {
    logCallback("Max iterations reached without completion.");
  }

  return { fullOutput };
}