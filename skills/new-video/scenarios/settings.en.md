# "Settings and data" video scenario (`settings`, English)

- Video: `app/public/videos/en/settings.{mp4,jpg}` · Recording program: `scenarios/settings.en.cjs`
- Duration: 2:59 · Frame: 390×844, dark theme · Poster: "Courses" with the "Acquaintance (En-Ru)" course
- Platform: browser · Every action is explained by the narrator (what we do and why), no tooltips
- Status: published.

## Goal

Show where the app adapts to the user: which settings sections exist and what each is for, how to switch
the theme, and how the "Data" section works — export to a file, import and reset. After the video it is
clear what can be tailored and how not to lose your courses.

## What we use

- Ready-made course **"Acquaintance"** with two lessons ("New Neighbors", "Let's Get Acquainted") and two
  sets — so there is something to choose in the export and a meaningful file for the import.
- **Import mock**: the browser has no native file picker — a backup file is put into the hidden
  `input[type=file]` via `DataTransfer` (an `eval` step). The format version is read from
  `app/src/transport/backup.ts`, the file name uses today's date.
- **The Voice section is not shown**: it exists only on Android, and voices are not downloaded.
  The "Data" section is shown in detail, including import and reset.

## Rules

- Narrator — `edge:en-US-GuyNeural`; pauses = line + ~0.9 s; step cards separate the stages.
- Themes switch by tapping a radio — the app changes immediately; at the end we return to Dark.
- Import — only the file card and "Cancel": the file duplicates the current lessons, a real import would
  navigate to "Courses". Reset — only the confirmation sheet and "Cancel": a real reset would reload the
  app and interrupt the recording.
- Export is real: tick one lesson, tap "Export", the file is actually downloaded and the app returns to "Data" by itself.

## Step 1 — settings sections

- **Card:** "Step 1" — "Get to know the settings sections."
- **Screen:** "Courses" with the loaded course → "Settings" menu.

| Action | Narrator line |
| --- | --- |
| Card "Step 1" | Let's get to know the settings — this is where the app adapts to you. |
| Tap "Settings" | Open Settings and we'll go through each section. |
| Tap "Language" | Language sets the language of translations and hints. |
| Back | — |
| Tap "Checks" | Checks decide how you train words: say them out loud or type them. |
| "Checks" screen | And the “Move to learned” switch marks a word as learned right after a correct answer. |
| Back | — |
| Tap "Knowledge base" | If you forget something, the Knowledge base has video guides you can rewatch. |
| Back | — |
| Tap "About" | About shows the version and build date, and debug mode reveals what the model heard when a check fails. |
| Back | — |

- **Result:** Language, Checks, Knowledge base and About have been visited; it is clear what each is for.

## Step 2 — theme

- **Card:** "Step 2" — "Let's choose a theme."
- **Screen:** "Settings" menu → "Theme" with six themes.

| Action | Narrator line |
| --- | --- |
| Card "Step 2" | Now for the look: everyone picks a theme to their taste. |
| Tap "Theme" | There are six themes: light, dark and coloured. |
| Tap "Light" | Light is for daytime. |
| Tap "Terracotta" | Terracotta brings warm beige tones. |
| Tap "Amethyst" | Amethyst is a dark theme with purple accents. |
| Tap "Dark" | Back to Dark — it's the default theme. |
| Back | — |

- **Result:** the theme changes immediately; the selected one is "Dark".

## Step 3 — the "Data" section (in detail)

- **Card:** "Step 3" — "A closer look at the Data section."
- **Screen:** "Settings" menu → "Data".

| Action | Narrator line |
| --- | --- |
| Card "Step 3" | Let's look at the Data section separately — it keeps your courses safe. |
| Tap "Data" | There are three actions here: export, import and reset. |
| Tap "Export" | Export saves the selected lessons to a file — for example, to move them to another device. |
| Untick "Let's Get Acquainted" | Choose which lessons go into the file: keep only “New Neighbors”. |
| Tap "Export" (button) | Tap “Export” — the app saves the file. |
| "Data" screen | You can email the file to yourself or keep it in the cloud. |
| Tap "Import" | Import is the reverse: choose a file with a copy of your data. |
| File card | The app reads the file and shows what's inside: courses, lessons, sets and cards. |
| "Data" screen | “Merge” adds the lessons from the file to the current ones, “Replace” completely replaces all the app data. |
| Tap "Cancel" | Cancel the import — these lessons are already in the app. |
| Tap "Reset data" | Reset returns the app to its initial state — for example, if you want to start over. |
| Confirmation sheet | Courses, lessons and settings will be deleted with no way to restore them, so the app asks for confirmation. |
| Tap "Cancel" | Cancel — we still need our data. |
| "Data" screen (final) | Now you know where to tailor the app to yourself and how to save your courses to a file. |

- **Result:** all three actions of the section are shown; the final screen is "Data" with the data intact.

## Sound

Narrator only (Guy), 27 lines; silence between lines. Line durations were measured with
`engine/measure-tts.cjs`, pauses are set in the scenario (`pause = line + ~0.9 s`).

## Check

- Record: `node skills/new-video/engine/runner.cjs skills/new-video/scenarios/settings.en.cjs`
- Frames — via `ffmpeg-static` (see SKILL.md, step 3); check the Light theme by eye
  (white background, dark text) and the bottom sheets.
- Publication: `node skills/new-video/engine/audio.cjs settings --trim=auto --poster=0.6 --to=app/public/videos/en`
