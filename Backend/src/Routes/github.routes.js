import { Router } from "express";
import axios from "axios";
import { requireGithubToken } from "../middleware/auth.js";
import { gh } from "../utils/githubClient.js";

const router = Router();

// ---- OAuth ----
router.get("/", (_req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const scope = "repo,user";
  const redirectUrl =
    `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scope)}`;
  return res.redirect(redirectUrl);
});

router.get("/callback", async (req, res, next) => {
  try {
    const { code } = req.query;
    const r = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );
    const accessToken = r.data.access_token;
    if (!accessToken) return res.status(400).send("OAuth failed");

    res.cookie("github_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.redirect((process.env.CLIENT_ORIGIN || "http://localhost:5173") + "/dashboard");
  } catch (e) { next(e); }
});

// ---- API: GitHub data ----
router.get("/user", requireGithubToken, async (req, res, next) => {
  try {
    const api = gh(req.githubToken);
    const { data } = await api.get("/user");
    res.json(data);
  } catch (e) { next(e); }
});

router.get("/repos", requireGithubToken, async (req, res, next) => {
  try {
    const api = gh(req.githubToken);
    const { data } = await api.get("/user/repos?per_page=100&sort=updated");
    res.json(data);
  } catch (e) { next(e); }
});

router.get("/files", requireGithubToken, async (req, res, next) => {
  try {
    const { owner, repo, branch = "main" } = req.query;
    const api = gh(req.githubToken);
    const { data } = await api.get(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);

    const files = (data.tree || []).filter(
      (f) => f.type === "blob" && /\.(js|jsx|ts|tsx|py|java)$/.test(f.path)
    );
    res.json(files);
  } catch (e) { next(e); }
});

router.get("/file-content", requireGithubToken, async (req, res, next) => {
  try {
    const { owner, repo, path } = req.query;
    const api = gh(req.githubToken);
    const { data } = await api.get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`);
    const content = Buffer.from(data.content || "", "base64").toString("utf-8");
    res.json({ content });
  } catch (e) { next(e); }
});

// ---- API: Create PR with generated tests (BONUS) ----
router.post("/create-pr", requireGithubToken, async (req, res, next) => {
  try {
    const { owner, repo, testPath, testCode, title, body, baseBranch } = req.body;
    if (!owner || !repo || !testPath || !testCode) {
      return res.status(400).json({ error: "owner, repo, testPath, testCode are required" });
    }

    const api = gh(req.githubToken);

    // 1) get repo info -> default branch if not provided
    const { data: repoInfo } = await api.get(`/repos/${owner}/${repo}`);
    const base = baseBranch || repoInfo.default_branch || "main";

    // 2) base sha
    const { data: ref } = await api.get(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(base)}`);
    const baseSha = ref.object.sha;

    // 3) create new branch
    const branchName = `testcases/${Date.now()}`;
    await api.post(`/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // 4) create file on that branch
    const message = title || `test: add tests for ${testPath}`;
    await api.put(`/repos/${owner}/${repo}/contents/${encodeURIComponent(testPath)}`, {
      message,
      content: Buffer.from(testCode, "utf-8").toString("base64"),
      branch: branchName,
    });

    // 5) create PR
    const prTitle = title || "Add generated test cases";
    const prBody = body || "This PR was created automatically by Workik test case generator.";
    const { data: pr } = await api.post(`/repos/${owner}/${repo}/pulls`, {
      title: prTitle,
      head: branchName,
      base,
      body: prBody,
    });

    res.json({ prNumber: pr.number, prUrl: pr.html_url });
  } catch (e) { next(e); }
});

export default router;
