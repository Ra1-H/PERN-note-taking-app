import React, { useEffect, useState } from "react";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { PATH } from "./shared/constants";

type Note = {
  id: number;
  title: string;
  content: string;
  userId: number;
  user: String;
};

function App() {
  const [name, setName] = useState("");
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);

  const [newNotetitle, setNewNoteTitle] = useState("");
  const [newNotecontent, setNewNoteContent] = useState("");

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Function to make a POST request to create a new user
  const handleSignup = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/user/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Registered user:", responseData.user);

        // Store the token locally
        setToken(responseData.token);

        // Clear form fields
        setName("");
        setEmail("");
        setPassword("");
      } else {
        const errorData = await response.json();
        console.error("oops Error registering user:", errorData);
      }
    } catch (error) {
      console.error("oops Error:", error);
    }
  };

  // Function to make a POST request to sign in
  const handleSignin = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/user/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      console.log(response);

      if (response.ok) {
        const responseData = await response.json();
        setToken(responseData.token);
        console.log("we have the token as: ", token);
        setEmail("");
        setPassword("");
        setName("");
      } else {
        const errorData = await response.json();
        console.error("oops Error signing in:", errorData);
      }
    } catch (error) {
      console.error("oops Error:", error);
    }
  };

  // Function to make a POST request to create a new note
  const handleAddNote = async (event:React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/notes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newNotetitle,
          content: newNotecontent,
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes((prevNotes) => [...prevNotes, newNote]);
        // Clear input fields after successful contact creation
        setNewNoteTitle("");
        setNewNoteContent("");
      } else {
        const errorData = await response.json();
        console.error("oops Error creating note:", errorData);
      }
    } catch (error) {
      console.error("oops Error:", error);
    }
  };

  //delete
  const deleteNote = async (event: React.MouseEvent, noteId: number) => {
    event.stopPropagation(); //this stops the click event that is on the x button to inerfere with the click event that is on the whole note item update.
    try {
      const response = await fetch(PATH + `/api/notes/${noteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      } else {
        const errorData = await response.json();
        console.error("Error deleting note:", errorData);
      }
    } catch (error) {
      console.log(error);
    }
  };


  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
  };

  //updated
  const handleUpdateNote = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedNote) {
      return;
    }

    try {
      const response = await fetch(PATH + `/api/notes/${selectedNote.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newNotetitle,
          content: newNotecontent,
        }),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        const updatedNotesList = notes.map((note) =>
          note.id === selectedNote.id ? updatedNote : note
        );

        setNotes(updatedNotesList);
        setNewNoteTitle("");
        setNewNoteContent("");
        setSelectedNote(null);
      } else {
        const errorData = await response.json();
        console.error("Error updating note:", errorData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCancel = () => {
    setNewNoteTitle("");
    setNewNoteContent("");
    setSelectedNote(null);
  };



  //connecting FE to BE and get user notes each time token chamges
  useEffect(() => {
    //create an async function that calls the API
    const fetchNotes = async () => {
      try {
        const response = await fetch(PATH + "/api/notes/list", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const notesData = await response.json();
          setNotes(notesData);
        } else {
          const errorData = await response.json();
          console.error("oops Error fetching notes:", errorData);
        }
      } catch (e) {
        console.log(e);
      }
    };

    if (token) {
      fetchNotes();
    }
  }, [token]);

  return (
    <div className="app-container">

    <div>
      {/* user form */}
      <form
        className="note-form">
          <input
              type="text"
              id="name"
              name="name"
              placeholder="Name..."
              onChange={(e) => {
                setName(e.target.value);
                setUser(e.target.value);
              }}
              value={name}
            />
            <input
              type="text"
              name="email"
              id="email"
              placeholder="Email..."
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              value={email}
            />
            <input
              type="text"
              name="password"
              id="password"
              placeholder="Password..."
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              value={password}
            />
            <div className="register-button">
              <button style={{marginRight:"20px",width:"100px"}} type="button" onClick={handleSignup}>
                Signup
              </button>
              <button style={{width:"100px"}}  type="button" onClick={handleSignin}>
                Signin
              </button>
            </div>
      </form>

      <div style={{display:"block",border:"1px solid gray",width:"100%",marginBottom: "20px"}}></div>
        {/* note form */}
        <form
          className="note-form"
          onSubmit={(event) =>
            selectedNote ? handleUpdateNote(event) : handleAddNote(event)
          }
        >
          <input
            placeholder="title"
            required
            value={newNotetitle}
            onChange={(event) => setNewNoteTitle(event.target.value)}
          ></input>
          <textarea
            placeholder="content"
            rows={10}
            required
            value={newNotecontent}
            onChange={(event) => setNewNoteContent(event.target.value)}
          ></textarea>
          {selectedNote ? (
            <div className="edit-buttons">
              <button type="submit">Save</button>
              <button onClick={handleCancel}>Cancel</button>
            </div>
          ) : (
            <button type="submit">Add Note</button>
          )}
        </form>
    </div>

      

      <div className="notes-grid">
        {notes.map((note) => (
          <div className="notes-header">
            <div className="note-item" onClick={() => handleNoteClick(note)}>
              <div className="notes-header">
                <button
                  onClick={(event) => {
                    deleteNote(event, note.id);
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              <h2>{note.title}</h2>
              <p>{note.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
