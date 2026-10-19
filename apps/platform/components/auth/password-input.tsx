"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

export function PasswordInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className={cn("pr-10", className)} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-800"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}