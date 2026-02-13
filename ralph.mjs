// Core UI imports - handle user interaction and menu display
import { showMainMenu } from "./lib/menu.mjs";

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

// Workflow phase imports - each handles a major step in the development process
import { actionCreatePRD } from "./lib/prd-generator.mjs"; // Phase 1: PRD generation from user requirements

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { actionCreateTasks, actionCreateTasksFromDescription } from "./lib/task-generator.mjs"; // Phase 2: Task breakdown from PRDs

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { actionRunDev, actionDev, actionRestartDev } from "./lib/dev-executor.mjs"; // Phase 3: Development execution with agents

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { actionResetTasks } from "./lib/task-reset.mjs"; // Task reset functionality

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { actionLearnSkills } from "./lib/skill-learner.mjs"; // Skill learning from progress

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { analyzeLogs } from "./lib/log-analyzer.mjs"; // Log analysis functionality

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { actionCreateRecommendationsReport } from "./lib/recommendations-generator.mjs"; // Recommendations report generation

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { ResourceExhaustionError } from "./lib/agent-runner.mjs"; // Resource exhaustion error handling

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { MAX_CONTEXT_SIZE_BYTES } from "./lib/config.mjs"; // Configuration constants

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

/**
 * Parse command line arguments for direct command execution
 *
 * @param {string[]} args - Command line arguments

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
 * @returns {Object} Parsed command configuration

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
 */
