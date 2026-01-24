/**
 * Skill Learning from Progress
 *
 * This module extracts learnings from progress.txt and creates/updates Agent Skills
 * in the .cursor/skills directory. It follows the Agent Skills specification format.
 *
 * Process:
 * 1. Parse progress.txt to extract Codebase Patterns and task-specific learnings
 * 2. Use AI to analyze and organize learnings into skill topics
 * 3. Create or update skills in .cursor/skills/{skill-name}/SKILL.md format
 * 4. Follow Agent Skills spec: YAML frontmatter + Markdown body
 *
 * Skill Format:
 * - Directory: .cursor/skills/{skill-name}/
 * - File: SKILL.md (required) with YAML frontmatter + Markdown body
 * - Optional: scripts/, references/, assets/ directories
 */

import fs from "fs-extra";
import path from "path";
import OpenAI from "openai";
import prompts from "prompts";
import { PROGRESS_PATH, SKILLS_DIR, MODELS } from "./config.mjs";

/**
 * Parse Progress File to Extract Learnings
 *
 * Extracts two types of learnings from progress.txt:
 * 1. Codebase Patterns section (at the top) - reusable patterns for all tasks
 * 2. Task-specific learnings - entries with "Learnings for future iterations:"
 *
 * @returns {Promise<{codebasePatterns: string, taskLearnings: string[]}>}
 *         Extracted learnings organized by type
 */
async function parseProgressFile() {
  // Check if progress.txt exists
  const exists = await fs.pathExists(PROGRESS_PATH);
  if (!exists) {
    return {
      codebasePatterns: "",
      taskLearnings: [],
      error: "No progress.txt file found. Run development tasks first to generate learnings.",
    };
  }

  // Read progress.txt content
  const progressContent = await fs.readFile(PROGRESS_PATH, "utf8");

  // Extract Codebase Patterns section (everything under "## Codebase Patterns")
  let codebasePatterns = "";
  const patternsMatch = progressContent.match(/## Codebase Patterns([\s\S]*?)(?=## |$)/);
  if (patternsMatch) {
    codebasePatterns = patternsMatch[1].trim();
    // Remove placeholder text if present
    if (codebasePatterns.includes("No patterns yet")) {
      codebasePatterns = "";
    }
  }

  // Extract task-specific learnings (entries with "Learnings for future iterations:")
  const taskLearnings = [];
  const learningRegex = /\*\*Learnings for future iterations:\*\*([\s\S]*?)(?=---|## |$)/g;
  let match;
  while ((match = learningRegex.exec(progressContent)) !== null) {
    const learning = match[1].trim();
    if (learning && learning.length > 10) { // Filter out very short learnings
      taskLearnings.push(learning);
    }
  }

  // Also check for learnings in task entries (alternative format)
  const taskEntryRegex = /## .* - Task \d+([\s\S]*?)(?=## |$)/g;
  while ((match = taskEntryRegex.exec(progressContent)) !== null) {
    const taskContent = match[1];
    if (taskContent.includes("Learnings") || taskContent.includes("learning")) {
      // Extract any bullet points that look like learnings
      const bulletPoints = taskContent.match(/^[-*]\s+(.+)$/gm);
      if (bulletPoints) {
        bulletPoints.forEach((point) => {
          const cleanPoint = point.replace(/^[-*]\s+/, "").trim();
          if (cleanPoint.length > 20 && !taskLearnings.includes(cleanPoint)) {
            taskLearnings.push(cleanPoint);
          }
        });
      }
    }
  }

  return {
    codebasePatterns,
    taskLearnings,
  };
}

/**
 * Analyze Learnings and Organize into Skills
 *
 * Uses AI to analyze extracted learnings and organize them into skill topics.
 * Returns structured skill definitions following Agent Skills specification.
 *
 * @param {string} codebasePatterns - Codebase Patterns section content
 * @param {string[]} taskLearnings - Array of task-specific learnings
 * @returns {Promise<Array<{name: string, description: string, content: string, isUpdate: boolean}>>}
 *         Array of skill definitions ready to be created/updated
 */
async function analyzeLearnings(codebasePatterns, taskLearnings) {
  // Combine all learnings for analysis
  const allLearnings = [];
  if (codebasePatterns) {
    allLearnings.push(`Codebase Patterns:\n${codebasePatterns}`);
  }
  if (taskLearnings.length > 0) {
    allLearnings.push(`Task-specific Learnings:\n${taskLearnings.join("\n\n")}`);
  }

  if (allLearnings.length === 0) {
    return [];
  }

  const learningsText = allLearnings.join("\n\n---\n\n");

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // System prompt for skill organization
  const systemMessage = {
    role: "system",
    content: `You are a skill organization expert. Analyze learnings from a development project and organize them into Agent Skills following the Agent Skills specification.

Agent Skills Format Requirements:
- Each skill is a directory with SKILL.md file
- SKILL.md has YAML frontmatter with required fields:
  - name: lowercase, hyphens, numbers only, max 64 chars, matches directory name
  - description: max 1024 chars, describes what skill does and when to use it (include keywords)
- Body content: Markdown instructions (recommended < 5000 tokens, < 500 lines)

Group related learnings into cohesive skills. Each skill should:
- Have a clear, focused purpose
- Include keywords in description for discoverability
- Be reusable across future tasks
- Follow naming convention: kebab-case, descriptive, max 64 chars

Return a JSON array of skill definitions.`,
  };

  // User message with learnings
  const userMessage = {
    role: "user",
    content: `Analyze these learnings and organize them into Agent Skills:

${learningsText}

For each skill, provide:
- name: kebab-case identifier (max 64 chars, lowercase, hyphens only)
- description: what it does and when to use it (max 1024 chars, include keywords)
- content: Markdown body with organized learnings, examples, and instructions

Group related learnings together. If learnings are too diverse, create multiple focused skills.`,
  };

  // Call OpenAI with structured JSON schema
  const completion = await openai.chat.completions.create({
    model: MODELS.taskBreakdown, // Use task breakdown model for structured analysis
    messages: [systemMessage, userMessage],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "skill_definitions",
        schema: {
          title: "skill_definitions",
          type: "object",
          properties: {
            skills: {
              type: "array",
              description: "Array of skill definitions",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Skill name in kebab-case (max 64 chars, lowercase, hyphens only)",
                    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                    maxLength: 64,
                  },
                  description: {
                    type: "string",
                    description: "Skill description (max 1024 chars) - what it does and when to use it, include keywords",
                    maxLength: 1024,
                  },
                  content: {
                    type: "string",
                    description: "Markdown body content with organized learnings, examples, and instructions",
                  },
                },
                required: ["name", "description", "content"],
              },
            },
          },
          required: ["skills"],
        },
      },
    },
  });

  // Parse response
  const result = JSON.parse(completion.choices[0].message.content);
  const skills = result.skills || [];

  // Check which skills already exist
  const skillsWithUpdateFlag = await Promise.all(
    skills.map(async (skill) => {
      const skillDir = path.join(SKILLS_DIR, skill.name);
      const exists = await fs.pathExists(skillDir);
      return {
        ...skill,
        isUpdate: exists,
      };
    }),
  );

  return skillsWithUpdateFlag;
}

