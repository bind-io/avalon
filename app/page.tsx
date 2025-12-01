"use client";

import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";

const Converter = dynamic(
  () => import("./components/Converter").then((mod) => mod.Converter),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-4xl h-64 rounded-3xl border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading converter...</div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-4 py-20 flex flex-col items-center gap-12">
        <div className="text-center space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-300 mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Premium HEIC Converter</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            Avalon
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed">
            Convert your HEIC images to JPG instantly in your browser.
            <br />
            Secure, private, and no file size limits.
          </p>
        </div>

        <Converter />

        <footer className="mt-20 text-center text-sm text-zinc-600">
          <p>
            &copy; {new Date().getFullYear()} Avalon. All conversions happen
            locally on your device.
          </p>
        </footer>
      </div>
    </main>
  );
}
