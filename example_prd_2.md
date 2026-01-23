SimpleBoard - Product Requirements Document

## 1) Summary

SimpleBoard is a lightweight project management web app for small teams to run work using kanban boards and real-time collaboration. It provides teams, projects, kanban boards with columns and cards, card detail modals for comments/assignees/due dates, and basic activity history. Target users are teams of 2–50 who need a focused kanban workflow without extra complexity.

Assumption: All users are authenticated via Clerk.
Assumption: Realtime collaboration uses Supabase Realtime (Postgres replication).
Assumption: File attachments are stored in Supabase Storage with max 10 files per card, each ≤ 10MB.
Assumption: Timezones are UTC on the server; clients present local datetime formatted from UTC.
Assumption: Notifications are in-app only (no email or push in V1).
Assumption: Boards limited to 50 columns and 2,000 cards per board.

## 2) Tech Stack

- Framework: Next.js 16 App Router with Turbopack
- Database: Supabase PostgreSQL
- Auth: Clerk
- Styling: Tailwind CSS + shadcn/ui
- Key libs: Zod (validation), React Hook Form (forms), react-beautiful-dnd (drag & drop)
- Deployment: Vercel

## 3) User Roles

- Owner: Full permissions for the Team. Can invite/remove members, create/delete projects, change team settings. (1 per team optional)
- Member: Create/edit/delete projects, boards, columns, cards within the team. Can invite Guests.
- Guest: Read and comment on cards only; cannot create projects/boards/columns/cards.

Permissions matrix:

- Create Team: Owner only
- Invite Members/Guests: Owner, Member (Members can invite Guests only)
- Delete Team: Owner only
- Create Project/Board/Column/Card: Owner, Member
- Edit/Delete Project/Board/Column/Card: Owner, Member (Guests cannot)
- Comment on Card: Owner, Member, Guest
- Assign Card: Owner, Member

If a user is not authenticated, they see a login screen with the copy: "Sign in to continue" and buttons "Sign in with Email" and "Sign in with Google".

## 4) Data Model

Entity: user

- id: string (primary)
- email: string
- name: string
- avatar_url: string | null
- created_at: timestamp (default now)

Entity: team

- id: uuid (primary)
- name: string
- description: string | null
- created_by_user_id: string (foreign -> user.id)
- created_at: timestamp (default now)

Entity: team_membership

- id: uuid (primary)
- team_id: uuid (foreign -> team.id)
- user_id: string (foreign -> user.id)
- role: enum('owner','member','guest') default 'member'
- joined_at: timestamp (default now)

Entity: project

- id: uuid (primary)
- team_id: uuid (foreign -> team.id)
- name: string
- description: string | null
- created_by_user_id: string (foreign -> user.id)
- created_at: timestamp (default now)
- archived: boolean (default false)

Relationship: team 1 -> many projects

Entity: board

- id: uuid (primary)
- project_id: uuid (foreign -> project.id)
- name: string
- created_by_user_id: string (foreign -> user.id)
- created_at: timestamp (default now)
- is_template: boolean (default false)

Relationship: project 1 -> many boards

Entity: column

- id: uuid (primary)
- board_id: uuid (foreign -> board.id)
- title: string
- position: integer (0-based, default 0) -- used for ordering
- created_at: timestamp (default now)

Relationship: board 1 -> many columns (ordered by position)

Entity: card

- id: uuid (primary)
- column_id: uuid (foreign -> column.id)
- title: string
- description: string | null
- position: integer (0-based, default 0) -- used for ordering within column
- created_by_user_id: string (foreign -> user.id)
- created_at: timestamp (default now)
- due_date: timestamp | null
- archived: boolean (default false)

Relationship: column 1 -> many cards

Entity: card_assignee

- id: uuid (primary)
- card_id: uuid (foreign -> card.id)
- user_id: string (foreign -> user.id)
- assigned_at: timestamp (default now)

Relationship: card many -> many users via card_assignee

Entity: comment

- id: uuid (primary)
- card_id: uuid (foreign -> card.id)
- user_id: string (foreign -> user.id)
- body: string
- created_at: timestamp (default now)
- edited_at: timestamp | null

Relationship: card 1 -> many comments

Entity: attachment

- id: uuid (primary)
- card_id: uuid (foreign -> card.id)
- uploaded_by_user_id: string (foreign -> user.id)
- file_url: string
- file_name: string
- file_size: integer (bytes)
- created_at: timestamp (default now)

Relationship: card 1 -> many attachments

Entity: activity

- id: uuid (primary)
- team_id: uuid (foreign -> team.id)
- user_id: string (foreign -> user.id)
- type: enum('create_card','update_card','move_card','comment','assign','archive_card','create_column')
- payload: json (free-form details)
- created_at: timestamp (default now)

Indexes: board_id, column_id, card_id where appropriate for queries.

## 5) Core Features

Feature: Team & Project Management

