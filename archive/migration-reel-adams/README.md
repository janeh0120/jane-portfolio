# Migration reel, ADAMS version (archived)

The migration case study's motion reel as it was when its final act unfolded the acronym
**ADAMS** into "Agentically Discovers And Migrates as a Service". Replaced by a version that
types out a plain sentence instead ("So we built a migration dashboard that discovers and migrates
codebases, agentically."), so the reel no longer uses the tool's internal name.

Everything before the acronym (intro, agent window, folder rain, swarm, pink stack) is the same
as the version that replaced it at the time of archiving.

## Files

- `MigrationReel.tsx`: the reel component.
- `MigrationReel.css`: its styles.

## Restore

1. Copy both files back to `src/components/react/`, replacing the current ones.
2. They depend on files that still live in the project: `src/lib/folder-fall.ts`,
   `src/lib/folder-fall-sample.ts`, `src/lib/folder-fall.worker.ts`, the `matter-js` package, and
   `public/images/case-studies/migration/reel-bg.webp`. If any of those have since been removed,
   restore them too.
