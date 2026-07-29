# CreaoLink

## Project Overview

CreaoLink is a frontend-focused creative collaboration platform for clients, freelancers, and video editing teams. The project is built around one main idea: creative delivery should happen inside a structured workspace where project briefs, versions, feedback, chat, team members, and Adobe Premiere Pro timeline sync all stay connected.

The frontend presents CreaoLink as a modern SaaS workspace. It starts with a public landing page, moves users through signup or login, and then gives authenticated users a dashboard for managing projects, tracking activity, reviewing synced video-editing timelines, and communicating with collaborators.

The frontend is implemented with Next.js App Router, React, TypeScript, Tailwind CSS, and a custom global CSS design system.

## Frontend Orientation

The frontend orientation is productivity-first and workspace-driven. Instead of behaving like a simple marketing website, CreaoLink behaves like an operational product for creative teams.

The visual style is dark, focused, and professional. It uses deep charcoal backgrounds, muted secondary text, red accent actions, compact cards, clear status tags, dashboard grids, and structured panels. The design is meant to feel like a creative operations tool: serious enough for client work, but still expressive enough for media and design workflows.

The interface is organized around these principles:

- Role-based collaboration between clients and freelancers.
- Project rooms as the center of work.
- Version history and feedback as first-class frontend concepts.
- Adobe Premiere Pro sync as a visible workflow, not a hidden backend feature.
- Fast scanning through dashboards, tables, cards, status chips, and side panels.
- Responsive layouts for desktop, tablet, and mobile usage.

## Main Frontend Areas

### 1. Public Landing Page

The landing page introduces CreaoLink as a workspace for clients, freelancers, and version-based creative delivery.

Frontend functionality includes:

- Sticky navigation with brand identity and page section links.
- Hero section with a strong product message.
- Calls to action for signup and login/demo flow.
- Dashboard preview mockup that visually communicates the product experience.
- Feature cards explaining role-based dashboards, version-safe collaboration, feedback tracking, project rooms, progress dashboards, and approval checkpoints.
- "How it works" section showing the workflow from project creation to feedback and final approval.
- Outcomes, testimonials, pricing cards, and final signup CTA.

Frontend orientation:

- Marketing content is connected directly to the real dashboard concept.
- The page visually sells the actual workspace experience instead of only using generic promotional text.
- The landing layout uses a dark SaaS aesthetic with serif display typography for brand personality and compact UI previews for product credibility.

Key file:

- `frontend/app/page.tsx`

### 2. Authentication Experience

The authentication frontend supports both login and signup flows.

Login functionality includes:

- Email and password login.
- Field validation for required values and email format.
- Password visibility toggle.
- Google OAuth login through Supabase.
- Admin gate mode for administrator access.
- Error display and loading states.
- Links between login and signup screens.

Signup functionality includes:

- Multi-step onboarding flow.
- Plan selection between Starter and Growth.
- Optional pro plan tier selection.
- Role selection for client or freelancer.
- Profile setup with name and username.
- Signup method selection.
- Email/password account creation.
- Google OAuth signup.
- Password confirmation and validation.
- Step progress indicator.

Frontend orientation:

- Signup is treated as guided onboarding, not just a form.
- Role selection happens early so the platform can route users into the correct project experience.
- The UI uses concise steps, compact panels, and visible validation feedback.

Key files:

- `frontend/app/auth/login/page.tsx`
- `frontend/app/auth/signup/page.tsx`
- `frontend/app/auth/layout.tsx`
- `frontend/app/auth/callback/page.tsx`

### 3. Dashboard Shell

After login, users enter an authenticated dashboard shell.

Dashboard shell functionality includes:

- Auth guard that redirects unauthenticated users to login.
- Topbar with brand link, global search, notification bell, and user chip.
- Sidebar navigation for dashboard, projects, feedback, timeline, profile, and recent project shortcuts.
- Responsive mobile sidebar with overlay and body scroll locking.
- Route-aware active navigation states.
- Loading spinner while user state is being checked.

Frontend orientation:

- The shell makes CreaoLink feel like a persistent workspace.
- Navigation is always available, but compact enough to keep project content central.
- The sidebar shows current project context so users can quickly jump between workspaces.

Key files:

- `frontend/app/dashboard/layout.tsx`
- `frontend/app/dashboard/components/Topbar.tsx`
- `frontend/app/dashboard/components/Sidebar.tsx`

### 4. Main Dashboard

The main dashboard summarizes the user's current project activity.

Frontend functionality includes:

