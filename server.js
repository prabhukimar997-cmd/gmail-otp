

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// OTP store
let otpStore = {};
let lastSent = {};

// 🔐 Gmail transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "prabhukimar997@gmail.com",
        pass: "naaywhujgkbkmqhk" // ⚠️ बाद में नया app password बना लेना
    }
});

// 📩 Send OTP (POST)
app.post("/send-otp", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.send({ success: false, message: "Email required" });
    }

    if (lastSent[email] && Date.now() - lastSent[email] < 60000) {
        return res.send({ success: false, message: "Wait 1 minute" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore[email] = {
        otp: otp,
        expires: Date.now() + 5 * 60 * 1000
    };

    lastSent[email] = Date.now();

    try {
        await transporter.sendMail({
            from: "prabhukimar997@gmail.com",
            to: email,
            subject: "Your OTP Code",
            html: `<h2>Your OTP is: ${otp}</h2>`
        });

        res.send({ success: true, otp }); // testing ke liye otp bhi bhej raha
    } catch (err) {
        console.log(err);
        res.send({ success: false, message: "Email failed" });
    }
});

// 🌐 Send OTP (GET - browser ke liye)
app.get("/send-otp", async (req, res) => {
    const email = req.query.email;

    if (!email) return res.send("Email required");

    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        await transporter.sendMail({
            from: "prabhukimar997@gmail.com",
            to: email,
            subject: "OTP Code",
            text: `Your OTP is ${otp}`
        });

        res.send("OTP sent successfully");
    } catch (err) {
        console.log(err);
        res.send("Email failed");
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

// 🚀 Server start
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running on port " + PORT);
});



