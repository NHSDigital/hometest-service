"use client";

import { useEffect, useState, useRef } from "react";
import { useCreateOrderContext } from "@/state/OrderContext";
import { RoutePath } from "@/lib/models/route-paths";
import { useNavigate } from "react-router-dom";

export default function CallbackPage() {
  type Result =
  | null
  | { data: unknown }
  | { error: string };

  const { updateOrderAnswers } = useCreateOrderContext();
  const [result, setResult] = useState<Result>(null);
  const navigate = useNavigate();
  const didRun = useRef(false);

  useEffect(() => {
    // ALPHA: Revisit this solution to the double call of useEffect.
    if (didRun.current) return;
    didRun.current = true;

    const loginLambdaUrl = process.env.NEXT_PUBLIC_LOGIN_LAMBDA_ENDPOINT;
    if (!loginLambdaUrl) {
      console.error("Missing NEXT_PUBLIC_LOGIN_LAMBDA_ENDPOINT");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    console.log("Params:", params.toString());
    console.log("Authorization code:", code);

    if (!code) return;

    fetch(loginLambdaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        updateOrderAnswers({
          user: {
            sub: data.sub,
            nhsNumber: data.nhs_number,
            birthdate: data.birthdate,
            identityProofingLevel: data.identity_proofing_level,
            phoneNumber: data.phone_number,
          },
        });
      })
      .then(() => {
        navigate(RoutePath.GetSelfTestKitPage);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Fetch error:", message);
        setResult({ error: message });
      });
  }, [updateOrderAnswers, navigate]);
  return null;
}