- Personalized greeting using the logged-in user's name.
- KPI cards for active projects, open feedback, latest version, and reputation score.
- Recent projects table with status tags and update dates.
- Activity feed populated from API data.
- Open feedback summary panel.
- Quick actions for creating projects, viewing projects, and editing profile.
- Network panel showing followed or connected users.
- Empty states when projects, activity, or network data is missing.

Frontend orientation:

- The dashboard is a command center.
- It prioritizes scannable metrics, recent activity, and quick navigation.
- The design uses a dense, operational layout rather than a decorative homepage style.

Key file:

- `frontend/app/dashboard/page.tsx`

### 5. Projects Page

The projects page lists all projects available to the current user.

Frontend functionality includes:

- Project fetching through the API client.
- Role-aware create project button for clients/admins.
- Project search by title.
- Status filters: All, Active, Review, and Done.
- Filter count badges.
- Loading spinner while projects load.
- Empty states for no projects, no matching search results, or no assigned freelancer projects.
- Project cards with title, description, status, progress bar, avatar marker, and created date.
- Clickable project cards that navigate to the project detail room.

Frontend orientation:

- Clients are encouraged to create and manage projects.
- Freelancers are shown assigned work without unnecessary creation controls.
- The grid is visual, compact, and status-focused.

Key file:

- `frontend/app/dashboard/projects/page.tsx`

### 6. Create Project Modal

The create project modal lets clients set up a new collaboration workspace.

Frontend functionality includes:

- Modal overlay with blurred backdrop.
- Required project title field.
- Optional description field.
- Deadline date input.
- Freelancer invitation field using comma-separated emails.
- API submission through `apiCreateProject`.
- Loading state during creation.
- Error display for failed creation.
- Automatic redirect to the newly created project when complete.

Frontend orientation:

- Project creation is presented as a focused workflow inside the dashboard.
- The modal keeps users in context instead of forcing a separate page.
- The fields match the minimum information needed to start collaboration quickly.

Key file:

- `frontend/app/dashboard/components/CreateProjectModal.tsx`

### 7. Project Detail Room

The project detail screen is the most important frontend workspace. It combines project metadata, version management, Premiere Pro timeline sync, chat, feedback, and team information.

Frontend functionality includes:

- Project header with breadcrumbs and project status.
- Actions for connecting Premiere Pro, inviting members, and creating a new version.
- Project metadata including creation date, member count, and current version.
- Tabs for Overview, Chat, and Feedback.
- Right-side metadata panel with project info, team list, settings, and approval actions.
- Client-only status change menu.
- Version creation form with optional version notes.
- Version timeline showing current and previous versions.
- Error and loading states for unavailable project data.

Frontend orientation:

- The project detail page is designed like a control room.
- Primary work happens in the central panel, while project metadata and team actions stay visible on the right.
- Tabs separate different types of collaboration without forcing users into disconnected pages.

Key file:

- `frontend/app/dashboard/projects/[id]/page.tsx`

### 8. Premiere Pro Timeline Viewer

The timeline viewer visualizes timeline data synced from Adobe Premiere Pro.

Frontend functionality includes:

- Empty state while no timeline data has been synced.
- Sequence header with name, duration, clip count, and marker count.
- Horizontal scrollable timeline area.
- Sticky track header column.
- Video tracks and audio tracks separated visually.
- Clip blocks positioned by start time and duration.
- Timeline ruler with time ticks.
- Marker overlay with color-coded flags.
- Hover tooltip for marker name, comment, and timestamp.
- Responsive horizontal scrolling on smaller screens.

Frontend orientation:

- Timeline data is made readable for clients who may not use Premiere Pro.
- The viewer translates editing metadata into a web-friendly review surface.
- The styling resembles editing software enough to feel familiar to video editors.

Key file:

- `frontend/app/dashboard/components/TimelineViewer.tsx`

### 9. Premiere Pro Link Page

The Premiere Pro link page helps users connect a web project to the local Adobe Premiere Pro plugin.

Frontend functionality includes:

- Project-specific sync code display.
- Copy-to-clipboard interaction.
- Copied confirmation state.
- Step-by-step connection instructions.
- Premiere Pro visual badge.
- Back navigation to the project room.
- Error and loading states.
- Plugin download/help hint.

Frontend orientation:

- The sync process is made simple and visible.
- The page bridges the web workspace and the editor's local Adobe workflow.
- The copyable code is emphasized as the primary action.

Key file:

- `frontend/app/dashboard/projects/[id]/link/page.tsx`

