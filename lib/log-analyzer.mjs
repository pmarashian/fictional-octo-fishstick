/**
 * Log Analysis Module
 *
 * This module provides comprehensive analysis of task execution logs stored in
 * the project's logs directory. It analyzes JSONL log files for issues, insights,
 * and feedback to help improve the development workflow.
 *
 * Log File Format:
 * - Location: project/logs/ directory
 * - Format: JSONL (JSON Lines) - one JSON object per line
 * - Naming: task-{taskId}-{role}-{runId}.jsonl
 * - Structure: Each line contains {timestamp, level, message, ...additionalData}
 *
 * Analysis Capabilities:
 * - Issue Detection: Errors, failures, warnings, agent hangs
 * - Performance Insights: Iteration counts, tool call patterns, duration metrics
 * - Pattern Recognition: Common failure modes, tool usage patterns
 * - Feedback Generation: Actionable suggestions for improvement
 *
 * Key Functions:
 * - analyzeLogs(): Main entry point for log analysis workflow
 * - listLogFiles(): Get all available log files
 * - parseLogFile(): Efficiently parse JSONL files (handles large files)
 * - analyzeLogData(): Perform comprehensive analysis on log entries
 * - displayAnalysisResults(): Format and display analysis results
 */

import fs from "fs-extra";
import path from "path";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import prompts from "prompts";
import { LOG_DIR, MODELS } from "./config.mjs";
import { runAgent } from "./agent-runner.mjs";
import { loadPrompt } from "./file-ops.mjs";

const NUM_WORKERS = 4;

/**
 * Main Log Analysis Action
 *
 * Interactive workflow for analyzing task execution logs. Allows users to:
 * 1. Select which log files to analyze (individual or all)
 * 2. Analyze logs for issues, insights, and feedback
 * 3. View comprehensive analysis results
 *
 * @returns {Promise<void>} Resolves when analysis is complete
 */
export async function analyzeLogs() {
  console.log("\n=== Log Analysis ===\n");

  // Check if logs directory exists
  const logsDir = LOG_DIR;
  try {
    await fs.access(logsDir);
  } catch {
    console.log(`No logs directory found at: ${logsDir}`);
    console.log("Logs are created during task execution.");
    return;
  }

  // List all log files
  const logFiles = await listLogFiles(logsDir);

  if (logFiles.length === 0) {
    console.log("No log files found in logs directory.");
    return;
  }

  console.log(`Found ${logFiles.length} log file(s):\n`);

  // logFiles.forEach((file, index) => {
  //   const stats = fs.statSync(file);
  //   const sizeKB = (stats.size / 1024).toFixed(2);
  //   const fileName = path.basename(file);
  //   console.log(`  ${index + 1}. ${fileName} (${sizeKB} KB)`);
  // });

  // Let user select which logs to analyze
  const selection = await prompts({
    type: "multiselect",
    name: "files",
    message: "Select log files to analyze (space to select, enter to confirm):",
    choices: [
      { title: "All logs", value: "all" },
      ...logFiles.map((file, index) => ({
        title: path.basename(file),
        value: file,
      })),
    ],
    initial: 0, // Highlight "All logs" by default
  });

  // Handle case where prompt returns null/undefined (user cancelled)
  if (!selection) {
    console.log("Selection cancelled. Returning to menu.");
    return;
  }

  // Determine which files to analyze
  // If no files selected or user just pressed enter, default to analyzing all logs
  const filesToAnalyze =
    !selection.files || selection.files.length === 0
      ? logFiles
      : selection.files.includes("all")
        ? logFiles
        : selection.files;

  console.log(`\nAnalyzing ${filesToAnalyze.length} log file(s)...\n`);

  // Analyze each selected file
  const allResults = [];

  for (const file of filesToAnalyze) {
    try {
      // const logData = await parseLogFile(file);
      // const analysis = analyzeLogData(logData, path.basename(file));
      allResults.push({
        fileName: path.basename(file),
      });
    } catch (error) {
      console.log(
        `  ❌ Error analyzing ${path.basename(file)}: ${error.message}`,
      );
    }
  }

  console.log("\n=== Starting AI Analysis ===\n");

  await processLogsWithPool(allResults);

  console.log("\n=== AI Analysis complete ===\n");
}

/**
 * Process logs using a pool of 2 worker agents
 *
 * Filters logs that need processing, creates a queue, and distributes
 * work across 2 concurrent workers.
 *
 * @param {Object[]} allResults - Array of log file results to process
 * @returns {Promise<void>} Resolves when all logs are processed
 */
