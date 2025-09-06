import React, { useState, useEffect } from "react";
import { api } from "../api";

const RepoSelector = ({ onSelectRepo }) => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/github/repos");
        setRepos(data);
      } catch (e) {
        console.error("Error fetching repos:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const selected = repos.find(r => r.full_name === e.target.value);
    onSelectRepo(selected || null);
  };

  return (
    <div>
      <label htmlFor="repo" className="block mb-2 font-semibold">Select Repository</label>
      {loading ? (
        <p className="text-sm text-gray-500">Loading repositories…</p>
      ) : (
        <select
          id="repo"
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-lg bg-white"
          defaultValue=""
        >
          <option value="" disabled>-- Select a repo --</option>
          {repos.map(repo => (
            <option key={repo.id} value={repo.full_name}>
              {repo.full_name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default RepoSelector;

