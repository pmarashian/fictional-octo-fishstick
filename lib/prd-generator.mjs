/**
 * PRD Creation Workflow
 *
 * This module implements the Product Requirements Document (PRD) generation workflow,
 * the first phase of the Ralph orchestrator's three-phase development process.
 *
 * PRD Generation Process:
 * 1. User provides initial project description/requirements
 * 2. AI analyzes requirements and generates clarification questions
 * 3. Interactive clarification rounds collect additional context
 * 4. AI generates comprehensive PRD using templates and examples
 * 5. PRD is saved to project directory with extracted filename
 *
 * Key Features:
 * - Multi-round clarification process to gather complete requirements
 * - Structured question categories (scope, technical, business, constraints)
 * - Interactive approval workflow for PRD content
 * - Automatic filename generation from PRD content
 * - Template-based PRD structure with examples
 *
 * The clarification process uses AI to identify gaps in initial requirements
 * and guides users through providing comprehensive project context before
 * generating detailed, actionable PRDs.
 */

import fs from "fs-extra";
import path from "path";
import prompts from "prompts";
import OpenAI from "openai";
import { MAX_CLARIFICATION_ROUNDS, MODELS, SCRIPT_DIR } from "./config.mjs";
import { loadPrompt } from "./file-ops.mjs";
import { getMultiLineInput, interactiveLoop } from "./prompts.mjs";

/**
 * Generate AI-Powered Clarification Questions
 *
 * Uses OpenAI to analyze user requirements and generate targeted clarification
 * questions to fill gaps in the initial project description. Questions are
 * categorized and structured to ensure comprehensive requirement gathering.
 *
 * Question Categories:
 * - scope: Project boundaries, deliverables, and scope limitations
 * - technical: Technical constraints, architecture, and implementation details
 * - business: Business logic, user workflows, and domain requirements
 * - constraints: Time, budget, regulatory, and resource limitations
 *
 * Process:
 * 1. Constructs context from previous clarification rounds
 * 2. Uses specialized clarification system prompt
 * 3. Generates structured JSON response with questions
 * 4. Returns boolean flag indicating if clarification is needed
 *
 * @param {string} userMessage - Initial user project description
 * @param {Array} previousClarifications - Previous clarification Q&A pairs
 * @param {number} clarificationRound - Current round number (0-based)
 * @returns {Promise<{has_questions: boolean, questions: Array}>} Structured clarification data
 */
