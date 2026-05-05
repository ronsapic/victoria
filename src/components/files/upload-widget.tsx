"use client";

import { useState } from "react";

import { firebaseAuthFetch } from "@/lib/auth/firebase-auth-fetch";
import { btnGhostClass, btnPrimaryClass, inputClass, labelClass } from "@/components/form-styles";

export function UploadWidget({
  onUploaded,
  category = "GENERAL",
  visibility = "PRIVATE",
}: {
  onUploaded: (fileId: string) => void;
  category?: string;
  visibility?: "PRIVATE" | "RESIDENTS";
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setFileId(null);
    try {
      formData.set("category", category);
      formData.set("visibility", visibility);
      const res = await firebaseAuthFetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { ok?: boolean; fileId?: string; error?: string };
      if (!res.ok || !data.fileId) {
        throw new Error(data.error ?? "Upload failed");
      }
      setFileId(data.fileId);
      onUploaded(data.fileId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <form action={onSubmit} className="space-y-3">
        <div>
          <label className={labelClass}>File</label>
          <input name="file" type="file" required className={inputClass} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={btnPrimaryClass} disabled={pending}>
            {pending ? "Uploading…" : "Upload"}
          </button>
          {fileId && (
            <button
              type="button"
              className={btnGhostClass}
              onClick={() => navigator.clipboard.writeText(fileId)}
            >
              Copy File ID
            </button>
          )}
        </div>
      </form>
      <p className="text-xs text-zinc-500">
        Uploaded files are stored under <code>storage/</code> locally during dev.
      </p>
    </div>
  );
}

