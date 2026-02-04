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
import { CursorAgent, CursorAgentError } from "../cursor-agent-sdk/dist/index.js";
import {
  MODELS,
  WARN_THRESHOLD,
  NEXT_TASK_PATH,
  PROGRESS_PATH,
  MAX_CONSECUTIVE_FAILURES,
  MAX_CONNECTION_RETRIES,
  RETRY_DELAY_MS,
  RETRY_BACKOFF_MULTIPLIER,
  MAX_ITERATION_RUNTIME_MS,
  MAX_LOOP_RETRIES,
} from "./config.mjs";
import { countUncheckedCheckboxes } from "./logger.mjs";
import { logAgentEvent, createLoggingState, logLoopError, flushAssistantLog } from "./agent-logger.mjs";

/**
 * Connection Error Class
 *
 * Custom error class for connection-related failures during agent streaming.
 * Includes metadata about the error and any partial response that was captured
 * before the connection was lost.
 */
export class ConnectionError extends Error {
  constructor(message, originalError, partialResponse = null) {
    super(message);
    this.name = "ConnectionError";
    this.originalError = originalError;
    this.partialResponse = partialResponse;
    this.code = originalError?.code || originalError?.errno;
  }
}

/**
 * Loop Error Class
 *
 * Custom error class for loop-related failures during agent execution.
 * Includes metadata about the loop detection, iteration number, retry count,
 * and any partial response that was captured before the loop was detected.
 */
export class LoopError extends Error {
  constructor(message, originalError = null, partialResponse = null, metadata = {}) {
    super(message);
    this.name = "LoopError";
    this.originalError = originalError;
    this.partialResponse = partialResponse;
    this.iteration = metadata.iteration || null;
    this.retryCount = metadata.retryCount || 0;
    this.runtimeMs = metadata.runtimeMs || null;
  }
}

/**
 * Check if an error is a loop error
 *
 * Identifies errors related to infinite loops or maximum step limits during agent execution.
 * These errors indicate the agent is stuck in a repetitive pattern and needs recovery.
 *
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is a loop-related error
 */
export function isLoopError(error) {
  // Check if it's already a LoopError instance
  if (error instanceof LoopError) {
    return true;
  }

  // Check if it's a CursorAgentError with loop-related messages
  if (error instanceof CursorAgentError || error.name === "CursorAgentError") {
    const errorMessage = error.message?.toLowerCase() || "";
    const loopKeywords = [
      "maximum number of steps",
      "looping",
      "reached maximum",
      "possible looping",
    ];
    if (loopKeywords.some((keyword) => errorMessage.includes(keyword))) {
      return true;
    }
  }

  // Check error message for loop-related keywords
  const errorMessage = error.message?.toLowerCase() || "";
  const loopKeywords = [
    "maximum number of steps",
    "looping",
    "reached maximum",
    "possible looping",
  ];

  if (loopKeywords.some((keyword) => errorMessage.includes(keyword))) {
    return true;
  }

  return false;
}

/**
 * Check if an error is a retryable connection error
 *
 * Identifies network/connection errors that should trigger automatic retry logic.
 * These errors are typically transient and may resolve on retry.
 *
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is a retryable connection error
 */
export function isRetryableConnectionError(error) {
  // Check error code (Node.js network errors)
  const retryableCodes = [
    "ECONNRESET", // Connection reset by peer
    "ECONNREFUSED", // Connection refused
    "ETIMEDOUT", // Connection timeout
    "EPIPE", // Broken pipe
    "ENOTFOUND", // DNS lookup failed
    "EAI_AGAIN", // DNS lookup temporary failure
  ];

  // Check error code directly
  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }

  // Check errno (alternative error code format)
  if (error.errno && retryableCodes.includes(error.errno)) {
    return true;
  }

  // Check error message for connection-related keywords
  const errorMessage = error.message?.toLowerCase() || "";
  const connectionKeywords = [
    "connection reset",
    "connection refused",
    "connection timeout",
    "connection stalled",
    "stalled",
    "aborted",
    "network",
    "socket",
    "econnreset",
    "econnrefused",
    "etimedout",
  ];

  if (connectionKeywords.some((keyword) => errorMessage.includes(keyword))) {
    return true;
  }

  // Check if it's a ConnectionError instance
  if (error instanceof ConnectionError) {
    return true;
  }

  return false;
}

