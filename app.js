const {Elarian} = require("elarian");
const log = require("signale");

let myClient ;

// const USSD_CODE = "*883#"

const myWhatsappChannel ={
	number:"+254721303295",
	channel:"whatsapp"
};

const mySmsChannel = {
	number: "mySmsChannel",
	channel: 'sms',
};

const myVoiceChannel = {
	number: process.env.VOICE_NUMBER,
	channel: 'voice',
};

const myMpesaChannel = {
	number: "300900",
	channel: 'cellular',
};

const myPurseId = "el_prs_608fu4";

const approveLoan = async (customer, amount) => {
	log.info(`Processing loan for ${customer.customerNumber.number}`);

	const { name } = await customer.getMetadata();
	const repaymentDate = (Date.now() + 60000);
	const res = await myClient.initiatePayment({
		purseId: myPurseId,
	}, {
		channelNumber: myMpesaChannel,
		customerNumber: customer.customerNumber,
	}, {
		amount,
		currencyCode: 'KES',
	}, 'loan approved');
	if (!['success', 'queued', 'pending_confirmation', 'pending_validation'].includes(res.status)) {
		log.error(`Failed to send KES ${amount} to ${customer.customerNumber.number} --> ${res.status}: `, res.description);
		return;
	}
	await customer.updateMetadata({
		name,
		balance: amount,
	});
	await customer.sendMessage(
		mySmsChannel, {
			body: {
				text: `Congratulations ${name}!\nYour loan of KES ${amount} has been approved!\nYou are expected to pay it back by ${new Date(repaymentDate)}`,
			},
		},
	);
	await customer.addReminder({
		key: 'moni',
		remindAt: repaymentDate / 1000,
		payload: '',
		interval: 60
	});
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

async function handleUssdSession(notification, customer, appData, callback){
	try {
		log.info(`Processing USSD from ${customer.customerNumber.number}`);
		const input = notification.input.text;
		console.log('input', input);

		let screen = 'home';
		if (appData && Object.keys(appData).length) {
			screen = appData.screen;
			console.log('appData', appData);
			console.log('screen', screen);
		}

		const customerData = await customer.getMetadata();
		console.log('customer data', customerData);
		let {
			name,
			balance = 0,
		} = customerData;

		const menu = {
			text: null,
			isTerminal: false,
		};
		let nextScreen = screen;
		if (screen === 'home' && input !== '') {
			if (input === '1') {
				nextScreen = 'request-name';
			} else if (input === '2') {
				nextScreen = 'quit';
			}
		}
		if (screen === 'home' && input === '') {
			if (name) {
				nextScreen = 'info';
			}
		}
		switch (nextScreen) {
			case 'quit':
				menu.text = 'Thanks for visiting Efinance!';
				menu.isTerminal = true;
				nextScreen = 'home';
				callback(menu, {
					screen: nextScreen,
				});
				break;
			case 'info':
				menu.text = `Hey ${name}, `;
				menu.text += balance > 0 ? `you still owe me KES ${balance}!` : 'you have repaid your loan, good for you!';
				menu.isTerminal = true;
				nextScreen = 'quit';
				callback(menu, {
					screen: nextScreen,
				});
				break;
			case 'request-name':
				menu.text = 'Alright, what is your name?';
				nextScreen = 'request-amount';
				callback(menu, {
					screen: nextScreen,
				});
				break;
			case 'request-amount':
				name = input;
				menu.text = `Okay ${name}, how much do you need?`;
				nextScreen = 'approve-amount';
				callback(menu, {
					screen: nextScreen,
				});
				break;
			case 'approve-amount':
				balance = parseInt(input, 10);
				menu.text = `Awesome! ${name} we are reviewing your application and will be in touch shortly!\nHave a lovely day!`;
				menu.isTerminal = true;
				nextScreen = 'home';
				callback(menu, {
					screen: nextScreen,
				});
				await approveLoan(customer, balance);
				break;
			case 'home':
			default:
				menu.text = 'Welcome to Efinance!\n1. Apply for loan\n2. Quit';
				menu.isTerminal = false;
				callback(menu, {
					screen: nextScreen,
				});
				break;
		}
		await customer.updateMetadata({
			name,
			balance,
		});
	} catch (error) {
		log.error('USSD Error: ', error);
	}
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
		.connect();
	myClient
		.on("ussdSession", handleUssdSession);
	// myClient
	// 	.on("receivedWhatsapp", handleWhatsappMessages)

}

start();
