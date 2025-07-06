import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, code } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlTemplate = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px; }
            .code { font-size: 32px; text-align: center; padding: 20px; color: #01939c; }
            .footer { text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>رمز التحقق لمرة واحدة</h2>
            </div>
            <h4>لقد تلقيت هذا البريد الإلكتروني لأنه تم طلب رمز لمرة واحدة يمكن استخدامه للمصادقة.</h4>
            <h4>الرجاء إدخال الرمز التالي للتحقق:</h4>
            <div class="code">
              <strong>${code}</strong>
            </div>
            <h4>إذا لم تطلب هذا التغيير، يرجى تغيير كلمة المرور الخاصة بك أو الاتصال بنا.</h4>
            <div class="footer">
              <h4>تم إرسال هذه الرسالة من هتاري</h4>
              <h4>© ${new Date().getFullYear()} هتاري. جميع الحقوق محفوظة.</h4>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `" هتاري" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "رمز التحقق لمرة واحدة",
      html: htmlTemplate
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'تم إرسال رمز التحقق بنجاح', info });
    } catch (error) {
      console.error('Failed to send email:', error);
      res.status(500).json({ error: 'فشل في إرسال رمز التحقق', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
