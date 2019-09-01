import { Op } from 'sequelize';

import Subscription from '../models/Subscription';
import User from '../models/User';
import File from '../models/File';
import Meetup from '../models/Meetup';

import ConfirmationEmail from '../jobs/ConfirmationEmail';
import Queue from '../../lib/Queue';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      attributes: ['id'],
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: { [Op.gt]: new Date() },
          },
          include: [
            { model: User },
            { model: File, as: 'file', attributes: ['id', 'path', 'url'] },
          ],
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const user = await User.findByPk(req.userId);
    const meetup = await Meetup.findByPk(req.params.meetupId, {
      include: [User],
    });

    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to you own meetups" });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't subscribe to past meetups" });
    }

    const checkDate = await Subscription.findOne({
      where: {
        user_id: user.id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to two meetups at the same time" });
    }

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id: meetup.id,
    });

    await Queue.add(ConfirmationEmail.key, { meetup, user });

    return res.json(subscription);
  }

  // Delete meetups of user

  async delete(req, res) {
    const subscription = await Subscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription not found' });
    }

    await subscription.destroy();

    return res.send();
  }
}

export default new SubscriptionController();
