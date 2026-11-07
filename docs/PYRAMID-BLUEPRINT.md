# Pyramid of Righteousness — Build Blueprint

Build spec for the Claude Desktop coding agent. This is a new module for the existing Islamic history site (repo aksam1/cloud-amana). Build what is described. Items marked DEFAULT can be changed later by the owner.

## 1. Core Idea

The user climbs a visual pyramid based on the hadith of Jibril: Islam at the base, Iman in the middle, Ihsan at the top. A few reflection questions place them at a starting point. They climb by learning through story-driven lessons, and their score rises as their understanding grows.

Priorities, in order: people genuinely benefit, then people want to come back.

This is a learning journey, not a habit tracker. There is no daily tracker.

## 2. Non-Negotiable Rules

- Never predict or imply anyone's afterlife outcome. Only Allah knows the unseen.
- Never call any part of it a "test" or "exam."
- Progress and scores are private. No leaderboards, no comparing users.
- Tone is always encouraging and mercy-focused, never shaming.
- Show this disclaimer on the intro and results screens: "This is a tool for learning and self-reflection. Only Allah knows the state of anyone's heart."
- Non-Muslim mode is welcoming and respectful, never preachy.
- All religious content (ayat, hadith, rulings, wording) must be reviewed by a qualified imam or scholar before launch.

## 3. The Pyramid

Three levels, each a "world" made of units. Each unit is one lesson path.

1. Level 1, Islam (the base): Shahadah, Salah, Zakat, Sawm, Hajj.
2. Level 2, Iman (the middle): belief in Allah, the Angels, the Books, the Messengers, the Last Day, and Qadr. The existing prophet history section lives inside the Messengers unit.
3. Level 3, Ihsan (the peak): sincerity (ikhlas), patience (sabr), gratitude (shukr), trust in Allah (tawakkul), humility, and good character.

Units within a level can be taken in any order. A level's top section lights up when all its units are completed. DEFAULT: higher levels are open to everyone, but the pyramid recommends starting where placement puts you.

## 4. User Journey

1. Landing: the pyramid shown as a stone monument, with a short invitation like "Where do you stand on the path?"
2. Path choice: the site's existing Muslim / non-Muslim toggle.
3. Placement: 10 to 15 short reflection questions (see section 5).
4. Placement result: the pyramid with the user's starting point glowing, their strongest and weakest units, and a recommended first unit.
5. Climb: the user enters a unit and goes through its lesson (see section 6).
6. Return: the user comes back to continue their climb, unlock new parts of the monument, and retake placement whenever they want to reflect again.

## 5. Placement (Reflection Questions)

- 10 to 15 questions spread across all three levels.
- Answer scale: Never, Rarely, Sometimes, Often, Always (0 to 4), plus some short real-life scenario questions with 3 or 4 options.
- Purpose: find a starting point and recommend units. It is not a grade.
- Questions live in a JSON data file with: id, path (muslim or nonmuslim), level, unit, type, text, options, points.

## 6. Lesson Unit Structure

Every unit follows the same five steps:

1. Story scene: a visual scene in the site's art style showing a prophet, companion, or real-life moment tied to the topic. Example: patience opens with Ayyub.
2. Choice: the user is put in a situation and picks what they would do.
3. Teaching: what the Qur'an says, a hadith, and a short insight from classical scholars, each with references. Arabic shown right-to-left with translation.
4. Understanding check: 3 to 5 questions on what was just taught.
5. Reflection: one personal reflection prompt, with an optional private note the user can write.

All unit content lives in data files (one JSON per unit) so content can be added without code changes.

## 7. Scoring

The score measures understanding and reflection, not a judgment of the person.

- Unit meter (0 to 100): built from the understanding check (DEFAULT 70%) and the choice and reflection steps (DEFAULT 30%).
- Level progress: average of that level's unit meters.
- Overall score: average of all unit meters, shown smaller than the pyramid itself.
- Headline rank: the user's current level on the pyramid (Islam, Iman, or Ihsan), with a progress bar toward the next level.
- Units can be retaken to raise the meter.

## 8. Muslim and Non-Muslim Modes

- Same pyramid and units for both.
- Muslim mode: placement asks about personal practice; lessons speak to the user as a believer.
- Non-Muslim mode: placement asks about values and curiosity; lessons are framed as "What Islam teaches about this"; reflection prompts are about the user's own values.
- User can switch modes anytime with the toggle.

## 9. Connection to the History Section

- The prophet history chapters sit inside the Messengers unit of Level 2.
- Lesson story scenes reuse characters and art from the history section where possible.
- The end of each history chapter links to the related lesson unit, for example Yusuf's story to forgiveness.

## 10. Data and Privacy

- DEFAULT first version: everything stored in the browser (localStorage). No account needed.
- Later version: optional account login so progress follows the user across devices.
- A "Delete my data" button on the progress screen.
- No analytics on individual answers or reflection notes.

## 11. Design

- Visual style matches the site: a blend of Total War Troy and Total War Three Kingdoms art.
- The pyramid is a stepped stone monument; completed units light up its stones.
- Mobile-first, one step per screen, large tap targets.

## 12. Build Order

1. Data file formats for placement questions and lesson units, with placeholder content.
2. Pyramid landing screen and Muslim / non-Muslim toggle.
3. Placement flow and placement result screen.
4. One complete unit end to end: patience (Ihsan level, using Ayyub's story). This is the prototype.
5. Scoring engine and localStorage progress.
6. Test the prototype with a few real users and adjust.
7. Build out the remaining units level by level.
8. Scholar review of all content, then launch.

## 13. Open Questions

- Final name for the module.
- Exact unit list and order within each level.
- Whether higher levels stay open to everyone or unlock after lower ones.
