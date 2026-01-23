Secret of Mana — Product Requirements Document

## 1) Summary

A single-player, top-down action-RPG inspired by Secret of Mana for web and desktop (browser + packaged PWA). Target users: players who want real-time combat, party member AI, equipment progression, and a small overworld with 3-5 unique dungeons. Core value: deliver a deterministic, playable v1 that includes movement, combat, item/equipment, spell system, save/load, and a basic enemy/NPC ecosystem.

Assumption: Target runtime is modern browsers (Chromium-based and Firefox) and wrapped as a PWA; no console ports.
Assumption: Single-player only; no networked multiplayer.
Assumption: Art will be simple 2D sprite tiles provided as PNG/atlas by the design team; v1 uses placeholder sprites if none provided.
Assumption: Controller support limited to keyboard and gamepad (standard XInput mapping).
Assumption: Physics limited to gridless 2D movement with axis-aligned collision boxes; no complex physics simulation.
Assumption: Audio uses Ogg/MP3 assets; v1 supports background music and SFX with volume controls.

## 2) Tech Stack

- Framework: Next.js 16 App Router with Turbopack
- Database: Supabase PostgreSQL (for persistent save slots)
- Auth: No auth (anonymous players; saves identified by device cookie + optional passphrase)
- Styling: Tailwind CSS + shadcn/ui
- Key libs: Zod (validation), React Hook Form (settings UI), Howler.js (audio), matter-js (basic collision detection), Konva or HTML5 Canvas API for rendering
- Deployment: Vercel

## 3) User Roles

- Anonymous Player: full play access, can create up to 3 persistent save slots, manage settings, export/import save JSON.
  (No admin, no multiplayer.)

Permissions:

- Anonymous Player: create/read/update/delete their own save slots (stored in DB tied to cookie), control settings, play game.
- System: scheduled cleanup of orphaned saves older than 180 days (implementation out of scope).

## 4) Data Model

Entity: SaveSlot

- id: UUID (primary)
- name: string (max 32) default "Save 1"
- created_at: timestamp
- updated_at: timestamp
- passphrase_hash: string | null (optional user set passphrase hashed with bcrypt)
- data: JSON (see GameState schema)
- device_cookie_id: string (references anonymized cookie id)
  Relationship: SaveSlot belongs to device cookie id (one-to-many)

Entity: GameState (embedded JSON in SaveSlot.data)

- player: object
  - id: UUID
  - name: string
  - level: int default 1
  - exp: int default 0
  - max_hp: int default 30
  - hp: int
  - attack: int
  - defense: int
  - magic: int
  - position: { x: float, y: float, map_id: string }
  - facing: enum { "up", "down", "left", "right" }
  - equipped: { weapon_id: string | null, armor_id: string | null, accessory_id: string | null }
  - inventory: array of InventoryItem
- party: array of PartyMember
  - PartyMember: { id: UUID, npc_id: string, level: int, hp: int, ai_mode: enum { "aggressive","defensive","stay" } }
- maps: array of MapState
  - MapState: { map_id: string, visited: boolean, chests_opened: string[] (chest ids), enemies_defeated: string[] }
- active_quests: array of QuestProgress
  - QuestProgress: { quest_id: string, stage: int, completed: boolean }
- time_played_seconds: int
- seed: int (for deterministic random)

Entity: ItemTemplate (server-side reference data; not editable by client)

- id: string (e.g., "sword_1")
- type: enum { "weapon","armor","consumable","accessory","key" }
- name: string
- description: string
- stats: object (attack:int, defense:int, magic:int, heal:int as applicable)
- stackable: boolean
- max_stack: int default 1

Entity: EnemyTemplate (server-side)

- id: string
- name: string
- hp: int
- attack: int
- defense: int
- behavior: enum { "patrol","stationary","aggressive" }

InventoryItem (in GameState.player.inventory)

- template_id: string (FK to ItemTemplate.id)
- quantity: int default 1
- id: UUID (unique per stack)
- durability: int | null

Notes:

- Relationships: One SaveSlot contains one GameState blob. ItemTemplate and EnemyTemplate are read-only reference tables used by client logic to instantiate in-memory entities.
- No many-to-many relationships required beyond JSON arrays.

## 5) Core Features

Feature: New Game / Load Game / Save Game

- User Flow:
  1. On app load, Landing screen shows three save slot cards.
  2. User clicks "New Game" on empty slot → "Create Character" modal appears.
  3. User enters "Player Name" input and clicks button "Start Adventure".
  4. System initializes GameState with seed = crypto.getRandomValues, starting stats, starting map "village_1", and redirects to Game Scene.
  5. Save occurs automatically on map transition and when user clicks "Save" in pause menu.
  6. User can click existing save slot card to continue; if passphrase set, prompt "Enter Save Passphrase" with buttons "Unlock" and "Cancel".
