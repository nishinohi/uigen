"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolInvocationBadgeProps {
  toolName: string;
  args: any;
  state: "result" | "call";
  result?: any;
}

export function ToolInvocationBadge({
  toolName,
  args,
  state,
  result,
}: ToolInvocationBadgeProps) {
  const getDisplayText = () => {
    const path = args?.path;
    const filename = path ? path.split("/").pop() || path : "";

    if (toolName === "str_replace_editor") {
      const command = args?.command;
      switch (command) {
        case "create":
          return `📄 Creating file: ${filename}`;
        case "str_replace":
          return `✏️ Editing file: ${filename}`;
        case "insert":
          return `📝 Inserting into file: ${filename}`;
        case "view":
          return `👁️ Viewing file: ${filename}`;
        case "undo_edit":
          return `↩️ Undoing edit in file: ${filename}`;
        default:
          return `🔧 Processing file: ${filename}`;
      }
    }

    if (toolName === "file_manager") {
      const command = args?.command;
      switch (command) {
        case "list":
          return `📁 Listing files in: ${args?.path || "/"}`;
        case "delete":
          return `🗑️ Deleting file: ${filename}`;
        case "rename":
          return `✏️ Renaming file: ${args?.old_path?.split("/").pop() || ""} → ${args?.new_path?.split("/").pop() || ""}`;
        case "mkdir":
          return `📂 Creating directory: ${filename}`;
        default:
          return `📁 Managing files`;
      }
    }

    // フォールバック：ツール名をそのまま表示
    return toolName;
  };

  const isCompleted = state === "result" && result;
  const displayText = getDisplayText();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-xs border transition-colors",
        isCompleted
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-neutral-50 border-neutral-200 text-neutral-700"
      )}
    >
      {isCompleted ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="font-medium">{displayText}</span>
    </div>
  );
}