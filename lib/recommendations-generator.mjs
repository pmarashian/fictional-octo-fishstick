/**
 * Recommendations Report Generator
 *
 * This module generates a comprehensive recommendations report by analyzing
 * all markdown files in the log-analysis/ directory. The report focuses on
 * three key areas:
 * 1. New Agent Skills: Patterns that could become reusable skills
 * 2. Skill Updates: Improvements to existing skills
 * 3. Prompt Improvements: Updates to agent prompts
 *
 * The analysis is performed by an AI agent that reads all log-analysis files
 * and generates a structured markdown report saved to combined-recommendations.md
 */

import fs from "fs-extra";
import path from "path";
import { MODELS } from "./config.mjs";
import { runAgent } from "./agent-runner.mjs";

/**
 * Create Recommendations Report Action
 *
 * Analyzes all markdown files in the log-analysis/ directory and generates
 * a combined recommendations report focused on agent skills and prompt improvements.
 *
 * Workflow:
 * 1. Check if log-analysis/ directory exists
 * 2. List all markdown files (excluding combined-recommendations.md)
 * 3. If no files found, display message and return
 * 4. Construct optimized prompt for AI agent
 * 5. Run agent to analyze files and generate report
 * 6. Report is saved to log-analysis/combined-recommendations.md
 *
 * @param {Object|null} mcpConfig - MCP configuration for agent (currently unused but kept for consistency)
 * @returns {Promise<void>} Resolves when report generation is complete
 */
export async function actionCreateRecommendationsReport(mcpConfig) {
  console.log("\n=== Create Recommendations Report ===\n");

  // Check if log-analysis/ directory exists in project root
  const logAnalysisDir = path.join(process.cwd(), "log-analysis");

  try {
    await fs.access(logAnalysisDir);
  } catch {
    console.log(`No log-analysis directory found at: ${logAnalysisDir}`);
    console.log("Log analysis files are created by the 'Analyze logs' option.");
    return;
  }

  // List all markdown files in log-analysis/ directory
  const files = await fs.readdir(logAnalysisDir);
  const markdownFiles = files
    .filter((file) => file.endsWith(".md"))
    .filter((file) => file !== "combined-recommendations.md"); // Exclude the report itself

  if (markdownFiles.length === 0) {
    console.log("No markdown files found in log-analysis/ directory.");
    console.log("Run 'Analyze logs' first to generate analysis files.");
    return;
  }

  console.log(`Found ${markdownFiles.length} analysis file(s) to analyze:\n`);
  markdownFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });

  // Construct optimized prompt for the agent
  const prompt = `Analyze all markdown files in the log-analysis/ directory and the tasks/progress.txt file and create a comprehensive recommendations report.

  For the tasks/progress.txt file, focus on the Codebase Patterns section and the Task-specific entries with "Learnings for future iterations:" to understand the patterns and learnings from previous iterations. 

Focus your analysis on three key areas:
1. New Agent Skills: Identify recurring patterns, workflows, or solutions that could be extracted into reusable Agent Skills
2. Updates to Existing Skills: Find opportunities to improve or extend existing Agent Skills based on execution patterns
3. Agent Prompt Updates: Suggest improvements to agent prompts (in prompts/ directory) based on observed issues or inefficiencies

Draft your recommendations as project agnostic that can be applied to any project. Do not include any project specific information.

For each recommendation, provide:
- Clear description of the recommendation
- Rationale (why this would help)
- Priority level (High/Medium/Low)
- Implementation guidance

Save the final report to: log-analysis/combined-recommendations.md

The report should be well-structured with clear sections for each category.

Files to analyze:
${markdownFiles.map((file) => `- log-analysis/${file}`).join("\n")}`;

  console.log("\n=== Starting AI Analysis ===\n");
  console.log("Generating recommendations report...\n");

  try {
    // Run the agent with the prompt
    // The agent will read the log-analysis files and generate the report
    await runAgent(
      prompt,
      MODELS.default,
      process.cwd(),
      null,
      (message) => {
        // Log callback for progress updates
        if (message && typeof message === "string") {
          // Only log meaningful messages (skip empty or very verbose tool calls)
          if (message.length > 0 && !message.includes("TOOL:")) {
            console.log(message);
          }
        }
      },
      null, // No progress callback needed
      mcpConfig,
    );

    console.log("\n✓ Recommendations report generated successfully!");
    console.log(
      `  Report saved to: log-analysis/combined-recommendations.md\n`,
    );
  } catch (error) {
    console.error("\n✗ Error generating recommendations report:");
    console.error(`  ${error.message}\n`);
    throw error;
  }
}
