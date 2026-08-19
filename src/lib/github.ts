import { Octokit } from "@octokit/rest";

const owner = process.env.GITHUB_OWNER!;
const repo = process.env.GITHUB_REPO!;
const branch = process.env.GITHUB_BRANCH || "main";

function client() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

export function jsdelivrUrl(slug: string) {
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/animations/${slug}.css`;
}

/** Writes (or overwrites) animations/<slug>.css in the registry repo. */
export async function writeAnimationFile(slug: string, cssContent: string) {
  const octokit = client();
  const path = `animations/${slug}.css`;

  let sha: string | undefined;
  try {
    const existing = await octokit.repos.getContent({ owner, repo, path, ref: branch });
    if (!Array.isArray(existing.data) && existing.data.type === "file") {
      sha = existing.data.sha;
    }
  } catch (err: unknown) {
    if (!(err instanceof Object && "status" in err && err.status === 404)) throw err;
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    branch,
    message: sha ? `Update ${slug}` : `Publish ${slug}`,
    content: Buffer.from(cssContent, "utf-8").toString("base64"),
    sha,
  });

  await purgeJsdelivrCache(slug);

  return jsdelivrUrl(slug);
}

/** Deletes animations/<slug>.css from the registry repo. */
export async function deleteAnimationFile(slug: string) {
  const octokit = client();
  const path = `animations/${slug}.css`;

  const existing = await octokit.repos.getContent({ owner, repo, path, ref: branch });
  if (Array.isArray(existing.data) || existing.data.type !== "file") {
    throw new Error(`Expected a file at ${path}`);
  }

  await octokit.repos.deleteFile({
    owner,
    repo,
    path,
    branch,
    message: `Delete ${slug}`,
    sha: existing.data.sha,
  });

  await purgeJsdelivrCache(slug);
}

/** Best-effort jsDelivr CDN cache purge; failures shouldn't block the caller. */
async function purgeJsdelivrCache(slug: string) {
  try {
    await fetch(
      `https://purge.jsdelivr.net/gh/${owner}/${repo}@${branch}/animations/${slug}.css`
    );
  } catch {
    // Cache will still expire naturally; not worth failing the request over.
  }
}
