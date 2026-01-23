# Ralph Orchestrator

A global CLI tool for project orchestration that can be run from any directory.

## Setup

1. **Add to your PATH** (add this to your `~/.zshrc`):
   ```bash
   export PATH="$HOME/dev/orchestrator:$PATH"
   ```

2. **Reload your shell**:
   ```bash
   source ~/.zshrc
   ```

3. **Test it**:
   ```bash
   ralph
   ```

## Usage

Run `ralph` from any project directory. The tool will:
- Load its assets (prompts, templates, SDK) from `~/dev/orchestrator/`
- Create project-specific files (tasks/, prds/, logs/) in the current working directory

## Development

To update the script:
1. Edit `~/dev/orchestrator/ralph.mjs`
2. Changes take effect immediately (no rebuild needed)

To update dependencies:
```bash
cd ~/dev/orchestrator
npm install
```

To rebuild the cursor-agent-sdk:
```bash
cd ~/dev/orchestrator/cursor-agent-sdk
npx tsc -p tsconfig.json
```
