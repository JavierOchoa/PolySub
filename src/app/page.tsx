import { UploadForm } from "@/components/upload-form";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="animate-fade-up">
        <div className="mb-10 max-w-4xl">
          <div className="mb-4 inline-flex items-center rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-900 shadow-sm backdrop-blur">
            Subtitle Translation
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-teal-950 sm:text-5xl lg:text-6xl">
            Translate subtitles with rolling dialogue context.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-teal-900/75 sm:text-lg">
            Upload an SRT file, choose a provider and model, paste your API key, and let the app
            translate in contextual chunks so the dialogue stays coherent scene to scene without
            changing timing or subtitle structure.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-teal-950/80">
            <div className="rounded-2xl border bg-white/85 px-4 py-2 shadow-sm">
              Your API key is used only for the current translation
            </div>
            <div className="rounded-2xl border bg-white/85 px-4 py-2 shadow-sm">
              Subtitle timings stay under app control
            </div>
            <div className="rounded-2xl border bg-white/85 px-4 py-2 shadow-sm">
              Context summary and glossary improve consistency
            </div>
          </div>
        </div>
        <UploadForm />
      </section>
    </main>
  );
}
