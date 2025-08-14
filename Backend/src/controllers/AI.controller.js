import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateTestSummary(req, res, next) {
  try {
    const { files } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "files[] required" });
    }

    const prompt = files.map(f =>
      `Filename: ${f.filename}\n---\n${truncate(f.content, 4000)}`
    ).join("\n\n");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const result = await model.generateContent(
`You are a senior test engineer. For each file below, propose *one or more* specific test cases.
Return in this strict list format (repeat for each test):

- Filename: <file path>
- Summary: <one concise line>
- Purpose: <short reason focusing on behavior or edge case>

Files:
${prompt}`
    );

    const text = await result.response.text();

    // parse into array of { filename, summary, purpose }
    const suggestions = [];
    const blocks = text.split(/\n{2,}/);
    let current = {};
    for (const block of blocks) {
      const filename = match(block, /-+\s*Filename:\s*(.+)/i);
      const summary  = match(block, /-+\s*Summary:\s*(.+)/i);
      const purpose  = match(block, /-+\s*Purpose:\s*(.+)/i);
      if (filename && summary && purpose) {
        suggestions.push({
          filename: filename.trim(),
          summary: summary.trim(),
          purpose: purpose.trim(),
        });
      }
    }

    return res.json({ summary: suggestions });
  } catch (e) { next(e); }
}

export async function generateTestCode(req, res, next) {
  try {
    const { filename, summary, purpose } = req.body;
    if (!filename || !summary || !purpose) {
      return res.status(400).json({ error: "filename, summary, purpose required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(
`You are an expert test engineer. Generate only the test code (no commentary).
Choose the correct framework: 
- JS/TS/React: Jest + React Testing Library if applicable
- Python: pytest
- Java: JUnit 5

Filename: ${filename}
Test Summary: ${summary}
Purpose: ${purpose}

Constraints:
- Import the subject under test correctly based on filename.
- Make tests deterministic, no external IO/network.
- Include at least one edge-case assertion.
- Output ONLY code.`
    );

    const code = (await result.response.text()).trim();
    return res.json({ code });
  } catch (e) { next(e); }
}

// helpers
function truncate(s = "", max = 4000) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "\n/* ...truncated... */" : s;
}
function match(s, re) { const m = s.match(re); return m && m[1]; }
