"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useTransition } from "react";
import { addCompany } from "@/app/admin/actions";

const inputCls =
  "w-full rounded-md border border-charcoal/20 bg-white px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none";

export function NewCompanyDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await addCompany(formData);
        setOpen(false);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-navy transition hover:bg-amber">
          + New company
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-navy/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="font-display text-lg font-semibold">
            New company
          </Dialog.Title>
          <form action={submit} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-warmgray">Company name *</span>
              <input name="name" required className={inputCls} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-warmgray">Report PIN * (4–10 digits)</span>
              <input
                name="pin"
                required
                pattern="\d{4,10}"
                inputMode="numeric"
                className={inputCls}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-warmgray">
                Meta ad account ID (e.g. act_1234567890)
              </span>
              <input name="metaAdAccountId" className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block text-warmgray">Currency</span>
                <input name="currency" defaultValue="ETB" className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-warmgray">
                  Contacts “company” value
                </span>
                <input name="sourceCompany" className={inputCls} />
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-md border border-line px-4 py-2 text-sm text-warmgray"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-navy transition hover:bg-amber disabled:opacity-60"
              >
                {pending ? "Saving…" : "Create"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