/**
 * Select Skills to Process
 *
 * Interactive multi-select prompt that allows users to choose which skills
 * to create or update. Displays each skill with status indicator and description.
 *
 * @param {Array<{name: string, description: string, isUpdate: boolean}>} skills - Array of skill definitions
 * @returns {Promise<Array<string>|null>} Array of selected skill names, or null if cancelled
 */
async function selectSkillsToProcess(skills) {
  // Build choices array with status indicators and descriptions
  const choices = skills.map((skill) => {
    const status = skill.isUpdate ? "(UPDATE)" : "(NEW)";
    // Truncate description if too long for display (max 80 chars)
    const displayDescription = skill.description.length > 80
      ? `${skill.description.substring(0, 77)}...`
      : skill.description;

    return {
      title: `${skill.name} ${status}`,
      value: skill.name,
      description: displayDescription,
      selected: true, // Default to all selected
    };
  });

  try {
    const response = await prompts({
      type: "multiselect",
      name: "selectedSkills",
      message: "Select skills to create/update (use space to toggle, enter to confirm):",
      choices: choices,
      instructions: false, // Hide default instructions for cleaner output
    });

    // Handle user cancellation
    if (!response || !response.selectedSkills) {
      return null;
    }

    return response.selectedSkills;
  } catch (error) {
    // Handle cancellation (Ctrl+C or other cancellation methods)
    if (error.message === "User cancelled the prompt" || 
        error.name === "ExitPromptError" || 
        error.name === "SIGINT") {
      return null;
    }
    throw error;
  }
}

/**
 * Create or Update a Skill
 *
 * Creates a new skill or updates an existing one following Agent Skills specification.
 *
 * @param {Object} skillDef - Skill definition with name, description, content
 * @param {boolean} isUpdate - Whether this is an update to existing skill
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function createOrUpdateSkill(skillDef, isUpdate) {
  try {
    const { name, description, content } = skillDef;
    const skillDir = path.join(SKILLS_DIR, name);
    const skillFile = path.join(skillDir, "SKILL.md");

    // Ensure skills directory exists
    await fs.ensureDir(SKILLS_DIR);

    // If updating, read existing content and merge
    let finalContent = content;
    if (isUpdate) {
      try {
        const existingContent = await fs.readFile(skillFile, "utf8");
        // Extract existing body (everything after frontmatter)
        const bodyMatch = existingContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
        const existingBody = bodyMatch ? bodyMatch[1].trim() : "";

        // Merge: append new content with separator
        if (existingBody) {
          finalContent = `${existingBody}\n\n---\n\n## New Learnings\n\n${content}`;
        }
      } catch (e) {
        // File might not exist yet, continue with new content
      }
    }

    // Create skill directory
    await fs.ensureDir(skillDir);

    // Build SKILL.md with YAML frontmatter
    // Quote description if it contains special characters or is long
    const cleanDescription = description.replace(/\n/g, " ").trim();
    const quotedDescription = cleanDescription.includes(":") || cleanDescription.includes("'") || cleanDescription.includes('"')
      ? `"${cleanDescription.replace(/"/g, '\\"')}"`
      : cleanDescription;

    const frontmatter = `---
name: ${name}
description: ${quotedDescription}
---`;

    const skillMarkdown = `${frontmatter}\n\n${finalContent}`;

    // Write SKILL.md
    await fs.writeFile(skillFile, skillMarkdown, "utf8");

    return {
      success: true,
      message: isUpdate
        ? `Updated skill: ${name}`
        : `Created skill: ${name}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error ${isUpdate ? "updating" : "creating"} skill ${skillDef.name}: ${error.message}`,
    };
  }
}

/**
 * Main Action: Learn Skills from Progress
 *
 * Extracts learnings from progress.txt and creates/updates skills in .cursor/skills.
 * This is the main entry point called from the menu system.
 *
 * @returns {Promise<{success: boolean, message: string, stats?: Object}>}
 *         Success status, message, and statistics about created/updated skills
 */
