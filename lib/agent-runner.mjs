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
import { logAgentEvent, createLoggingState } from "./agent-logger.mjs";


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

  // Logging state for centralized event logging
  const loggingState = createLoggingState();

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
    if (event.type === "system" || event.type === "user") {
      logAgentEvent(event, loggingState, logCallback);
    }

    // === AI THINKING/REASONING STREAMING ===
    // Display AI's internal reasoning process in real-time for transparency
    if (event.type === "thinking") {
      logAgentEvent(event, loggingState, logCallback);
    }

    // === TOOL CALL HANDLING ===
    // Process tool execution requests from the AI agent
    // Supports file operations, shell commands, MCP tools, and custom development tools
    // Each tool call is logged with parameters and execution results tracked
    if (event.type === "tool_use" || event.type === "tool_call") {
      logAgentEvent(event, loggingState, logCallback);
    }

    // Track tool results with enhanced logging and hang detection
    if (event.type === "tool_result") {
      logAgentEvent(event, loggingState, logCallback);
    }

    // Log ALL assistant messages with full content
    if (event.type === "assistant" && event.message?.content?.[0]?.text) {
      logAgentEvent(event, loggingState, logCallback);
      const text = event.message.content[0].text;
      response += text;

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