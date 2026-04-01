# PolySub

PolySub is a browser-based subtitle translation app.

You upload a subtitle file, choose an AI provider, paste your own API key, pick the original subtitle language and what language to translate into, and the app returns a translated subtitle file for download from the Results panel.

The key product idea is simple:

- the app does **not** translate one subtitle line in isolation
- it translates the file in **contextual chunks**
- each chunk carries forward a short context summary and a small glossary
- the app rebuilds the final subtitle file itself so the original timing data stays intact

## Who This Is For

This project is written to stay understandable and easy to run:

- no database
- no authentication
- no user accounts
- no background jobs
- no file storage service
- no billing system

Everything runs in one Next.js app.

## What The App Supports

- `.srt` files as the preferred format
- `.vtt` files are also supported
- `OpenAI`
- `Anthropic`
- `Google`
- curated model lists per provider
- strict JSON validation for model output
- one repair attempt if a model returns malformed JSON
- progress updates while translation is running
- a guided translation workflow with progress and results panels

## How It Works

1. The browser reads the subtitle file you upload.
2. The app sends the file text, your settings, and your API key to the app's server route.
3. The server parses the subtitle file into structured entries.
4. The server splits the subtitle entries into chunks.
5. Each chunk is sent to the selected AI provider with:
   - the current subtitle entries
   - a rolling context summary from earlier chunks
   - a small glossary of names and recurring terms
6. The model returns strict JSON with translated text by subtitle index.
7. The app validates that JSON with Zod.
8. The app rebuilds the final subtitle file itself using the original indexes and timestamps.
9. The browser offers the translated file as a download.

## Security Notes

- API keys are **not** stored in a database.
- API keys are **not** saved to disk by the app.
- API keys are used only for the current request.
- The server route makes provider requests so the browser does not call provider APIs directly.
- There are no `console.log` statements printing API keys.

## Local Setup

### What you need

- Node.js 20 or newer
- pnpm

### Install

```bash
pnpm install
```

### Run the app

```bash
pnpm dev
```

Then open:

```text
http://localhost:3000
```

## How To Use The App

1. Open the app in your browser.
2. Upload an `.srt` or `.vtt` subtitle file.
3. Choose your provider.
4. Choose a model.
5. Paste your API key.
6. Choose the original subtitle language.
7. Choose which language to translate into.
8. Click `Start Translation`.
9. Wait for the progress panel to finish.
10. Download the translated file.

## Commands

Install dependencies:

```bash
pnpm install
```

Start local development:

```bash
pnpm dev
```

Run type checking:

```bash
pnpm typecheck
```

Run linting:

```bash
pnpm lint
```

Run smoke tests:

```bash
pnpm test
```

Build for production:

```bash
pnpm build
```

Start the production build locally:

```bash
pnpm start
```

## Project Structure

```text
src/
  app/
    page.tsx
    api/translate/route.ts
  components/
    upload-form.tsx
    settings-panel.tsx
    progress-panel.tsx
    result-panel.tsx
    ui/
  lib/
    subtitles/
    translation/
    providers/
    utils/
tests/
```

## Most Important Files

Main page:

- [src/app/page.tsx](/home/reivaj/dev/PolySub/src/app/page.tsx)
- [src/app/api/translate/route.ts](/home/reivaj/dev/PolySub/src/app/api/translate/route.ts)

Main browser workflow:

- [src/components/upload-form.tsx](/home/reivaj/dev/PolySub/src/components/upload-form.tsx)

Translation orchestration:

- [src/lib/translation/orchestrator.ts](/home/reivaj/dev/PolySub/src/lib/translation/orchestrator.ts)

Prompt rules:

- [src/lib/translation/prompts.ts](/home/reivaj/dev/PolySub/src/lib/translation/prompts.ts)

Validation schema:

- [src/lib/translation/schema.ts](/home/reivaj/dev/PolySub/src/lib/translation/schema.ts)

Subtitle parsing and rebuilding:

- [src/lib/subtitles/index.ts](/home/reivaj/dev/PolySub/src/lib/subtitles/index.ts)
- [src/lib/subtitles/parse-srt.ts](/home/reivaj/dev/PolySub/src/lib/subtitles/parse-srt.ts)
- [src/lib/subtitles/build-srt.ts](/home/reivaj/dev/PolySub/src/lib/subtitles/build-srt.ts)

