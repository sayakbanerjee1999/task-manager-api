const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeMail = (email, name) => {
    const msg = {
    to: email,
    from: "sayakbanerjee022@gmail.com",
    subject: "Welcome to my life",
    text: `Welcome to the app ${name}. Let me know how you get along with it. Remember I Love YOU.... `
    }
    sgMail.send(msg)
}

const sendCancellationMail = (email, name) => {
    const msg = {
        to: email,
        from: "sayakbanerjee022@gmail.com",
        subject: "Goodbye",
        text: `It has been a great journey ${name}. Let me know what went wrong from our side. Anyways Fuck OFF ${name}.... `
    }
    sgMail.send(msg)
}

module.exports = {
    sendWelcomeMail,
    sendCancellationMail
}