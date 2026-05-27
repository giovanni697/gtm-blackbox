'use client'

import { useRef, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { revokeApiKey } from './actions'

interface Props {
  keyId: string
  keyPrefix: string
  keyName: string
}

export function RevokeKeyButton({ keyId, keyPrefix, keyName }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isPending, startTransition] = useTransition()

  function openDialog() {
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
  }

  function handleConfirm() {
    startTransition(async () => {
      await revokeApiKey(keyId)
      closeDialog()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        title="Revogar chave"
        className="flex h-7 w-7 items-center justify-center text-gray-300 transition-colors hover:text-red-500"
      >
        <Trash2 size={13} strokeWidth={1.5} />
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-none border border-gray-200 bg-white p-0 shadow-xl backdrop:bg-black/40"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDialog()
        }}
      >
        <div className="w-80 p-6">
          <p className="font-sora text-sm font-semibold text-gray-900">Revogar chave?</p>
          <p className="mt-2 font-sora text-xs text-gray-500">
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
              {keyPrefix}…
            </code>{' '}
            <span className="text-gray-400">({keyName})</span>
          </p>
          <p className="mt-2 font-sora text-xs text-red-600">
            Esta ação não pode ser desfeita. Agentes usando esta chave perderão acesso
            imediatamente.
          </p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={closeDialog}
              disabled={isPending}
              className="flex-1 border border-gray-200 py-2 font-sora text-xs text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 bg-red-600 py-2 font-sora text-xs text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Revogando…' : 'Revogar'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
