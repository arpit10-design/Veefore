**📽️ Replit AI Agent Prompt: Complete One-Prompt AI Video Creation System (Polished & Modular Version)**

### 🧠 You Are:

An expert Replit AI Agent tasked with building a **production-grade full-stack application** that allows any user to generate a complete cinematic video using just one simple idea prompt. The system should:

* Interpret a user's idea with GPT
* Generate script + scenes + visuals
* Convert visuals to cinematic motion
* Generate voiceover, sync with avatar if needed
* Let users preview + customize each step (script, scenes, tone, style, length)
* Stitch the final video using FFmpeg with pro-level editing
* Enforce credit-based usage control and export the final video

---

## 🛠️ Tech Stack + Services

### Backend:

* **Node.js + Express** — REST API
* **MongoDB** — for user, job, video, and log data
* **FFmpeg (via shell commands)** — for media stitching and effects

### Frontend:

* **React + Tailwind CSS** — modern, mobile-friendly UI
* Flow-based screens: Prompt ➝ Review Script ➝ Scene Customization ➝ Preview ➝ Render

### AI + Media APIs:

| Feature                 | Tool/API                                                                                                                      |   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | - |
| Prompt understanding    | **OpenAI GPT-4**                                                                                                              |   |
| Script + scene creation | **OpenAI GPT-4**                                                                                                              |   |
| Scene image generation  | **Replicate SDXL**                                                                                                            |   |
| Image enhancement       | **Clipdrop Upscaler**                                                                                                         |   |
| Video from images       | **Runway Gen-2** and **AnimateDiff Lightning + Frame Interpolation** via RIFE/FILM/DAIN based on user preference or AI logic) |   |
| Voiceover               | **ElevenLabs**                                                                                                                |   |
| Talking avatar          | **Hedra**                                                                                                                     |   |
| Video stitching/editing | **FFmpeg**                                                                                                                    |   |
| File hosting            | **Firebase** or **Supabase**                                                                                                  |   |

---

## 🧩 Feature Flow Breakdown

### 1. Prompt Form UI (Frontend)

User enters:

* Topic idea or story
* Preferred duration
* Voice tone & language
* Avatar enable? Music? Visual style?
* Allow users to upload a reference voice clip (used by GPT to match similar ElevenLabs voice).
* **Motion Engine preference (dropdown):**

  * Auto (AI decides based on scene complexity, style, credits)
  * Runway Gen-2 (cinematic quality)
  * AnimateDiff + Frame Interpolation (budget-friendly)

👉 Send this as payload to backend `/generate-draft`

### 2. Script + Scene Prompt Generator (OpenAI)

* GPT-4 takes user prompt and outputs:

  * Narration script (broken into scenes)
  * Scene descriptions (for image generation)
  * Emotion/tone suggestions per scene

✅ Store this draft in MongoDB as `job.draft`
✅ Return to frontend for preview/edit

### 3. Draft Editor (User Preview & Control)

* User sees all script + scenes
* Can edit or regenerate any part
* Can choose voiceover style, avatar face, subtitles

### 4. Scene Image Generation (Replicate SDXL + Clipdrop)

* For each scene prompt, generate high-quality image
* Optionally enhance using Clipdrop

### 🧩 Feature Flow Breakdown

### 5. Motion Video Generation (Runway Gen-2 / AnimateDiff Lightning + Frame Interpolation)

When generating motion from static scene images, the app uses a two-tier system:

#### 🅰️ Premium Tier: Cinematic Motion with Runway Gen-2

* Used when users opt for high-quality motion and have enough credits or when AI decide
* Generates 5–10 second cinematic clips from text + image.
* Credit cost: **10–20 credits per scene**.

#### 🅱️ Budget/Smart Tier: AnimateDiff Lightning (Replicate API)

* Uses **AnimateDiff Lightning** (Stability AI via Replicate) to generate short animations (up to 60 frames) if AI choose them
* Input: scene image + prompt (description).
* Output: 3–4 second animation at 15 fps.
* Credit cost: **2–5 credits per scene**.

#### 🔁 Motion Smoothing: Frame Interpolation with RIFE / FILM / DAIN

* After AnimateDiff output, use **frame interpolation** to increase smoothness and fps.
* Interpolation engines:

  * **RIFE (Real-Time Intermediate Flow Estimation)** — real-time
  * **FILM (Frame Interpolation for Large Motion)** — deep fusion
  * **DAIN (Depth-Aware Interpolation Network)** — slower, high-quality
