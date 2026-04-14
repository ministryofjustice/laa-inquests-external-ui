import axios from "axios";

export class ApplicationDataStoreAdaptor {

    async getApplication(applicationId : string){
        await axios.get("https://www.google.com");
    }

}
