const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// OTP store
let otpStore = {};
let lastSent = {};

// Gmail transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "prabhukimar997@gmail.com",
        pass: "naaywhujgkbkmqhk" // 👈 yaha apna app password daalo
    }
});

// 🔥 Send OTP
app.post("/send-otp", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.send({ success: false, message: "Email required" });
    }

    // Spam protection (1 min)
    if (lastSent[email] && Date.now() - lastSent[email] < 60000) {
        return res.send({ success: false, message: "Wait 1 minute" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore[email] = {
        otp: otp,
        expires: Date.now() + 5 * 60 * 1000
    };

    lastSent[email] = Date.now();

    const mailOptions = {
        from: "prabhukimar997@gmail.com",
        to: email,
        subject: "Your OTP Code",
        html: `
        <div style="font-family:sans-serif;text-align:center;">
            <h2>🔐 OTP Verification</h2>
            <p>Your OTP is:</p>
            <h1 style="color:blue;">${otp}</h1>
            <p>Valid for 5 minutes</p>
        </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.send({ success: true, message: "OTP sent" });
    } catch (err) {
        console.log(err);
        res.send({ success: false, message: "Email failed" });
    }
});

// 🔐 Verify OTP
app.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;

    const data = otpStore[email];

    if (!data) {
        return res.send({ success: false, message: "No OTP found" });
    }

    if (Date.now() > data.expires) {
        delete otpStore[email];
        return res.send({ success: false, message: "OTP expired" });
    }

    if (data.otp == otp) {
        delete otpStore[email];
        return res.send({ success: true, message: "OTP verified" });
    } else {
        return res.send({ success: false, message: "Wrong OTP" });
    }
});

// Start server
app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});
