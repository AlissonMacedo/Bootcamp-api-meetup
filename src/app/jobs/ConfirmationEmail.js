import Mail from '../../lib/Mail';

class ConfirmationEmail {
  get key() {
    return 'ConfirmationEmail';
  }

  async handle({ data }) {
    const { meetup, user } = data;

    console.log('A fila executou');

    await Mail.sendMail({
      to: `${meetup.User.name} <${meetup.User.email}>`,
      subject: `[${meetup.title}] Nova inscrição`,
      template: 'confirmation',
      context: {
        provider: meetup.User.name,
        user: user.name,
        title: meetup.title,
      },
    });
  }
}

export default new ConfirmationEmail();