Provider adapters:

- [src/lib/providers/openai.ts](/home/reivaj/dev/PolySub/src/lib/providers/openai.ts)
- [src/lib/providers/anthropic.ts](/home/reivaj/dev/PolySub/src/lib/providers/anthropic.ts)
- [src/lib/providers/google.ts](/home/reivaj/dev/PolySub/src/lib/providers/google.ts)
- [src/lib/providers/registry.ts](/home/reivaj/dev/PolySub/src/lib/providers/registry.ts)

Curated model list:

- [src/lib/utils/model-options.ts](/home/reivaj/dev/PolySub/src/lib/utils/model-options.ts)

Smoke tests:

- [tests/translation-flow.test.ts](/home/reivaj/dev/PolySub/tests/translation-flow.test.ts)
- [tests/subtitles.test.ts](/home/reivaj/dev/PolySub/tests/subtitles.test.ts)

## If You Want To Change Things Later

Add more models:

- Edit [src/lib/utils/model-options.ts](/home/reivaj/dev/PolySub/src/lib/utils/model-options.ts)

Add another provider:

- Add a new adapter file in [src/lib/providers](/home/reivaj/dev/PolySub/src/lib/providers)
- Register it in [src/lib/providers/registry.ts](/home/reivaj/dev/PolySub/src/lib/providers/registry.ts)
- Add it to [src/lib/utils/model-options.ts](/home/reivaj/dev/PolySub/src/lib/utils/model-options.ts)

Support another subtitle format:

- Add parsing and rebuilding in [src/lib/subtitles](/home/reivaj/dev/PolySub/src/lib/subtitles)
- Update [src/lib/subtitles/index.ts](/home/reivaj/dev/PolySub/src/lib/subtitles/index.ts)
- Update [src/lib/utils/file.ts](/home/reivaj/dev/PolySub/src/lib/utils/file.ts)

Change translation behavior:

- Edit [src/lib/translation/prompts.ts](/home/reivaj/dev/PolySub/src/lib/translation/prompts.ts)
- Edit [src/lib/translation/orchestrator.ts](/home/reivaj/dev/PolySub/src/lib/translation/orchestrator.ts)
- Edit [src/lib/translation/glossary.ts](/home/reivaj/dev/PolySub/src/lib/translation/glossary.ts)

## Updating Model Lists

The model list is intentionally curated in code.

Edit:

- [src/lib/utils/model-options.ts](/home/reivaj/dev/PolySub/src/lib/utils/model-options.ts)

Each model entry can include:

- `id`
- `label`
- `provider`
- `description`
- `recommended`
- `speedLabel`
- `qualityLabel`
- `preview`
- `legacy`

Simple maintenance rules:

- Keep only a small visible list per provider.
- Mark one model as `recommended` when it is the best default for most people.
- Use `preview: true` only for models you want visible but clearly marked as unstable or newer.
- Prefer stable model IDs for defaults.

Current curated picks:

- OpenAI:
  - `gpt-5.4` as the recommended default
  - `gpt-5.4-mini` as the fast option
  - `gpt-5.4-nano` as the cheapest option
- Anthropic:
  - `claude-sonnet-4-6` as the recommended default
  - `claude-opus-4-6` as the premium option
  - `claude-haiku-4-5` as the fast option
- Google:
  - `gemini-2.5-flash` as the recommended stable default
  - `gemini-2.5-pro` as the more advanced stable option
  - `gemini-2.5-flash-lite` as the fast option
  - `gemini-3-flash-preview` as a clearly marked preview option
  - `gemini-3-pro-preview` as a clearly marked premium preview option

## Verification Already Run

The project has been checked with:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Deploy Later

When you deploy this later, keep these points in mind:

- The hosting platform must allow outbound server-side HTTPS requests to provider APIs.
- The app does not need a database.
- The app does not need background workers.
- The app does not need file storage for the MVP.
- Users still paste their own API key into the app.
- If your host has request body size limits, keep that in mind for large subtitle files.
- If your host has request timeout limits, very large translations may need smaller chunk sizes or a later async-job design.
- If you later add rate-limit handling, caching, or retries, keep them in the server route and provider layer, not in the UI.
