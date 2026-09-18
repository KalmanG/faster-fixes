import { prisma } from "@workspace/db";
import { NextRequest, NextResponse } from "next/server";
import { agentError } from "../../_utils/agent-error";
import { ReviewerIdSchema } from "../../_utils/agent.schema";
import {
  isAuthFailure,
  requireAgentAuth,
} from "../../_utils/require-agent-auth";

/**
 * Revokes a reviewer (soft: `isActive = false`, same as the dashboard), so
 * their token stops working while their existing feedback stays attributed.
 */
type RouteContext = { params: Promise<{ id: string }> };

export async function revokeReviewer(req: NextRequest, ctx: RouteContext) {
  const auth = await requireAgentAuth(
    req.headers.get("authorization"),
    "reviewers:manage",
    "agent:write",
  );
  if (isAuthFailure(auth)) return auth;
  const agentToken = auth;

  const { id } = await ctx.params;
  if (!ReviewerIdSchema.safeParse(id).success) {
    return agentError("Invalid reviewer id", "VALIDATION_ERROR", 422);
  }

  const orgProjectIds = agentToken.organization.projects.map((p) => p.id);
  const reviewer = await prisma.reviewer.findFirst({
    where: { id, projectId: { in: orgProjectIds } },
    select: { id: true },
  });
  if (!reviewer) {
    return agentError("Reviewer not found", "NOT_FOUND", 404);
  }

  const updated = await prisma.reviewer.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, name: true, isActive: true, updatedAt: true },
  });

  console.info(
    `[agent-api] reviewers:revoke tokenId=${agentToken.id} reviewer=${id}`,
  );

  return NextResponse.json(updated);
}
