import { prisma } from "@workspace/db";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { agentError } from "../../_utils/agent-error";
import { CreateReviewerAgentSchema } from "../../_utils/agent.schema";
import {
  isAuthFailure,
  requireAgentAuth,
} from "../../_utils/require-agent-auth";
import { resolveProjectId } from "../../_utils/resolve-project-id";

/**
 * Creates a reviewer and returns its raw token exactly once, mirroring the
 * dashboard's create-reviewer mutation: only the SHA-256 hash is persisted,
 * and the share URL points at the project's registered domain.
 */
export async function createReviewer(req: NextRequest) {
  const auth = await requireAgentAuth(
    req.headers.get("authorization"),
    "reviewers:manage",
    "agent:write",
  );
  if (isAuthFailure(auth)) return auth;
  const agentToken = auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return agentError("Invalid JSON body", "VALIDATION_ERROR", 422);
  }

  const parsed = CreateReviewerAgentSchema.safeParse(body);
  if (!parsed.success) {
    return agentError("Validation failed", "VALIDATION_ERROR", 422);
  }

  const projectId = resolveProjectId(
    parsed.data.project,
    agentToken.organization.projects,
  );
  if (!projectId) {
    return agentError("Project not found", "NOT_FOUND", 404);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { domain: true },
  });
  if (!project) {
    return agentError("Project not found", "NOT_FOUND", 404);
  }

  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const reviewer = await prisma.reviewer.create({
    data: { projectId, name: parsed.data.name, token: tokenHash },
  });

  console.info(
    `[agent-api] reviewers:create tokenId=${agentToken.id} project=${projectId} reviewer=${reviewer.id}`,
  );

  return NextResponse.json(
    {
      id: reviewer.id,
      name: reviewer.name,
      isActive: reviewer.isActive,
      createdAt: reviewer.createdAt,
      // Shown once - not retrievable later.
      token,
      shareUrl: `https://${project.domain}?ff_token=${token}`,
    },
    { status: 201 },
  );
}
