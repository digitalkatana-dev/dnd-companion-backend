const isEmpty = (data) => {
	if (data?.trim() === '') return true;
	else return false;
};

const isEmail = (data) => {
	const regEx =
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (data?.match(regEx)) return true;
	else return false;
};

exports.validateRegistration = (data) => {
	let errors = {};

	if (isEmpty(data?.firstName)) errors.firstName = 'Must not be empty!';
	if (isEmpty(data?.lastName)) errors.lastName = 'Must not be empty!';
	if (isEmpty(data?.handle)) errors.handle = 'Must not be empty!';
	if (isEmpty(data?.email)) {
		errors.email = 'Must not be empty!';
	} else if (!isEmail(data?.email)) {
		errors.email = 'Must be a valid email address!';
	}
	if (isEmpty(data?.password)) errors.password = 'Must not be empty!';

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};

exports.validateLogin = (data) => {
	let errors = {};

	if (isEmpty(data?.login)) errors.login = 'Must not be empty!';
	if (isEmpty(data?.password)) errors.password = 'Must not be empty!';

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};

exports.validateForgot = (data) => {
	let errors = {};

	if (isEmpty(data?.email)) {
		errors.email = 'Must not be empty!';
	} else if (!isEmail(data?.email)) {
		errors.email = 'Must be a valid email address!';
	}

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};

exports.validateReset = (data) => {
	let errors = {};

	if (isEmpty(data?.password)) errors.password = 'Must not be empty!';

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};

exports.validateCampaign = (data) => {
	let errors = {};

	if (isEmpty(data?.name)) errors.name = 'Must not be empty!';

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};
