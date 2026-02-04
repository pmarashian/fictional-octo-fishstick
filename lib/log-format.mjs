/**
 * Log Format and Colors
 *
 * Central formatting for console output: ANSI colors and styles by log kind.
 * Only applies ANSI when process.stdout.isTTY so piping/redirect stays plain.
 *
 * Kinds: thinking, tool_call, tool_result_success, tool_result_failure,
 * tool_result_result, assistant, system, user, orchestrator, git, git_ok,
 * git_fail, task, error, warning, agent.
 */

const TTY =
  typeof process !== "undefined" && process.stdout && process.stdout.isTTY;

// ANSI codes (no color when not TTY)
const reset = TTY ? "\x1b[0m" : "";
const dim = TTY ? "\x1b[2m" : "";
const bold = TTY ? "\x1b[1m" : "";

// Colors
const cyan = TTY ? "\x1b[36m" : "";
const yellow = TTY ? "\x1b[33m" : "";
const green = TTY ? "\x1b[32m" : "";
const red = TTY ? "\x1b[31m" : "";
const blue = TTY ? "\x1b[34m" : "";
const magenta = TTY ? "\x1b[35m" : "";
const gray = TTY ? "\x1b[90m" : "";

/**
 * Style map: kind -> [prefix, suffix] (ANSI wrap for the whole line)
 */
const STYLES = {
  thinking: [cyan, reset],
  tool_call: [yellow, reset],
  tool_result_success: [green, reset],
  tool_result_failure: [red, reset],
  tool_result_result: [dim + gray, reset],
  tool_args: [dim + gray, reset],
  assistant: [dim + magenta, reset],
  system: [dim + gray, reset],
  user: [gray, reset],
  orchestrator: [blue, reset],
  git: [magenta, reset],
  git_ok: [green, reset],
  git_fail: [red, reset],
  task: [bold + gray, reset],
  error: [red, reset],
  warning: [yellow, reset],
  agent: [reset, reset],
};

/**
 * Format a log line by kind. Only applies ANSI when stdout is a TTY.
 *
 * @param {string} kind - Log category (thinking, tool_call, orchestrator, git_ok, etc.)
 * @param {string} text - Raw message
 * @returns {string} Styled message (or plain text when not TTY)
 */
export function format(kind, text) {
  if (text == null || text === "") return "";
  const k = kind || "agent";
  const [start, end] = STYLES[k] || STYLES.agent;
  return `${start}${text}${end}`;
}

/**
 * Start a styled region (e.g. for streaming thinking). Use with formatEnd().
 *
 * @param {string} kind - Log category (e.g. 'thinking')
 * @returns {string} ANSI prefix only
 */
export function formatStart(kind) {
  const k = kind || "agent";
  const [start] = STYLES[k] || STYLES.agent;
  return start;
}

/**
 * End a styled region (reset).
 *
 * @returns {string} ANSI reset
 */
export function formatEnd() {
  return reset;
}
