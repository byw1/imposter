# Store art

Every picture of the app, made from the app itself.

```sh
npm run store-art
```

1. **Build** the web version of the app (`expo export -p web`) and serve it
   with the cross-origin headers `expo-sqlite` needs (`serve.js`).
2. **Play** a real five-player game in Chromium at the iPhone 6.9" size
   (`capture.js`): type the names, hold each card to peek, vote, reveal, guess.
   Roles and words are random, so it reads the screen to find the imposter.
   A second run records the round as video for the gameplay GIF.
3. **Render** (`render.js`) three HTML templates in Chromium:
   - `store.html`: seven App Store screenshots, 1320×2868, no alpha channel.
   - `video.html`: two 1080×1920 videos for Reels, TikTok and Shorts. Each is
     a pure `render(t)` function, drawn frame by frame at 30fps and encoded
     with ffmpeg, so every frame lands exactly on time however slow the
     machine.
   - `readme.html`: the banner, the phone line-up, Shade's moods and the
     screenshot strip in `docs/images`.

Shade comes from `src/ui/shadeFace.ts` through `spec/generate-mascot.js`, and
the fonts from `node_modules`, so the art always matches the app.

**Needs** Playwright with Chromium (`npx playwright install chromium`) and
ffmpeg. Set `PLAYWRIGHT_MODULE` or `CHROMIUM_PATH` to use an installed copy.

**Output:** `out/` (store screenshots and videos, not committed) and
`docs/images` (committed).