- User Flow:
  1. User clicks "Create team" button on dashboard -> displays modal titled "Create team".
  2. User fills "Team name" and optional "Description" and clicks "Create team".
  3. On success user sees new team in left sidebar under "Teams".
  4. Within team user clicks "New project" -> fills "Project name" -> clicks "Create project".
- UI Copy & Colors:
  - Buttons: primary "Create team" / "Create project" (text: "Create team" / "Create project")
  - Modal title: "Create team" / "Create project"
  - Input labels: "Team name", "Description (optional)", "Project name"
  - Success toast: "Team created" (bg #16A34A)
- Error & Empty States:
  - Validation: If team name empty show inline error text "Team name is required" in color #DC2626.
  - Server error toast: "Unable to create team. Try again." (bg #B91C1C)
  - Empty teams sidebar: message "You are not part of any teams yet." with CTA button "Create team" (#0EA5E9)
- Acceptance Checks:
  - ✓ Creating a team with a valid name inserts team row and shows toast "Team created".
  - ✓ Submitting empty team name shows inline error "Team name is required".
  - ✓ Clicking "Create project" within a team creates a project tied to that team.

Feature: Kanban Board (columns + drag/drop)

- User Flow:
  1. User opens a project -> clicks a board in project to open board view.
  2. Board displays columns left-to-right ordered by column.position.
  3. User can click "+ Add column" at board right to open input inline labeled "Column title" and press Enter or click "Add column".
  4. User drags a card from one column to another; on drop, card.position and column_id update immediately and broadcast via realtime to team members.
  5. User can drag to reorder cards inside a column; positions update.
- UI Copy & Colors:
  - Board header: board.name and a button "Board actions" (three-dot icon) with menu items "Rename board", "Delete board", "Archive board".
  - Column header shows title and a menu button "Column actions" with "Rename column", "Delete column".
  - "+ Add column" button text: "+ Add column" background #F3F4F6, border #E5E7EB, text #111827.
  - Card background: #FFFFFF, border #E5E7EB.
  - Drag shadow color: rgba(59,130,246,0.12) (for visual feedback).
- Error & Empty States:
  - Empty board (no columns): center message "No columns yet. Click + Add column to begin." CTA button: "+ Add column" (#0EA5E9).
  - Empty column (no cards): shows "No cards" and a button "Add card" (#10B981).
  - Drag/drop failure toast: "Move failed. Refresh to sync." (bg #B91C1C).
- Acceptance Checks:
  - ✓ Adding a column creates column with correct position and shows in UI.
  - ✓ Dragging card to another column updates card.column_id and position and other users see change within 3s via realtime.
  - ✓ Empty board shows "No columns yet. Click + Add column to begin."

Feature: Card creation and detail modal

- User Flow:
  1. User clicks "Add card" inside a column -> inline input appears with placeholder "Card title" and buttons "Add card" and "Cancel".
  2. On "Add card", card appears at bottom of column and opens card detail modal automatically.
  3. In modal, user can edit Title, Description, set Due date (date + time picker), assign team members (multi-select), add attachments, and add comments.
  4. User clicks "Save" to persist edits or "Close" to exit modal (changes auto-save on field blur).
- UI Copy & Colors:
  - Card inline: placeholder text "Card title".
  - Modal title: card.title or "Untitled card".
  - Modal buttons: primary "Save" (bg #0369A1, text #FFFFFF), secondary "Close" (bg transparent, border #E5E7EB, text #111827).
  - Assign button: "Assign" (bg #7C3AED, text #FFFFFF).
  - Add comment button: "Comment" (bg #059669, text #FFFFFF).
  - Attachment upload button: "Attach file" (bg #111827, text #FFFFFF).
- Error & Empty States:
  - Creating card with empty title shows inline error "Card title cannot be empty" in #DC2626.
  - Attachment upload error: "Upload failed. File too large or invalid type." (#B91C1C).
  - No assignees display: "No assignees" grey text #6B7280.
- Acceptance Checks:
  - ✓ Adding a card with a non-empty title creates card and opens detail modal with correct fields.
  - ✓ Assigning a user adds card_assignee records and shows avatar in card header.
  - ✓ Adding a comment appends comment with current user and timestamp visible.

Feature: Comments & Activity

- User Flow:
  1. In card modal user types in comment box labeled "Write a comment…" and clicks "Comment".
  2. Comment appears appended with user avatar, name, and "just now" time, and activity record is created.
  3. Activity stream for project/team shows actions ordered newest-first.
- UI Copy & Colors:
  - Comment button: "Comment" (bg #059669, text #FFFFFF).
  - Activity header: "Activity" with list entries like "Maria added a comment to Card Title".
  - Timestamps use relative format: "just now", "5m", "2h", "3d".
- Error & Empty States:
  - Empty comments: shows "No comments yet. Be the first to comment." with CTA "Comment" (#059669).
  - Comment submit failure: "Unable to post comment. Try again." (#B91C1C).
- Acceptance Checks:
  - ✓ Posting a comment adds comment row and corresponding activity entry.
  - ✓ Empty comment input prevents submission and shows inline "Comment cannot be empty" in #DC2626.

Feature: Search & Filters (board-level)

- User Flow:
  1. User clicks search input in board header placeholder "Search cards by title or assignee" and types text.
  2. Results filter visible cards in all columns in real-time; matches highlight text in card title.
  3. User may apply filter dropdown: "Show: All / Assigned to me / Due this week" and can clear filter via "Clear filters".
- UI Copy & Colors:
  - Search placeholder: "Search cards by title or assignee".
  - Filter labels: "Show", options "All", "Assigned to me", "Due this week".
  - Clear filters button: "Clear filters" (text #6B7280).
- Error & Empty States:
  - No results: "No cards match your search." with CTA "Clear filters" (#0EA5E9).
- Acceptance Checks:
  - ✓ Typing search filters cards client-side by title and assignee.
  - ✓ Selecting "Assigned to me" only shows cards where current user is in card_assignee.

Feature: Basic Team Collaboration (Realtime presence)

- User Flow:
  1. When a team member opens a board, their avatar shows in board header under "Active" area.
  2. When another member edits a card, a small "editing" indicator with their avatar appears on that card detail modal.
- UI Copy & Colors:
  - Presence text: "Active" followed by avatars; tooltip on avatar shows full name and email.
  - Editing indicator: small pill with user avatar and text "Editing now" with background #DBEAFE.
- Error & Empty States:
  - If realtime connection lost: banner at top of board "Disconnected — changes may not sync" with background #FEE2E2 and text #B91C1C and button "Retry" (#0369A1).
- Acceptance Checks:
  - ✓ Opening same board in two browsers shows both users in Active area within 5s.
  - ✓ When a user edits a card, the other browser shows the "Editing now" indicator.

## 6) UI/UX

Color palette (minimum 5 hexes):

- Primary button / accents: #0369A1 (usage: primary CTA buttons like "Save", board header accents)
- Secondary / action: #0EA5E9 (usage: "Create team" CTA, links)
- Success / toast: #16A34A (usage: success toast background)
- Danger / errors: #B91C1C and inline error #DC2626 (usage: error toasts and inline validation)
- Background / surface: #F9FAFB (usage: page background)
- Card background: #FFFFFF (usage: cards, modals)
- Text primary: #111827 (usage: main text)
- Muted text: #6B7280 (usage: secondary text)
- Drag overlay: rgba(59,130,246,0.12) (usage: drag shadow)
- Presence badge background: #DBEAFE (usage: editing indicator)

Typography:

- Font family: Inter
- Base: 16px
- H1: 28px, font-weight 700
- H2: 20px, font-weight 600
- Body: 16px, font-weight 400
- Small/labels: 13px, font-weight 500

Layout notes:

- Mobile-first single column: board view collapses to vertical scroll showing columns stacked horizontally as a horizontal scroll container; primary interactions remain the same.
- Desktop: two-column layout for dashboard (left sidebar teams/projects, main content). Board view uses full-width horizontal columns with overflow-x scroll.
- Modal size: max-width 720px, centered, background overlay rgba(17,24,39,0.6).

## 7) Out of Scope (V1)

- Email or push notifications.
- Advanced permissions/RLS per-project (beyond Owner/Member/Guest roles).
- External integrations (Slack, Jira, GitHub, Google Drive).
- Gantt charts, timelines, or calendar views.
- Recurring tasks, time tracking, or estimations.
- Mobile native apps (only responsive web).
- Single sign-on (SAML) or enterprise billing.
- Activity search/export or audit logs beyond the in-app activity stream.

## 8) Success Criteria (Testable Checklist)

- ✓ Auth: Unauthenticated user sees "Sign in to continue" and can sign in via Clerk flows; authenticated users can access teams.
- ✓ Team/project creation: Creating a team and project persist in DB and appear in left sidebar with a "Team created" toast (#16A34A).
- ✓ Board basics: Adding a column and card persists with correct position fields and displays in board UI; empty board shows "No columns yet. Click + Add column to begin."
- ✓ Drag & drop: Moving a card updates card.column_id and position; second client receives update via realtime and UI reflects the change.
- ✓ Card modal: Opening a card displays Title, Description, Assignees, Due date, Attachments, Comments; saving updates DB and shows primary "Save" button (#0369A1).
- ✓ Comments & activity: Posting a comment creates comment record and activity entry and shows in UI with "just now" timestamp.
- ✓ Validation & errors: Empty required fields show inline messages (e.g., "Card title cannot be empty" in #DC2626). Server errors display toasts (e.g., "Unable to create team. Try again." with bg #B91C1C).
- ✓ Realtime presence: Two clients opening same board show both avatars under "Active" within 5 seconds and editing indicator appears when a user edits a card.
- ✓ No console errors: All major pages (dashboard, project board, card modal) load and render without uncaught exceptions or console errors.