async function generateClarificationQuestions(
  userMessage,
  previousClarifications = [],
  clarificationRound = 0,
) {
  // === OPENAI INTEGRATION FOR CLARIFICATION ===
  // Initialize OpenAI client with API key from environment
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Build context from previous clarification rounds
  // This allows AI to avoid asking redundant questions and build upon previous answers
  const clarificationsContext =
    previousClarifications.length > 0
      ? `\n\nPrevious clarifications:\n${previousClarifications
          .map(
            (c, i) =>
              `${i + 1}. [${c.category}] ${c.question}\n   Answer: ${c.answer}`,
          )
          .join("\n")}`
      : "";

  // Load specialized system prompt for clarification question generation
  const systemMessage = {
    role: "system",
    content: await loadPrompt("clarification-system.md"),
  };

  // Construct user message with original request and clarification history
  const finalUserMessage = {
    role: "user",
    content: `User request: ${userMessage}${clarificationsContext}

Round ${clarificationRound + 1}: Do you need clarification to create a comprehensive PRD?`,
  };

  // Call OpenAI with structured JSON schema for reliable question generation
  // Uses clarification-specific model optimized for requirement analysis
  const completion = await openai.chat.completions.create({
    model: MODELS.clarification,  // Specialized model for clarification tasks
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
                    description: "Question category for organization",
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

  // Parse structured JSON response for programmatic use
  const jsonOutput = completion.choices[0].message.content;
  return JSON.parse(jsonOutput);
}

/**
 * Interactive Clarification Question Collection
 *
 * Presents AI-generated clarification questions to the user in an organized,
 * category-grouped interface. Allows users to answer questions, skip them,
 * or exit the clarification process early.
 *
 * User Interface:
 * - Questions grouped by category (scope, technical, business, constraints)
 * - Options: Answer normally, 'skip' to skip, 'done' to finish early
 * - Cancellation support (Ctrl+C) for graceful exit
 *
 * @param {Array} questions - Array of clarification questions with id, question, category
 * @param {number} round - Current clarification round number for display
 * @returns {Promise<{clarifications: Array, userExited: boolean}>} Collected answers and exit status
 */
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

/**
 * Complete Clarification Workflow Orchestration
 *
 * Manages the multi-round clarification process, iteratively generating
 * questions and collecting answers until either:
 * - AI determines no more clarification is needed, OR
 * - User chooses to finish early, OR
 * - Maximum clarification rounds reached
 *
 * Workflow:
 * 1. Generate initial clarification questions using AI
 * 2. If questions exist, collect user answers interactively
 * 3. Repeat with context from previous answers
 * 4. Continue until stopping condition met
 *
 * Error Handling:
 * - Gracefully handles AI API errors by proceeding with available context
 * - Continues to PRD generation even if clarification fails
 *
 * @param {string} userMessage - Initial user project description
 * @returns {Promise<Array>} Array of all collected clarification Q&A pairs
 */
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

/**
 * Extract Descriptive Name from PRD Content
 *
 * Uses AI to analyze PRD content and generate a short, filename-friendly
 * description suitable for use in PRD filenames. Falls back to regex
 * extraction and timestamp if AI extraction fails.
 *
 * Filename Format:
 * - Lowercase, hyphen-separated words (e.g., "user-authentication")
 * - 2-5 words describing the PRD's main purpose
 * - Max 50 characters, sanitized for filesystem compatibility
 *
 * Fallback Strategy:
 * 1. AI extraction using specialized prompt
 * 2. Regex extraction from PRD title/header
 * 3. Timestamp-based filename as final fallback
 *
 * @param {string} prdOutput - Complete PRD content
 * @returns {Promise<string|null>} Extracted description or null if extraction fails
 */
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

/**
 * Generate Complete PRD with Context and Templates
 *
 * Core PRD generation function that combines user input, clarifications,
 * templates, and examples to create comprehensive Product Requirements Documents.
 * Uses interactive approval workflow to ensure user satisfaction with the result.
 *
 * Process:
 * 1. Load PRD template and example documents from orchestrator assets
 * 2. Construct enhanced prompt with user context and clarifications
 * 3. Run interactive approval loop for PRD generation
 * 4. Extract descriptive filename from PRD content
 * 5. Save PRD to project directory with generated filename
 *
 * Template Integration:
 * - Uses TEMPLATE.md for structure guidance
 * - Includes example PRDs for quality reference
 * - Incorporates clarification context for completeness
 *
 * @param {string} userMessage - Original user project description
 * @param {Array} clarifications - Collected clarification Q&A pairs
 * @param {Object|null} mcpConfig - MCP configuration for agent tools
 * @returns {Promise<{prdOutput: string, prdPath: string}>} Generated PRD content and file path
 */
async function generatePRDWithContext(
  userMessage,
  clarifications,
  mcpConfig = null,
) {
  // === TEMPLATE AND CONTEXT LOADING ===
  // Load static assets from orchestrator directory for consistent PRD generation
  // Templates provide structure, examples provide quality reference
  const template = await fs.readFile(path.join(SCRIPT_DIR, "prds", "TEMPLATE.md"), "utf8");
  const example1 = await fs.readFile(path.join(SCRIPT_DIR, "example_prd_1.md"), "utf8");
  const example2 = await fs.readFile(path.join(SCRIPT_DIR, "example_prd_2.md"), "utf8");

  // Format clarifications as readable context for PRD generation
  const clarificationsContext =
    clarifications.length > 0
      ? `\n\nClarifications Provided:\n${formatClarifications(clarifications)}\n\n`
      : "";

  // === PROMPT CONSTRUCTION ===
  // Build comprehensive PRD generation prompt with all available context
  const prdPromptTemplate = await loadPrompt("prd-generation.md");
  const prdPrompt = prdPromptTemplate
    .replace("${example1}", example1)              // Quality example 1
    .replace("${example2}", example2)              // Quality example 2
    .replace("${userMessage}", userMessage)        // Original user request
    .replace("${clarificationsContext}", clarificationsContext); // Additional context

  const prdOutput = await interactiveLoop(
    prdPrompt,
    MODELS.prd,
    "PRD",
    5,
    mcpConfig,
  );

  // === FILENAME EXTRACTION AND SANITIZATION ===
  // Extract descriptive name from PRD content for user-friendly filenames
  console.log("\nExtracting description for filename...");
  let projectName = await extractPRDDescription(prdOutput);

  // Fallback strategies if AI extraction fails
  if (!projectName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    projectName = `prd-${timestamp}`;  // Timestamp-based fallback
  }

  // Sanitize for filesystem compatibility and consistent naming
  const sanitized = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")    // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, "")          // Remove leading/trailing hyphens
    .substring(0, 50);              // Limit length

  // === PRD FILE WRITING ===
  // Save PRD to project directory (not orchestrator directory) for user access
  const filename = `prd-${sanitized}.md`;
  const filepath = path.join(process.cwd(), "prds", filename);

  // Ensure directory exists and write file
  await fs.ensureDir(path.dirname(filepath));
  console.log(`Creating PRD directory: ${path.dirname(filepath)}`);
  await fs.writeFile(filepath, prdOutput, "utf8");

  console.log(`\n✓ PRD saved to ${filepath}`);

  return { prdOutput, prdPath: filepath };
}

export async function actionCreatePRD(mcpConfigForAgent) {
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