const { Router } = require('express');
const { model } = require('mongoose');
const { config } = require('dotenv');
const { validateCampaign } = require('../util/validators');
const requireAuth = require('../middleware/requireAuth');
const Campaign = model('Campaign');
const router = Router();
config();

// Create
router.post('/campaigns', requireAuth, async (req, res) => {
	const { valid, errors } = validateCampaign(req?.body);

	if (!valid) return res.status(400).json(errors);

	try {
		const { name } = req?.body;

		const campaign = await Campaign.findOne({ name });

		if (campaign) {
			errors.name = 'Name already in use.';
			return res.status(400).json(errors);
		}

		const newCampaign = new Campaign(req?.body);
		await newCampaign?.save();

		res.json({ newCampaign, success: 'Campaign created successfully!' });
	} catch (err) {
		console.log(err);
		errors.message = 'Error creating campaign!';
		return res.status(400).json(errors);
	}
});

// Read
router.get('/campaigns', requireAuth, async (req, res) => {
	const errors = {};
	const createdBy = req?.query?.createdBy;
	const hasId = req?.query?.id;

	try {
		let campaigns;

		if (createdBy) {
			campaigns = await Campaign.find({ createdBy });
		} else if (hasId) {
			campaigns = await Campaign.findById(hasId);
		} else {
			campaigns = await Campaign.find({});
		}

		res.json(campaigns);
	} catch (err) {
		errors.message = 'Error retrieving campaigns!';
		return res.status(400).json(errors);
	}
});

// Update
router.put('/campaigns/:campaignId', requireAuth, async (req, res) => {
	let errors = {};

	try {
		const { campaignId } = req?.params;

		const updated = await Campaign.findByIdAndUpdate(
			campaignId,
			{
				$set: req?.body,
			},
			{
				new: true,
			}
		);

		if (!updated) {
			errors.message = 'Error, campaign not found!';
			return res.status(404).json(errors);
		}

		res.json({ updated, success: 'Campaign updated successfully!' });
	} catch (err) {
		errors.message = 'Error updating campaign!';
		return res.status(400).json(errors);
	}
});

// Add/Remove Monster
router.put('/campaigns/:campaignId/monsters', requireAuth, async (req, res) => {
	let errors = {};

	try {
		const { campaignId } = req?.params;
		const { monster } = req?.body;
		const campaign = await Campaign.findById(campaignId);
		const monsters = campaign.monsters;
		const inCampaign = monsters.some((item) => item.slug == monster.slug);
		const option = inCampaign ? '$pull' : '$addToSet';
		const successMessage =
			option === '$pull'
				? `${monster.name} has been removed from ${campaign.name}.`
				: `${monster.name} has been added to ${campaign.name}.`;

		const updated = await Campaign.findByIdAndUpdate(
			campaignId,
			{ [option]: { monsters: monster } },
			{ new: true }
		);

		res.json({
			updated,
			success: successMessage,
		});
	} catch (err) {
		console.log(err);
		errors.message = 'Error updating campaign!';
		return res.status(400).json(errors);
	}
});

//Delete
router.delete('/campaigns/:id', requireAuth, async (req, res) => {
	let errors = {};

	try {
		const { id } = req?.params;

		const deleted = await Campaign.findByIdAndDelete(id);

		if (!deleted) {
			errors.message = 'Error, campaign not found!';
			return res.status(404).json(errors);
		}

		res.json({ deleted, success: 'Campaign deleted successfully!' });
	} catch (err) {
		console.log(err);
		errors.message = 'Error deleting campaign!';
		return res.status(400).json(errors);
	}
});

module.exports = router;
