import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ToolInvocation } from "ai";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

function makeCall(
  toolName: string,
  args: Record<string, unknown>
): ToolInvocation {
  return { state: "call", toolCallId: "test-id", toolName, args } as ToolInvocation;
}

function makeResult(
  toolName: string,
  args: Record<string, unknown>,
  result: unknown = "OK"
): ToolInvocation {
  return { state: "result", toolCallId: "test-id", toolName, args, result } as ToolInvocation;
}

// --- str_replace_editor label generation ---

test("str_replace_editor create shows 'Creating'", () => {
  render(<ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "create", path: "src/Button.tsx" })} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("str_replace_editor str_replace shows 'Editing'", () => {
  render(<ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "str_replace", path: "src/App.tsx" })} />);
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("str_replace_editor insert shows 'Editing'", () => {
  render(<ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "insert", path: "src/App.tsx" })} />);
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("str_replace_editor view shows 'Reading'", () => {
  render(<ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "view", path: "src/index.tsx" })} />);
  expect(screen.getByText("Reading index.tsx")).toBeDefined();
});

test("str_replace_editor undo_edit shows 'Reverting'", () => {
  render(<ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "undo_edit", path: "src/App.tsx" })} />);
  expect(screen.getByText("Reverting App.tsx")).toBeDefined();
});

// --- file_manager label generation ---

test("file_manager rename shows 'Renaming'", () => {
  render(<ToolCallBadge toolInvocation={makeCall("file_manager", { command: "rename", path: "old/Button.tsx", new_path: "new/Button.tsx" })} />);
  expect(screen.getByText("Renaming Button.tsx")).toBeDefined();
});

test("file_manager delete shows 'Deleting'", () => {
  render(<ToolCallBadge toolInvocation={makeCall("file_manager", { command: "delete", path: "src/Unused.tsx" })} />);
  expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
});

// --- Basename extraction ---

test("extracts basename from deeply nested path", () => {
  render(<ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "create", path: "src/components/ui/Card.tsx" })} />);
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("handles filename with no directory", () => {
  render(<ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "view", path: "App.tsx" })} />);
  expect(screen.getByText("Reading App.tsx")).toBeDefined();
});

// --- Fallbacks ---

test("unknown toolName renders raw toolName", () => {
  render(<ToolCallBadge toolInvocation={makeCall("some_unknown_tool", {})} />);
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

test("known tool with unknown command renders raw toolName", () => {
  render(<ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "frobnicate", path: "x.ts" })} />);
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

// --- State-based visuals ---

test("shows spinner when state is 'call'", () => {
  const { container } = render(
    <ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "create", path: "Button.tsx" })} />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is 'partial-call'", () => {
  const tool = { state: "partial-call", toolCallId: "test-id", toolName: "str_replace_editor", args: { command: "create", path: "Button.tsx" } } as ToolInvocation;
  const { container } = render(<ToolCallBadge toolInvocation={tool} />);
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("shows green dot when state is 'result' with truthy result", () => {
  const { container } = render(
    <ToolCallBadge toolInvocation={makeResult("str_replace_editor", { command: "create", path: "Button.tsx" })} />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is 'result' but result is null", () => {
  const { container } = render(
    <ToolCallBadge toolInvocation={makeResult("str_replace_editor", { command: "create", path: "Button.tsx" }, null)} />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

// --- Label present in both states (regression) ---

test("label text is present in call state", () => {
  render(<ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "create", path: "Button.tsx" })} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("label text is present in result state", () => {
  render(<ToolCallBadge toolInvocation={makeResult("str_replace_editor", { command: "create", path: "Button.tsx" })} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});
