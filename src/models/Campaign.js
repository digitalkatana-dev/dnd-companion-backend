const { Schema, model } = require('mongoose');

const campaignSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		monsters: [
			{
				type: Object,
			},
		],
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{
		toJSON: {
			virtuals: true,
		},
		toObject: {
			virtuals: true,
		},
		timestamps: true,
	}
);

model('Campaign', campaignSchema);
