"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Shield, Building2, User } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationSlug: "",
    userEmail: "",
    userName: "",
  });

  // Note: After running npx convex dev, setup.ts will be available
  // The API path will be: api["mutations/setup"]
  const createMainUser = useMutation(
    (api as any)["mutations/setup"]?.createMainOrganizationAndUser
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate slug from organization name if not provided
      const slug = formData.organizationSlug || 
        formData.organizationName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const result = await createMainUser({
        organizationName: formData.organizationName,
        organizationSlug: slug,
        userEmail: formData.userEmail,
        userName: formData.userName,
        authProvider: "email",
        authProviderId: formData.userEmail, // In real app, use proper auth ID
      });

      toast({
        title: "Success!",
        description: "Organization and main user created successfully",
      });

      // Redirect to login or dashboard
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create organization and user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Initial Setup</CardTitle>
          <CardDescription>
            Create your organization and main administrator account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Building2 className="h-5 w-5" />
                Organization Information
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({ ...formData, organizationName: e.target.value })
                  }
                  placeholder="My Company"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationSlug">Organization Slug</Label>
                <Input
                  id="organizationSlug"
                  value={formData.organizationSlug}
                  onChange={(e) =>
                    setFormData({ ...formData, organizationSlug: e.target.value })
                  }
                  placeholder="my-company (auto-generated if empty)"
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier for your organization
                </p>
              </div>
            </div>

            {/* User Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                Administrator Account
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName">Full Name *</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={formData.userEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, userEmail: e.target.value })
                  }
                  placeholder="admin@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be your super administrator account
                </p>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                The main user will be created as a <strong>Super Administrator</strong> with
                full access to all features and permissions.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating..." : "Create Organization & Admin Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