export async function actionLearnSkills() {
  try {
    console.log("\n=== Learning Skills from Progress ===\n");

    // Step 1: Parse progress.txt
    console.log("Reading progress.txt...");
    const { codebasePatterns, taskLearnings, error } = await parseProgressFile();

    if (error) {
      return {
        success: false,
        message: error,
      };
    }

    // Check if we have any learnings
    const hasPatterns = codebasePatterns && codebasePatterns.length > 20;
    const hasTaskLearnings = taskLearnings.length > 0;

    if (!hasPatterns && !hasTaskLearnings) {
      return {
        success: false,
        message: "No learnings found in progress.txt. Run development tasks first to generate learnings.",
      };
    }

    console.log(`Found ${hasPatterns ? "Codebase Patterns" : ""}${hasPatterns && hasTaskLearnings ? " and " : ""}${hasTaskLearnings ? `${taskLearnings.length} task learnings` : ""}`);

    // Step 2: Analyze learnings with AI
    console.log("\nAnalyzing learnings and organizing into skills...");
    const skills = await analyzeLearnings(codebasePatterns, taskLearnings);

    if (skills.length === 0) {
      return {
        success: false,
        message: "No skills could be generated from the learnings. The learnings may be too sparse or unclear.",
      };
    }

    console.log(`Organized into ${skills.length} skill${skills.length !== 1 ? "s" : ""}`);

    // Step 3: Let user select which skills to process
    console.log("\nSelect skills to create/update:");
    const selectedSkillNames = await selectSkillsToProcess(skills);

    // Handle cancellation
    if (selectedSkillNames === null) {
      return {
        success: false,
        message: "Skill selection cancelled. No skills were processed.",
      };
    }

    // Handle no selection
    if (selectedSkillNames.length === 0) {
      return {
        success: false,
        message: "No skills selected. No skills were processed.",
      };
    }

    // Filter skills to only include selected ones
    const selectedSkills = skills.filter((skill) => selectedSkillNames.includes(skill.name));

    // Show which skills will be processed
    console.log(`\nProcessing ${selectedSkills.length} selected skill${selectedSkills.length !== 1 ? "s" : ":"}`);
    selectedSkills.forEach((skill) => {
      const status = skill.isUpdate ? "UPDATE" : "NEW";
      console.log(`  - ${skill.name} (${status})`);
    });

    // Step 4: Create/update selected skills
    console.log("\nCreating/updating skills...");
    const results = [];
    const stats = {
      created: 0,
      updated: 0,
      failed: 0,
    };

    for (const skill of selectedSkills) {
      const result = await createOrUpdateSkill(skill, skill.isUpdate);
      results.push(result);

      if (result.success) {
        if (skill.isUpdate) {
          stats.updated++;
          console.log(`  ✓ Updated: ${skill.name}`);
        } else {
          stats.created++;
          console.log(`  ✓ Created: ${skill.name}`);
        }
      } else {
        stats.failed++;
        console.log(`  ✗ Failed: ${skill.name} - ${result.message}`);
      }
    }

    // Build summary message
    const summaryParts = [];
    if (stats.created > 0) {
      summaryParts.push(`created ${stats.created} skill${stats.created !== 1 ? "s" : ""}`);
    }
    if (stats.updated > 0) {
      summaryParts.push(`updated ${stats.updated} skill${stats.updated !== 1 ? "s" : ""}`);
    }
    if (stats.failed > 0) {
      summaryParts.push(`failed to process ${stats.failed} skill${stats.failed !== 1 ? "s" : ""}`);
    }

    const summary = summaryParts.length > 0
      ? `Successfully ${summaryParts.join(", ")}.`
      : "No skills were processed.";

    return {
      success: stats.created > 0 || stats.updated > 0,
      message: summary,
      stats,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error learning skills: ${error.message}`,
    };
  }
}
