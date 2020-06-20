import { mapActions } from "vuex";

export default {
    methods: {
        ...mapActions({
            getServices: "getServices",
            alertToggle: "alertToggle"
        }),
        async setDefaultService() {
            try {
                if(!this.services.length) {
                    await this.getServices();
                }
            } catch(err) {
                this.alertToggle({message: "Error on getting services from DB", isShow: true, type: "error"});
            }
            const service = this.services.find(item => item);
            this.service = service.title;
            const option = service.steps.length === 1 ? '1 Step' : '2 Steps';
            this.setWorkflow({option});
            this.storeDefaultService(service);
        },
    },
    created() {
        this.setDefaultService()
    }
}