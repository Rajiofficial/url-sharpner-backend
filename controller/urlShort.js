import urlShortDetails from '../models/urlShort.js';

// To get all urls of the particular user
export const getUrl = (req, res) => {
  try {
    urlShortDetails.find({ createdBy: req.userId }, (err, data) => {
      if (err) {
        return res
          .status(403)
          .json('An error accured while getting urldetails');
      } else {
        res.status(200).json(data);
      }
    });
  } catch (error) {
    res.status(500).send('Internal server error');
    console.log('something went wrong', error);
  }
};

// To create urls
export const createUrl = (req, res) => {
  try {
    req.body.createdBy = req.userId;
    let urlShort = new urlShortDetails(req.body);
    urlShort.save((err, data) => {
      if (err) {
        console.log(err);
        return res
          .status(400)
          .json({ message: 'Data is not inserted properly' });
      } else {
        res.status(201).json(data);
      }
    });
  } catch (error) {
    res.status(500).send('Internal server error');
    console.log('something went wrong', error);
  }
};

// shorturl redirect to the long url
export const redirectUrl = (req, res) => {
  try {
    urlShortDetails.findOne({ shortUrl: req.params.shortUrl }, (err, data) => {
      if (err) throw err;

      urlShortDetails.findByIdAndUpdate(
        { _id: data._id },
        { $inc: { clickCount: 1 } },
        (err) => {
          if (err) throw err;
          res.redirect(data.longUrl);
        }
      );
    });
  } catch (error) {
    res.status(500).send('Internal server error');
    console.log('something went wrong', error);
  }
};

// to delete the url
export const delUrl = (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    urlShortDetails.deleteOne({ _id: id }, (err, data) => {
      if (err) throw err;
      return res
        .status(200)
        .json({ message: 'Url deleted successfully', data: data });
    });
  } catch (error) {
    res.status(500).send('Internal server error');
    console.log('something went wrong', error);
  }
};

// To find the totalviews

export const viewsUrl = (req, res) => {
  try {
    urlShortDetails.aggregate(
      [
        { $match: { createdBy: req.userId } },
        {
          $group: {
            _id: { createdBy: '$createdBy' },
            totalViews: { $sum: '$clickCount' },
            count: { $sum: 1 },
          },
        },
      ],
      (err, data) => {
        if (err) {
          return res
            .status(403)
            .json('An error accured while getting urldetails');
        } else {
          res.status(200).json(data);
        }
      }
    );
  } catch (error) {
    res.status(500).send('Internal server error');
    console.log('something went wrong', error);
  }
};
