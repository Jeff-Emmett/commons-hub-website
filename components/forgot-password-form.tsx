"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Forgot your password?</CardTitle>
          <CardDescription>
            Password resets are handled by Commons Hub admins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Email{" "}
            <a
              href="mailto:hello@commons-hub.at"
              className="underline underline-offset-4"
            >
              hello@commons-hub.at
            </a>{" "}
            from the address on your account and we&apos;ll send you a new
            password.
          </p>
          <p className="text-sm">
            <Link href="/auth/login" className="underline underline-offset-4">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
