import axios from "axios";

export function gh(token) {
  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "workik-testgen-app",
    },
    timeout: 15_000,
  });
}
