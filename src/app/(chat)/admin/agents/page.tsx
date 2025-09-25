import { getEnhancedSession } from "@/lib/auth/server";
import { pgAgentRepository } from "@/lib/db/pg/repositories/agent-repository.pg";
import { notFound } from "next/navigation";
import { AdminAgentsList } from "@/components/admin/admin-agents-list";

export default async function AdminAgentsPage() {
  const session = await getEnhancedSession();

  if (!session?.user?.id) {
    notFound();
  }

  // Fetch all agents to filter admin-all ones
  const allAgents = await pgAgentRepository.selectAgents(session.user.id, [
    "all",
  ]);
  const adminAgents = allAgents.filter(
    (agent) => agent.visibility === "admin-all",
  );

  return <AdminAgentsList agents={adminAgents} userId={session.user.id} />;
}
