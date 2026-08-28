# Darkroom Studio

Build the complete frontend product architecture for a web application called:

DARKROOM SYSTEM

The attached transparent PNG is the official DARKROOM SYSTEM logo.

============================================================

1. BRAND RULES

============================================================

Use the supplied logo asset directly.

Do NOT:

- redraw it

- recreate it with CSS

- replace it with an icon

- distort it

- crop it

- recolor it

- approximate it with another symbol

Preserve:

- transparency

- original aspect ratio

- monochrome appearance

Product name:

DARKROOM SYSTEM

The interface should feel like a serious creative operating system for music work.

Visual direction:

- black-dominant

- white typography

- monochrome

- minimal

- cold

- premium

- editorial

- technical

- creative-tool feeling

- music studio software

- fashion/editorial interface

- control-room energy

Avoid:

- generic SaaS dashboard styling

- bright accent colors

- purple gradients

- blue startup UI

- playful illustrations

- excessive rounded cards

- bubbly design

- glassmorphism everywhere

- overuse of gradients

- generic Bootstrap/admin template appearance

Use grayscale hierarchy only.

Suggested palette:

#000000 primary background

#0A0A0A elevated surface

#141414 cards / panels

#262626 borders

#737373 secondary text

#A3A3A3 muted text

#FFFFFF primary text / active controls

The UI should work almost entirely in black, white, and grayscale.

============================================================

2. PRODUCT PURPOSE

============================================================

DARKROOM SYSTEM is NOT a streaming platform.

It is a creative operations workspace for artists and music teams.

The long-term workflow is:

Idea

→ Demo

→ Recording

→ Mixing

→ Mastering

→ Release Preparation

→ Content Campaign

→ Released

→ Analytics

The Song is the central object.

The system brings together:

- songs

- production progress

- audio files

- visual assets

- release planning

- content planning

- credits

- collaborators

- analytics

The goal is to create one workspace for managing a music project from idea to release.

============================================================

3. IMPORTANT ARCHITECTURE RULE

============================================================

Build the COMPLETE FRONTEND PRODUCT ARCHITECTURE now.

However:

Not every backend feature exists yet.

Therefore use this rule:

REAL BACKEND EXISTS

→ use the real API layer

BACKEND DOES NOT EXIST YET

→ use isolated mock data

Never hardcode large mock datasets directly inside page components.

Mocks must live in a dedicated mock/data layer.

The frontend architecture must make it easy to replace mocks with API calls later.

Do not pretend future integrations are real.

============================================================

4. CURRENT REAL BACKEND

============================================================

The backend currently exists as:

ASP.NET Core Web API

.NET 10

Entity Framework Core

Npgsql

PostgreSQL

Current real API:

GET    /api/songs

GET    /api/songs/{id}

POST   /api/songs

PUT    /api/songs/{id}

DELETE /api/songs/{id}

Current Song fields:

id

title

status

createdAt

CreatedAt is server-controlled.

Current allowed Song statuses:

Idea

Demo

Recording

Mixing

Mastering

ReleasePreparation

ContentCampaign

Released

Analytics

Status input is normalized by the backend.

Title:

- required

- max 200 characters

Status:

- required

- max 40 characters

Use the real Song API architecture for the Songs area.

All other future product areas can use mocks for now.

============================================================

5. TECH STACK

============================================================

Use:

- React

- TypeScript

- Tailwind CSS

- React Router

- clean reusable components

Use a structure that can scale.

Prefer something like:

src/

├── app/

├── components/

├── layouts/

├── pages/

├── features/

│   ├── dashboard/

│   ├── songs/

│   ├── calendar/

│   ├── team/

│   └── settings/

├── services/

│   ├── api/

│   └── mock/

├── types/

├── hooks/

├── lib/

└── assets/

Do not create unnecessary architecture layers.

============================================================

6. GLOBAL PRODUCT ROUTES

============================================================

Build the full route architecture:

/login

/dashboard

/songs

/songs/:id

/calendar

/team

/settings

The Song Workspace at /songs/:id should use internal tabs instead of separate top-level pages.

Song Workspace tabs:

Overview

Audio

Visuals

Release

Content

Credits

Analytics

============================================================

7. GLOBAL APP SHELL

============================================================

Create a strong desktop-first app shell.

Use:

- left sidebar navigation

- main content area

- responsive mobile navigation

- subtle top utility/header area if needed

Sidebar should include:

DARKROOM SYSTEM logo

Dashboard

Songs

Calendar

Team

Bottom section:

Settings

Profile

Use the attached logo near the top of the sidebar.

Do not make the sidebar overly wide.

The sidebar should feel like a professional creative tool.

Active states should be monochrome.

Use:

- border

- fill

- text weight

- icon contrast

- subtle background

instead of bright colors.

============================================================

8. LOGIN PAGE

============================================================

Create a DARKROOM SYSTEM login screen.

It should feel minimal and branded.

Use:

- large logo

- DARKROOM SYSTEM wordmark

- email field

- password field

- sign in button

Do not build real authentication yet.

Use mock behavior.

