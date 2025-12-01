"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import heicConvert from "heic-convert";
import JSZip from "jszip";
import { Buffer } from "buffer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  Download,
  FileImage,
  Loader2,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ConvertedFile {
  id: string;
  originalName: string;
  convertedName: string;
  blob: Blob;
  url: string;
}

interface FileItem {
  id: string;
  file: File;
  status: "pending" | "converting" | "completed" | "error";
  converted?: ConvertedFile;
}

export function Converter() {
  if (typeof window !== "undefined") {
    window.Buffer = window.Buffer || Buffer;
  }
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isConvertingAll, setIsConvertingAll] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/heic": [".heic", ".heif"],
    },
  });

  const convertFile = async (fileItem: FileItem) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "converting" } : f
        )
      );

      console.log(
        `Converting file: ${fileItem.file.name}, Size: ${fileItem.file.size}, Type: ${fileItem.file.type}`
      );

      const arrayBuffer = await fileItem.file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      console.log(
        "File header:",
        Array.from(buffer.slice(0, 16))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
      );

      const outputBuffer = await heicConvert({
        buffer,
        format: 'JPEG',
        quality: 0.9,
      });

      const outputBlob = new Blob([new Uint8Array(outputBuffer)], { type: "image/jpeg" });
      const url = URL.createObjectURL(outputBlob);
      const convertedName = fileItem.file.name.replace(
        /\.(heic|heif)$/i,
        ".jpg"
      );

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? {
                ...f,
                status: "completed",
                converted: {
                  id: Math.random().toString(36).substring(7),
                  originalName: fileItem.file.name,
                  convertedName,
                  blob: outputBlob,
                  url,
                },
              }
            : f
        )
      );
      toast.success(`Converted ${fileItem.file.name}`);
    } catch (error: any) {
      console.error("Conversion error:", error);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileItem.id ? { ...f, status: "error" } : f))
      );
      toast.error(
        `Failed to convert ${fileItem.file.name}: ${
          error?.message || "Unknown error"
        }`
      );
    }
  };

  const convertAll = async () => {
    setIsConvertingAll(true);
    const pendingFiles = files.filter(
      (f) => f.status === "pending" || f.status === "error"
    );

    // Process sequentially to avoid freezing the browser with too many workers
    for (const file of pendingFiles) {
      await convertFile(file);
    }
    setIsConvertingAll(false);
  };

  const downloadFile = (converted: ConvertedFile) => {
    const a = document.createElement("a");
    a.href = converted.url;
    a.download = converted.convertedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const completedFiles = files.filter(
      (f) => f.status === "completed" && f.converted
    );

    if (completedFiles.length === 0) return;

    completedFiles.forEach((f) => {
      if (f.converted) {
        zip.file(f.converted.convertedName, f.converted.blob);
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted_images.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const completedCount = files.filter((f) => f.status === "completed").length;
  const totalCount = files.length;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out",
          isDragActive
            ? "border-blue-500 bg-blue-500/10"
            : "border-white/20 hover:border-white/40 hover:bg-white/5",
          "h-64 flex flex-col items-center justify-center text-center p-8 backdrop-blur-xl bg-black/20"
        )}
      >
        <input {...getInputProps()} />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              {isDragActive ? "Drop files here" : "Drag & drop HEIC files"}
            </h3>
            <p className="text-sm text-zinc-400">
              or click to browse from your computer
            </p>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <FileImage className="w-5 h-5 text-blue-400" />
                Files ({completedCount}/{totalCount})
              </h2>
              <div className="flex gap-2">
                {completedCount > 0 && (
                  <button
                    onClick={downloadAll}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download All
                  </button>
                )}
                {files.some((f) => f.status === "pending") && (
                  <button
                    onClick={convertAll}
                    disabled={isConvertingAll}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConvertingAll ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    Convert All
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                    {file.status === "completed" && file.converted ? (
                      <img
                        src={file.converted.url}
                        alt={file.converted.convertedName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <FileImage className="w-6 h-6 text-zinc-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {file.status === "converting" && (
                      <div className="flex items-center gap-2 text-blue-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Converting...</span>
                      </div>
                    )}

                    {file.status === "completed" && file.converted && (
                      <button
                        onClick={() => downloadFile(file.converted!)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    {file.status === "error" && (
                      <span className="text-red-400 text-sm">Error</span>
                    )}

                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