/**
 * Check if an error is a resource exhaustion error
 *
 * Identifies resource exhaustion errors from the Cursor Agent SDK that indicate
 * the agent has exceeded resource limits and needs to be restarted.
 *
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is a resource exhaustion error
 */
export function isResourceExhaustionError(error) {
  // Check if it's a CursorAgentError with resource exhaustion messages
  if (error instanceof CursorAgentError || error.name === "CursorAgentError") {
    const errorMessage = error.message?.toLowerCase() || "";
    const resourceKeywords = [
      "resource_exhausted",
      "resource exhausted",
      "exceeded resource",
      "resource limit",
    ];
    if (resourceKeywords.some((keyword) => errorMessage.includes(keyword))) {
      return true;
    }
  }

  // Check error message for resource exhaustion keywords
  const errorMessage = error.message?.toLowerCase() || "";
  const resourceKeywords = [
    "resource_exhausted",
    "resource exhausted",
    "exceeded resource",
    "resource limit",
  ];

  if (resourceKeywords.some((keyword) => errorMessage.includes(keyword))) {
    return true;
  }

  return false;
}

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
    cwd, // Working directory for file operations
    defaultModel: model, // AI model selection
    sandbox: "enabled", // Enable sandboxed execution for safety
    approveMcps: true, // Auto-approve MCP tool calls
    forceWrites: true, // Allow file write operations
    approveMcps: true, // Auto-approve MCP tool calls
  };

  const agent = new CursorAgent(agentOptions);

  // State tracking for streaming response processing
  let response = ""; // Accumulated final AI response
  let sessionId = null; // Chat session ID for conversation resumption

  // Logging state for centralized event logging
  const loggingState = createLoggingState();

  // Main event streaming loop - processes all agent events in real-time
  // This async iterator yields events as the agent thinks, calls tools, and responds
  // Wrapped in try-catch to detect and handle connection errors
  try {
    for await (const event of agent.stream({
      prompt, // The user's prompt/instruction
      model, // AI model to use
      chatId: resume, // Resume previous conversation if provided
      streamPartialOutput: true, // Enable streaming for real-time output
      sandbox: "enabled", // Maintain sandboxed execution
      approveMcps: true, // Auto-approve MCP integrations
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

    // Flush any remaining assistant content so we log one line per turn
    flushAssistantLog(loggingState, logCallback);
  } catch (error) {
    // Detect loop errors and throw LoopError with metadata
    if (isLoopError(error)) {
      throw new LoopError(
        `Loop error during agent streaming: ${error.message}`,
        error,
        response, // Preserve partial response if available
      );
    }
    // Detect connection errors and throw ConnectionError with metadata
    if (isRetryableConnectionError(error)) {
      throw new ConnectionError(
        `Connection error during agent streaming: ${error.message}`,
        error,
        response, // Preserve partial response if available
      );
    }
    // Re-throw non-connection errors as-is
    throw error;
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
  let prompt = ralphPromptTemplate; // Current prompt (remains constant across iterations)

  // Iteration tracking and performance monitoring
  let iterations = 0; // Current iteration count
  let fullOutput = ""; // Accumulated output from all iterations
  let tokenCount = 0; // Total token usage across iterations
  const iterationTimings = []; // Performance tracking for each iteration
  let iterationStartTime = Date.now(); // Timing for current iteration

  // === MAIN ITERATION LOOP ===
  // Continue until completion detected or max iterations reached
  while (iterations < maxIterations) {
    // Track iteration performance - record timing for previous iteration
    if (iterations > 0) {
      iterationTimings.push(Date.now() - iterationStartTime);
    }
    iterationStartTime = Date.now(); // Start timing current iteration

    logCallback(`Iteration ${iterations + 1}: Starting...`, "orchestrator");

    // Execute agent iteration with streaming progress updates
    // The agent will read from progress.txt and other files for context
    // Tool calls (including MCP) will be executed and logged in real-time
    // Wrapped in retry logic to handle connection errors and loop errors
    let output = "";
    let retryAttempt = 0;
    let retryDelay = RETRY_DELAY_MS;
    let loopRetries = 0; // Track loop retry counter per iteration (reset each new iteration)

    while (retryAttempt <= MAX_CONNECTION_RETRIES) {
      try {
        // Check max runtime before starting agent execution (for retry scenarios)
        const currentRuntime = Date.now() - iterationStartTime;
        
        // Log warning when approaching timeout (80% of max runtime)
        if (currentRuntime >= MAX_ITERATION_RUNTIME_MS * 0.8 && currentRuntime < MAX_ITERATION_RUNTIME_MS) {
          logCallback(
            `⚠️ Warning: Iteration ${iterations + 1} approaching timeout (${Math.round(currentRuntime / 1000)}s / ${Math.round(MAX_ITERATION_RUNTIME_MS / 1000)}s)`,
            "warning",
          );
        }

        // Check if iteration exceeds max runtime before starting
        if (currentRuntime >= MAX_ITERATION_RUNTIME_MS) {
          throw new LoopError(
            `Iteration ${iterations + 1} exceeded maximum runtime of ${Math.round(MAX_ITERATION_RUNTIME_MS / 1000)}s`,
            null,
            output, // Preserve partial response
            {
              iteration: iterations + 1,
              retryCount: loopRetries,
              runtimeMs: currentRuntime,
            },
          );
        }

        const result = await runAgent(
          prompt, // Ralph Loop prompt (constant across iterations)
          model, // AI model for this iteration
          process.cwd(), // Project directory context
          null, // No conversation resumption
          logCallback, // Real-time logging callback
          null, // No progress callback
          mcpConfig, // MCP tool configuration
        );
        
        // Check runtime after runAgent completes
        const runtimeAfterExecution = Date.now() - iterationStartTime;
        if (runtimeAfterExecution >= MAX_ITERATION_RUNTIME_MS) {
          throw new LoopError(
            `Iteration ${iterations + 1} exceeded maximum runtime of ${Math.round(MAX_ITERATION_RUNTIME_MS / 1000)}s`,
            null,
            result.output, // Preserve partial response
            {
              iteration: iterations + 1,
              retryCount: loopRetries,
              runtimeMs: runtimeAfterExecution,
            },
          );
        }
        
        output = result.output;
        // Success - break out of retry loop
        if (retryAttempt > 0) {
          logCallback("✓ Connection restored, continuing...", "orchestrator");
        }
        break;
      } catch (error) {
        // Check if this is a retryable connection error first
        // Connection errors can occur during loop retries and should be handled gracefully
        if (isRetryableConnectionError(error) && retryAttempt < MAX_CONNECTION_RETRIES) {
          retryAttempt++;
          const isDuringLoopRetry = loopRetries > 0;
          logCallback(
            `⚠️ Connection error${isDuringLoopRetry ? ` during loop retry` : ""}: ${error.message}`,
            "warning",
          );
          logCallback(
            `🔄 Retrying connection... (Attempt ${retryAttempt}/${MAX_CONNECTION_RETRIES})`,
            "orchestrator",
          );
          
          // Preserve partial response if available
          if (error.partialResponse) {
            output = error.partialResponse;
          } else if (error instanceof ConnectionError && error.partialResponse) {
            output = error.partialResponse;
          }

          // Exponential backoff: wait before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retryDelay *= RETRY_BACKOFF_MULTIPLIER; // Increase delay for next retry
          
          // Continue to retry the connection
          continue;
        }
        
        // Check if this is a loop error
        // Note: Loop errors are checked after connection errors to ensure connection
        // errors during loop retries are handled first
        if (isLoopError(error)) {
          const runtimeMs = Date.now() - iterationStartTime;
          const loopError = error instanceof LoopError 
            ? error 
            : new LoopError(
                `Loop error detected: ${error.message}`,
                error,
                output, // Preserve partial response
                {
                  iteration: iterations + 1,
                  retryCount: loopRetries,
                  runtimeMs: runtimeMs,
                },
              );

          logCallback(
            `⚠️ Loop detected in iteration ${iterations + 1} (retry ${loopRetries}/${MAX_LOOP_RETRIES})`,
            "warning",
          );

          // Log loop error to activity logger
          logLoopError(
            {
              iteration: iterations + 1,
              retryCount: loopRetries,
              runtimeMs: runtimeMs,
              errorMessage: error.message,
            },
            logCallback,
          );

          // Check if we have retries remaining
          if (loopRetries < MAX_LOOP_RETRIES) {
            loopRetries++;
            logCallback(
              `🔄 Retrying iteration ${iterations + 1}... (Attempt ${loopRetries}/${MAX_LOOP_RETRIES})`,
              "orchestrator",
            );
            
            // Wait briefly before retrying same iteration
            await new Promise((resolve) => setTimeout(resolve, 1000));
            
            // Reset iteration start time for retry
            iterationStartTime = Date.now();
            
            // Reset connection retry state for the new loop retry attempt
            retryAttempt = 0;
            retryDelay = RETRY_DELAY_MS;
            
            // Continue to retry the same iteration
            continue;
          } else {
            // Max retries exceeded - throw LoopError to propagate to task level
            logCallback(
              `✗ Max loop retries (${MAX_LOOP_RETRIES}) exceeded for iteration ${iterations + 1}. Stopping task execution.`,
              "error",
            );
            throw loopError;
          }
        }
        
        // Not a retryable connection error, or max retries exceeded
        if (isRetryableConnectionError(error) && retryAttempt >= MAX_CONNECTION_RETRIES) {
          logCallback(
            `✗ Connection failed after ${MAX_CONNECTION_RETRIES} retries. Task marked as failed.`,
            "error",
          );
        }
        
        // Re-throw the error to be handled at task level
        throw error;
      }
    }

    // Accumulate output and track token usage
    fullOutput += output;
    tokenCount += Buffer.byteLength(output, "utf8"); // Approximate token count

    logCallback(
      `Iteration ${iterations + 1} complete. Token count: ${tokenCount}`,
      "orchestrator",
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
      (m) => m[1].toLowerCase() === "x", // Count checked ([x]) items
    ).length;
    const totalCount = allCriteria.length;

    // Display progress statistics if criteria found
    if (totalCount > 0) {
      logCallback(
        `  📊 Progress: ${checkedCount}/${totalCount} criteria (${Math.round((checkedCount / totalCount) * 100)}%)`,
        "orchestrator",
      );

      // Show next incomplete task for user awareness
      const unchecked = allCriteria.find((m) => m[1] === " ");
      if (unchecked) {
        logCallback(`  📋 Next: ${unchecked[2].slice(0, 60)}...`, "orchestrator");
      }
    }

    // Log iteration performance metrics
    const iterationTime = Date.now() - iterationStartTime;
    logCallback(
      `  ⏱️  Iteration ${iterations + 1} took ${(iterationTime / 1000).toFixed(1)}s`,
      "orchestrator",
    );

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
      logCallback("Completion detected.", "orchestrator");
      break; // Exit iteration loop
    }

    // Token limit warning - approaching context window limits
    if (tokenCount > WARN_THRESHOLD) {
      logCallback(
        "Warning: Approaching token limit. Agent should check progress.txt for context.",
        "warning",
      );
    }

    // Continue to next iteration
    // Note: Agent reads progress.txt directly for context, no prompt accumulation needed
    iterations++;
  }

  if (iterations >= maxIterations) {
    logCallback("Max iterations reached without completion.", "orchestrator");
  }

  return { fullOutput };
}