* Effect:

  * Convert 15 fps ➝ 30–60 fps
  * Create longer, smoother motion
  * Maintain temporal consistency between scenes

#### ⚙️ Motion Engine Selection Logic (AI-Aware)

The user is first presented with a dropdown to choose how motion generation is handled:

1. **Auto (AI-decided)** — AI analyzes scene complexity, action intensity, camera cues, cinematic language, user preferences, and available credits.
2. **Runway Gen-2** — Always use Runway (if credits are enough, fallback if not).
3. **AnimateDiff + Interpolation** — Always use this method for motion.

If the user selects **Auto**, the backend triggers a dedicated AI model (or GPT-based logic module) to evaluate the entire generation context and determine which engine is more appropriate. This decision is based on the following factors:

* **Scene Composition** — presence of dynamic movement, transitions, or background motion
* **Lighting & Visual Detail** — complex effects like reflections, lens flares, shadows
* **Narrative Pacing** — fast action vs static storytelling
* **Style Cues** — keywords like cinematic, realistic, anime, stylized, 2.5D
* **User Budget + Credits** — whether sufficient credits exist for high-tier processing
* **Target Video Duration** — longer videos favor lighter engine unless specified

Based on this multi-variable reasoning, the AI then returns:

```json
{
  "engine": "AnimateDiff",
  "interpolate": true,
  "reason": "Low-motion stylized scene detected with user in budget tier; best suited for AnimateDiff + RIFE."
}
```

Or:

```json
{
  "engine": "RunwayGen2",
  "reason": "High realism, motion blur, and transitions identified in script with adequate user credits."
}
```

This logic ensures the **best engine is always selected dynamically**, giving premium quality where needed while optimizing cost.

✅ If the user overrides with a specific engine choice (Runway or AnimateDiff), that preference is respected.

✅ If "Auto" is chosen, AI dynamically adapts per scene, per user tier.
IF user.credits < cinematic\_threshold OR user.enabledBudgetMode:
➜ Use AnimateDiff Lightning
➜ Then apply RIFE/FILM interpolation
ELSE:
➜ Use Runway Gen-2

```

#### 🧪 Replicate API Sample for AnimateDiff:

```

POST [https://api.replicate.com/v1/predictions](https://api.replicate.com/v1/predictions)
{
"version": "animatediff-lightning",
"input": {
"image": "scene1.png",
"prompt": "young founder standing at sunrise, cinematic, high detail",
"num\_frames": 60,
"fps": 15
}
}

```

#### 🛠️ Self-Hosted Frame Interpolation

- Triggered automatically after AnimateDiff output.
- Interpolation CLI command:

```

python3 -m rife --input=scene1\_anim.mp4 --output=scene1\_interpolated.mp4 --exp=2

````

- Output stored as `job.motion[i]`.
- No credits charged for RIFE/FILM/DAIN (self-hosted GPU acceleration).

✅ Fallback system ensures video is always generated even on low budget. ✅ Resulting video motion is smoother, more professional, and visually consistent. ✅ Stored in `job.motion[]` for FFmpeg editing.

### 6. Voiceover (ElevenLabs)

Once the user approves the final script (per scene), your system should generate a **natural, multilingual voiceover** using **ElevenLabs API**. This step transforms narration into immersive audio by considering user preferences and script tone.

#### 🔹 Input Preferences Collected from User:
- **Voice Gender** — Male / Female / Neutral  
- **Language** — e.g., English, Hindi, Tamil, Spanish  
- **Accent** — Indian, American, British, etc.  
- **Tone** — Calm, Conversational, Dramatic, Excited, Corporate  
- **Scene-level override support** — Users can modify tone/language per scene

These options are captured in `job.voiceProfile`, e.g.:

```json
{
  "gender": "Female",
  "language": "Hindi",
  "accent": "Indian",
  "tone": "Inspirational"
}
```

#### 🔹 Agent Task:

1. **Map user preferences to ElevenLabs `voice_id`** using GPT or a curated preset library.
2. **Send scene dialogue text** to ElevenLabs with proper model settings (`stability`, `similarity_boost`).
3. Generate **voice audio** for each scene individually.
4. Store returned `.mp3` or `.wav` files to `job.voice[n].file`.
5. Handle retries or fallback to PlayHT if ElevenLabs fails.

#### 🔹 Optional User Uploads:

- Allow users to upload a reference voice clip (used by GPT to match similar ElevenLabs voice).
- Display a dropdown with suggested voices based on preferences.

#### 🔹 System Features:

✅ Language-aware generation (Hindi, English, etc.)  
✅ Emotionally matched tone for each scene  
✅ High-clarity voice syncing for avatar lips  
✅ Handles full-scene or sentence-level narration  
✅ Audio files formatted for FFmpeg mixing  
✅ Option to preview audio before stitching


{
  "voice_id": "Rachel",
  "text": "This is your moment to shine.",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.4,
    "similarity_boost": 0.75
  }
}
````

