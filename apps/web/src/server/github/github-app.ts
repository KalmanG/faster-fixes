import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

// Read at call time, not import time: the GitHub App is optional (self-hosted
// installs may never configure it) and `next build` imports this module.
function appCredentials() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!appId || !privateKey) {
    throw new Error(
      "GitHub App is not configured: set GITHUB_APP_ID and GITHUB_PRIVATE_KEY.",
    );
  }
  return { appId, privateKey };
}

export function getAppOctokit() {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: appCredentials(),
  });
}

export function getInstallationOctokit(installationId: number) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { ...appCredentials(), installationId },
  });
}
