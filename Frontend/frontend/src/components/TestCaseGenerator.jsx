import React, { useState } from 'react';
import FileList from './FileList.jsx';

const TestCaseGenerator = ({ repo }) => {
  const [summary, setSummary] = useState("");

  if (!repo) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Test Case Generator</h1>

      <FileList
        repo={repo}
        onTestSuggestions={(summary) => setSummary(summary)}
      />

      {summary && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Test Summaries</h2>
          <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-3 rounded">
            {summary}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestCaseGenerator;

