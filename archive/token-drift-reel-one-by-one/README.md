# Token drift reel, one-at-a-time version (archived)

The design system audit's hero reel as it was when the tokens changed one after another: the colour
in code, then the weight in design (with a cursor picking from a Libraries menu), then the spacing in
both. It runs about 16 seconds. Replaced by a version where every token changes together in one beat.

## Files

- `TokenDriftReel.tsx`: the reel component.
- `TokenDriftReel.css`: its styles.

## Restore

1. Copy both files back to `src/components/react/`, replacing the current ones.
2. They depend on `public/images/case-studies/des-sys/pink-texture.webp` and
   `public/images/case-studies/des-sys/grey-texture.webp`. If either has since been removed, restore it too.
