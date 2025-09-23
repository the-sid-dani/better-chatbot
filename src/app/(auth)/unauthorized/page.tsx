import { Shield, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto text-center space-y-6 p-6">
        <div className="space-y-2">
          <Shield className="w-16 h-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access this resource. Admin privileges are required.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          If you believe this is an error, please contact your administrator.
        </div>
      </div>
    </div>
  );
}