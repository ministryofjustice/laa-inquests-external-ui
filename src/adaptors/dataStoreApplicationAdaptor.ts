import axios, { AxiosResponse, AxiosStatic } from "#node_modules/axios/index.js";
import { Application } from "./models/application.types.js";
import { ApplicationSchema } from "./models/application.schema.js";

export class ApplicationDataStoreAdaptor {
    constructor(private http: AxiosStatic = axios, private baseUrl : string) {
        
    }

    async getApplication(applicationId : string): Promise<Application> {
        const { data }: AxiosResponse<Application> = await this.http.get(`${this.baseUrl}/application/${applicationId}`);
        const application = ApplicationSchema.parse(data);
        return application;
    }

}