### 10. Project Chat

The project chat room supports communication inside each project.

Frontend functionality includes:

- Project-specific message loading.
- Auto-refresh every 5 seconds.
- Manual refresh button.
- Message bubbles styled differently for current user and other users.
- Sender name, avatar initials, and timestamp display.
- Text message composer.
- Enter-to-send and Shift+Enter for new line.
- File attachment support up to six selected files.
- File size display.
- Attachment previews for images, video, audio, and general files.
- Downloadable attachments.
- Empty state when no messages exist.
- Loading and error states.

Frontend orientation:

- Chat is tied to the project room, keeping project communication in context.
- Attachment support fits creative workflows where users exchange media files and references.
- The layout uses familiar messaging patterns while staying visually aligned with the dashboard.

Key file:

- `frontend/app/dashboard/projects/[id]/components/ProjectChatRoom.tsx`

### 11. Feedback Management

The feedback tab lets clients and collaborators track revision notes.

Frontend functionality includes:

- Feedback count indicators.
- Filters for all, open, and resolved feedback.
- Client-only add feedback form.
- Feedback type selection: Revision, Bug, Enhancement, General.
- Priority selection: High, Medium, Low.
- Optional timestamp field.
- Feedback description field.
- Feedback cards with creator, date, type, priority, timestamp, version, and status.
- Mark feedback as resolved.
- Empty state when no feedback exists.

Frontend orientation:

- Feedback is structured instead of being buried in chat.
- Timestamp support makes the feature useful for video and timeline review.
- Priority tags and resolved states turn comments into trackable work items.

Key file:

- `frontend/app/dashboard/projects/[id]/page.tsx`

### 12. Notifications

The notification frontend gives users a dropdown activity center.

Frontend functionality includes:

- Notification bell in the topbar.
- Unread count badge.
- Dropdown panel with notification list.
- Filter chips for all, chat, feedback, status, project, and version events.
- Mark all as read.
- Clear all notifications.
- Dismiss individual notifications.
- Clickable notifications that navigate to related project pages.
- Empty state when all notifications are cleared.
- Automatic polling update message.

Frontend orientation:

- Notifications keep users aware of collaboration events without leaving the current workspace.
- Filters make the dropdown usable even when project activity grows.

Key files:

- `frontend/app/dashboard/components/Topbar.tsx`
- `frontend/app/dashboard/components/NotificationPanel.tsx`

### 13. Profile and Social Discovery

The frontend includes profile and user discovery features.

Frontend functionality includes:

- Current user profile page.
- Public profile page by user id.
- User search from the topbar.
- Search results dropdown.
- Navigation to searched user profiles.
- API support for profiles, portfolio projects, follower counts, following counts, skills, activity graph, reputation, and follow state.

Frontend orientation:

- CreaoLink is not only a project tracker; it also supports freelancer discovery and reputation.
- Profiles help clients evaluate collaborators and help freelancers present their work.

Key files:

- `frontend/app/dashboard/profile/page.tsx`
- `frontend/app/dashboard/profile/[id]/page.tsx`
- `frontend/app/dashboard/components/ProfileView.tsx`
- `frontend/app/dashboard/components/Topbar.tsx`

## Role-Based Frontend Behavior

CreaoLink separates users into client, freelancer, and admin-oriented experiences.

Client-facing behavior:

- Can create projects.
- Can invite freelancers by email.
- Can add feedback.
- Can change project status.
- Can create versions from the project room.
- Can connect the project to Premiere Pro through the sync code page.

Freelancer-facing behavior:

- Can view assigned projects.
- Can participate in project chat.
- Can review project details and synced timeline data.
- Can use the Premiere Pro connection workflow when working from the editing environment.
- Sees a project list oriented around assigned work rather than project creation.

Admin-facing behavior:

- Can access admin gate login mode.
- Is treated similarly to a client for project management actions in some frontend checks.

## Frontend Design System

The frontend uses a custom design system defined in `frontend/app/globals.css`.

Core design characteristics:

- Dark background palette based on charcoal and near-black surfaces.
- Red primary accent for main actions, active states, and important highlights.
- Muted green, yellow, blue, and purple colors for statuses, users, and timeline metadata.
- DM Sans for general interface text.
- Instrument Serif for display headings and brand-forward text.
- Compact border radii for professional dashboard controls.
- Consistent button variants: primary, ghost, subtle, large, small, and full-width.
- Status tags for active, review, done, and neutral states.
- Card components for dashboard sections, project cards, KPI blocks, feedback items, and modal panels.
- Responsive breakpoints for desktop, tablet, mobile, and very small screens.
- Mobile sidebar overlay and mobile-safe form sizing.

