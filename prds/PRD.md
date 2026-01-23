# PixelMaze — Product Requirements Document

## 1) Summary

PixelMaze is a single-player, top-down 2D maze game for web desktop where players navigate procedurally generated mazes, collect coins for score, and reach the exit before a timer expires. Target users are casual players who want quick, replayable puzzle-navigation gameplay. Core value: deliver a deterministic, playable v1 with procedural maze generation, smooth movement, timer-based challenge, and coin collection scoring.

Assumption: Target runtime is modern desktop browsers (Chromium-based and Firefox); mobile web support deferred to future versions.
Assumption: Single-player only; no networked multiplayer or leaderboards in V1.
Assumption: Art assets (sprites for player, walls, coins, exit) will be created using PixelLab MCP; v1 uses 16x16 pixel tiles with a limited color palette.
Assumption: Controls limited to keyboard (WASD and arrow keys); gamepad support deferred.
Assumption: Movement uses smooth pixel-based physics with collision detection against wall tiles; no tile-grid snapping.
Assumption: Procedural maze generation uses a guaranteed-solvable algorithm (e.g., recursive backtracking or Prim's algorithm) on a 21x21 grid.
Assumption: Timer countdown starts at level start; game ends when timer reaches 0 (lose) or player reaches exit tile (win).
Assumption: Coins are placed randomly after maze generation with a minimum count (e.g., 5-10 coins per maze); collection is optional for scoring only.
Assumption: Camera shows entire maze on screen for MVP; future versions will support larger mazes with camera following player.
Assumption: No enemies, traps, or locked doors in V1; pure navigation gameplay.
Assumption: Save/load state not required for MVP; each play session is independent.
Assumption: Audio uses simple SFX (coin collect, win, lose) and optional background music; volume controls in settings.

## 2) Tech Stack

**Core Dependencies:**
- Framework: phaser@3.80.1 - Game engine and rendering
- Styling: None (Phaser handles rendering; minimal HTML/CSS for menu overlay)
- Storage: localStorage API (native) - High score persistence
- Other: None required for MVP

**Development Dependencies:**
- Build: vite@5.0.0 - Development server and build tool
- TypeScript: typescript@5.3.0 - Type safety (optional but recommended)

**Deployment:** Vercel or Netlify (static hosting)

**Runtime Environment:** Modern browsers with ES6+ support (Chrome 90+, Firefox 88+, Safari 14+)

## 3) User Roles

- **Player**: Full gameplay access, can start new game, view high scores, adjust settings (volume, controls). No authentication required.

Permissions:
- Player: Start game, play levels, view high scores stored in localStorage, adjust settings, restart level.

## 4) Data Model

Entity: GameState (in-memory only; not persisted)

- current_level: integer default 1
- score: integer default 0 (coins collected)
- time_remaining: float (seconds, default based on level)
- player_position: { x: float, y: float } (pixel coordinates)
- coins_collected: array of string (coin IDs collected this level)
- maze_seed: integer (for procedural generation reproducibility)

Entity: HighScore (stored in localStorage)

- score: integer (total coins collected)
- timestamp: string (ISO 8601)
- level: integer default 1

Entity: Settings (stored in localStorage)

- music_volume: float (0.0 to 1.0) default 0.7
- sfx_volume: float (0.0 to 1.0) default 0.8
- control_scheme: enum { "wasd", "arrows" } default "wasd"

Entity: MazeData (generated at runtime)

- grid: 2D array of integers (0 = floor, 1 = wall)
- width: integer default 21
- height: integer default 21
- coin_positions: array of { x: integer, y: integer, id: string }
- exit_position: { x: integer, y: integer }
- start_position: { x: integer, y: integer }

Notes:
- No database required; all data is either in-memory (GameState, MazeData) or localStorage (HighScore, Settings).
- Maze generation is deterministic if seed is provided; otherwise uses random seed.
- Coins are identified by unique string IDs (e.g., "coin_0", "coin_1") to track collection.

## 5) Core Features

Feature: Main Menu

- User Flow:
  1. On app load, Main Menu screen displays with title "PixelMaze", buttons "Start Game", "High Scores", "Settings", and "Quit".
  2. User clicks "Start Game" → initializes new GameState, generates maze with random seed, sets timer (e.g., 60 seconds), and transitions to Game Scene.
  3. User clicks "High Scores" → displays modal with top 10 scores from localStorage, sorted by score descending, with "Back" button.
  4. User clicks "Settings" → displays modal with music volume slider (0-100%), SFX volume slider (0-100%), control scheme toggle ("WASD" / "Arrow Keys"), and "Back" button.
- UI Copy & Colors:
  - Title text: "PixelMaze" (#E6EEF6)
  - Buttons: "Start Game" (#0EA5A4), "High Scores" (#64748B), "Settings" (#64748B), "Quit" (#EF4444)
  - Modal titles: "High Scores" (#E6EEF6), "Settings" (#E6EEF6)
  - Settings labels: "Music Volume", "SFX Volume", "Controls"
  - Back button: "Back" (#94A3B8)
- Error & Empty States:
  - If localStorage is unavailable: show console warning "localStorage not available; high scores will not persist." (developer visible only).
  - Empty high scores: show message "No scores yet. Play a game to set your first high score!" with text color #64748B.
- Acceptance Checks:
  - ✓ Clicking "Start Game" initializes GameState and transitions to Game Scene.
  - ✓ High Scores modal displays scores from localStorage sorted by score descending.
  - ✓ Settings changes persist to localStorage and apply immediately (volume sliders update audio, control scheme changes input handling).

Feature: Procedural Maze Generation

- User Flow:
  1. On "Start Game", system generates a 21x21 maze using recursive backtracking algorithm (or Prim's algorithm) ensuring a solvable path from start to exit.
  2. Algorithm places start position at top-left area (e.g., [1,1]), exit at bottom-right area (e.g., [19,19]).
  3. After maze walls are generated, system randomly places 5-10 coins on floor tiles (excluding start and exit positions).
  4. Maze data is stored in MazeData entity and rendered in Game Scene.
- UI Copy & Colors:
  - No visible UI text for generation; process is instant.
- Error & Empty States:
  - If generation fails to create solvable maze: regenerate with new seed and log console warning "Maze generation retry with new seed." (developer visible).
  - If coin placement fails (all floor tiles occupied): place minimum 5 coins on available floors and log console info "Coin placement limited by available tiles." (developer visible).
- Acceptance Checks:
  - ✓ Generated maze is 21x21 grid with valid walls and floors.
  - ✓ Start and exit positions are on floor tiles and have a valid path between them (validated by pathfinding check).
  - ✓ Coins are placed only on floor tiles, not on walls, start, or exit (5-10 coins per maze).

Feature: Player Movement

- User Flow:
  1. Player uses WASD keys (or arrow keys if control scheme set to "arrows") to move character.
  2. Holding a key applies continuous movement in that direction at speed = 100 px/s.
  3. Movement is smooth (not tile-snapped); player sprite moves pixel-by-pixel.
  4. Collision detection checks player bounds against wall tiles; if collision detected, movement is blocked in that direction.
  5. Player sprite faces the direction of movement (up/down/left/right).
- UI Copy & Colors:
  - No visible text for movement; HUD shows timer and coin counter (see HUD feature).
- Error & Empty States:
  - If input is not recognized: ignore input and log console warning "Unknown input key: {key}" (developer visible).
- Acceptance Checks:
  - ✓ WASD and arrow keys move player smoothly at 100 px/s.
  - ✓ Player cannot move through walls (collision detection blocks movement).
  - ✓ Player sprite faces correct direction based on movement input.

Feature: Coin Collection

- User Flow:
  1. Player moves over a coin tile → coin is collected automatically (no button press required).
  2. Coin disappears from map, score increments by 1, and coin ID is added to GameState.coins_collected.
  3. SFX plays coin collect sound (if SFX volume > 0).
  4. Coin counter in HUD updates immediately.
- UI Copy & Colors:
  - Coin counter label: "Coins: {count}" with text color #FBBF24 (gold).
  - No visible button required; collection is automatic on overlap.
- Error & Empty States:
  - If coin is already collected (duplicate collection attempt): ignore and log console warning "Coin {id} already collected." (developer visible).
- Acceptance Checks:
  - ✓ Moving over a coin removes it from map and increments score.
  - ✓ Coin counter in HUD updates immediately after collection.
  - ✓ Collected coins do not reappear if player revisits the same tile.

Feature: Timer & Exit

- User Flow:
  1. Timer starts at level start (e.g., 60 seconds) and counts down continuously.
  2. Timer displays in HUD as "Time: {MM:SS}" format.
  3. When timer reaches 0:00, game ends → "Game Over" screen appears with message "Time's up!" and buttons "Restart" and "Main Menu".
  4. When player moves over exit tile: game ends → "Level Complete" screen appears with message "You escaped!" showing final score and buttons "Play Again" and "Main Menu".
  5. If score is a new high score, message includes "New High Score!" text.
- UI Copy & Colors:
  - Timer label: "Time: {MM:SS}" with text color #E6EEF6 (white).
  - Timer warning (when < 10 seconds): text color changes to #EF4444 (red).
  - Game Over screen title: "Game Over" (#EF4444)
  - Game Over message: "Time's up!" (#E6EEF6)
  - Level Complete screen title: "Level Complete" (#16A34A)
  - Level Complete message: "You escaped!" (#E6EEF6)
  - New High Score text: "New High Score!" (#FBBF24)
  - Final score display: "Score: {count}" (#E6EEF6)
  - Buttons: "Restart" (#0EA5A4), "Play Again" (#0EA5A4), "Main Menu" (#64748B)
- Error & Empty States:
  - If timer calculation error: default to 60 seconds and log console error "Timer initialization failed; using default 60s." (developer visible).
- Acceptance Checks:
  - ✓ Timer counts down from start value and displays in MM:SS format.
  - ✓ Timer text turns red when < 10 seconds remaining.
  - ✓ Reaching exit before timer hits 0 shows "Level Complete" screen with score.
  - ✓ Timer hitting 0 shows "Game Over" screen.
  - ✓ New high score is saved to localStorage and displays "New High Score!" message.

Feature: HUD (Heads-Up Display)

- User Flow:
  1. During gameplay, HUD displays at top of screen: timer on left, coin counter on right.
  2. HUD is always visible and updates in real-time.
  3. HUD overlays game scene but does not obstruct critical gameplay areas (positioned at top edge).
- UI Copy & Colors:
  - Timer: "Time: {MM:SS}" text color #E6EEF6, background semi-transparent #1E293B (80% opacity).
  - Coin counter: "Coins: {count}" text color #FBBF24, background semi-transparent #1E293B (80% opacity).
  - HUD background: #1E293B with 80% opacity, padding 8px, rounded corners 4px.
- Error & Empty States:
  - If HUD fails to render: game continues but log console error "HUD rendering failed." (developer visible).
- Acceptance Checks:
  - ✓ Timer and coin counter display correctly in HUD and update in real-time.
  - ✓ HUD does not obstruct player view of maze (positioned at top, small footprint).

Feature: Camera & Viewport

- User Flow:
  1. For MVP, entire 21x21 maze (336x336 pixels at 16x16 tiles) fits on screen.
  2. Camera is fixed to show full maze; no camera movement or following required.
  3. Game scene renders maze, player, coins, and exit within viewport.
- UI Copy & Colors:
  - No visible UI text for camera; viewport is static.
- Error & Empty States:
  - If viewport is too small to display full maze: scale down maze rendering to fit (maintain aspect ratio) and log console warning "Viewport too small; scaling maze to fit." (developer visible).
- Acceptance Checks:
  - ✓ Entire maze is visible on screen without scrolling or camera movement.
  - ✓ Player, coins, exit, and walls render correctly within viewport.

## 6) UI/UX

**Color palette (minimum 5 hex codes):**
- Primary action: #0EA5A4 — primary buttons (Start Game, Restart, Play Again)
- Background dark: #0F172A — main game background, menu background
- UI shell: #1E293B — HUD background, modal backgrounds
- Success: #16A34A — Level Complete screen title, success states
- Danger: #EF4444 — Game Over screen title, timer warning (< 10s), Quit button
- Text primary: #E6EEF6 — main text, timer display, menu text
- Muted text: #64748B — secondary buttons, labels
- Gold accent: #FBBF24 — coin counter text, New High Score text
- Button cancel: #94A3B8 — Back button, secondary actions

**Typography:**
- Font family: "Press Start 2P" (pixel font) or "Courier New" (fallback)
- Base: 16px (line-height 20px)
- Title: 32px bold (main menu title)
- HUD labels: 14px bold (timer, coin counter)
- Button text: 16px medium
- Modal titles: 24px bold

**Layout notes:**
- Desktop-first fixed viewport: minimum 800x600px, optimal 1024x768px.
- Main menu: centered vertically and horizontally, title at top, buttons stacked vertically with 16px spacing.
- Game scene: full viewport, HUD at top (left: timer, right: coin counter), maze centered.
- Modals: centered overlay with semi-transparent background (#1E293B at 90% opacity), max-width 400px, rounded corners 8px.
- End screens (Game Over / Level Complete): full-screen overlay, centered content, buttons at bottom.

## 7) Out of Scope (V1)

1. Mobile web support (touch controls, responsive layout).
2. Multiple levels or level progression system.
3. Enemies, traps, locked doors, or keys (pure navigation only).
4. Fog of war or camera following player (full maze always visible).
5. Save/load game state (each session is independent).
6. Online leaderboards or multiplayer.
7. Gamepad/controller support (keyboard only).
8. Advanced procedural generation (larger mazes, different algorithms, difficulty scaling).
9. Particle effects or advanced animations (basic sprite animation only).
10. Soundtrack or extensive audio (minimal SFX only).
11. Tutorial or onboarding flow (players learn by playing).
12. Pause menu (game runs continuously until win/lose).

## 8) Success Criteria (Testable Checklist)

- ✓ User can click "Start Game" from main menu and game scene loads with procedurally generated 21x21 maze.
- ✓ Maze generation produces a solvable path from start to exit (validated by pathfinding check).
- ✓ Player moves smoothly with WASD/arrow keys at 100 px/s and cannot pass through walls (collision detection works).
- ✓ Moving over a coin removes it from map, increments score, updates coin counter in HUD, and plays SFX (if enabled).
- ✓ Timer counts down from start value (e.g., 60s) and displays in MM:SS format in HUD; text turns red when < 10 seconds.
- ✓ Reaching exit before timer hits 0 shows "Level Complete" screen with message "You escaped!" and final score; new high score saves to localStorage and displays "New High Score!".
- ✓ Timer hitting 0 shows "Game Over" screen with message "Time's up!" and buttons "Restart" and "Main Menu".
- ✓ High Scores modal displays top 10 scores from localStorage sorted by score descending; empty state shows "No scores yet. Play a game to set your first high score!".
- ✓ Settings modal allows adjusting music/SFX volume (0-100%) and control scheme (WASD/Arrow Keys); changes persist to localStorage and apply immediately.
- ✓ Entire maze is visible on screen without scrolling; player, coins, exit, and walls render correctly.
- ✓ All UI copy matches exact strings specified (e.g., "Time's up!", "You escaped!", "New High Score!") and colors render with hex codes given (e.g., timer red #EF4444 when < 10s, coin counter gold #FBBF24).
- ✓ No console errors during core flows (main menu navigation, game start, movement, coin collection, exit reach, timer expiration, high score save).
