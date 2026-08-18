import type { AxiosInstance, AxiosResponse, ResponseType } from "axios";

interface PostToInquestsApiParams<TBody> {
  http: AxiosInstance;
  baseUrl: string;
  path: string;
  body: TBody;
  accessToken: string | undefined;
  headers?: Record<string, string>;
  validateStatus?: (status: number) => boolean;
}

export async function postToInquestsApi<TResponse, TBody>(
  params: PostToInquestsApiParams<TBody>,
): Promise<AxiosResponse<TResponse>> {
  const { http, baseUrl, path, body, accessToken, headers, validateStatus } =
    params;

  if (typeof accessToken !== "string" || accessToken === "") {
    throw new Error("Missing access token for Inquests API request");
  }

  return await http.post<TResponse>(`${baseUrl}${path}`, body, {
    ...(validateStatus === undefined ? {} : { validateStatus }),
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
  responseType?: ResponseType;
  validateStatus?: (status: number) => boolean;
}

export async function getFromInquestsApi<TResponse>(
  options: GetFromInquestsApiParams,
): Promise<AxiosResponse<TResponse>> {
  const {
    http,
    baseUrl,
    path,
    params,
    accessToken,
    responseType,
    validateStatus,
  } = options;

  if (typeof accessToken !== "string" || accessToken === "") {
    throw new Error("Missing access token for Inquests API request");
  }

  return await http.get<TResponse>(`${baseUrl}${path}`, {
    params,
    ...(responseType === undefined ? {} : { responseType }),
    ...(validateStatus === undefined ? {} : { validateStatus }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

interface DeleteFromInquestsApiParams {
  http: AxiosInstance;
  baseUrl: string;
  path: string;
  accessToken: string | undefined;
}

export async function deleteFromInquestsApi(
  options: DeleteFromInquestsApiParams,
): Promise<AxiosResponse> {
  const { http, baseUrl, path, accessToken } = options;

  if (typeof accessToken !== "string" || accessToken === "") {
    throw new Error("Missing access token for Inquests API request");
  }

  return await http.delete(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
