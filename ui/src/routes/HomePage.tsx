import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { RoutePath } from "@/lib/models/route-paths";

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(RoutePath.GetSelfTestKitPage, { replace: true });
  }, [navigate]);

  return <div></div>;
}
