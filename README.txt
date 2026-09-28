M.V.P. ACCELERATOR, PLAYER-COACH TRACK
Getting Started and Lessons 1 to 6, 162 screens, for the managers who coach an Athleader through the season

HOW TO OPEN IT
1. Unzip the folder anywhere on your computer. Keep every folder together.
2. Double-click one of the two launch files. They open in Chrome or Edge.
     Learner view.html   every rule on, exactly as a manager will see it
     Review view.html    for QA: Next, the menu and every video timeline are unlocked
3. Select Begin. Sound on: every screen has narration or video.

Nothing to install. The course runs from the folder. The pre-assessment, the Pulse Checks and the
post-assessment run inside the course on screens of their own: Deep's final questions (his Sept 26 item
bank), scales, routing and codes. They stand in for his JotForm embeds until he sends the embed codes. You
need an internet connection for the Wall of Fame form, the calendar links and LinkedIn.

WHAT IS INSIDE
Learner view.html, Review view.html   the course, two ways in
js/             content_pc.js (every word on screen, generated from the content model), narration_pc.js
                (narration timing), captions_pc.js (video captions), player.js (layout and behavior; the same
                file, byte for byte, runs the Athleader track)
css/            player.css (the visual design, shared with the Athleader track), fonts.css (Montserrat, embedded)
media/          Melissa's 24 manager videos (edited, loudness-matched, captioned), the six drills, the six
                Athleader Pro videos, opener, welcome, congratulations; posters/ holds a still for each
audio/          186 narration clips
captions/       caption files (WebVTT) for every video with speech
resources/      Player-Coach Playbook (full and per-lesson pages), Melissa's 90-Day Way Core 4 Scorecard
                (fillable) and her filled-in example, Commitment and Starting Line agenda
assets/         photos, pillar icons, Pro headshots, the Athleadership mark, the Player-Coach Playbook cover,
                Scorecard pages, the certificate background

WHAT IS DIFFERENT FROM THE ATHLEADER TRACK
The same player, design, drills, Pro Huddles, Pulse Check and ending. The lessons are Melissa's manager
lessons: each one leads yourself first, then others. Three screen types are new: steps (a sequence to run
with other people, as a timeline or numbered cards), reflect (1.6, one behavior the manager keeps all season)
and lookback (6.12, that behavior next to what they write about it in Lesson 6). The finish screen (E5)
shows the two side by side. The top bar reads Player-Coach, and the Playbook is the Player-Coach one.

CODES
Each survey shows a code on its last page; the next screen asks for it. To walk through without filling in a
survey:
  Pre-assessment     DFQS9D       (opens Lesson 1)
  Pulse Check        Lesson 1 BXMZZT, 2 ERCZDU, 3 B5N29K, 4 H69WKT, 5 J5N3N5, 6 DPQHD2
                     (each one completes its lesson and opens the next)
  Post-assessment    6EU3YP       (completes the course)
Codes are checked with case and spaces ignored. The post-assessment ends with the questions about the
Athleader (they replace the separate 180). The Wall of Fame, the last screen, is optional and has no code.

CERTIFICATE
After the post-assessment code, the certificate screen takes the manager's name and saves Melissa's
certificate as a one-page PDF. It is a setting: in _generators/model_course.py, 'certificate':
{'enabled': False} leaves the screen out and the finish screen's button reads Continue.

THE TWO VIEWS
Learner view: videos must be watched through before Next opens, each lesson opens only after the code
before it is in, and the menu only lets you go back to screens already seen. The seek bar drags back
freely and forward only as far as the screen has played, until it has played through once. Drills stop at
every hold for the manager's answer.

Review view: Next is always on, every item in the menu opens, and the seek bar can be dragged to any point
at once. A gold "Review view" tag sits in the top bar so you always know which one is open.

Each view keeps its own progress, and so does each track: opening the Athleader track in the same browser
changes nothing here.

The Course data panel (Ctrl + Alt + D, or click the gold mark in the top bar three times) shows what the
LMS would record (completion, bookmark, suspend data, interactions), lets you jump to any screen and reset
the learner. Outside an LMS the course has no learner name and shows none; in an LMS it reads
cmi.core.student_name.

Your place and your answers are saved in this browser. Closing and reopening the course offers to resume
where you left off.

CONTROLS
Bottom bar, as in the Storyline player: Play/Pause, then the seek bar stretching across the width of the bar
(the timeline of the screen you are on: its narration, or its video), then Replay, captions on or off and
volume, with Prev and Next at the right. The bar never moves between screens. When Next is greyed out, point
at it to see why it is locked.
Top bar: the menu, the lesson and "7 of 24" (where you are in it), Resources (every PDF), Transcript (the
narration and video text of the screen).
Keyboard: Tab moves through every control (gold focus ring). On the seek bar, Left and Right move 5 seconds,
Home and End jump to the start and the end, Space plays and pauses. Alt + Right arrow is Next, Alt + Left
arrow is Prev. Esc closes a menu or dialog.
