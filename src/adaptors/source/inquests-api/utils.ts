import type { AxiosInstance, AxiosResponse } from "axios";

interface PostToInquestsApiParams<TBody> {
  http: AxiosInstance;
  baseUrl: string;
  path: string;
  body: TBody;
  accessToken: string | undefined;
  headers?: Record<string, string>;
}

export async function postToInquestsApi<TResponse, TBody>(
  params: PostToInquestsApiParams<TBody>,
): Promise<AxiosResponse<TResponse>> {
  const { http, baseUrl, path, body, accessToken, headers } = params;

  if (typeof accessToken !== "string" || accessToken === "") {
    throw new Error("Missing access token for Inquests API request");
  }

  return await http.post<TResponse>(`${baseUrl}${path}`, body, {
    headers: {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

interface GetFromInquestsApiParams {
  http: AxiosInstance;
  baseUrl: string;
  path: string;
  params?: Record<string, string>;
  accessToken: string | undefined;
}

export async function getFromInquestsApi<TResponse>(
  options: GetFromInquestsApiParams,
): Promise<AxiosResponse<TResponse>> {
  const { http, baseUrl, path, params, accessToken } = options;

  if (typeof accessToken !== "string" || accessToken === "") {
    throw new Error("Missing access token for Inquests API request");
  }

  return await http.get<TResponse>(`${baseUrl}${path}`, {
    params,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
