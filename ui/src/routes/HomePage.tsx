import { RoutePath } from "@/lib/models/route-paths";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  navigate(RoutePath.GetSelfTestKitPage);

  return <div></div>;
}
