import { prisma } from "@workspace/db";
import { NextRequest, NextResponse } from "next/server";
import { agentError } from "../../_utils/agent-error";
import { ListReviewersQuerySchema } from "../../_utils/agent.schema";
import {
  isAuthFailure,
  requireAgentAuth,
} from "../../_utils/require-agent-auth";
import { resolveProjectId } from "../../_utils/resolve-project-id";

/**
 * Lists a project's reviewers. Tokens are stored hashed and never returned;
 * the raw token is only ever shown once, by `POST /reviewers`.
 */
export async function listReviewers(req: NextRequest) {
  const auth = await requireAgentAuth(
    req.headers.get("authorization"),
    "reviewers:manage",
    "agent:read",
  );
  if (isAuthFailure(auth)) return auth;
  const agentToken = auth;

  const parsed = ListReviewersQuerySchema.safeParse({
    project: req.nextUrl.searchParams.get("project") ?? undefined,
  });
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

  const reviewers = await prisma.reviewer.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
      _count: { select: { feedback: true } },
    },
  });

  console.info(
    `[agent-api] reviewers:list tokenId=${agentToken.id} project=${projectId} count=${reviewers.length}`,
  );

  return NextResponse.json({
    reviewers: reviewers.map((r) => ({
      id: r.id,
      name: r.name,
      isActive: r.isActive,
      feedbackCount: r._count.feedback,
      createdAt: r.createdAt,
    })),
    count: reviewers.length,
  });
}