async function processLogsWithPool(allResults) {
  // Filter to only logs that need processing (check if aiInsights file exists)
  const logsToProcess = [];
  for (const result of allResults) {
    const aiInsightsFile = path.join(
      process.cwd(),
      "log-analysis",
      `${result.fileName}-ai-insights.md`,
    );

    if (await fs.exists(aiInsightsFile)) {
      console.log(`${result.fileName}: AI Insights already exists.`);
      continue;
    }

    logsToProcess.push(result);
  }

  if (logsToProcess.length === 0) {
    return;
  }

  // Create queue (array-based, workers will shift() items)
  const queue = [...logsToProcess];

  // Create NUM_WORKERS workers
  const workers = Array.from({ length: NUM_WORKERS }, (_, index) =>
    processLogWorker(index + 1, queue),
  );

  // Wait for all workers to complete
  await Promise.allSettled(workers);
}

/**
 * Worker function that processes logs from the queue
 *
 * Each worker picks up the next available log file, processes it,
 * then moves to the next one until the queue is empty.
 *
 * @param {number} workerId - Worker identifier (1 or 2) for logging
 * @param {Object[]} queue - Shared queue of log files to process
 * @returns {Promise<void>} Resolves when worker has processed all available logs
 */
async function processLogWorker(workerId, queue) {
  while (queue.length > 0) {
    // Atomically dequeue next log file
    const result = queue.shift();
    if (!result) break;

    console.log(`${result.fileName}: Running AI Insights...`);

    try {
      await performAiAnalysis(result);
    } catch (error) {
      console.log(`${result.fileName}: AI Analysis failed: ${error.message}`);
    }
  }
}

/**
 * Perform AI-powered log analysis
 *
 * @param {Object} analysisResult - Result from local heuristic analysis
 * @returns {Promise<string>} AI generated insights
 */
async function performAiAnalysis(analysisResult) {
  const systemPrompt = await loadPrompt("log-analysis.md");

  // Get raw log entries (already parsed in analysisResult if we store them,
  // but we don't currently store them in allResults to save memory.
  // Re-parsing or passing them along is needed.)
  const logsDir = LOG_DIR;
  const filePath = path.join(logsDir, analysisResult.fileName);

  const combinedPrompt =
    `${systemPrompt}\n\n` +
    `## Log File to Analyze\n` +
    `${filePath}\n\n` +
    `## Output Format: Markdown\n\n` +
    `## Output File Name: log-analysis/${analysisResult.fileName}-ai-insights.md`;

  const { output } = await runAgent(
    combinedPrompt,
    MODELS.default,
    process.cwd(),
    null,
    () => {},
  );
  return output;
}

/**
 * List All Log Files in Logs Directory
 *
 * Scans the logs directory for all JSONL log files and returns their full paths.
 *
 * @param {string} logsDir - Path to the logs directory
 * @returns {Promise<string[]>} Array of log file paths
 */
async function listLogFiles(logsDir) {
  const files = await fs.readdir(logsDir);
  return files
    .filter((file) => file.endsWith(".jsonl"))
    .map((file) => path.join(logsDir, file))
    .sort((a, b) => {
      // Sort by modification time (newest first)
      return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
    });
}

/**
 * Parse JSONL Log File Efficiently
 *
 * Reads a JSONL file line by line to handle large files efficiently.
 * Each line is a complete JSON object that is parsed and collected.
 *
 * @param {string} filePath - Path to the JSONL log file
 * @returns {Promise<Object[]>} Array of parsed log entries
 */
async function parseLogFile(filePath) {
  const logEntries = [];
  const fileStream = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        const entry = JSON.parse(line);
        logEntries.push(entry);
      } catch (error) {
        // Skip malformed JSON lines (shouldn't happen, but handle gracefully)
        console.warn(
          `  ⚠️  Skipping malformed line: ${line.substring(0, 50)}...`,
        );
      }
    }
  }

  return logEntries;
}

/**
 * Analyze Log Data for Issues, Insights, and Feedback
 *
 * Performs comprehensive analysis on parsed log entries, extracting:
 * - Issues: Errors, failures, warnings, agent hangs
 * - Performance metrics: Duration, iterations, tool calls
 * - Patterns: Common failure modes, tool usage
 * - Feedback: Actionable suggestions
 *
 * @param {Object[]} logEntries - Array of parsed log entries
 * @param {string} fileName - Name of the log file being analyzed
 * @returns {Object} Analysis results with issues, insights, and feedback
 */