The frontend favors structured density over decorative excess. Most screens are built for repeated work: scanning project states, jumping between views, reading feedback, copying sync codes, checking notifications, and reviewing versions.

## Responsive Frontend Behavior

The frontend includes responsive behavior for smaller screens.

Responsive functionality includes:

- Dashboard sidebar becomes a slide-in mobile panel.
- Topbar search hides on small mobile screens.
- KPI cards and project grids collapse into fewer columns.
- Project cards become single-column on mobile.
- Timeline viewer becomes horizontally scrollable.
- Touch targets are increased for mobile buttons and form inputs.
- Auth layout hides the decorative left panel on smaller screens.
- Landing page navigation and preview adapt for mobile.

Frontend orientation:

- Desktop is optimized for full dashboard productivity.
- Mobile is optimized for checking status, navigating projects, reading notifications, and submitting smaller updates.

## Frontend Data Interaction

The frontend communicates with internal Next.js API routes through helper functions in `frontend/lib/api.ts` and `frontend/lib/api-client.ts`.

Main frontend data operations include:

- Authentication: login, signup, Google auth.
- Project creation, listing, reading, updating, deleting, and status changes.
- Version creation and retrieval.
- Feedback creation, retrieval, and resolution.
- Team management and permissions.
- Freelancer presence updates.
- Feed and network activity.
- User search, profile loading, and follow state.
- Chat messages and attachments.
- Premiere Pro plugin linking and timeline sync through project sync codes.

The frontend stores and reads the current user through the local auth helper, then passes the user id to API requests using request headers.

## Adobe Premiere Pro Frontend Integration

The repository also includes a UXP plugin frontend inside `uxp_premier_pro`.

Plugin frontend functionality includes:

- Status bar showing whether the plugin is linked.
- Link Project button.
- Sync Timeline button.
- Unlink Project button.
- Inline form for entering the web-generated sync code.
- Status message area for connection and sync feedback.

The web frontend and plugin frontend work together:

1. A user opens a project in the web dashboard.
2. The user opens the Premiere Pro link page.
3. The page displays the project sync code.
4. The user copies that code into the Premiere Pro plugin.
5. The plugin links to the project.
6. The plugin syncs timeline metadata.
7. The web frontend displays the synced sequence in the project timeline viewer.

Key plugin files:

- `uxp_premier_pro/index.html`
- `uxp_premier_pro/main.js`
- `uxp_premier_pro/styles.css`
- `uxp_premier_pro/api.js`

## User Journey Summary

A typical client journey:

1. Visit the landing page.
2. Sign up and select the client role.
3. Enter the dashboard.
4. Create a new project.
5. Invite freelancers.
6. Open the project room.
7. Review versions and synced timeline data.
8. Add timestamped feedback.
9. Track open and resolved feedback.
10. Approve progress or request revisions.

A typical freelancer journey:

1. Sign up and select the freelancer role.
2. Open assigned projects from the dashboard.
3. Use the project room to understand the brief and deadline.
4. Connect Premiere Pro using the sync code.
5. Sync timeline metadata from the plugin.
6. Chat with the client.
7. Review feedback and resolve revision notes.
8. Submit or discuss new versions.

## Project Frontend Strengths

CreaoLink's frontend is strong because it combines several related workflows into one coherent product:

- A polished landing page for first-time users.
- A guided role-based authentication flow.
- A persistent dashboard shell.
- Project creation and project discovery.
- Rich project rooms with versioning, timeline sync, chat, feedback, team metadata, and settings.
- A Premiere Pro bridge that makes the project unique compared with a normal project management app.
- A responsive design system that supports both desktop productivity and mobile access.

## Final Frontend Description

CreaoLink is a modern, dark-themed creative collaboration frontend designed for video editors, freelancers, and clients. Its main purpose is to make project delivery easier by connecting client review workflows with Adobe Premiere Pro timeline data. The frontend gives users a polished landing page, multi-step authentication, a responsive dashboard, project management tools, timeline visualization, chat, timestamped feedback, notifications, profile discovery, and a plugin-linking workflow.

The frontend orientation is practical, role-aware, and workspace-centered. It does not only show information; it guides users through the complete creative delivery cycle from signup to project creation, collaboration, version review, Premiere Pro sync, feedback resolution, and approval.
