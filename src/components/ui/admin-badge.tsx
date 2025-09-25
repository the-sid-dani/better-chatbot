import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface AdminResourceBadgeProps {
  resource: { visibility: string };
}

export function AdminResourceBadge({ resource }: AdminResourceBadgeProps) {
  if (resource.visibility === "admin-all") {
    return (
      <Badge
        variant="outline"
        className="border-blue-200 bg-blue-50 text-blue-700"
      >
        <Crown className="w-3 h-3 mr-1" />
        Samba Shared
      </Badge>
    );
  }
  return null;
}