function analyzeLogData(logEntries, fileName) {
  if (logEntries.length === 0) {
    return {
      fileName,
      issues: [],
      insights: [],
      feedback: [],
      summary: {
        totalEntries: 0,
        duration: null,
        iterations: 0,
        toolCalls: 0,
        errors: 0,
      },
    };
  }

  // Extract task metadata
  const taskInfo = logEntries.find((e) => e.taskId) || {};
  const taskId = taskInfo.taskId || "unknown";
  const taskDescription = taskInfo.description || "unknown task";

  // Calculate time range
  const timestamps = logEntries
    .map((e) => new Date(e.timestamp))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a - b);
  const startTime = timestamps[0];
  const endTime = timestamps[timestamps.length - 1];
  const duration = startTime && endTime ? endTime - startTime : null;

  // Extract statistics
  const iterations = logEntries.filter(
    (e) => e.message?.includes("Iteration") && e.message?.includes("complete"),
  ).length;

  const toolCalls = logEntries.filter(
    (e) => e.message?.includes("TOOL:") || e.level === "tool_call",
  ).length;

  const errors = logEntries.filter(
    (e) =>
      e.level === "error" ||
      e.message?.includes("FAILED") ||
      e.message?.includes("ERROR") ||
      e.message?.includes("❌"),
  );

  const warnings = logEntries.filter(
    (e) => e.level === "warn" || e.message?.includes("Warning"),
  );

  const agentHangs = logEntries.filter(
    (e) => e.level === "agent_hang" || e.message?.includes("hang detected"),
  );

  // Analyze issues
  const issues = [];

  // Error analysis
  if (errors.length > 0) {
    const errorTypes = {};
    errors.forEach((e) => {
      const errorMsg = e.message || e.error || "Unknown error";
      const errorType = errorMsg.split(":")[0].trim();
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });

    issues.push({
      type: "Errors",
      severity: "high",
      count: errors.length,
      details: Object.entries(errorTypes)
        .map(([type, count]) => `  - ${type}: ${count} occurrence(s)`)
        .join("\n"),
      examples: errors.slice(0, 3).map((e) => ({
        message: e.message || e.error || "Unknown error",
        timestamp: e.timestamp,
      })),
    });
  }

  // Agent hang detection
  if (agentHangs.length > 0) {
    issues.push({
      type: "Agent Hangs",
      severity: "critical",
      count: agentHangs.length,
      details:
        "Agent execution was terminated due to consecutive tool failures.",
      examples: agentHangs.map((e) => ({
        message: e.message,
        timestamp: e.timestamp,
        consecutiveFailures: e.consecutive_failures,
      })),
    });
  }

  // Warning analysis
  if (warnings.length > 0) {
    issues.push({
      type: "Warnings",
      severity: "medium",
      count: warnings.length,
      details: "Non-critical issues that may indicate potential problems.",
      examples: warnings.slice(0, 3).map((e) => ({
        message: e.message,
        timestamp: e.timestamp,
      })),
    });
  }

  // Performance insights
  const insights = [];

  // Duration insight
  if (duration) {
    const durationSeconds = Math.round(duration / 1000);
    const durationMinutes = Math.round(durationSeconds / 60);
    insights.push({
      category: "Performance",
      metric: "Task Duration",
      value:
        durationMinutes > 0
          ? `${durationMinutes} minute(s)`
          : `${durationSeconds} second(s)`,
      interpretation:
        durationMinutes > 10
          ? "Task took longer than expected. Consider breaking into smaller tasks."
          : durationMinutes > 5
            ? "Moderate task duration. Monitor for optimization opportunities."
            : "Task completed efficiently.",
    });
  }

  // Iteration insight
  if (iterations > 0) {
    insights.push({
      category: "Workflow",
      metric: "Iterations",
      value: iterations,
      interpretation:
        iterations > 5
          ? "High iteration count. Task may need better initial planning or clearer requirements."
          : iterations > 2
            ? "Moderate iterations. Task required some refinement."
            : "Task completed with minimal iterations.",
    });
  }

  // Tool call insight
  if (toolCalls > 0) {
    const avgToolsPerIteration =
      iterations > 0 ? (toolCalls / iterations).toFixed(1) : toolCalls;
    insights.push({
      category: "Tool Usage",
      metric: "Tool Calls",
      value: `${toolCalls} total (avg ${avgToolsPerIteration} per iteration)`,
      interpretation:
        toolCalls > 50
          ? "High tool usage. Consider if task can be simplified or if tools are being used inefficiently."
          : "Normal tool usage pattern.",
    });
  }

  // Error rate insight
  if (toolCalls > 0) {
    const errorRate = ((errors.length / toolCalls) * 100).toFixed(1);
    insights.push({
      category: "Reliability",
      metric: "Error Rate",
      value: `${errorRate}%`,
      interpretation:
        parseFloat(errorRate) > 10
          ? "High error rate. Review error patterns and improve error handling."
          : parseFloat(errorRate) > 5
            ? "Moderate error rate. Monitor for improvement opportunities."
            : "Low error rate. Good reliability.",
    });
  }

  // Generate feedback
  const feedback = [];

  // Feedback based on errors
  if (errors.length > 0) {
    feedback.push({
      type: "Error Handling",
      suggestion:
        "Review common error patterns and consider adding better error handling or validation.",
      priority: "high",
    });
  }

  // Feedback based on iterations
  if (iterations > 5) {
    feedback.push({
      type: "Task Planning",
      suggestion:
        "High iteration count suggests task may benefit from better initial planning or breaking into smaller subtasks.",
      priority: "medium",
    });
  }

  // Feedback based on agent hangs
  if (agentHangs.length > 0) {
    feedback.push({
      type: "Agent Stability",
      suggestion:
        "Agent hangs detected. Review tool reliability and consider adding retry logic or better error recovery.",
      priority: "critical",
    });
  }

  // Feedback based on duration
  if (duration && duration > 10 * 60 * 1000) {
    feedback.push({
      type: "Performance",
      suggestion:
        "Task took longer than 10 minutes. Consider optimizing workflow or breaking into smaller tasks.",
      priority: "medium",
    });
  }

  // General feedback if no major issues
  if (
    errors.length === 0 &&
    agentHangs.length === 0 &&
    iterations <= 3 &&
    duration &&
    duration < 5 * 60 * 1000
  ) {
    feedback.push({
      type: "Overall",
      suggestion: "Task execution looks good! No major issues detected.",
      priority: "low",
    });
  }

  return {
    fileName,
    taskId,
    taskDescription,
    issues,
    insights,
    feedback,
    summary: {
      totalEntries: logEntries.length,
      duration: duration ? Math.round(duration / 1000) : null, // in seconds
      iterations,
      toolCalls,
      errors: errors.length,
      warnings: warnings.length,
      agentHangs: agentHangs.length,
    },
  };
}

