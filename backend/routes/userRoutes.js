import { Router } from "express";
const router = Router();
import { Student } from "../model/Student.js";
import { Teacher } from "../model/Teacher.js";

//login
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  let type = "student";
  //check if user is a student
  let user = await Student.findOne({ email });
  if (!user) {
    type = "teacher";
    user = await Teacher.findOne({ email });
  }

  if (user) {
    if (user.password === password) {
      user.type = type;
      res.send({ user: user, type: type });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } else {
    res.status(400).json({ message: "No such User" });
  }
});

// Create a new user
router.post("/signup", async (req, res) => {
  const { name, email, pno, dob, password, type } = req.body;
  if (type === "student") {
    const user = new Student({
      name: name,
      email: email,
      pno: pno,
      dob: dob,
      password: password,
    });
    try {
      const existingUser = await Student.findOne({ email: email }).exec();
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      } else {
        const newUser = await user.save();
        res.status(201).json(newUser);
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  } else {
    const user = new Teacher({
      name: name,
      email: email,
      pno: pno,
      dob: dob,
      password: password,
    });
    try {
      const existingUser = await Teacher.findOne({ email: email }).exec();
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      } else {
        const newUser = await user.save();
        res.status(201).json(newUser);
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
});

export default router;
