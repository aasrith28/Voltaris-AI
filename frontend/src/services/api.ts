
const API_BASE =
  import.meta.env.VITE_API_URL?.trim() ||
  "https://voltaris-ai-qcwj.onrender.com";

export interface PredictionRequest {
  Ia: number;
  Ib: number;
  Ic: number;
  Va: number;
  Vb: number;
  Vc: number;
}

export interface PredictionResponse {
  fault_type: string;
  fault_label: string;
  description: string;
  confidence: number;
  class_scores: Record<string, number>;
  phase_status: {
    A: boolean;
    B: boolean;
    C: boolean;
    ground: boolean;
  };
  model_version: string;
  features_used: number[];
  disclaimer: string;
}

export interface ModelInfo {
  ready: boolean;
  version: string;
  expected_features: string[];
  expected_classes: string[];
  error?: string | null;
  n_features?: number;
  classes?: string[];
  estimator?: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail: unknown = res.statusText;

    try {
      const body = await res.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      // The response may not contain JSON.
    }

    throw new Error(
      typeof detail === "string"
        ? detail
        : JSON.stringify(detail)
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  health: () =>
    request<{ status: string; model_ready: boolean }>(
      "/api/v1/health"
    ),

  modelInfo: () =>
    request<ModelInfo>("/api/v1/predictions/model"),

  predict: (body: PredictionRequest) =>
    request<PredictionResponse>("/api/v1/predictions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (
    email: string,
    password: string,
    full_name?: string
  ) =>
    request<{
      message: string;
      dev_verification_token?: string;
    }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    }),

  verifyEmail: (token: string) =>
    request<{ message: string }>("/api/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  login: (email: string, password: string) =>
    request<Record<string, unknown>>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ message: string }>("/api/v1/auth/logout", {
      method: "POST",
    }),

  me: () =>
    request<{
      id: string;
      email: string;
      two_factor_enabled: boolean;
    }>("/api/v1/auth/me"),

  setup2fa: () =>
    request<{
      secret: string;
      provisioning_uri: string;
      qr_code_base64: string;
      message: string;
    }>("/api/v1/auth/2fa/setup", {
      method: "POST",
    }),

  activate2fa: (code: string) =>
    request<{ codes: string[]; message: string }>(
      "/api/v1/auth/2fa/activate",
      {
        method: "POST",
        body: JSON.stringify({ code }),
      }
    ),

  verify2fa: (code: string) =>
    request<{ message: string; user?: unknown }>(
      "/api/v1/auth/2fa/verify",
      {
        method: "POST",
        body: JSON.stringify({ code }),
      }
    ),

  recover2fa: (code: string) =>
    request<{ message: string }>("/api/v1/auth/2fa/recover", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
};
