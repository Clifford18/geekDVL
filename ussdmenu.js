const log = require("signale");

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

const getNextScreen = (nextScreen, input) => {
	switch (nextScreen) {
		case "register-home":
			if (input === "1") {
				nextScreen = "register-name";
			} else if (input === "2") {
				nextScreen = "quit";
			}
			break;

		case "garbage-collection":
			if (input === "1") {
				nextScreen = "roles";
			} else if (input === "2") {
				nextScreen = "collectors_ranks";
			}
			break;

		case "home":
			if (input === "1") {
				nextScreen = "garbage-collection";
			} else if (input === "2") {
				nextScreen = "view-collectors";
			} else if (input === "3") {
				nextScreen = "talk-to-an-agent";
			} else if (input === "4") {
				nextScreen = "crowdfunding";
			} else if (input === "5") {
				nextScreen = "quit";
			}
			break;

		case "crowdfunding":
			if (input === "1") {
				nextScreen = "stellar";
			} else if (input === "2") {
				nextScreen = "m-pesa";
			}

			break;
	}
	return nextScreen;
};

exports.handleUssdSession = async (
	notification,
	customer,
	appData,
	callback
) => {
	const sessionId = notification.sessionId;
	const input = notification.input.text;
	let { nextScreen = "home" } = appData || {};

	log.info(`Processing USSD from ${customer.customerNumber.number}`);
	log.info(nextScreen);

	const customerData = await customer.getMetadata();
	let { name, address, role, registered = false, collector } = customerData;

	console.log(customerData);
	const menu = {
		text: "Welcome to Garbanize",
		isTerminal: false,
	};

	if (!registered && nextScreen == "home") {
		nextScreen = "register-home";
	}

	// Bootstrap screen flow
	nextScreen = getNextScreen(nextScreen, input);

	const activity = {
		key: null,
		sessionId,
		properties: {
			name,
			address,
			role,
			registered,
		},
	};

	switch (nextScreen) {
		// Registration
		case "register-home":
			menu.text = `${menu.text}\n1. Register\n2. Quit`;
			activity.key = "RegistrationStart";
			break;

		case "register-name":
			menu.text = "What is your name?";
			nextScreen = "register-location";
			activity.key = "RegistrationGetName";
			break;

		case "register-location":
			name = input;
			menu.text = `Great ${name}, whats your location?\n${config
				.get("locations")
				.map((i, idx) => `${idx + 1}. ${i}`)
				.join("\n")}`;
			nextScreen = "register-role";
			activity.key = `RegistrationGetLocation`;
			activity.properties = {
				...activity.properties,
				name,
			};
			break;

		case "register-role":
			address = config.get("locations")[parseInt(input, 10) - 1];
			registered = true;
			menu.text = `You can also specify your role\n${config
				.get("roles")
				.map((i, idx) => `${idx + 1}. ${i}`)
				.join("\n")}`;
			nextScreen = "register-complete";
			activity.key = "RegistrationGetRole";
			activity.properties = {
				...activity.properties,
				address,
			};
			break;

		case "register-complete":
			role = config.get("roles")[parseInt(input, 10) - 1];
			menu.text = `Great! Thank you ${name} for registering on Garbanize. We are processing your application and will get back to you shortly`;
			menu.isTerminal = true;
			registered = true;
			activity.key = "RegistrationFinished";
			activity.properties = {
				...activity.properties,
				role,
				registered,
			};

			nextScreen = "home";
			const text = `Hi ${name}, thank you for joining Garbanize familiy. Dial ${process.env.USSD_CODE} to get started`;

			customer
				.sendMessage(
					{
						number: process.env.SENDER_ID,
						channel: "sms",
					},
					{
						body: {
							text,
						},
					}
				)
				.catch(console.error);

			break;

		// main menu
		case "home":
			menu.text = `Welcome to Garbanize!\n1.Garbage collection \n2.View Collectors\n3.Talk to an Agent\n4.Crowdfunding\n5. Quit`;
			activity.key = "showHome";
			break;

		case "garbage-collection":
			menu.text =
				"Okay! Are you a landlord or a homeowner?\n1.landlord \n2. top Collectors\n3. back";
			break;

		case "roles":
			menu.text =
				"Greetings Landlord! Please select services needed?\n1.Call Collectors \n2.Send SMS reminder\n3.back";
			nextScreen = "home";
			menu.isTerminal = true;
			break;

		case "landlord_view":
			break;

		case "collectors_ranks":
			menu.text = `Here are top rated collectors available in your area\n${config
				.get("collectors")
				.map((i, idx) => `${idx + 1}. ${i}`)
				.join("\n")}`;
			nextScreen = "home";
			menu.isTerminal = true;
			break;

		case "crowdfunding":
			menu.text = "Fund a community activity\n1. Stellar wallet\n2. Mpesa";
			break;

		case "stellar":
			menu.text = "not available at the moment";
			nextScreen = "home";
			menu.isTerminal = true;
			break;

		case "mpesa":
			menu.text = "not available at the moment";
			nextScreen = "home";
			menu.isTerminal = true;
			break;

		case "view-collectors":
			menu.text = `Here are collectors available in your area\n${config
				.get("collectors")
				.map((i, idx) => `${idx + 1}. ${i}`)
				.join("\n")}`;
			nextScreen = "collectors";
			break;

		case "collectors":
			collector = config.get("collectors")[parseInt(input, 10) - 1];
			menu.text = `Here is the contact of the collecor you have selected\n${config
				.get(`contacts.${collector}`)
				.map((i, idx) => `${idx + 1}. ${i}`)
				.join("\n")}`;
			menu.isTerminal = true;
			nextScreen = "home";
			break;

		case "quit":
			menu.text = "Thank you for using Garbanize";
			menu.isTerminal = true;
			activity.key = "Quit";
			nextScreen = "home";
			callback(menu, {
				screen: nextScreen,
			});
			break;
	}

	await customer.updateMetadata({
		name,
		address,
		registered,
		collector,
	});

	callback(menu, { ...appData, nextScreen });
	customer
		.updateActivity(config.get("activityChannel"), activity)
		.catch(console.error);

	// console.log(newUser);
};