/**
 * Display Analysis Results in Readable Format
 *
 * Formats and displays comprehensive analysis results including:
 * - Summary statistics
 * - Issues found
 * - Performance insights
 * - Actionable feedback
 *
 * @param {Object[]} results - Array of analysis results for each log file
 */
function displayAnalysisResults(results) {
  console.log("\n" + "=".repeat(60));
  console.log("LOG ANALYSIS RESULTS");
  console.log("=".repeat(60) + "\n");

  results.forEach((result, index) => {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`File: ${result.fileName}`);
    if (result.taskId) {
      console.log(`Task: ${result.taskId} - ${result.taskDescription}`);
    }
    console.log(`${"─".repeat(60)}\n`);

    // Summary
    console.log("📊 SUMMARY");
    console.log(`  Total Log Entries: ${result.summary.totalEntries}`);
    if (result.summary.duration !== null) {
      const minutes = Math.floor(result.summary.duration / 60);
      const seconds = result.summary.duration % 60;
      console.log(`  Duration: ${minutes}m ${seconds}s`);
    }
    console.log(`  Iterations: ${result.summary.iterations}`);
    console.log(`  Tool Calls: ${result.summary.toolCalls}`);
    console.log(`  Errors: ${result.summary.errors}`);
    console.log(`  Warnings: ${result.summary.warnings}`);
    if (result.summary.agentHangs > 0) {
      console.log(`  ⚠️  Agent Hangs: ${result.summary.agentHangs}`);
    }

    // Issues
    if (result.issues.length > 0) {
      console.log("\n🚨 ISSUES");
      result.issues.forEach((issue) => {
        const icon =
          issue.severity === "critical"
            ? "🔴"
            : issue.severity === "high"
              ? "🟠"
              : "🟡";
        console.log(`\n${icon} ${issue.type} (${issue.count} occurrence(s))`);
        if (issue.details) {
          console.log(issue.details);
        }
        if (issue.examples && issue.examples.length > 0) {
          console.log("  Examples:");
          issue.examples.slice(0, 2).forEach((ex) => {
            const msg = ex.message || ex.error || "Unknown";
            const preview =
              msg.length > 80 ? msg.substring(0, 80) + "..." : msg;
            console.log(`    - ${preview}`);
          });
        }
      });
    } else {
      console.log("\n✅ No issues detected");
    }

    // Insights
    if (result.insights.length > 0) {
      console.log("\n💡 INSIGHTS");
      result.insights.forEach((insight) => {
        console.log(`\n  ${insight.category}: ${insight.metric}`);
        console.log(`    Value: ${insight.value}`);
        console.log(`    ${insight.interpretation}`);
      });
    }

    // Feedback
    if (result.feedback.length > 0) {
      console.log("\n💬 FEEDBACK");
      result.feedback.forEach((fb) => {
        const priorityIcon =
          fb.priority === "critical"
            ? "🔴"
            : fb.priority === "high"
              ? "🟠"
              : fb.priority === "medium"
                ? "🟡"
                : "🟢";
        console.log(
          `\n  ${priorityIcon} [${fb.priority.toUpperCase()}] ${fb.type}`,
        );
        console.log(`    ${fb.suggestion}`);
      });
    }

    if (index < results.length - 1) {
      console.log("\n");
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log("Analysis complete.");
  console.log("=".repeat(60) + "\n");
}
