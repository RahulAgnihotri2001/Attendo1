import { Router } from "express";
const router = Router();
import { Teacher } from "../model/Teacher.js";
import { Student } from "../model/Student.js";
import querystring from "querystring";

function getQR(session_id, email) {
    let url = `http://localhost:3000/login?${querystring.stringify({
        session_id,
        email,
    })}`;
    return url;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in meters
    return distance;
}
function checkStudentDistance(Location1, Location2) {
    Location1 = Location1.split(",");
    Location2 = Location2.split(",");
    const locationLat1 = parseFloat(Location1[0]);
    const locationLon1 = parseFloat(Location1[1]);
    const locationLat2 = parseFloat(Location2[0]);
    const locationLon2 = parseFloat(Location2[1]);

    const distance = haversineDistance(
        locationLat1,
        locationLon1,
        locationLat2,
        locationLon2
    );

    return distance.toFixed(2);
}


//login
router.post("/create", async (req, res) => {
    let { session_id, name, duration, location, radius, date, time } = req.body;
    let newSession = {
        session_id,
        date,
        time,
        name,
        duration,
        location,
        radius,
    };

    try {
        const teacher = await Teacher.findOne({ email: req.body.email });
        await Teacher.findOneAndUpdate(
            { email: req.body.email },
            { $push: { sessions: newSession } }
        );

        res.status(200).json({
            url: getQR(session_id, teacher.email),
            message: "Session created successfully",
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
//get sessions
router.post("/getSessions", async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ email: req.body.email });
        res.status(200).json({ sessions: teacher.sessions });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
//get QR
router.post("/getQR", async (req, res) => {
    try {
        let url = getQR(req.body.session_id, req.body.email);
        res.status(200).json({ url });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//attend session
router.post("/attend_session", async (req, res) => {
    let { session_id, teacher_email, regno, IP, student_email, Location, image, date } = req.body;
    try {
        let present = false;
        const teacher = await Teacher.findOne({ email: teacher_email });
        let session_details = {};
        teacher.sessions.map((session) => {
            if (session.session_id === session_id) {
                //find distance
                let distance = checkStudentDistance(Location, session.location);
                session_details = {
                    session_id: session.session_id,
                    teacher_email: teacher.email,
                    name: session.name,
                    date: session.date,
                    time: session.time,
                    duration: session.duration,
                    distance: distance,
                    radius: session.radius,
                };
                session.attendance.map((student) => {
                    if (student.regno === regno || student.student_email === student_email) {
                        present = true;
                    }
                });
                if (!present) {
                    session.attendance.push({
                        regno,
                        image,
                        date,
                        IP,
                        student_email,
                        Location,
                        distance,
                    });
                }
            }
        });
        if (!present) {
            await Teacher.findOneAndUpdate(
                { email: teacher_email },
                { sessions: teacher.sessions }
            );
            const student = await Student.findOneAndUpdate(
                { email: student_email },
                { $push: { sessions: session_details } }
            );
            res.status(200).json({ message: "Attendance marked successfully" });
        }
        else {
            res.status(200).json({ message: "Attendance already marked" });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//get student sessions
router.post("/getStudentSessions", async (req, res) => {
    try {
        const student = await Student.findOne({
            email: req
                .body.email
        });
        res.status(200).json({ sessions: student.sessions });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
