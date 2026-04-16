import * as React from "react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";

import { RoutePath } from "@/lib/models/route-paths";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }
  return "An unexpected error occurred";
}

export default function ErrorRedirect() {
  const navigate = useNavigate();
  const error = useRouteError();
  React.useEffect(() => {
    navigate(RoutePath.ServiceErrorPage, {
      replace: true,
      state: { errorMessage: getErrorMessage(error) },
    });
  }, [navigate, error]);
  return null;
}
