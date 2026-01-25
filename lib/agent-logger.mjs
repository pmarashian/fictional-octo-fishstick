/**
 * Agent Logging Module
 *
 * Centralized logging functionality for AI agent events and operations.
 * Handles various event types (thinking, tool calls, results, etc.) with
 * structured logging to console and activity logger.
 *
 * Key Functions:
 * - logAgentEvent(): Main dispatcher for all agent events
 * - logSystemUserMessage(): System/user message logging
 * - logThinkingEvent(): AI thinking streaming
 * - logToolCall(): Complex tool call logging with MCP support
 * - logToolResult(): Tool result logging with failure detection
 * - logAssistantMessage(): Assistant response logging
 * - createLoggingState(): Initialize logging state object
 */

import { MAX_CONSECUTIVE_FAILURES } from "./config.mjs";

/**
 * Initialize Logging State
 *
 * Creates the state object used for tracking logging state across agent execution.
 *
 * @returns {Object} Logging state object
 */
export function createLoggingState() {
  return {
    isThinkingActive: false,      // Whether AI thinking is currently being streamed
    accumulatedThinking: "",      // Buffer for AI reasoning content
    consecutiveFailures: 0,       // Track consecutive tool failures to detect hangs
  };
}

/**
 * Log Agent Event Helper Function
 *
 * Centralized logging handler for all agent events. Routes events to specific
 * logging handlers based on event type and manages logging state.
 *
 * @param {Object} event - The agent event to log
 * @param {Object} loggingState - State object for logging (isThinkingActive, accumulatedThinking, consecutiveFailures)
 * @param {Function} logCallback - Callback for logging messages
 * @returns {Object} Updated logging state
 */
export function logAgentEvent(event, loggingState, logCallback) {
  switch (event.type) {
    case "system":
    case "user":
      logSystemUserMessage(event, logCallback);
      break;
    case "thinking":
      logThinkingEvent(event, loggingState, logCallback);
      break;
    case "tool_use":
    case "tool_call":
      logToolCall(event, logCallback);
      break;
    case "tool_result":
      logToolResult(event, loggingState, logCallback);
      break;
    case "assistant":
      logAssistantMessage(event, logCallback);
      break;
  }

  return loggingState;
}

/**
 * Log System and User Messages
 *
 * Handles logging of system prompts and user messages to console and activity logger.
 *
 * @param {Object} event - The system or user event
 * @param {Function} logCallback - Callback for logging messages
 */
export function logSystemUserMessage(event, logCallback) {
  if (event.type === "system" && event.message?.content) {
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
}

/**
 * Log Thinking Events
 *
 * Handles streaming AI reasoning process to console and activity logger.
 *
 * @param {Object} event - The thinking event
 * @param {Object} loggingState - State object containing isThinkingActive and accumulatedThinking
 * @param {Function} logCallback - Callback for logging messages
 */
export function logThinkingEvent(event, loggingState, logCallback) {
  if (event.subtype === "delta") {
    // Streaming delta: AI thinking content arriving incrementally
    // Only process if we have actual text content
    if (event.text) {
      // Print "[THINKING]" prefix only on first delta chunk with non-empty text
      if (!loggingState.isThinkingActive) {
        process.stdout.write("[THINKING] ");
        loggingState.isThinkingActive = true;
      }

      // Stream the thinking text directly to console as it arrives
      process.stdout.write(event.text);
      loggingState.accumulatedThinking += event.text;  // Buffer for logging
    }
  } else if (event.subtype === "completed") {
    // Thinking phase complete - add newline only if we wrote the prefix
    if (loggingState.isThinkingActive) {
      process.stdout.write("\n");
    }

    // Log complete thinking content to activity logger
    if (logCallback.activityLogger && loggingState.accumulatedThinking) {
      logCallback.activityLogger.log("thinking", "AI reasoning", {
        content: loggingState.accumulatedThinking,
        timestamp: new Date().toISOString(),
      });
    }

    // Reset thinking state for next reasoning phase
    loggingState.isThinkingActive = false;
    loggingState.accumulatedThinking = "";
  }
}

/**
 * Log Tool Calls
 *
 * Handles logging of all tool call types with appropriate formatting and parameters.
 *
 * @param {Object} event - The tool call event
 * @param {Function} logCallback - Callback for logging messages
 */
export function logToolCall(event, logCallback) {
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
      // Format: {toolName: {args: {...}}}
      if (alreadyFormatted && event?.tool_call && toolName !== "unknown") {
        const formattedToolCall = { [toolName]: event.tool_call[toolName] };
        logCallback(`🔧 TOOL: ${JSON.stringify(formattedToolCall)}`);
      } else if (toolName !== "unknown" && args) {
        const formattedToolCall = { [toolName]: { args } };
        logCallback(`🔧 TOOL: ${JSON.stringify(formattedToolCall)}`);
      } else {
        logCallback(`🔧 TOOL: ${JSON.stringify(event.tool_call)}`);
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
}

/**
 * Log Tool Results
 *
 * Handles logging of tool execution results including success/failure and hang detection.
 *
 * @param {Object} event - The tool result event
 * @param {Object} loggingState - State object containing consecutiveFailures
 * @param {Function} logCallback - Callback for logging messages
 */
export function logToolResult(event, loggingState, logCallback) {
  const toolName =
    event.tool_name || event.name || event.tool_id || "previous tool";
  const hasError = event.error || event.is_error;

  if (hasError) {
    loggingState.consecutiveFailures++;
    logCallback(`  ❌ FAILED: ${toolName} (${loggingState.consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} consecutive failures)`);
    const errorMsg = event.error || event.content;
    logCallback(`     Error: ${errorMsg}`);

    // Hang detection: Terminate if too many consecutive failures
    if (loggingState.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      const hangError = `Agent hang detected: ${loggingState.consecutiveFailures} consecutive tool failures. Terminating to prevent infinite loop.`;
      logCallback(`  🚨 ${hangError}`);

      if (logCallback.activityLogger) {
        logCallback.activityLogger.log(
          "agent_hang",
          "Agent terminated due to consecutive failures",
          {
            consecutive_failures: loggingState.consecutiveFailures,
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
          consecutive_failures: loggingState.consecutiveFailures,
          timestamp: new Date().toISOString(),
        },
      );
    }
  } else {
    // Reset consecutive failures counter on successful tool execution
    if (loggingState.consecutiveFailures > 0) {
      logCallback(`  ✅ SUCCESS: ${toolName} (reset failure counter)`);
      loggingState.consecutiveFailures = 0;
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

/**
 * Log Assistant Messages
 *
 * Handles logging of assistant responses to console and activity logger.
 *
 * @param {Object} event - The assistant event
 * @param {Function} logCallback - Callback for logging messages
 */
export function logAssistantMessage(event, logCallback) {
  if (event.message?.content?.[0]?.text) {
    const text = event.message.content[0].text;

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
  }
}

/**
 * Log Loop Error
 *
 * Handles logging of loop detection events to console and activity logger.
 * Includes metadata about iteration number, retry count, and runtime duration.
 *
 * @param {Object} metadata - Loop error metadata (iteration, retryCount, runtimeMs, error message)
 * @param {Function} logCallback - Callback for logging messages
 */
export function logLoopError(metadata, logCallback) {
  const { iteration, retryCount, runtimeMs, errorMessage } = metadata;

  // Log to activity logger with full metadata
  if (logCallback.activityLogger) {
    logCallback.activityLogger.log("loop_error", "Loop detected during agent execution", {
      iteration: iteration,
      retry_count: retryCount,
      runtime_ms: runtimeMs,
      error_message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}