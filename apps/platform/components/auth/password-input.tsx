"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { PASSWORD_SPECIFICATIONS } from "@/lib/validators"

export function PasswordInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className={cn("pr-10", className)} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-800"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export function PasswordSpecifications() {
  return (
    <div className="text-sm text-slate-600">
      <ol>
        {PASSWORD_SPECIFICATIONS.map((specification, i) => (
          <li
            key={specification}
          >
            [{i+1}] {specification}
          </li>
        ))}
      </ol>
    </div>
  )
}