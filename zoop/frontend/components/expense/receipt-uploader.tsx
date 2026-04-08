"use client";

import { useState } from "react";
import axios from "axios";
import { requestReceiptUpload } from "@/lib/api/expenses";

export function ReceiptUploader({ expenseId, onUploaded }: { expenseId?: string; onUploaded: (receiptKey: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("Attach receipt to prefill the form.");

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-ink/20 bg-white/70 p-8 text-center shadow-card">
      <input
        className="hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          setUploading(true);
          setMessage(`Uploading ${file.name}...`);

          try {
            const response = await requestReceiptUpload(file.type, expenseId);
            await axios.put(response.upload_url, file, {
              headers: {
                "Content-Type": file.type
              }
            });
            onUploaded(response.receipt_key);
            setMessage("Receipt uploaded. OCR will populate after the draft is created.");
          } catch {
            setMessage("Receipt upload failed. You can still create the draft manually.");
          } finally {
            setUploading(false);
          }
        }}
      />
      <p className="text-sm font-semibold text-ink">{uploading ? "Uploading..." : "Tap to upload a receipt"}</p>
      <p className="mt-2 text-sm text-slate">{message}</p>
    </label>
  );
}
