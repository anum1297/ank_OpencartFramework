export const generateNameDetails = async () => {
	const { faker } = await import('@faker-js/faker');

	return {
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
	};
};

type SignupDetails = {
	firstName: string;
	lastName: string;
	email: string;
	telephone: string;
	password: string;
	passwordConfirm: string;
};

let sharedSignupDetails: Promise<SignupDetails> | undefined;

const createSignupDetails = async (profile?: { firstName: string; lastName: string }): Promise<SignupDetails> => {
	const { faker } = await import('@faker-js/faker');
	const password = faker.internet.password({ length: 12 });
	const nameDetails = profile ?? await generateNameDetails();

	return {
		firstName: nameDetails.firstName,
		lastName: nameDetails.lastName,
		email: `customer.${faker.string.uuid()}@example.com`,
		telephone: faker.string.numeric(10),
		password,
		passwordConfirm: password,
	};
};

export const generateSignupDetails = async (profile?: { firstName: string; lastName: string }) => {
	if (profile) {
		return createSignupDetails(profile);
	}

	sharedSignupDetails ??= createSignupDetails();
	return sharedSignupDetails;
};

export const getSignupCredentials = async () => {
	const { email, password } = await generateSignupDetails();
	return { email, password };
};

export const generateAddressDetails = async (profile?: { firstName: string; lastName: string }) => {
	const { faker } = await import('@faker-js/faker');
	const nameDetails = profile ?? await generateNameDetails();

	return {
		firstName: nameDetails.firstName,
		lastName: nameDetails.lastName,
		company: faker.company.name(),
		address1: `${faker.location.streetAddress({ useFullAddress: false })}`,
		address2: faker.location.streetAddress({ useFullAddress: false }),
		city: faker.location.city(),
		postCode: faker.string.numeric({ length: 6 }),
		country: 'India',
		region: 'Maharashtra',
	};
};
