/**
 * Configuration and Constants
 *
 * This module centralizes all configuration constants and path definitions used
 * throughout the Ralph orchestrator system. It handles the critical distinction
 * between the orchestrator installation directory (SCRIPT_DIR) and the project
 * directory (process.cwd()) where operations are performed.
 *
 * Key Configuration Areas:
 * - Path Management: Script vs project directory handling
 * - Environment Variables: .env file loading from orchestrator directory
 * - Token Management: Thresholds for AI model context limits
 * - Workflow Limits: Maximum clarification rounds
 * - File Paths: Progress tracking, logging, and task management
 * - Model Configuration: AI model selection for different workflow phases
 *
 * The path distinction is crucial: SCRIPT_DIR contains the orchestrator's own
 * assets (prompts, templates), while process.cwd() is the user's project directory
 * where all project-specific files and operations occur.
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import path from "path";
import dotenv from "dotenv";

// ============================================================================
// PATH MANAGEMENT - Critical Distinction Between Directories
// ============================================================================

/**
 * Script Directory (Orchestrator Installation)
 *
 * SCRIPT_DIR points to the directory where the Ralph orchestrator is installed.
 * This contains all the orchestrator's own assets, templates, and configuration files.
 *
 * Used for loading orchestrator assets:
 * - prompts/ folder: System prompts for AI interactions
 * - prds/TEMPLATE.md: PRD generation template
 * - prds/ folder: Example PRDs for reference
 * - .env file: Environment variables for API keys and configuration
 *
 * IMPORTANT DISTINCTION:
 * - SCRIPT_DIR: Where the orchestrator lives (/path/to/orchestrator/)
 * - process.cwd(): Where the user runs the command (their project directory)
 *
 * All project-specific operations (creating files, running tasks) use process.cwd(),
 * while orchestrator assets are always loaded from SCRIPT_DIR.
 */
const __filename = fileURLToPath(import.meta.url);
export const SCRIPT_DIR = dirname(__filename);

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

/**
 * Environment Variables Loading
 *
 * Load .env file from the orchestrator directory (SCRIPT_DIR), not the project directory.
 * This ensures that API keys and configuration are managed within the orchestrator
 * installation, separate from user project files.
 */
dotenv.config({ path: path.join(dirname(SCRIPT_DIR), ".env") });

// ============================================================================
// AI MODEL LIMITS AND THRESHOLDS
// ============================================================================

/**
 * Token Thresholds for AI Model Context Management
 *
 * These thresholds help manage AI model context windows by monitoring conversation
 * size and triggering warnings or automatic rotation when approaching limits.
 *
 * - WARN_THRESHOLD: Alert user when approaching context limits (70k tokens)
 * - ROTATE_THRESHOLD: Automatically rotate/create new conversation (80k tokens)
 *
 * Note: Values are in bytes approximation of token counts. Actual tokenization
 * may vary slightly by model, but these provide safe operational limits.
 */
export const WARN_THRESHOLD = 70000; // Bytes ~ tokens
export const ROTATE_THRESHOLD = 80000;

/**
 * Workflow Limits
 *
 * Maximum number of clarification rounds allowed during PRD generation.
 * This prevents infinite loops while allowing sufficient iteration for
 * requirement clarification.
 */
export const MAX_CLARIFICATION_ROUNDS = 3;

/**
 * Agent Hang Detection Threshold
 *
 * Maximum number of consecutive tool call failures before considering the agent
 * to be in a hang state. When this threshold is exceeded, the agent execution
 * will be terminated with an error to prevent infinite loops.
 */
export const MAX_CONSECUTIVE_FAILURES = 5;

// ============================================================================
// PROJECT-SPECIFIC FILE PATHS (Relative to process.cwd())
// ============================================================================

/**
 * Project File Paths - All Created in User's Project Directory
 *
 * These paths use process.cwd() to ensure files are created in the project directory
 * where the user is working, not in the orchestrator installation directory.
 *
 * This separation allows:
 * - Multiple projects to use the same orchestrator installation
 * - Clean project directories without mixing orchestrator files
 * - Proper version control scoping (only project files tracked)
 */

/**
 * Progress Tracking File
 *
 * Contains real-time progress updates during development task execution.
 * Updated continuously as tasks are completed, providing status feedback.
 * Located in: project/tasks/progress.txt
 */
export const PROGRESS_PATH = path.join(process.cwd(), "tasks/progress.txt");

/**
 * Next Task Preview File
 *
 * Single file that contains the current/next task being executed.
 * Updated before each task begins, allowing external monitoring.
 * Located in: project/tasks/next_task.md
 */
export const NEXT_TASK_PATH = path.join(process.cwd(), "tasks/next_task.md");

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================

/**
 * Logging Directory and Run Identification
 *
 * All logs are stored in the project directory for easy access and version control.
 * Each orchestrator run gets a unique timestamp-based ID for log organization.
 *
 * - LOG_DIR: Base directory for all logs (project/logs/)
 * - RUN_ID: Unique identifier for this orchestrator session
 */
export const LOG_DIR = path.join(process.cwd(), "logs");
export const RUN_ID = Date.now();

// ============================================================================
// AI MODEL CONFIGURATION
// ============================================================================

/**
 * AI Model Selection for Different Workflow Phases
 *
 * Each phase of the orchestrator workflow can use different AI models optimized
 * for specific tasks. Models are selected based on their strengths:
 *
 * - prd: "auto" - Automatic model selection for initial PRD generation
 *   Uses general-purpose models good at understanding broad requirements
 *
 * - clarification: "gpt-5.2-2025-12-11" - Specific model for requirement clarification
 *   Uses advanced reasoning for iterative requirement refinement
 *
 * - taskBreakdown: "gpt-5.2-2025-12-11" - Same model for task decomposition
 *   Leverages structured reasoning for breaking requirements into tasks
 *
 * - devAgent: "grok" - Development-focused model for code generation and execution
 *   Specialized for programming tasks and technical implementation
 *
 * - default: "auto" - Fallback model for any unspecified operations
 *   Provides general-purpose AI capabilities when specific models aren't defined
 *
 * Model selection can be customized based on available APIs, performance needs,
 * and specific project requirements.
 */
export const MODELS = {
  prd: "auto", // PRD generation - broad requirement understanding
  clarification: "auto", // Requirement clarification - advanced reasoning
  taskBreakdown: "auto", // Task decomposition - structured analysis
  taskBreakdownFormatter: "gpt-5.2", // Task decomposition formatter - structured analysis
  devAgent: "grok", // Development execution - code generation
  default: "auto", // Fallback for unspecified operations
};
