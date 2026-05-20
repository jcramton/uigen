"use client";

import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

interface StrReplaceEditorArgs {
  command: "view" | "create" | "str_replace" | "insert" | "undo_edit";
  path: string;
}

interface FileManagerArgs {
  command: "rename" | "delete";
  path: string;
  new_path?: string;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

function getBasename(filePath: string): string {
  const parts = filePath.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || filePath;
}

function parseArgs(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

function getLabel(tool: ToolInvocation): string {
  if (tool.toolName === "str_replace_editor") {
    const args = parseArgs(tool.args) as StrReplaceEditorArgs;
    const filename = getBasename(args.path);
    switch (args.command) {
      case "create":      return `Creating ${filename}`;
      case "str_replace": return `Editing ${filename}`;
      case "insert":      return `Editing ${filename}`;
      case "view":        return `Reading ${filename}`;
      case "undo_edit":   return `Reverting ${filename}`;
      default:            return tool.toolName;
    }
  }

  if (tool.toolName === "file_manager") {
    const args = parseArgs(tool.args) as FileManagerArgs;
    const filename = getBasename(args.path);
    switch (args.command) {
      case "rename": return `Renaming ${filename}`;
      case "delete": return `Deleting ${filename}`;
      default:       return tool.toolName;
    }
  }

  return tool.toolName;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const label = getLabel(toolInvocation);
  const isDone =
    toolInvocation.state === "result" &&
    (toolInvocation as { result?: unknown }).result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
