const axios = require("axios");

const sendPasswordResetOtp = async (user, otp) => {
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "Estatera", email: "estatera.team@gmail.com" },
      to: [{ email: user.email, name: user.name || "Member" }],
      subject: "Your Estatera password reset code",
      htmlContent: `<div style="font-family:Arial,sans-serif;color:#17201d;max-width:560px;margin:auto;padding:32px"><p style="letter-spacing:2px;font-size:11px;color:#b88a45;font-weight:bold">ESTATERA · PRIVATE ACCESS</p><h1 style="font-size:30px">Reset your password</h1><p>Use the following one-time code to continue. It expires in 10 minutes.</p><div style="margin:28px 0;padding:18px;background:#f0ede4;font-size:32px;font-weight:bold;letter-spacing:10px;text-align:center">${otp}</div><p style="color:#53615b">If you did not request this, you can safely ignore this email.</p></div>`,
    },
    { headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" } },
  );
};

const sendPropertyAlert = async (users, property) => {
  if (!users || users.length === 0) return;

  const propertyImage =
    property.images?.[0] || "https://estatera-hjnn.onrender.com/og-image.png";
  const propertyTitle = property.title || "New Property";
  const propertyPrice = property.price
    ? `₹${property.price.toLocaleString()}`
    : "Upon Request";
  const frontendUrl =
    process.env.FRONTEND_URL || "https://estatera-hjnn.onrender.com";

  const emailPromises = users.map((user) => {
    // 🛡️ PRIMARY INBOX LOGIC: Use the user's name
    const firstName = user.name ? user.name.split(" ")[0] : "there";

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${propertyTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      
      <!-- Hidden Preheader: Inbox Preview -->
      <div style="display: none; max-height: 0px; overflow: hidden;">
        Hi ${firstName}, I thought you might be interested in this new architectural piece in ${property.location}...
      </div>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 600px;">
              
              <!-- Simple Professional Header -->
              <tr>
                <td style="padding: 20px 0 40px 0; text-align: left;">
                  <h1 style="margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 3px; color: #0f172a; text-transform: uppercase;">ESTATERA</h1>
                  <p style="margin: 4px 0 0 0; font-size: 10px; color: #64748b; letter-spacing: 1px; font-weight: 600;">PORTFOLIO UPDATE</p>
                </td>
              </tr>

              <!-- Personal Opening (Kills Promotions Tab detection) -->
              <tr>
                <td style="padding-bottom: 30px; line-height: 1.6; color: #334155; font-size: 16px;">
                  Hi ${firstName}, <br><br>
                  A rare opportunity has just been added to our collection in <strong>${property.location}</strong>. 
                  Given your interest in premium ${property.propertyType.toLowerCase()}s, I wanted to ensure you saw the presentation first.
                </td>
              </tr>

              <!-- Hero Cinematic Image -->
              <tr>
                <td>
                  <a href="${frontendUrl}/property/${property._id}" style="text-decoration: none;">
                    <img src="${propertyImage.replace("http://", "https://")}" 
                         alt="${propertyTitle}" 
                         width="600" 
                         style="display: block; width: 600px; height: 400px; object-fit: cover; border-radius: 2px; border: 0;" />
                  </a>
                </td>
              </tr>

              <!-- Details Section -->
              <tr>
                <td style="padding: 40px 0;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="vertical-align: top;">
                        <h2 style="margin: 0; color: #0f172a; font-size: 32px; font-weight: 800; line-height: 1.1; letter-spacing: -1px;">
                          ${propertyTitle}
                        </h2>
                        <p style="margin: 15px 0 0 0; color: #475569; font-size: 15px; line-height: 1.7; max-width: 480px;">
                          ${property.description?.substring(0, 180)}...
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- High-End Specs Grid -->
              <tr>
                <td style="padding-bottom: 50px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 25px 0;">
                    <tr>
                      <td width="33%">
                         <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Investment</p>
                         <p style="margin: 5px 0 0 0; font-size: 18px; color: #2563eb; font-weight: 700;">${propertyPrice}</p>
                      </td>
                      <td width="33%" style="border-left: 1px solid #f1f5f9; padding-left: 20px;">
                         <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Area</p>
                         <p style="margin: 5px 0 0 0; font-size: 18px; color: #0f172a; font-weight: 700;">${property.size}</p>
                      </td>
                      <td width="33%" style="border-left: 1px solid #f1f5f9; padding-left: 20px;">
                         <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Status</p>
                         <p style="margin: 5px 0 0 0; font-size: 18px; color: #10b981; font-weight: 700;">Verified</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td align="center">
                  <a href="${frontendUrl}/property/${property._id}" 
                     style="background-color: #0f172a; color: #ffffff; padding: 22px 50px; text-decoration: none; font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; display: inline-block; border-radius: 0px;">
                     Explore Presentation
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 100px 0 40px 0; border-top: 1px solid #f1f5f9; margin-top: 60px;">
                  <p style="color: #94a3b8; font-size: 11px; line-height: 1.8; text-align: center;">
                    <strong>Estatera Realty Group</strong><br>
                    Chennai, Tamil Nadu. Confidential Listing Alert.<br><br>
                    To modify your alert preferences, <a href="#" style="color: #64748b; text-decoration: underline;">click here</a>.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    return axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Estatera", email: "estatera.team@gmail.com" },
        to: [{ email: user.email, name: user.name || "Member" }],
        subject: `Property Update: ${propertyTitle} in ${property.location}`,
        htmlContent: htmlContent,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  });

  const results = await Promise.allSettled(emailPromises);
  console.log(
    `📊 Extraordinary Dispatch Complete: ${results.filter((r) => r.status === "fulfilled").length} primary inbox attempts.`,
  );
};

const sendSavedSearchAlert = async (user, property, searchName) => {
  const frontendUrl = process.env.FRONTEND_URL || "https://estatera-hjnn.onrender.com";
  const price = property.price ? `₹${Number(property.price).toLocaleString("en-IN")}` : "Price on request";
  await axios.post("https://api.brevo.com/v3/smtp/email", {
    sender: { name: "Estatera", email: "estatera.team@gmail.com" },
    to: [{ email: user.email, name: user.name || "Member" }],
    subject: `New match for your saved search: ${property.title}`,
    htmlContent: `<div style="font-family:Arial,sans-serif;color:#17201d;max-width:560px;margin:auto;padding:32px"><p style="letter-spacing:2px;font-size:11px;color:#b88a45;font-weight:bold">ESTATERA · SAVED SEARCH</p><h1 style="font-size:28px">A property matches your search</h1><p><strong>${property.title}</strong> in ${property.location} matches “${searchName}”.</p><p style="font-size:20px;font-weight:bold">${price}</p><a href="${frontendUrl}/property/${property._id}" style="display:inline-block;background:#17201d;color:#fff;padding:14px 22px;text-decoration:none;font-weight:bold">View property</a><p style="color:#64748b;font-size:12px;margin-top:28px">You can manage saved-search email alerts from your Estatera profile.</p></div>`,
  }, { headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" } });
};

module.exports = { sendPropertyAlert, sendPasswordResetOtp, sendSavedSearchAlert };
