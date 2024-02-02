const { Router } = require('express');
const { model } = require('mongoose');
const { sign } = require('jsonwebtoken');
const { genSalt, hash } = require('bcrypt');
const { createHash } = require('crypto');
const { config } = require('dotenv');
const {
	validateRegistration,
	validateLogin,
	validateForgot,
	validateReset,
} = require('../util/validators');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const User = model('User');
const router = Router();
config();

const storage = multer.diskStorage({
	destination: 'uploads/',
	filename: function (req, file, cb) {
		cb(null, file.originalname); // Use the original name as the filename
	},
});
const filter = (req, file, cb) => {
	file.mimetype.startsWith('image')
		? cb(null, true)
		: cb({ message: 'Unsupported file format.' }, false);
};
const upload = multer({
	storage: storage,
	fileFilter: filter,
	limits: { fileSize: 6000000000, fieldSize: 25 * 1024 * 1024 },
});

// Register
router.post('/users/register', async (req, res) => {
	const { valid, errors } = validateRegistration(req?.body);

	if (!valid) return res.status(400).json(errors);

	try {
		const { email, handle } = req?.body;

		const user = await User.findOne({ $or: [{ email }, { handle }] });

		if (user) {
			if (email == user.email) {
				errors.email = 'Email already in use.';
			} else {
				errors.handle = 'Handle already in use.';
			}
			return res.status(400).json(errors);
		}

		const newUser = new User(req?.body);
		await newUser?.save();
		const token = sign({ userId: newUser?._id }, process.env.DB_SECRET_KEY, {
			expiresIn: '10d',
		});

		const userData = {
			_id: newUser?._id,
			firstName: newUser?.firstName,
			lastName: newUser?.lastName,
			handle: newUser?.handle,
			email: newUser?.email,
			profilePic: newUser?.profilePic,
			createdAt: newUser?.createdAt,
			updatedAt: newUser?.updatedAt,
		};

		res.json({ userData, token });
	} catch (err) {
		errors.message = 'Error registering user!';
		return res.status(422).json(errors);
	}
});

// Login
router.post('/users/login', async (req, res) => {
	const { valid, errors } = validateLogin(req?.body);

	if (!valid) return res.status(400).json(errors);

	try {
		const { login, password } = req?.body;

		const user = await User.findOne({
			$or: [{ email: login }, { handle: login }],
		}).populate('campaigns');

		if (!user) {
			errors.message = 'Error, user not found!';
			return res.status(404).json(errors);
		}

		await user?.comparePassword(password);
		const token = sign({ userId: user?._id }, process.env.DB_SECRET_KEY, {
			expiresIn: '10d',
		});

		const userData = {
			_id: user?._id,
			firstName: user?.firstName,
			lastName: user?.lastName,
			handle: user?.handle,
			email: user?.email,
			profilePic: user?.profilePic,
			campaigns: user?.campaigns,
			createdAt: user?.createdAt,
			updatedAt: user?.updatedAt,
		};

		res.json({ userData, token });
	} catch (err) {
		errors.message = 'Invalid login or password!';
		return res.status(400).json(errors);
	}
});

// Generate Password Reset Token
router.put('/users/generate-password-token', async (req, res) => {
	const { valid, errors } = validateForgot(req?.body);

	if (!valid) return res.status(400).json(errors);

	const { email } = req?.body;

	const user = await User.findOne({ email });

	if (!user) {
		errors.message = 'Error, user not found!';
		return res.status(404).json(errors);
	}

	try {
		const resetToken = user?.createPasswordResetToken();
		await user?.save();

		res.json({ resetToken, success: 'Token generated successfully!' });
	} catch (err) {
		errors.message = 'Error generating token';
		return res.status(400).json(errors);
	}
});