function parseArgs(args) {
  if (args.length === 0) {
    return { mode: 'interactive' };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
  }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

  const command = args[0].toLowerCase();
  const commandArgs = args.slice(1);

  switch (command) {
    case 'dev':
    case 'resume':
      return {
        mode: 'direct',
        action: 'dev',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'run-dev':
    case 'rundev':
      return {
        mode: 'direct',
        action: 'run_dev',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'restart-dev':
    case 'restartdev':
    case 'restart':
      return {
        mode: 'direct',
        action: 'restart_dev',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'create-prd':
    case 'createprd':
    case 'prd':
      return {
        mode: 'direct',
        action: 'create_prd',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'create-tasks':
    case 'createtasks':
    case 'tasks':
      return {
        mode: 'direct',
        action: 'create_tasks',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'create-tasks-quick':
    case 'createtasksquick':
    case 'quick':
      return {
        mode: 'direct',
        action: 'create_tasks_quick',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'reset-tasks':
    case 'resettasks':
    case 'reset':
      return {
        mode: 'direct',
        action: 'reset_tasks',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'learn-skills':
    case 'learnskills':
    case 'learn':
      return {
        mode: 'direct',
        action: 'learn_skills',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'analyze-logs':
    case 'analyzelogs':
    case 'analyze':
      return {
        mode: 'direct',
        action: 'analyze_logs',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'create-recommendations':
    case 'createrecommendations':
    case 'recommendations':
      return {
        mode: 'direct',
        action: 'create_recommendations',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      process.exit(0);
      break;

    default:
      console.error(`Unknown command: ${command}`);

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
      console.error("Use 'ralph help' for usage information");
      process.exit(1);
  }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
#!/usr/bin/env node

/**
 * Ralph - Interactive Development Orchestrator
 *
 * This is the main entry point for the Ralph orchestrator system, an interactive
 * development workflow tool that guides users through the complete software
 * development lifecycle from concept to implementation.
 *
 * System Architecture:
 * - Interactive CLI interface with menu-driven navigation
 * - Three-phase workflow: PRD Generation → Task Breakdown → Development Execution
 * - Modular design with separate libraries for each major functionality
 * - MCP (Model Context Protocol) integration for agent communication
 * - Project-scoped operations within the current working directory
 *
 * Workflow Overview:
 * 1. PRD Generation: Clarify requirements and generate Product Requirements Documents
 * 2. Task Breakdown: Convert PRDs into structured, actionable development tasks
 * 3. Development Execution: Run agents to implement tasks with progress tracking
 *
 * The system is designed to be user-friendly, handling errors gracefully and
 * providing clear feedback throughout the development process.
 */

// Core UI imports - handle user interaction and menu display
import { showMainMenu } from "./lib/menu.mjs";

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

// Workflow phase imports - each handles a major step in the development process
import { actionCreatePRD } from "./lib/prd-generator.mjs";     // Phase 1: PRD generation from user requirements

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { actionCreateTasks, actionCreateTasksFromDescription } from "./lib/task-generator.mjs";  // Phase 2: Task breakdown from PRDs

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { actionRunDev, actionDev, actionRestartDev } from "./lib/dev-executor.mjs";  // Phase 3: Development execution with agents

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { actionResetTasks } from "./lib/task-reset.mjs";      // Task reset functionality

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { actionLearnSkills } from "./lib/skill-learner.mjs";  // Skill learning from progress

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { analyzeLogs } from "./lib/log-analyzer.mjs";          // Log analysis functionality

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { actionCreateRecommendationsReport } from "./lib/recommendations-generator.mjs";  // Recommendations report generation

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { ResourceExhaustionError } from "./lib/agent-runner.mjs"; // Resource exhaustion error handling

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
import { MAX_CONTEXT_SIZE_BYTES } from "./lib/config.mjs"; // Configuration constants

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

/**
 * Parse command line arguments for direct command execution
 *
 * @param {string[]} args - Command line arguments

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
 * @returns {Object} Parsed command configuration

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
 */
function parseArgs(args) {
  if (args.length === 0) {
    return { mode: 'interactive' };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
  }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

  const command = args[0].toLowerCase();
  const commandArgs = args.slice(1);

  switch (command) {
    case 'dev':
    case 'resume':
      return {
        mode: 'direct',
        action: 'dev',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'run-dev':
    case 'rundev':
      return {
        mode: 'direct',
        action: 'run_dev',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'restart-dev':
    case 'restartdev':
    case 'restart':
      return {
        mode: 'direct',
        action: 'restart_dev',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'create-prd':
    case 'createprd':
    case 'prd':
      return {
        mode: 'direct',
        action: 'create_prd',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'create-tasks':
    case 'createtasks':
    case 'tasks':
      return {
        mode: 'direct',
        action: 'create_tasks',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'create-tasks-quick':
    case 'createtasksquick':
    case 'quick':
      return {
        mode: 'direct',
        action: 'create_tasks_quick',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'reset-tasks':
    case 'resettasks':
    case 'reset':
      return {
        mode: 'direct',
        action: 'reset_tasks',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'learn-skills':
    case 'learnskills':
    case 'learn':
      return {
        mode: 'direct',
        action: 'learn_skills',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'analyze-logs':
    case 'analyzelogs':
    case 'analyze':
      return {
        mode: 'direct',
        action: 'analyze_logs',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'create-recommendations':
    case 'createrecommendations':
    case 'recommendations':
      return {
        mode: 'direct',
        action: 'create_recommendations',
        args: commandArgs
      };

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      process.exit(0);
      break;

    default:
      console.error(`Unknown command: ${command}`);

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
      console.error("Use 'ralph help' for usage information");
      process.exit(1);
  }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

/**
 * Main orchestrator entry point and menu loop controller
 *
 * This function initializes the orchestrator system and runs the main interactive
 * menu loop that guides users through the three-phase development workflow.
 *
 * Key responsibilities:
 * - Initialize project context (current working directory)
 * - Display welcome message and branding
 * - Run the interactive menu loop until user chooses to exit
 * - Route user selections to appropriate workflow actions
 * - Handle errors gracefully and return to menu for recovery
 * - Provide user feedback throughout the process
 *
 * The menu loop continues indefinitely until the user explicitly chooses to exit,
 * allowing for multiple workflow iterations within a single session.
 *
 * @returns {Promise<void>} Resolves when user chooses to exit the orchestrator

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const commandConfig = parseArgs(args);

  // Initialize project context - operations will be scoped to current working directory
  const projectPath = process.cwd();

  // MCP configuration for agent integration - currently null (placeholder for future MCP setup)
  // This will be passed to workflow actions that may need agent communication
  const mcpConfigForAgent = null;

  // Display welcome message and system branding
  console.log("
=== Ralph Orchestrator ===
");

  // Handle direct command execution (non-interactive mode)
  if (commandConfig.mode === 'direct') {
    try {
      await executeDirectAction(commandConfig.action, commandConfig.args, mcpConfigForAgent, projectPath);
      return; // Exit after direct action completes
    } catch (error) {
      console.error("
Error:", error.message);
      process.exit(1);
    }
  }

  // Track automatic restart attempts to prevent infinite loops
  const MAX_AUTOMATIC_RESTARTS = 3;
  let automaticRestartCount = 0;
  let automaticRestartCount = 0;

  // Main interactive menu loop - continues until user chooses to exit
  // This loop provides the primary user interface, allowing multiple workflow
  // iterations and graceful error recovery
  while (true) {
    try {
      // Display main menu and await user selection
      // showMainMenu() handles all menu rendering and input validation
      const choice = await showMainMenu();

      // Exit condition - user selected exit or cancelled menu
      if (!choice || choice === "exit") {
        console.log("\nExiting orchestrator. Goodbye!");
        break;
      }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

      // Reset automatic restart counter on successful action
      automaticRestartCount = 0;

      // Route user selection to appropriate workflow action
      // Each case represents one phase of the development workflow
      switch (choice) {
        case "create_prd":
          // Phase 1: Generate Product Requirements Document
          // Interactive clarification process to create detailed PRDs
          await actionCreatePRD(mcpConfigForAgent);
          break;

        case "create_tasks":
          // Phase 2: Break down PRD into structured development tasks
          // Convert requirements into actionable, prioritized tasks
          await actionCreateTasks(mcpConfigForAgent);
          break;

        case "create_tasks_quick":
          // Phase 2: Quick task generation from bugs/changes description
          // Generate tasks without requiring a full PRD document
          await actionCreateTasksFromDescription(mcpConfigForAgent);
          break;

        case "run_dev":
          // Phase 3: Execute development tasks using AI agents
          // Run the development workflow with progress tracking
          await actionRunDev(projectPath, mcpConfigForAgent);
          break;

        case "dev":
          // Streamlined Dev: Auto-load tasks.json and start/resume development
          // No user prompting - assumes tasks.json exists and starts from first incomplete task
          await actionDev(projectPath, mcpConfigForAgent);
          break;

        case "restart_dev":
          // Restart Dev: Resume development after interruption with recovery logic
          // Enhanced recovery features and detailed status reporting
          await actionRestartDev(projectPath, mcpConfigForAgent);
          break;

        case "reset_tasks":
          // Reset Tasks: Clear completion status from tasks.json
          // Allows users to restart development on completed tasks
          await actionResetTasks();
          break;

        case "learn_skills":
          // Learn Skills: Extract learnings from progress.txt and create/update skills
          // Converts project learnings into reusable Agent Skills
          const learnResult = await actionLearnSkills();
          if (learnResult.success) {
            console.log(`\n✓ ${learnResult.message}`);

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
            if (learnResult.stats) {
              console.log(`  Created: ${learnResult.stats.created}, Updated: ${learnResult.stats.updated}`);

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
            }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          } else {

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
            console.log(`\n✗ ${learnResult.message}`);

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          break;

        case "analyze_logs":
          // Analyze Logs: Analyze task execution logs for issues, insights, and feedback
          // Provides comprehensive analysis of development workflow execution
          await analyzeLogs();
          break;

        case "create_recommendations":
          // Create Recommendations Report: Generate combined recommendations from log-analysis files
          // Analyzes all log-analysis markdown files and creates a comprehensive recommendations report
          await actionCreateRecommendationsReport(mcpConfigForAgent);
          break;

        default:
          // Handle unexpected menu choices (shouldn't happen with proper validation)
          console.log("Unknown option. Returning to menu.");
      }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

      // Brief pause for visual separation before showing menu again
      // This provides better UX by preventing menu spam after actions complete
      console.log("\n");

    } catch (error) {

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
      // Comprehensive error handling for the menu loop
      // The orchestrator is designed to be resilient - errors shouldn't crash the system

      if (error.message === "User cancelled the prompt") {
        // Expected cancellation (user pressed Ctrl+C or chose to cancel)
        // This is normal user behavior, not an error condition
        console.log("\nOperation cancelled. Returning to menu.");

      } else if (error instanceof ResourceExhaustionError || error.message.startsWith("RESOURCE_EXHAUSTION_RESTART:")) {

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
        // Automatic restart triggered by resource exhaustion
        // Check if we've exceeded maximum restart attempts
        if (automaticRestartCount >= MAX_AUTOMATIC_RESTARTS) {
          console.log(`\n❌ Maximum automatic restart attempts (${MAX_AUTOMATIC_RESTARTS}) exceeded.`);

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          console.log("This usually indicates persistent context accumulation issues.");
          console.log("Consider breaking large tasks into smaller ones or checking your model limits.");
          console.log("Returning to menu.\n");
          automaticRestartCount = 0; // Reset counter
          continue;
        }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

        // Extract error details for better messaging
        let errorMessage = error.message;
        let contextInfo = "";
        if (error instanceof ResourceExhaustionError) {
          errorMessage = error.message;
          contextInfo = `\n💥 Resource exhaustion details:`;
          if (error.contextSizeBytes) {
            contextInfo += `\n  Context size: ${Math.round(error.contextSizeBytes/1024)}KB (limit: ${Math.round(MAX_CONTEXT_SIZE_BYTES/1024)}KB)`;

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          if (error.iteration) {
            contextInfo += `\n  Failed at iteration: ${error.iteration}`;

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          if (error.runtimeMs) {
            contextInfo += `\n  Task runtime: ${Math.round(error.runtimeMs/1000)}s`;

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          contextInfo += `\n  Cause: Conversation context exceeded AI model limits`;
        } else {

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          errorMessage = error.message.replace("RESOURCE_EXHAUSTION_RESTART:", "");
        }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

        automaticRestartCount++;
        console.log(`${contextInfo}`);

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
        console.log(`\n🔄 Resource exhaustion detected: ${errorMessage}`);

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
        console.log(`🔄 Recovery strategy: Starting fresh conversation session`);
        console.log(`🔄 This prevents context accumulation across iterations`);
        console.log(`🔄 Automatically restarting development workflow (attempt ${automaticRestartCount}/${MAX_AUTOMATIC_RESTARTS})...\n`);

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

        // Add a brief delay before restart to allow system recovery
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Automatically trigger restart_dev action
        try {
          await actionRestartDev(projectPath, mcpConfigForAgent);
          // If restart succeeds, reset the counter
          automaticRestartCount = 0;
        } catch (restartError) {

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
          console.error("\nError during automatic restart:", restartError.message);
          console.log("Returning to menu.\n");
        }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

      } else {

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
        // Unexpected error occurred during workflow execution
        // Log the error for debugging but continue running the orchestrator
        // Users can retry operations or exit gracefully
        console.error("\nError:", error.message);
        console.log("Returning to menu.\n");
      }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
    }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
  }

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Ralph - Development Orchestrator

USAGE:
  ralph [command] [options]

COMMANDS:
  dev, resume              Start/resume development on tasks.json (non-interactive)
  run-dev, rundev          Select a tasks.json file and start development
  restart-dev, restartdev  Resume development after interruption
  create-prd, prd          Generate a new PRD
  create-tasks, tasks      Select a PRD and generate tasks.json
  create-tasks-quick, quick Generate tasks from bugs/changes description
  reset-tasks, reset       Clear completion status from tasks.json
  learn-skills, learn      Extract learnings and create/update skills
  analyze-logs, analyze    Analyze logs for issues and insights
  create-recommendations   Generate recommendations report

INTERACTIVE MODE:
  ralph                    Start interactive menu (default when no arguments)

EXAMPLES:
  ralph dev                # Auto-resume tasks.json development
  ralph create-prd         # Interactive PRD creation
  ralph create-tasks       # Select PRD and generate tasks
  ralph run-dev            # Select tasks file and run development
  ralph restart-dev        # Resume after interruption
  ralph reset-tasks        # Reset task completion status
  ralph learn-skills       # Extract skills from progress.txt

For interactive mode with all options, run without arguments.
`);
}

main().catch(console.error);