- UI Copy & Colors:
  - Save slot empty card label: "Empty Slot"
  - Buttons: "New Game" (#1E293B), "Start Adventure" (#0EA5A4), "Load" (#0EA5A4), "Save" (#0EA5A4), "Cancel" (#94A3B8)
  - Modal title: "Create Character"
  - Input placeholder: "Enter player name (max 16)"
- Error & Empty States:
  - If name >16 chars: show inline message "Name must be 16 characters or fewer." in color #EF4444.
  - If save fails: show toast "Save failed. Please try again." with background #FEF2F2 and text #991B1B.
- Acceptance Checks:
  - ✓ New game creates a SaveSlot row in DB with GameState.player.name matching input.
  - ✓ Loading a slot restores GameState and places player at saved position.
  - ✓ Save failure displays the exact toast message.

Feature: Movement & Camera

- User Flow:
  1. Player uses arrow keys / WASD / left analog stick to move character; holding input moves continuously at speed = 80 px/s.
  2. Facing updated to last cardinal direction moved.
  3. Camera centers on player with 64 px deadzone; map boundaries clamp camera.
- UI Copy & Colors:
  - No visible text required; HUD shows mini health bar with colors below.
- Error & Empty States:
  - If tile collision miscomputed, show console error "Collision mismatch at map {map_id}" (developer visible).
- Acceptance Checks:
  - ✓ Movement responds to keyboard and gamepad inputs.
  - ✓ Camera centers within deadzone and clamps at map edges.

Feature: Combat (real-time)

- User Flow:
  1. Player presses "Attack" (keyboard "J", gamepad A) → character performs attack animation, collision check for enemies within attack range (30 px).
  2. Damage = max(1, player.attack - enemy.defense). Enemy hp reduced; if <=0 trigger enemy death.
  3. Player presses "Skill" (keyboard "K", gamepad B) to cast equipped spell if enough MP; mana cost deducted.
  4. Enemy AI reacts per behavior: "aggressive" moves toward player and attacks when within 40 px; "patrol" follows path.
  5. Party members: simple AI attacks nearest enemy if within 120 px; obey ai_mode settings.
- UI Copy & Colors:
  - HUD Attack button label: "ATTACK" (for touch) with background #1E293B, text #FFFFFF.
  - Damage popup color: player damage text #EF4444, healing text #16A34A.
- Error & Empty States:
  - If player tries to cast without MP: show floating text "Not enough MP" in color #B91C1C above player for 1.2s.
- Acceptance Checks:
  - ✓ Attack input reduces enemy HP correctly per formula.
  - ✓ Enemies die and drop loot as defined in templates.
  - ✓ "Not enough MP" appears when trying to cast with insufficient MP.

Feature: Inventory & Equipment

- User Flow:
  1. User presses "I" or opens pause menu and selects "Inventory".
  2. Inventory modal lists items with quantity, name, and equip/use buttons for each stackable/non-stackable item.
  3. For weapons/armor, "Equip" sets player.equipped.weapon_id etc., immediately updating attack/defense stats.
  4. For consumable, "Use" applies effect (e.g., heal 20 HP), reduces quantity, removes item if quantity reaches 0.
- UI Copy & Colors:
  - Inventory modal title: "Inventory"
  - Buttons: "Equip" (#0EA5A4), "Use" (#0EA5A4), "Drop" (#EF4444)
  - Empty inventory message: "You are carrying nothing." with text color #64748B
- Error & Empty States:
  - If trying to equip an incompatible item: show inline message "Cannot equip this item." color #EF4444.
- Acceptance Checks:
  - ✓ Equipping updates player attack/defense stat values and reflects in combat damage.
  - ✓ Using a consumable reduces quantity and applies effect.

Feature: Spells & Magic Ring (Mana system)

- User Flow:
  1. Player opens magic menu via "M" or pause menu -> selects known spell from list; selects "Cast" to bind to quick-slot (1-4).
  2. In gameplay, pressing number key 1-4 casts bound spell if MP sufficient.
  3. Spell effects are templates (damage, heal, buff) and use player's magic stat in damage formula: damage = base + floor(magic \* 0.5).
- UI Copy & Colors:
  - Spell menu title: "Spells"
  - Bind button: "Bind to Slot" (#0EA5A4)
  - MP depleted toast: exact text "Not enough MP" color #B91C1C
- Error & Empty States:
  - If no spells learned: show "No spells learned. Visit a Mana Stone to learn spells." text #64748B.
- Acceptance Checks:
  - ✓ Binding a spell to slot triggers cast with correct MP deduction.
  - ✓ Spell damage follows formula and affects enemy HP.

Feature: Dungeons, Chests, and Keys

- User Flow:
  1. Player enters dungeon door tile → triggers map transition confirm modal "Enter Dungeon: [Dungeon Name]" with buttons "Enter" (#0EA5A4) and "Cancel" (#94A3B8).
  2. Chests on maps have unique ids. Player near chest and presses "Interact" (K or gamepad X) → chest opens; if item present it is added to inventory and chest id appended to map.chests_opened.
  3. Keys are items of type "key" and are consumed on use when opening a locked door.
- UI Copy & Colors:
  - Chest open message: "Found: {Item Name} x{qty}" toast background #FEF9C3 text #92400E.
- Error & Empty States:
  - If inventory full (100 item slots): show modal "Inventory full. Drop items to pick up new ones." with button "OK" (#0EA5A4).
- Acceptance Checks:
  - ✓ Chest open toggles its opened state and persists across loads.
  - ✓ Keys consumed on locked door interaction.

Feature: Pause Menu & Settings

- User Flow:
  1. Player presses Esc / Start → Pause overlay appears with buttons: "Resume", "Save", "Inventory", "Settings", "Quit to Title".
  2. Settings allow toggling music and SFX volume sliders and control scheme selection (Keyboard/Gamepad).
- UI Copy & Colors:
  - Pause title: "Paused"
  - Buttons: "Resume" (#0EA5A4), "Save" (#0EA5A4), "Quit to Title" (#EF4444)
- Error & Empty States:
  - If save fails in pause menu, show modal "Save failed. Please try again." with "OK" (#0EA5A4).
- Acceptance Checks:
  - ✓ Pause menu opens and options function; settings persist per device in localStorage.

## 6) UI/UX

Color palette (all hex codes with usage)

- Primary: #0EA5A4 — primary action buttons (Start, Confirm, Equip)
- Dark Primary / UI Shell: #1E293B — primary header, attack button background
- Success: #16A34A — HP heal animations and success badges
- Danger: #EF4444 — delete/drop/destructive actions, error text accent
- Background: #0F172A — main game UI chrome background
- Text primary: #E6EEF6 — primary text color
- Muted text: #64748B — secondary/disabled text
- Toast warning background: #FEF9C3 — chests/toasts
- Error background: #FEF2F2 — save error toasts
  (Uses 8 hex codes; at least 5 required)

Typography

- Font family: Inter
- Base: 16px (line-height 24px)
- H2: 24px bold
- UI labels: 14px medium
- HUD numbers: 12px bold

Layout notes

- Mobile-first single-column canvas. On desktop, game canvas centered with HUD bars at top-left (HP/MP) and bottom-right (quick slots). Pause menu centered modal with 560px width, rounded 8px.

## 7) Out of Scope (V1)

1. Online multiplayer or co-op.
2. Procedural world generation beyond deterministic seed for random events.
3. Advanced pathfinding (A\* for enemies); use simple steering within 1.0 movement.
4. Map editor or modding tools.
5. Microtransactions, in-app purchases, analytics tracking.
6. Save sync across devices/account (no auth).
7. Complex animation blending; use frame-based sprite animation only.

## 8) Success Criteria (Testable Checklist)

- ✓ User can create a New Game: save appears in one of three slots with provided player name.
- ✓ Player can move, face directions, and camera stays centered with deadzone and map clamp (validated by telemetry-free play in browser).
- ✓ Player can attack and reduce enemy HP; enemy dies when HP <= 0 and loot is added to inventory.
- ✓ Player can open inventory, equip weapon/armor, and the stats change reflect immediately in combat calculations.
- ✓ Player can cast a bound spell consuming MP and apply damage/heal effect according to formula; "Not enough MP" appears when insufficient.
- ✓ Chests record opened state; after reload, opened chests remain opened and not give duplicate loot.
- ✓ Pause menu works; Save from pause writes updated SaveSlot.data to DB and shows either success (no message) or exact modal "Save failed. Please try again." on failure.
- ✓ Empty inventory shows "You are carrying nothing." message; attempting to pick up when inventory full shows "Inventory full. Drop items to pick up new ones."
- ✓ All UI copy matches exact strings specified and colors render with the hex codes given.
- ✓ No console errors during core flows (new game, movement, combat, inventory open/use, save/load, pause).

End of PRD.
