import type {
  ApplySubmitPort,
  SubmitApplicationRequest,
  SubmitApplicationResponse,
} from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export class SubmitApplicationAdaptor implements ApplySubmitPort {
  constructor(private http: AxiosInstance, private baseUrl: string) {}
  // eslint-disable-next-line @typescript-eslint/require-await -- Temp disable
  async submitApplication(    
    _body: SubmitApplicationRequest,
  ): Promise<SubmitApplicationResponse> {
    const response: AxiosResponse<SubmitApplicationResponse> = await this.http.post(`${this.baseUrl}/application`, _body);
    const submitApplicationResponse: SubmitApplicationResponse = {
      statusCode: response.status,
      applicationReferenceNumber: response.data.applicationReferenceNumber,
    }
    return submitApplicationResponse;
  }
}
