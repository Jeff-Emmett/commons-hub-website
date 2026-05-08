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

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Update Password</CardTitle>
          <CardDescription>
            This page isn&apos;t in use right now
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Password changes are handled directly by Commons Hub admins. Email{" "}
            <a
              href="mailto:hello@commons-hub.at"
              className="underline underline-offset-4"
            >
              hello@commons-hub.at
            </a>{" "}
            for help.
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
