"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Crown, Bot, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

interface CreateAgentForm {
  name: string;
  description: string;
  instructions: string;
}

export default function CreateAdminAgentPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateAgentForm>({
    name: "",
    description: "",
    instructions: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          instructions: {
            role: form.name,
            systemPrompt: form.instructions,
            mentions: [], // Admin can add tools later
          },
        }),
      });

      if (response.ok) {
        router.push("/admin/agents");
      } else {
        console.error("Failed to create admin agent");
      }
    } catch (error) {
      console.error("Error creating admin agent:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof CreateAgentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/agents">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agents
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create Admin Agent
          </h1>
          <p className="text-slate-600">
            Create a new shared agent for all Samba users
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <span>Agent Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure your admin agent that will be available to all Samba
                users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Samba Data Analyst"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    required
                  />
                  <p className="text-sm text-slate-600">
                    This name will be visible to all Samba users
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of what this agent does"
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                  />
                  <p className="text-sm text-slate-600">
                    Optional: Help users understand what this agent is for
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">System Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="You are a specialized assistant for Samba. Your role is to help with..."
                    value={form.instructions}
                    onChange={(e) => updateForm("instructions", e.target.value)}
                    rows={8}
                    required
                  />
                  <p className="text-sm text-slate-600">
                    Define how this agent should behave and what it should help
                    with
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/agents">Cancel</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !form.name || !form.instructions}
                  >
                    {loading ? (
                      <>Creating...</>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Admin Agent
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Admin Agent Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Samba Shared</div>
                  <div className="text-xs text-slate-600">
                    Automatically available to all users
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Full Tool Access</div>
                  <div className="text-xs text-slate-600">
                    Can be configured with any available tools
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Admin Only</div>
                  <div className="text-xs text-slate-600">
                    Only admins can create and edit
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Example Agents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-medium text-sm">Samba Data Analyst</div>
                <div className="text-xs text-slate-600 mt-1">
                  Specialized in analyzing viewership metrics and audience
                  insights
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-medium text-sm">Content Strategist</div>
                <div className="text-xs text-slate-600 mt-1">
                  Helps with content planning and performance optimization
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-medium text-sm">Technical Assistant</div>
                <div className="text-xs text-slate-600 mt-1">
                  Code reviews and technical documentation help
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
