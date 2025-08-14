import React, { useState, useEffect } from "react";
import { api } from "../api";

const FileList = ({ repo, onTestSuggestions }) => {
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorFiles, setErrorFiles] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [errorContent, setErrorContent] = useState(null);

  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (!repo) return;
    (async () => {
      setLoadingFiles(true); setErrorFiles(null);
      try {
        const owner = repo.owner?.login || (repo.full_name?.split("/")[0]);
        const name  = repo.name;
        const { data } = await api.get("/api/github/files", {
          params: { owner, repo: name, branch: repo.default_branch || "main" },
        });
        setFiles(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error fetching files:", e);
        setErrorFiles("Failed to fetch files.");
      } finally { setLoadingFiles(false); }
    })();
  }, [repo]);

  const handleFileClick = async (file) => {
    if (file.type !== "blob") return;
    setSelectedFile(file);
    setLoadingContent(true); setErrorContent(null); setFileContent("");

    try {
      const owner = repo.owner?.login || (repo.full_name?.split("/")[0]);
      const name  = repo.name;
      const { data } = await api.get("/api/github/file-content", {
        params: { owner, repo: name, path: file.path },
      });
      setFileContent(data?.content || "");
    } catch (e) {
      console.error("Error fetching file content:", e);
      setErrorContent("Failed to load file content.");
    } finally { setLoadingContent(false); }
  };

  const toggleSelect = (file) => {
    const next = new Set(selected);
    next.has(file.sha) ? next.delete(file.sha) : next.add(file.sha);
    setSelected(next);
  };

  const handleGenerateSuggestions = async () => {
    const owner = repo.owner?.login || (repo.full_name?.split("/")[0]);
    const name  = repo.name;

    const chosenFiles = files.filter(f => selected.has(f.sha) && f.type === "blob");

    const contents = await Promise.all(chosenFiles.map(async (f) => {
      try {
        const { data } = await api.get("/api/github/file-content", {
          params: { owner, repo: name, path: f.path },
        });
        return { filename: f.path, content: data?.content || "" };
      } catch (e) {
        console.error(`Error fetching ${f.path}`, e);
        return null;
      }
    }));

    const payload = contents.filter(Boolean);
    if (payload.length === 0) return alert("No readable files selected.");

    try {
      const { data } = await api.post("/api/ai/generate-test-summary", { files: payload });
      onTestSuggestions?.(data.summary || []);
    } catch (e) {
      console.error("Error generating summaries:", e);
      alert("Failed to generate test suggestions.");
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-white shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">📂 Files in <span className="text-green-600">{repo?.name}</span></h3>
        {selected.size > 0 && (
          <button
            className="bg-green-600 text-black px-4 py-2 rounded-lg hover:bg-green-700"
            onClick={handleGenerateSuggestions}
          >
             Generate Test Suggestions ({selected.size})
          </button>
        )}
      </div>

      {loadingFiles && <p className="animate-pulse text-gray-500">Loading files…</p>}
      {errorFiles && <p className="text-red-600">{errorFiles}</p>}
      {!loadingFiles && !errorFiles && files.length === 0 && <p className="text-gray-500">No files found.</p>}

      {!loadingFiles && !errorFiles && files.length > 0 && (
        <ul className="space-y-2 max-h-[420px] overflow-auto pr-1">
          {files.map(file => (
            <li
              key={file.sha}
              className={`flex items-center gap-3 p-3 rounded-xl transition ${
                file.type === "blob" ? "bg-neutral-50 hover:bg-neutral-100 cursor-pointer" : "bg-neutral-100"
              }`}
              onClick={() => handleFileClick(file)}
            >
              <input
                type="checkbox"
                className="accent-green-600"
                checked={selected.has(file.sha)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleSelect(file)}
              />
              <span className="truncate font-mono text-sm">
                {file.path}{file.type === "tree" && <strong className="text-gray-500"> (folder)</strong>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {selectedFile && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">
            📄 Viewing: <span className="text-green-700">{selectedFile.path}</span>
          </h4>
          {loadingContent && <p className="animate-pulse text-gray-500">Loading content…</p>}
          {errorContent && <p className="text-red-600">{errorContent}</p>}
          {!loadingContent && !errorContent && (
            <pre className="bg-black/90 text-green-300 p-4 rounded-xl overflow-x-auto text-xs border border-black">
{fileContent}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default FileList;
