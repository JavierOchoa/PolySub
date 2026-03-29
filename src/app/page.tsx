import { UploadForm } from "@/components/upload-form";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="animate-fade-up">
        <div className="mb-10 max-w-5xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-teal-950 sm:text-5xl lg:text-[4.5rem] lg:leading-[0.95]">
            Translate subtitles with rolling dialogue context.
          </h1>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-teal-900/75 sm:text-xl">
            Upload an SRT file, choose a provider and model, and translate subtitles in contextual
            chunks so dialogue stays natural from scene to scene.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-teal-950/80">
            <div className="rounded-2xl border bg-white/85 px-4 py-2 shadow-sm">Your API key is used only for this translation</div>
            <div className="rounded-2xl border bg-white/85 px-4 py-2 shadow-sm">Original timings stay unchanged</div>
            <div className="rounded-2xl border bg-white/85 px-4 py-2 shadow-sm">Context and glossary improve consistency</div>
          </div>
        </div>
        <UploadForm />
      </section>
    </main>
  );
}