Avoid generic SaaS illustrations.

Keep it stark and minimal.

============================================================

9. DASHBOARD

============================================================

The Dashboard should answer:

- what songs are active?

- what releases are upcoming?

- what content is due?

- what has changed recently?

- how are released projects performing?

Include sections such as:

ACTIVE PROJECTS

Show visually strong song cards.

Each card can include:

- artwork placeholder

- song title

- current status

- release date if available

- progress indicator

- collaborator avatars

- last updated

UPCOMING

Timeline/list showing:

- teaser

- artwork deadline

- music video

- release

- content posts

RECENT ACTIVITY

Examples:

- mix uploaded

- artwork approved

- release date changed

- teaser scheduled

PERFORMANCE SNAPSHOT

Mock metrics:

- total views

- recent growth

- top-performing release

- content performance

Make it visually restrained and premium.

Do not use rainbow charts.

Charts should be monochrome.

============================================================

10. SONGS PAGE

============================================================

Create a full Songs library page.

Include:

- page title

- create song button

- search

- filter by status

- sort

- grid/list toggle if useful

Song items should show:

- artwork

- title

- status

- created date

- last activity

- release date if available

Status presentation should remain monochrome.

Avoid colorful pills.

Use shapes, border styles, type weight, and opacity.

Create:

- loading state

- empty state

- error state

- no search results state

Use real API integration architecture here.

============================================================

11. CREATE SONG

============================================================

Create a proper create-song interaction.

This can be:

- modal

or

- side panel

Fields:

Title

Status

Do NOT expose:

Id

CreatedAt

Use allowed Song statuses exactly:

Idea

Demo

Recording

Mixing

Mastering

ReleasePreparation

ContentCampaign

Released

Analytics

Show user-friendly labels:

ReleasePreparation → Release Preparation

ContentCampaign → Content Campaign

But submit the backend value.

Use frontend validation that matches the backend.

============================================================

12. SONG WORKSPACE

============================================================

This is the most important part of the application.

Route:

/songs/:id

The page should feel like a creative project command center.

Header:

artwork

song title

status

artist/project info

release date

last updated

primary actions

Tabs:

Overview

Audio

Visuals

Release

Content

Credits

Analytics

Keep the tabs persistent.

============================================================

13. SONG WORKSPACE — OVERVIEW

============================================================

Include:

PROJECT STATUS

Current lifecycle progress.

Example:

Idea

Demo

Recording

Mixing

Mastering

Release Preparation

Content Campaign

Released

Highlight current state in monochrome.

PROJECT INFORMATION

- song title

- artist

- BPM

- key

- genre

- project notes

Only Song title/status currently come from real backend.

Other fields may use mocks.

UPCOMING TASKS

Examples:

- Final mix approval

- Cover artwork delivery

- Upload master

- Schedule teaser

RECENT ACTIVITY

Compact timeline.

TEAM

Show collaborators.

============================================================

14. SONG WORKSPACE — AUDIO

============================================================

Design an audio asset manager.

Sections:

Demo

Recording

Mix

Master

Each asset should support:

- filename

- version

- upload date

- uploader

- status

- file size

- duration

Example:

MIX

mix_v5.wav

mix_v6.wav

mix_v7.wav    CURRENT

Use a clear version-history UI.

Add mock waveform preview areas.

Do NOT build fake waveform processing logic.

Use placeholders/components ready for later integration.

Actions:

Upload

Mark as current

Download

View versions

Add note

Future files will come from Google Drive, but use mock data now.

============================================================

15. SONG WORKSPACE — VISUALS

============================================================

Create visual asset sections:

Cover Art

Music Video

Visualizer

Spotify Canvas

Promo Assets

Social Content

Use thumbnail grids.

Each item may have:

- type

- filename

- status

- version

- creator

- last updated

Support clear states:

Missing

In Progress

Review

Approved

Final

Keep monochrome styling.

============================================================

16. SONG WORKSPACE — RELEASE

============================================================

Create a release management tab.

Show:

Release Date

Distributor

ISRC

UPC

Release Type

Platforms

Release Status

Release lifecycle:

Planning

Preparing

Ready

Scheduled

Released

Include a release checklist:

Master

Cover

Metadata

Credits

Canvas

Music Video

Content Plan

Make checklist completion visually strong.

Use mock data.

============================================================

17. SONG WORKSPACE — CONTENT

============================================================

Create a campaign/content management interface.

Content types:

Teaser

Snippet

Music Video

Visualizer

Behind The Scenes

TikTok

Instagram Reel

YouTube Short

Artwork Post

Content lifecycle:

Idea

Planned

In Production

Editing

Ready

Scheduled

Published

Show content in:

- list/table

- timeline

or

- compact board

Do not build an enormous Trello clone.

Keep it integrated into the Song Workspace.

============================================================

18. SONG WORKSPACE — CREDITS

============================================================

Create a credits management interface.

Roles can include:

Artist

Featured Artist

Producer

Songwriter

Recording Engineer

Mix Engineer

Mastering Engineer

Director

Designer

Show:

name

role

