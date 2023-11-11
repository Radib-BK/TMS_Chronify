require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    dueDate: Date,
    priority: Number,
    category: String,
    status: { type: String, default: "pending" },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  });

const Task = mongoose.model("Task", taskSchema);
const User = mongoose.model("User", userSchema);

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});


// Register route
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      alert("Username already exists");
      return res.status(409).send("Username already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    console.log("New User:", newUser);
    await newUser.save();
    console.log("User registered successfully");
    res.status(201).send("User registered successfully");
  } catch (err) {
    console.error(err);
    // Send a more detailed error message
    res.status(500).send(`Registration failed: ${err.message}`);
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).send("Invalid username or password");
    }

    // Check the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send("Invalid username or password");
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET);
    console.log("Token stored in local storage:", token);


    return res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

const invalidatedTokens = [];

app.get("/logout", (req, res) => {
  // Invalidate the token
  const token = req.header("Authorization");
  invalidatedTokens.push(token);

  // Redirect to the login page
  res.redirect("/login");
});

const verifyToken = (req, res, next) => {
    const token = req.header("Authorization");
    try { 
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token decoded:", decoded);
        req.user = decoded;
        next();
    } catch (ex) {
        console.error("Invalid token:", token);
        return res.redirect("/login");
    }
};


app.get("/", verifyToken, (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.redirect("/login");
  }
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/viewTasks", (req, res) => {
  res.sendFile(path.join(__dirname, "viewTasks.html"));
});

app.post("/tasks/create", verifyToken, async (req, res) => {
    try {
        const newTask = new Task({
            title: req.body.title,
            description: req.body.description,
            dueDate: req.body.dueDate,
            priority: req.body.priority,
            category: req.body.category,
            user: req.body.user,
        });

        await newTask.save();
        console.log("Data inserted successfully");
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// Add this route after the verifyToken middleware
app.get("/user", verifyToken, async (req, res) => {
  try {
    // Retrieve user information based on the decoded token
    const user = await User.findOne({ username: req.user.username });

    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }

    // Return user information
    res.json({
      username: user.username,
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/categories", verifyToken, async (req, res) => {
  try {
    const categories = await Task.distinct("category", { user: req.user.userId });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/tasks", async (req, res) => {
  try {
    let sortQuery = {};

    if (req.query.sortBy) {
      if (req.query.sortBy === "priority") {
        sortQuery.priority = 1;
      } else if (req.query.sortBy === "dueDate") {
        sortQuery.dueDate = 1;
      }
    }

    let filterQuery = {};

    if (req.query.category) {
      filterQuery.category = req.query.category;
    }

    if (req.query.status) {
      filterQuery.status = req.query.status;
    }

    if (req.query.search) {
      filterQuery.$or = [
        { title: { $regex: new RegExp(req.query.search, "i") } },
        { description: { $regex: new RegExp(req.query.search, "i") } },
      ];
    }
    filterQuery.user = req.query.userId;
    const tasks = await Task.find(filterQuery).sort(sortQuery);

    console.log("Tasks are retrieved from the database");
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/tasks/:taskId", async (req, res) => {
    try {
      const taskId = req.params.taskId;
      // Only retrieve the task if it is associated with the logged-in user
      const task = await Task.findOne({ _id: taskId});
  
      if (!task) {
        return res.status(404).send("Task not found");
      }
  
      res.json(task);
      console.log("item retrieved");
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

  app.put("/tasks/:taskId", async (req, res) => {
    try {
      const taskId = req.params.taskId;
      // Ensure the task is associated with the logged-in user
      const task = await Task.findOne({ _id: taskId});
  
      if (!task) {
        console.log("Task not found");
        return res.status(404).send("Task not found");
      }
  
      const updatedTask = {
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
        priority: req.body.priority,
        category: req.body.category,
      };
      
    // Update the task
    const updatedTaskResult = await Task.findByIdAndUpdate(taskId, updatedTask, {
        new: true,
      });
  
      console.log("Task updated successfully");
      res.json(updatedTaskResult);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
});

app.put("/tasks/:taskId/complete", async (req, res) => {
  try {
    const taskId = req.params.taskId;

    const task = await Task.findOne({ _id: taskId})

    if (!task) {
      return res.status(404).send("Task not found");
    }

    // Toggle the status between 'pending' and 'completed'
    const newStatus = task.status === "pending" ? "completed" : "pending";

    // Update the task with the new status
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { status: newStatus },
      { new: true }
    );

    res.json(updatedTask);
    console.log("Item status toggled");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.delete("/tasks/:taskId", async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const deletedTask = await Task.findOneAndDelete({ _id: taskId});


    if (!deletedTask) {
      return res
        .status(404)
        .json({ error: "Task not found so could not delete" });
    }

    res.json({ message: "Task has been deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

//Connect to the database before listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running`);
  });
})