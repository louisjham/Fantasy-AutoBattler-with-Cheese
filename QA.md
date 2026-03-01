# QA Bug Log

---

### BUG-1 – IntroVideo does not play; video sits on first frame

| Field | Value |
|---|---|
| **Reported** | 2026-02-27 23:39 |
| **Status** | ✅ Resolved |
| **Resolved** | 2026-02-27 23:40 |
| **Description** | The intro video does not play. The video just sits on the first frame when the game loads. |
| **Expected Behavior** | The video should auto-play from the start when the IntroVideo screen is displayed. |
| **Fix Plan** | See BUG-1 Fix Plan below |
| **Resolution** | Fixed `src` path from relative `intro.mp4` to absolute `/intro.mp4` and added `muted` attribute to satisfy browser autoplay policy; removed dev-note overlay. |

#### BUG-1 Fix Plan

- [x] Step 1: Confirm `intro.mp4` is present in `/public` and accessible at `http://localhost:<port>/intro.mp4`
- [x] Step 2: Fix the video `src` path — change `src="intro.mp4"` to `src="/intro.mp4"` so Vite serves it correctly from the public root
- [x] Step 3: Add `muted` attribute to the `<video>` element so browsers allow `autoPlay` (browsers block unmuted autoplay by policy)
- [x] Step 4: Remove the dev-note overlay div that exposes internal instructions in production
- [x] Step 5: Apply the same fixes to both `src/screens/IntroVideo.tsx` (used by App) and `src/IntroVideo.tsx` (duplicate)
- [x] Step 6: Run `tsc --noEmit` to confirm no TypeScript errors

> ✅ Bug resolved at Step 6. User confirmed video is playing. Step 7 (browser verification) was not needed.