// Password Reset
router.put('/users/reset-password', async (req, res) => {
	const { valid, errors } = validateReset(req?.body);

	if (!valid) return res.status(400).json(errors);

	const { password, token } = req?.body;

	const hashedToken = createHash('sha256').update(token).digest('hex');
	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetTokenExpires: { $gt: new Date() },
	});

	if (!user) {
		errors.message = 'Token expired, try again later.';
		return res.status(400).json(errors);
	}

	try {
		user.password = password;
		user.passwordResetToken = undefined;
		user.passwordResetTokenExpires = undefined;
		await user?.save();

		res.json({ success: 'Password Upated Successfully!' });
	} catch (err) {
		errors.message = 'Error verifing token.';
		return res.status(400).json(errors);
	}
});

// Read
router.get('/users', requireAuth, async (req, res) => {
	let errors = {};
	const hasId = req?.query?.id;

	try {
		let users;
		let userData;

		if (hasId) {
			users = await User.findById(hasId).populate('campaigns');

			if (!users) {
				errors.message = 'Error, user not found!';
				return res.status(404).json(errors);
			}

			userData = {
				_id: users?._id,
				firstName: users?.firstName,
				lastName: users?.lastName,
				handle: users?.handle,
				email: users?.email,
				profilePic: users?.profilePic,
				campaigns: users?.campaigns,
				createdAt: users?.createdAt,
				updatedAt: users?.updatedAt,
			};
		} else {
			userData = [];
			users = await User.find({}).populate('campaigns');
			users.forEach((user) => {
				userData.push({
					_id: user?._id,
					firstName: user?.firstName,
					lastName: user?.lastName,
					handle: user?.handle,
					email: user?.email,
					profilePic: user?.profilePic,
					campaigns: user?.campaigns,
					createdAt: user?.createdAt,
					updatedAt: user?.updatedAt,
				});
			});
		}

		res.json(userData);
	} catch (err) {
		console.log(err);
		errors.message = 'Error getting users!';
		return res.status(400).json(errors);
	}
});

// Update
router.put('/users/:id', requireAuth, async (req, res) => {
	let errors = {};
	const _id = req?.params?.id;

	try {
		if (req?.body?.password) {
			const salt = await genSalt(10);
			req.body.password = await hash(req?.body?.password, salt);
		}

		const updatedUser = await User.findByIdAndUpdate(
			_id,
			{
				$set: req?.body,
			},
			{
				new: true,
			}
		).populate('campaigns');

		if (!updatedUser) {
			errors.message = 'Error, user not found!';
			return res.status(404).json(errors);
		}

		res.json({ updatedUser, success: 'User updated successfully!' });
	} catch (err) {
		console.log(err);
		errors.message = 'Error updating user!';
		return res.status(400).json(errors);
	}
});

// Update profile pic
router.put(
	'/users/:id/profile-pic',
	upload.single('file'),
	requireAuth,
	async (req, res) => {
		let errors = {};
		const { id } = req?.params?.id;

		const filePath = `/uploads/images/${req?.file?.filename}.png`;
		const tempPath = req?.file?.path;
		const targetPath = path.join(__dirname, `../../${filePath}`);

		try {
			fs.rename(tempPath, targetPath, (error) => console.log(error));
			const user = await User.findByIdAndUpdate(
				id,
				{
					$set: {
						profilePic: `https://dnd-companion-backend.onrender.com${filePath}`,
					},
				},
				{
					new: true,
				}
			);

			if (!user) {
				errors.message = 'Error, user not found!';
				return res.status(404).json(errors);
			}

			res.json({ user, success: 'Profile pic updated successfully!' });
		} catch (err) {
			console.log(err);
			errors.message = 'Error updating profile pic!';
			return res.status(400).json(errors);
		}
	}
);

// Delete User
router.delete('/users/:id', requireAuth, async (req, res) => {
	const errors = {};
	const { id } = req?.params;

	try {
		const deleted = await User.findByIdAndDelete(id);

		if (!deleted) {
			errors.message = 'Error, user not found!';
			return res.status(404).json(errors);
		}

		res.json({ deleted, success: { message: 'User deleted successfully!' } });
	} catch (err) {
		console.log(err);
		errors.message = 'Error deleting user!';
		return res.status(400).json(errors);
	}
});

module.exports = router;
