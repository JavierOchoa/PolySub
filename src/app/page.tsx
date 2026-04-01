import { UploadForm } from "@/components/upload-form";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="animate-fade-up space-y-10">
        <div className="w-full space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-900/65 sm:text-base">
            PolySub
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-teal-950 sm:text-[2.85rem] sm:leading-[1.02] lg:whitespace-nowrap lg:text-[2.5rem] lg:leading-[1.05] xl:text-[2.8rem]">
            Translate subtitles with rolling dialogue context.
          </h1>
          <p className="max-w-[66rem] text-lg leading-8 text-teal-900/75 sm:text-xl">
            Upload an SRT file, choose a provider and model, and translate subtitles in contextual
            chunks so dialogue stays natural from scene to scene.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-teal-950/80">
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