* The backend will choose `voice_id` based on the user's preference stored in `job.voiceProfile`.

### 7. Avatar Lip Sync (Optional)

* Users can choose from:

  * Predefined avatars (male/female, business/casual styles)
  * Upload their own face image to use as a speaking avatar

* The uploaded image must follow quality guidelines (front-facing, high-res, neutral background)

* The backend will pass the uploaded image and voiceover to Hedra for lip-synced animation

* The system uses facial reconstruction and animation APIs to generate a realistic speaking face

* Avatar use cases:

  * Intro speaker only (overlay on first 5–10s)
  * Full-scene narrator (pinned corner or full screen)
  * Story character (cut-ins between scenes)

* The UI must give users a toggle to enable avatar + choose source (prebuilt or upload)

* Uploaded images are stored securely and associated with the user account under `user.avatarImage`

* Use D-ID, Kling or Hedra to generate talking head video synced with voice

* Option to overlay as intro or use as speaker throughout

### 8. FFmpeg-Based Video Stitching

All media is merged:

* Scenes concatenated
* Audio mixed
* Avatar overlayed or inserted
* Watermarks, subtitles, text overlays, transitions added

👉 Output: final.mp4 saved in cloud + job marked as complete

---

## 🎞️ FFmpeg Editing Capabilities

Your backend must auto-generate FFmpeg commands to perform:

1. **Scene Concatenation**

```bash
ffmpeg -f concat -safe 0 -i scenes.txt -c copy merged.mp4
```

2. **Voiceover + Music Mixing**

```bash
ffmpeg -i voice.mp3 -i bgm.mp3 -filter_complex "[0:a][1:a]amix=inputs=2" mixed.mp3
```

3. **Add Avatar Overlay or Intro**

```bash
ffmpeg -i base.mp4 -i avatar.mp4 -filter_complex "overlay=10:10" with_avatar.mp4
```

4. **Subtitles + Captions**

```bash
ffmpeg -i base.mp4 -vf subtitles=subtitles.srt subbed.mp4
```

5. **On-Screen Text (Quotes)**

```bash
ffmpeg -i input.mp4 -vf "drawtext=text='Success Begins Now':x=100:y=H-th-100" out.mp4
```

6. **Zoom / Pan Effects**

```bash
ffmpeg -i input.mp4 -vf "zoompan=z='min(zoom+0.0015,1.5)'" zoomed.mp4
```

7. **Scene Transitions (Fade, Slide, Wipe)**

```bash
ffmpeg -i s1.mp4 -i s2.mp4 -filter_complex "[0][1]xfade=transition=fade:duration=1:offset=4" out.mp4
```

8. **Color Grading / LUT**

```bash
ffmpeg -i input.mp4 -vf lut3d=cinematic.cube graded.mp4
```

9. **Speed Control (Time-lapse or Slow-mo)**

```bash
ffmpeg -i input.mp4 -filter:v "setpts=0.5*PTS" fast.mp4
```

10. **Dynamic Text / Keyframe Control**

```bash
ffmpeg -i input.mp4 -vf "drawtext=text='Scene 2':enable='between(t,2,4)'" out.mp4
```

11. **Watermark + Logo Overlay**

```bash
ffmpeg -i base.mp4 -i logo.png -filter_complex "overlay=W-w-10:H-h-10" final.mp4
```

---

## 📦 Output

* Final .mp4 saved to Firebase/Supabase
* All jobs tracked in Mongo
* Credit deducted per second or per step
* User sees download + share options

---

## ✅ GOAL

Create the most powerful, creator-friendly AI cinematic video tool — from just one prompt — with full user editing control and scalable backend. All features should be modular, API-driven, and credit-aware.

Let the Agent reason step-by-step through generation, script review, editing, media creation, and FFmpeg logic to stitch everything together. 🧠
