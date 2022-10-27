const {Elarian} = require("elarian");
const log = require("signale");

let myClient ;

const myWhatsappChannel ={
	number:"+254721303295",
	channel:"whatsapp"
};

async function handleWhatsappMessages(notification, customer, appData, callback){
	log.info(`This is the notification sent by the customer: ${notification.text}`);

	if (notification.text){
		let myResp =await customer.sendMessage (myWhatsappChannel, {
			body:{
				text: "Hi Welcome to eFinance"
			}
		});

		log.info(`Message sent: ${JSON.stringify(myResp)}`);}
}

function start () {
	myClient =new Elarian({
		appId: "el_app_fYd5s5",
		orgId: "el_org_eu_bGV1kk",
		apiKey: "el_k_test_705e45912818e0908ac1503d759d0bef9e553c993ee611223c26e33a615dce5f"
	});

	myClient
		.on("error", (error) => log.error(error))
		.on("connected", ()=> log.success("App is connected..."))
		.on("receivedWhatsapp", handleWhatsappMessages)
		.connect();
}

start();
