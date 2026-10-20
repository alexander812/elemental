/**
 * English version of the "Adding a ready-made course" screencast.
 * English UI + English user learning Russian (Acquaintance, En-Ru).
 * Silent: no `say` lines.
 *
 * Publication:
 *   node skills/new-video/engine/audio.cjs add-ready-course --trim=auto --poster=0.6 \
 *     --to=app/public/videos/en
 */

module.exports = {
  name: 'add-ready-course',

  seed: {
    courses: [],
    lessons: [],
    sets: [],
    settings: {
      theme: 'dark',
      userLang: 'en',
      learnAfterChecks: false,
      voiceCheckEnabled: true,
      writeCheckEnabled: false,
      debugMode: false,
    },
  },

  steps: [
    { wait: 600 },
    { tap: 'Add course', pause: 1000 },
    { tap: 'Find a ready-made course', pause: 1500 },
    { tap: 'Acquaintance', pause: 1200 },
    { tap: 'Load', pause: 1600 },
    { wait: 2600 },
  ],
}
