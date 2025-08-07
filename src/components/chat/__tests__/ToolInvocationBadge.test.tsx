import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

test("ToolInvocationBadge displays create command correctly", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/components/Button.tsx" }}
      state="call"
    />
  );

  expect(screen.getByText("📄 Creating file: Button.tsx")).toBeDefined();
});

test("ToolInvocationBadge displays str_replace command correctly", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/src/App.jsx" }}
      state="call"
    />
  );

  expect(screen.getByText("✏️ Editing file: App.jsx")).toBeDefined();
});

test("ToolInvocationBadge displays insert command correctly", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "/src/styles.css" }}
      state="call"
    />
  );

  expect(screen.getByText("📝 Inserting into file: styles.css")).toBeDefined();
});

test("ToolInvocationBadge displays view command correctly", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "/package.json" }}
      state="call"
    />
  );

  expect(screen.getByText("👁️ Viewing file: package.json")).toBeDefined();
});

test("ToolInvocationBadge displays file_manager list command correctly", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      args={{ command: "list", path: "/src" }}
      state="call"
    />
  );

  expect(screen.getByText("📁 Listing files in: /src")).toBeDefined();
});

test("ToolInvocationBadge displays file_manager delete command correctly", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/src/old.js" }}
      state="call"
    />
  );

  expect(screen.getByText("🗑️ Deleting file: old.js")).toBeDefined();
});

test("ToolInvocationBadge displays file_manager rename command correctly", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      args={{
        command: "rename",
        old_path: "/src/OldComponent.tsx",
        new_path: "/src/NewComponent.tsx",
      }}
      state="call"
    />
  );

  expect(
    screen.getByText("✏️ Renaming file: OldComponent.tsx → NewComponent.tsx")
  ).toBeDefined();
});

test("ToolInvocationBadge shows loading state when state is call", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/App.tsx" }}
      state="call"
    />
  );

  // Check for loading spinner
  expect(container.querySelector(".animate-spin")).toBeDefined();
  // Check for neutral styling
  expect(container.querySelector(".bg-neutral-50")).toBeDefined();
});

test("ToolInvocationBadge shows completed state when state is result", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/App.tsx" }}
      state="result"
      result="File created successfully"
    />
  );

  // Check for success indicator
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  // Check for success styling
  expect(container.querySelector(".bg-emerald-50")).toBeDefined();
});

test("ToolInvocationBadge handles missing path gracefully", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create" }}
      state="call"
    />
  );

  expect(screen.getByText("📄 Creating file:")).toBeDefined();
});

test("ToolInvocationBadge handles unknown command gracefully", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "unknown", path: "/src/file.txt" }}
      state="call"
    />
  );

  expect(screen.getByText("🔧 Processing file: file.txt")).toBeDefined();
});

test("ToolInvocationBadge displays unknown tool name as fallback", () => {
  render(
    <ToolInvocationBadge
      toolName="unknown_tool"
      args={{ command: "action" }}
      state="call"
    />
  );

  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("ToolInvocationBadge handles deeply nested paths correctly", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{
        command: "create",
        path: "/src/components/ui/buttons/PrimaryButton.tsx",
      }}
      state="call"
    />
  );

  expect(screen.getByText("📄 Creating file: PrimaryButton.tsx")).toBeDefined();
});

test("ToolInvocationBadge handles root path correctly", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      args={{ command: "list", path: "/" }}
      state="call"
    />
  );

  expect(screen.getByText("📁 Listing files in: /")).toBeDefined();
});

test("ToolInvocationBadge handles empty args object", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{}}
      state="call"
    />
  );

  expect(screen.getByText("🔧 Processing file:")).toBeDefined();
});