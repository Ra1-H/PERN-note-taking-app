import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { auth } from "../middleware/auth";

const saltRounds = 10;

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.SECRET_KEY;

//signup
app.post("/api/user/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new Error("Request missing needed data!");
    }

    //check if user exists
    const userExists = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    console.log(userExists);

    //if user exists return error
    if (userExists) {
      return res
        .status(400)
        .json({ error: "User with email " + email + " already exists" });
    }

    //if not,create it,and hash passsword
    const hashedPass = bcrypt.hashSync(password, saltRounds); //hashSync means already synchronous and doesn't need await
    console.log("hashed password: ", hashedPass);
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        //never store raw passwords,needs hashing
        password: hashedPass,
      },
    });
    newUser["password"] = ""; //for not to send password to frontend

    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token expiration time (1 hour)
        data: JSON.stringify(newUser),
      },
      //@ts-ignore
      SECRET_KEY
    );
    console.log("this is user's token", token);
    res.json({ user: newUser, token: token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error happened!" });
  }
});

//login
app.post("/api/user/signin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new Error("Request missing needed data!");
    }

    //check if user exists
    const userExists = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    //if user does not exists return error
    if (!userExists) {
      return res
        .status(400)
        .json({ error: "User with email " + email + " does not exists" });
    }

    //if not return the user
    const hash = userExists.password;
    const authentication = bcrypt.compareSync(password, hash);
    console.log(userExists);
    console.log(authentication);

    if (!authentication) {
      res.status(400).send("Wrong password");
    }

    userExists["password"] = "";

    //the response to a successful signin is a javascipt web token.which is a representation of the signed-in-user data to allow this user to make actions without the need to authenticate him each time
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        data: JSON.stringify(userExists),
        //@ts-ignore
      },
      //@ts-ignore
      SECRET_KEY
    );

    console.log("this is user's token", token);
    res.json({ token: token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error happened!" });
  }
});

//get user notes
app.get("/api/notes/list", auth, async (req, res) => {
  try {
    //@ts-ignore
    const userIdentification = JSON.parse(req.decoded.data).id;
    const userNotes = await prisma.note.findMany({
      where: { userId: userIdentification },
    });

    //@ts-ignore
    console.log("this is decoded data:", JSON.parse(req.decoded.data));

    res.json(userNotes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error happened!" });
  }
});

//create user note
app.post("/api/notes/create", auth, async (req, res) => {
  try {
    //@ts-ignore
    const userIdentification = JSON.parse(req.decoded.data).id;

    const { title, content } = req.body; //first get the title and content from the requests body

    if (!title || !content) {
      return res.status(400).send("title and content fields are required!");
    }

    const newNote = await prisma.note.create({
      data: {
        title,
        content,
        userId: userIdentification,
      },
    });

    res.json(newNote);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error happened!" });
  }
});

//delete a user note
app.delete("/api/notes/:noteId", auth, async (req, res) => {
  try {
    //@ts-ignore
    const userIdentification = JSON.parse(req.decoded.data).id;
    const noteIdentification = parseInt(req.params.noteId);

    if (!noteIdentification || isNaN(noteIdentification)) {
      return res.status(400).send("invalid note Id");
    }

    // Check if the note belongs to the signed-in user
    const existingNote = await prisma.note.findUnique({
      where: {
        id: noteIdentification,
      },
    });

    if (!existingNote || existingNote.userId !== userIdentification) {
      return res.status(404).json({ error: "Note not found for this user!" });
    }

    //delete the note if it exists
    await prisma.note.delete({
      where: { id: noteIdentification },
    });
    res.status(200).send("note successfully deleted!");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "oops! Error happened!" });
  }
});

//update a note
app.put("/api/notes/:noteId", auth, async (req, res) => {
  try {
    //@ts-ignore
    const userIdentification = JSON.parse(req.decoded.data).id;
    const noteIdentification = parseInt(req.params.noteId);

    if (!noteIdentification || isNaN(noteIdentification)) {
      return res.status(400).send("invalid note Id");
    }

    // Check if the note belongs to the signed-in user
    const existingNote = await prisma.note.findUnique({
      where: {
        id: noteIdentification,
      },
    });

    if (!existingNote || existingNote.userId !== userIdentification) {
      return res.status(404).json({ error: "Note not found for this user!" });
    }

    //update if existing
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).send("title and content fields are required!");
    }

    if (!noteIdentification || isNaN(noteIdentification)) {
      return res.status(400).send("Id must be a valid number");
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteIdentification },
      data: { title, content },
    });

    console.log("note updated succesfully", updatedNote);
    res.json(updatedNote);
  } catch (error) {
    res.status(500).send("oops something went wrong!");
  }
});

app.listen(5000, () => {
  console.log("server running on localhost:5000");
});
