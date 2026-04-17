import { mapAuthUser } from "@/lib/auth/mapAuthUser";
import { backendUrl } from "@/settings";
import type { AuthUser } from "@/state";

class LoginService {
  async login(code: string): Promise<AuthUser> {
    if (!backendUrl || backendUrl.trim() === "") {
      throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
    }

    const response = await fetch(`${backendUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
      credentials: "include",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    return mapAuthUser(data);
  }
}

const loginService = new LoginService();
export default loginService;
