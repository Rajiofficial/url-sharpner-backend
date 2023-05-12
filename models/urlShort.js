import schemaModel from 'mongoose';
const { Schema, model } = schemaModel;
import shortid from 'shortid';

const urlSchema = new Schema(
  {
    longUrl: {
      type: String,
      required: true,
    },
    shortUrl: {
      type: String,
      required: true,
      default: shortid.generate,
    },
    clickCount: {
      type: Number,
      required: true,
      default: 0,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const urlShortDetails = model('url_short', urlSchema);

export default urlShortDetails;
