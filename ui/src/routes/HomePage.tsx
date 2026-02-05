import { RoutePath } from "@/lib/models/route-paths";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(RoutePath.GetSelfTestKitPage);
  }, [navigate]);

  return <div></div>;
}
