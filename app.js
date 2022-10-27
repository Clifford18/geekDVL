const {Elarian} = require("elarian");
const log = require ("signale");

let client ;

async function handleWhatsappMessages(notification, customer, appData, callback){

}

function start () {
	client =new ElarianClients({
		appId: "el_app_fYd5s5",
		orgId: "el_org_eu_bGV1kk",
		apiKey: "el_k_test_705e45912818e0908ac1503d759d0bef9e553c993ee611223c26e33a615dce5f"
	});

	client
		.on("error", (error) => console.error(error))
		.on("connected", ()=> console.log("App is connected..."))
		.on("recieveWhatssapp", handleWhatsappMessages)
		.connect();
}

start();
