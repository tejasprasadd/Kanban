import type { PropsWithChildren } from "react";
import { useDummyJsonSeedOnLoad } from "../domain/useDummyJsonSeedOnLoad";

// shadcn UI (you may need to generate these components)
import { Button } from "./shadcn-components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn-components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "./shadcn-components/ui/alert";

export function SeedGate({ children }: PropsWithChildren) {
  const { isLoading, isError, errorMessage, retry, hasHydrated } =
    useDummyJsonSeedOnLoad(20);

  // Optional: show nothing until hydration, or show a tiny loading state.
  if (!hasHydrated) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading…</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Restoring your board from local storage.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Setting up your board</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Fetching starter tasks from DummyJSON…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Alert variant="destructive">
          <AlertTitle>Couldn’t load starter tasks</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <div>{errorMessage}</div>
            <Button onClick={() => void retry()}>Retry</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}