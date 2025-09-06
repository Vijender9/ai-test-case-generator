import { useState, useEffect } from "react";
import { api } from "../api";
import RepoSelector from "../components/RepoSelector.jsx";
import FileList from "../components/FileList.jsx";
import TestCodeModal from "../components/TestCodeModal.jsx";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTestMeta, setActiveTestMeta] = useState(null); // for PR path

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/github/user");
        setUser(data);
      } catch (e) {
        console.error("Error fetching user:", e);
      }
    })();
  }, []);

  const handleGenerateCode = async (test) => {
    try {
      const { data } = await api.post("/api/ai/generate-test-code", {
        filename: test.filename,
        summary: test.summary,
        purpose: test.purpose,
      });
      setGeneratedCode(data.code || "");
      setActiveTestMeta(test);
      setShowModal(true);
    } catch (e) {
      console.error("Error generating test code:", e);
      alert("Failed to generate test code.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Test Case Generator :)</h1>
        <div className="text-sm text-gray-600">Signed in as <b>{user?.login}</b></div>
      </header>

      <main className="p-6 max-w-6xl mx-auto grid gap-6 md:grid-cols-3">
        <section className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <RepoSelector onSelectRepo={setSelectedRepo} />
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="font-semibold mb-2">Instructions</h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Select a repository</li>
              <li>Pick files & generate suggestions</li>
              <li>Pick a summary → Generate code</li>
              <li>Optionally create a PR</li>
            </ol>
          </div>
        </section>

        <section className="md:col-span-2 space-y-6">
          {selectedRepo && (
            <FileList
              repo={selectedRepo}
              onTestSuggestions={setTestCases}
            />
          )}

          {testCases.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-lg font-bold mb-3">Generated Test Case Summaries</h3>
              <div className="grid gap-3">
                {testCases.map((t, i) => (
                  <div key={`${t.filename}-${i}`} className="border rounded-xl p-4 bg-gradient-to-br from-neutral-50 to-white">
                    <div className="text-sm text-gray-500">File</div>
                    <div className="font-mono text-sm mb-2">{t.filename}</div>
                    <div className="text-sm"><b>Summary:</b> {t.summary}</div>
                    <div className="text-sm"><b>Purpose:</b> {t.purpose}</div>
                    <button
                      className="mt-3 bg-green-600 text-black px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      onClick={() => handleGenerateCode(t)}
                    >
                      Generate Test Code
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <TestCodeModal
        isOpen={showModal}
        code={generatedCode}
        onClose={() => setShowModal(false)}
        testMeta={activeTestMeta}
        repo={selectedRepo}
        user={user}
      />
    </div>
  );
};

export default Dashboard;