contact

status

Future split percentages may exist later.

You may show a placeholder split field only if clearly marked as planned/mock.

============================================================

19. SONG WORKSPACE — ANALYTICS

============================================================

Create an analytics page for released projects.

Mock data only.

Possible sections:

YouTube views

likes

comments

watch time

subscriber growth

content performance

view velocity

top-performing content

Use elegant monochrome charts.

Avoid:

- colorful pie charts

- random gradients

- flashy dashboard visuals

============================================================

20. GLOBAL CALENDAR

============================================================

Route:

/calendar

Create a release/content calendar.

Show:

- song release dates

- teaser dates

- content deadlines

- MV dates

- campaign milestones

Support:

Month

Week

Agenda

Use monochrome event differentiation.

Do not rely on bright event colors.

============================================================

21. TEAM

============================================================

Route:

/team

Create a team/collaboration page.

Show:

- members

- role

- projects involved

- recent activity

- invite button

Roles may include:

Owner

Admin

Artist

Producer

Engineer

Manager

Collaborator

Use mock data.

Do not build real auth or permissions yet.

============================================================

22. SETTINGS

============================================================

Route:

/settings

Create sections such as:

Profile

Workspace

Integrations

Notifications

Appearance

Integrations should visually show planned connections:

Google Drive

YouTube

Mark them clearly as:

Not Connected

Coming Later

or mock state

Do not pretend real integrations exist.

============================================================

23. DESIGN SYSTEM

============================================================

Create reusable components such as:

Button

IconButton

Input

Textarea

Select

Dialog

Drawer

Tabs

Card

Table

StatusBadge

Avatar

EmptyState

Skeleton

Toast

DropdownMenu

SearchInput

FilterBar

ProgressBar

Timeline

FileRow

AssetCard

Keep them visually consistent.

Avoid making every card overly rounded.

Use moderate or small border radii.

Use hard boundaries and strong spacing.

============================================================

24. TYPOGRAPHY

============================================================

Use typography that feels:

- modern

- editorial

- technical

- music-industry adjacent

Use one clean sans-serif family.

Use strong contrast between:

display headings

section headings

metadata

labels

body copy

Do not use decorative fonts everywhere.

============================================================

25. STATUS VISUALS

============================================================

Do not use rainbow status colors.

Use monochrome methods:

- filled vs outlined

- opacity

- border weight

- icons

- typography

- small symbols

Examples:

● MIXING

○ DEMO

◉ MASTERING

✓ RELEASED

============================================================

26. INTERACTION / MOTION

============================================================

Use subtle motion only:

- sidebar transitions

- modal transitions

- hover transitions

- tab transitions

- lightweight loading states

Avoid:

- excessive bounce

- springy playful animation

- giant page transitions

============================================================

27. RESPONSIVE BEHAVIOR

============================================================

Desktop-first but fully responsive.

Desktop:

persistent sidebar.

Tablet:

collapsed sidebar.

Mobile:

bottom nav or drawer.

Song Workspace tabs should remain usable on mobile with horizontal scroll if needed.

Tables should collapse intelligently.

Do not simply shrink desktop UI.

============================================================

28. MOCK DATA RULES

============================================================

Future features should use realistic mock data.

Centralize mock data.

Do NOT hardcode mock data inside every component.

Suggested:

services/mock/

or

data/mock/

Create realistic:

songs

assets

releases

content

credits

analytics

team members

calendar events

============================================================

29. API LAYER

============================================================

Create a clean API layer.

Example:

services/api/songs.ts

Methods:

getSongs()

getSong(id)

createSong(payload)

updateSong(id, payload)

deleteSong(id)

Use a configurable API base URL.

Do not scatter fetch calls across UI components.

============================================================

30. ERROR / EMPTY / LOADING STATES

============================================================

Every important area should have:

loading

empty

error

success

Examples:

No songs yet

No audio uploaded

No visual assets

No scheduled content

No analytics available

No collaborators yet

These states should feel branded and intentional.

============================================================

31. DO NOT OVERBUILD

============================================================

The goal of this first generation is:

COMPLETE PRODUCT ARCHITECTURE

+

COHERENT VISUAL SYSTEM

+

FULL NAVIGATION

+

REALISTIC MOCKED PRODUCT EXPERIENCE

Not perfect implementation of every future feature.

Do not build:

- real authentication

- Google OAuth

- Google Drive integration

- YouTube API integration

- backend replacements

- fake production integrations

- complex permissions

- payment systems

- streaming

============================================================

32. FINAL EXPECTED RESULT

============================================================

The generated frontend should feel like a complete DARKROOM SYSTEM product prototype.

A user should be able to navigate through:

Dashboard

Songs

Song Workspace

Calendar

Team

Settings

The Song Workspace should feel like the center of the product.

The app should look cohesive enough that later we can improve and connect modules one by one without redesigning the entire frontend.

Use the attached logo as the main visual anchor.

Do not make the product look generic.

DARKROOM SYSTEM should feel like its own brand.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0d3f7d39-42b3-42d9-b771-5468cbfef96b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
