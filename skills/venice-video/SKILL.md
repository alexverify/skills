---
name: venice-video
description: Generate and transcribe videos via Venice. Covers the async /video/quote + /video/queue + /video/retrieve + /video/complete loop, text-to-video, image-to-video, video-to-video (upscale), enhancement (Topaz) controls, keyframes, audio input, reference images/video/audio/documents (R2V), Seedance 2.5 source-matched duration and aspect ratio, scene and element support, plus /video/transcriptions for YouTube URLs.
---

# Venice Video

Video is **asynchronous** — like audio music. Five endpoints:

| Endpoint | Purpose |
|---|---|
| `POST /video/quote` | Price in USD (no charge, no job). |
| `POST /video/queue` | Enqueue generation. Returns `queue_id`, charges (reserves) funds. |
| `POST /video/retrieve` | Poll status or download `video/mp4`. |
| `POST /video/complete` | Finalize & delete media from Venice storage. |
| `POST /video/transcriptions` | Sync: transcribe a YouTube URL's audio. |

## Use when

- You need text-to-video, image-to-video, video upscale, video-with-audio, or video transcription.
- You can tolerate async execution (single-digit seconds to several minutes depending on model, duration, and queue depth — inspect `average_execution_time` and `execution_duration` on `/video/retrieve` for your job's live estimate).
- You want to price a job precisely before committing (`/video/quote`).

## Lifecycle — generation

### 1. Price with `/video/quote`

```bash
curl https://api.venice.ai/api/v1/video/quote \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "wan-2-7-text-to-video",
    "duration": "5s",
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "audio": true
  }'
```

Response: `{"quote": 0.35}` USD.

`/video/quote` requires `model` and `duration`. It also takes `resolution`
(required for models priced by duration × resolution × rate), `upscale_factor`
and `video_url` for upscale models (`video_url` lets Venice auto-detect the
source duration), and `reference_video_total_duration` for reference-to-video
models — the aggregate seconds of every reference video you intend to send, up
to 150 (per-clip and family caps vary by model). Quote a fixed-duration
reference-video job without it and you get the no-reference baseline price.
It is **required** when quoting Seedance source-matched duration (`-1` /
`auto`) or aspect ratio (`adaptive` / `auto`).

Enhancement models also accept `enhancement_model` (values from
`GET /models` `constraints.topaz.models`), `target_fps` (16–120), and
`slowdown_factor` (`1` / `2` / `4` / `8`). `target_fps` ≥ 48 doubles the
price on upscaling endpoints and scales linearly on interpolation;
`slowdown_factor` multiplies the billed duration.

### 2. Submit with `/video/queue`

```bash
curl https://api.venice.ai/api/v1/video/queue \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "wan-2-7-text-to-video",
    "prompt": "Commerce being conducted in the city of Venice, Italy.",
    "negative_prompt": "low resolution, worst quality, defects",
    "duration": "5s",
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "audio": true
  }'
```

Response: `{ "model": "...", "queue_id": "uuid", "download_url": "https://..." }`.

- `download_url` only appears for **VPS-backed** models. When present, the retrieve endpoint returns JSON status only — fetch this URL to download. Valid 24 h.

### 3. Poll with `/video/retrieve`

```bash
curl https://api.venice.ai/api/v1/video/retrieve \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"...","queue_id":"..."}' \
  --output out.mp4
```

- Processing: JSON `{"status":"PROCESSING","average_execution_time":145000,"execution_duration":53200}` (ms).
- Completed (non-VPS): binary `video/mp4` body.
- Completed (VPS-backed): `{"status":"COMPLETED", ...}` — fetch the `download_url` from the queue response.
- `delete_media_on_completion: true` auto-deletes after successful retrieve.

### 4. Finalize with `/video/complete`

```bash
curl https://api.venice.ai/api/v1/video/complete \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"...","queue_id":"..."}'
```

## `QueueVideoRequest` fields

Availability depends on the model — check `GET /models?type=video`.

| Field | Type | Notes |
|---|---|---|
| `model` | string | Required. |
| `prompt` | string, ≤ 2500–20000 | **Required** (min length 1). Schema max is 20000; most models cap near 2500. |
| `negative_prompt` | string, ≤ 2500–20000 | Same per-model cap as `prompt`. |
| `duration` | `1s`–`30s` in 1s steps, plus `-1`, `1 gen`, `auto`, `Auto` | Required. Model-specific subset. `1 gen` is one generation unit for models priced per generation. On Seedance 2.5 R2V edit, `-1` or `auto` matches output length to the source clip (`reference_video_urls` required; source 4–30 s). |
| `aspect_ratio` | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `9:21`, `16:9`, `21:9`, `adaptive`, `auto` | Some models ignore. On Seedance 2.x R2V edit/extend, `adaptive` or `auto` matches the source clip. |
| `omni_reference_task_type` | `auto` / `reference` / `edit` / `extend` | Seedance 2.5 R2V only. Hint forwarded to BytePlus; aliases `editing`→`edit`, `extension`→`extend`. Omit to infer from the prompt when `reference_video_urls` are present. Prompt must still match the type. |
| `resolution` | `256p`–`4k`, `1x` / `2x` / `4x`, `2K`, `768P`, `true_1080p` | Use `upscale_factor` for upscale models. |
| `upscale_factor` | `1` / `2` / `4` | Only for upscale models. `1` = quality enhancement. Default `2`. |
| `audio` | bool | Default `true`. Audio-capable models. |
| `image_url` | URL or `data:` URL | Image-to-video reference frame. |
| `end_image_url` | URL or data URL | End frame / transition reference. |
| `audio_url` | URL or data URL | Background music input. WAV/MP3, ≤ 30 s, ≤ 15 MB. |
| `video_url` | URL or data URL | Video-to-video / upscale / enhancement input. MP4/MOV/WebM. |
| `reference_image_urls[]` | array of URLs, ≤ 30 | Character / style consistency images. |
| `reference_video_urls[]` | array of URLs, ≤ 10 | R2V models (e.g. Seedance 2.x). Inherits subject motion, camera, style. Per clip 2–15 s, `.mp4` or `.mov`, ≤ 50 MB; the field description still lists aggregate ≤ 15 s (see gotchas). |
| `reference_audio_urls[]` | array of URLs, ≤ 10 | Donor audio for vocal timbre, narration, or SFX. Per clip 2–15 s, `.wav` or `.mp3`; aggregate ≤ 15 s. **Must be paired with at least one reference image or reference video.** |
| `reference_document_urls[]` | array of URLs, ≤ 1 | Wan 3.0 Omni-Reference. Document or public webpage URL; Venice fetches it as `type: "file"` (≤ 100 MB). |
| `keyframes[]` | array, ≤ 10 | Keyframe-driven models. Each item is `{ image_url, frame_index }`. `frame_index` ≥ 0, unique, and ≤ `duration × 24` (24 fps). |
| `consents` | object | Provider-specific consent attestations. Seedance requires consent only when the submitted media contains faces. |
| `elements[]` | array, ≤ 4 | Advanced models (e.g. Kling O3 R2V): each has `frontal_image_url`, up to 3 `reference_image_urls`, `video_url`. Reference in prompt as `@Element1`, `@Element2`. |
| `scene_image_urls[]` | array of URLs, ≤ 4 | Advanced scene refs; reference in prompt as `@Image1`, `@Image2`. |

### Enhancement-only fields (Topaz and similar)

Present on `/video/queue`. Values apply only to enhancement models — check
`GET /models?type=video` and `constraints.topaz.models` before sending.

| Field | Type | Notes |
|---|---|---|
| `enhancement_model` | string | Provider-side model; listed per model in `constraints.topaz.models`. |
| `target_fps` | integer 16–120 | Frame interpolation target. Omit to keep the source frame rate. ≥ 48 doubles price on upscaling endpoints. |
| `slowdown_factor` | `1` / `2` / `4` / `8` | Slow-motion; `2` makes the output twice as long at the target FPS. Multiplies billed duration. |
| `softness` | number 1–5 | Sharpest (1) to softest (5). |
| `creativity` | number 0–1 | How much new detail the model invents. |
| `realism` | number 0–1 | Bias generated detail toward photorealism. |
| `sharp` | number 0–1 | Output sharpness (0.5 = neutral). |
| `compression` | number 0–1 | Compression-artifact removal. |
| `noise` | number 0–1 | Noise reduction. |
| `halo` | number 0–1 | Halo reduction. |
| `grain` | number 0–0.1 | Film grain. |
| `recover_detail` | number 0–1 | Recover original detail. |
| `h264_output` | bool | Output H.264 instead of the default H.265. |
| `output_format` | `mp4` / `prores` | SDR-to-HDR only. `mp4` = 10-bit H.265 HDR10; `prores` = 10-bit ProRes. |

## Common recipes

### Text → video with audio

```json
{
  "model": "wan-2-7-text-to-video",
  "prompt": "A golden retriever chasing a frisbee in slow motion at sunset.",
  "duration": "6s",
  "aspect_ratio": "16:9",
  "resolution": "720p",
  "audio": true
}
```

### Image → video

```json
{
  "model": "<image-to-video model>",
  "prompt": "Camera slowly zooms out, revealing the cityscape.",
  "image_url": "https://example.com/cityscape.jpg",
  "duration": "5s",
  "aspect_ratio": "16:9"
}
```

### Video upscale

```json
{
  "model": "<upscale model>",
  "video_url": "data:video/mp4;base64,...",
  "upscale_factor": 2,
  "duration": "Auto"
}
```

### Enhancement (interpolation / slow-mo)

```json
{
  "model": "<enhancement model>",
  "video_url": "https://example.com/input.mp4",
  "duration": "Auto",
  "enhancement_model": "Proteus",
  "target_fps": 60,
  "slowdown_factor": 2
}
```

`enhancement_model` values come from `GET /models` `constraints.topaz.models`
for the chosen model — do not hardcode a name that is not listed there.

### Seedance 2.5 source-matched R2V edit

```json
{
  "model": "<seedance-2-5-r2v model>",
  "prompt": "Continue the clip: the camera pushes in as the subject turns.",
  "duration": "auto",
  "aspect_ratio": "adaptive",
  "omni_reference_task_type": "edit",
  "reference_video_urls": ["https://example.com/source-4-to-30s.mp4"]
}
```

Quote the same job with `duration: "auto"` (or `"-1"`),
`aspect_ratio: "adaptive"` (or `"auto"`), and
`reference_video_total_duration` set to the source clip's length in seconds.

### Multi-element consistency (Kling O3 R2V-style)

```json
{
  "model": "<advanced-model>",
  "prompt": "@Element1 walks toward @Element2 against @Image1.",
  "elements": [
    { "frontal_image_url": "<char1.png>", "reference_image_urls": ["<alt1.png>"] },
    { "frontal_image_url": "<char2.png>" }
  ],
  "scene_image_urls": ["<street-scene.jpg>"]
}
```

## `/video/transcriptions` (sync)

Transcribe a YouTube video URL directly — no queue.

```bash
curl https://api.venice.ai/api/v1/video/transcriptions \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=...","response_format":"json"}'
```

Response: `{"transcript":"...","lang":"en"}` (JSON) or plain `text/plain` body when `response_format: text`.

For arbitrary audio files, use [`venice-audio-transcription`](../venice-audio-transcription/SKILL.md) instead.

## Full polling loop

```ts
async function waitForVideo(model: string, queueId: string, downloadUrl?: string) {
  while (true) {
    const res = await fetch(`${base}/video/retrieve`, {
      method: 'POST', headers,
      body: JSON.stringify({ model, queue_id: queueId }),
    })
    const ct = res.headers.get('content-type') ?? ''
    if (ct.startsWith('video/')) {
      return Buffer.from(await res.arrayBuffer())
    }
    const body = await res.json()
    if (body.status === 'COMPLETED' && downloadUrl) {
      const v = await fetch(downloadUrl)
      return Buffer.from(await v.arrayBuffer())
    }
    if (body.status !== 'PROCESSING') throw new Error(`unexpected ${body.status}`)
    await new Promise(r => setTimeout(r, 5000))
  }
}
```

## Errors

| Code | Meaning |
|---|---|
| `400` | Bad params (duration/resolution not supported by model, missing required `image_url` for i2v, missing `prompt`, etc.). |
| `401` | Auth / Pro-only. |
| `402` | Insufficient balance. |
| `403` | Model unavailable in your region. |
| `413` | Request payload too large — shrink images / audio. (Returned from `/video/queue`.) |
| `422` | Content policy violation. (Returned from `/video/queue`.) |
| `500` | Inference failed. |
| `503` | Model at capacity — retry later. **On `/video/retrieve`**, returned when the queue is backed up. |

`/video/queue` does not document `503` in the spec — upstream capacity issues surface there as `500`. Watch for `503` specifically on `/video/retrieve`.

## Gotchas

- **`duration` is required on `/video/queue`.** `Auto`, `auto`, and `-1` are valid explicit values; the last two are Seedance 2.5 source-matched edit, not a generic "pick for me."
- `download_url` is **only sometimes** returned at queue time. Always handle both paths: binary from `/retrieve` OR fetching `download_url` after status `COMPLETED`.
- `download_url` expires in 24 h — download promptly.
- Upscale models use `upscale_factor` *instead of* `resolution`.
- Array caps: `reference_image_urls[]` ≤ 30, `reference_video_urls[]` ≤ 10, `reference_audio_urls[]` ≤ 10, `reference_document_urls[]` ≤ 1, `keyframes[]` ≤ 10, `elements[]` ≤ 4, `scene_image_urls[]` ≤ 4. Over-limit is `400`.
- Quote reference-video jobs with `reference_video_total_duration` (aggregate seconds, spec max 150). It switches the quote to the provider's "input with video" rate tier and the `(input + output) × pixels` token formula. Required for Seedance source-matched duration/aspect quotes; omit it on a fixed-duration quote and you get the no-reference baseline, which will under-quote the job. The queue field text still says reference-video aggregate ≤ 15 s — honor the stricter cap the model advertises on `GET /models`.
- Enhancement fields (`enhancement_model`, `target_fps`, `slowdown_factor`, softness/creativity/…) are ignored or rejected on non-enhancement models. Read `constraints.topaz.models` first.
- `data:` URLs count toward payload size; large base64 videos may trip `413` — prefer hosted URLs.
- `/video/transcriptions` is YouTube-URL-only; it does not accept arbitrary video uploads (use ffmpeg to strip audio, then `/audio/transcriptions`).
