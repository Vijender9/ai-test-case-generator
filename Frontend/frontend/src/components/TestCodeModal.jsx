import React, { useMemo, useState } from "react";
import { api } from "../api";

function defaultTestPath(filename = "") {
  // smart default: place tests next to file
  if (!filename) return "tests/generated.test.js";
  const parts = filename.split("/");
  const name = parts.pop() || "file";
  const base = name.replace(/\.(jsx?|tsx?|py|java)$/, "");
  if (/\.(py)$/.test(name)) return `tests/test_${base}.py`;
  if (/\.(java)$/.test(name)) return `src/test/java/${base}Test.java`;
  return `__tests__/${base}.test.${name.endsWith(".ts") || name.endsWith(".tsx") ? "ts" : "js"}`;
}

const TestCodeModal = ({ isOpen, code, onClose, testMeta, repo, user }) => {
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [testPath, setTestPath] = useState(() => defaultTestPath(testMeta?.filename));
  const owner = useMemo(() => repo?.owner?.login || repo?.full_name?.split("/")?.[0], [repo]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code || "");
    alert("Test code copied to clipboard!");
  };

  const createPR = async () => {
    if (!repo || !owner) return;
    setCreating(true); setError(null); setSuccess(null);
    try {
      const { data } = await api.post("/api/github/create-pr", {
        owner,
        repo: repo.name,
        testPath,
        testCode: code,
        title: `test: add tests for ${testMeta?.filename}`,
        body: `Auto-generated test for \`${testMeta?.filename}\`\n\nSummary: ${testMeta?.summary}\nPurpose: ${testMeta?.purpose}`,
        baseBranch: repo.default_branch || "main",
      });
      setSuccess(data?.prUrl || "PR created");
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to create PR");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-3xl w-full">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">Generated Test Code</h2>
          <button className="text-sm text-gray-500 hover:text-black" onClick={onClose}>✕</button>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          <div>Repo: <b>{owner}/{repo?.name}</b></div>
          <div>Source file: <code className="font-mono">{testMeta?.filename}</code></div>
        </div>

        <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto max-h-[50vh] mt-4 text-sm">
{code}
        </pre>

        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium">Test file path (you can edit)</label>
          <input
            value={testPath}
            onChange={(e) => setTestPath(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="__tests__/file.test.js"
          />

          <div className="flex items-center gap-3 pt-2">
            <button
              className="bg-gray-800 text-black px-4 py-2 rounded-lg"
              onClick={handleCopy}
            >
              Copy
            </button>
            <button
              className="bg-green-600 text-black px-4 py-2 rounded-lg disabled:opacity-50"
              onClick={createPR}
              disabled={creating}
            >
              {creating ? "Creating PR…" : "Create PR with this test"}
            </button>
            <button
              className="ml-auto bg-red-600 text-black px-4 py-2 rounded-lg"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          {success && (
            <div className="text-green-700 text-sm">
              ✅ PR created:&nbsp;
              <a href={success} target="_blank" rel="noreferrer" className="underline">{success}</a>
            </div>
          )}
          {error && <div className="text-red-600 text-sm">❌ {error}</div>}
        </div>
      </div>
    </div>
  );
};

export default TestCodeModal;
