export function requireGithubToken(req, res, next) {
  const token = req.cookies.github_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  req.githubToken = token;
  next();
}
