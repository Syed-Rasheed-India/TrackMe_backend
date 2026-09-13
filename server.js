import express from "express";
import db from "./models/db.js";
import Task from "./models/task.js";
import cors from "cors";
import dotenv from "dotenv";

import authMiddleware from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/emailRoute.js";
import "./services/revisionEmailService.js";

dotenv.config();

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================


const allowedOrigins = [
  "http://localhost:5173",
  "https://track-me-rho.vercel.app"
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);


// JSON BODY

app.use(express.json());


// URL ENCODED BODY

app.use(
  express.urlencoded({
    extended: true
  })
);


// ==========================================
// AUTH ROUTES
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);
app.use("/api", emailRoutes);


// ==========================================
// REVISION SCHEDULE
// ==========================================

const revisionDays = [1, 3, 7, 14, 30];


// ==========================================
// CREATE REVISIONS
// ==========================================

const createRevisions = (taskDate) => {

  const revisions = [];

  revisionDays.forEach((day, index) => {

    const date = new Date(taskDate);

    date.setDate(
      date.getDate() + day
    );

    revisions.push({

      // Day number
      day: day,

      // Revision date
      date: date
        .toISOString()
        .split("T")[0],

      // Day 1 = pending
      // Other days = locked
      status:
        index === 0
          ? "pending"
          : "locked",

      // Day 1 = unlocked
      unlocked:
        index === 0,

      // Email reminder
      emailSent: false,

      // Completion time
      completedAt: null

    });

  });

  return revisions;
};


// ==========================================
// CREATE TASK
// ==========================================
// PROTECTED ROUTE
// ==========================================

app.post(
  "/api/tasks",
  authMiddleware,
  async (req, res) => {

    try {

      const {
        date,
        tasks
      } = req.body;


      // -------------------------------
      // VALIDATION
      // -------------------------------

      if (!date) {

        return res.status(400).json({

          message:
            "Date is required"

        });

      }


      if (
        !tasks ||
        !Array.isArray(tasks) ||
        tasks.length === 0
      ) {

        return res.status(400).json({

          message:
            "At least one task is required"

        });

      }


      // -------------------------------
      // CREATE REVISION SCHEDULE
      // -------------------------------

      const revisions =
        createRevisions(date);


      // -------------------------------
      // CREATE TASK
      // -------------------------------

      const task =
        new Task({

          // Logged-in user's ID
          user: req.user.userId,

          date,

          tasks,

          revisions

        });


      // -------------------------------
      // SAVE
      // -------------------------------

      const response =
        await task.save();


      res.status(201).json(
        response
      );


    } catch (error) {

      console.error(
        "CREATE ERROR:",
        error
      );

      res.status(500).json({

        message:
          "Failed to save tasks"

      });

    }

  }
);


// ==========================================
// GET ALL TASKS
// ==========================================
// ONLY LOGGED-IN USER'S TASKS
// ==========================================

app.get(
  "/api/tasks",
  authMiddleware,
  async (req, res) => {

    try {

      const data =
        await Task.find({

          user:
            req.user.userId

        });


      res.status(200).json(
        data
      );


    } catch (error) {

      console.error(
        "FETCH ERROR:",
        error
      );

      res.status(500).json({

        message:
          "Failed to fetch tasks"

      });

    }

  }
);


// ==========================================
// COMPLETE REVISION
// ==========================================
// PROTECTED ROUTE
// ==========================================

app.patch(
  "/api/tasks/:id/revision/:day",
  authMiddleware,
  async (req, res) => {

    try {

      // -------------------------------
      // FIND TASK
      // -------------------------------

      const task =
        await Task.findOne({

          _id:
            req.params.id,

          // Only owner's task
          user:
            req.user.userId

        });


      if (!task) {

        return res.status(404).json({

          message:
            "Task not found"

        });

      }


      // -------------------------------
      // GET REVISION DAY
      // -------------------------------

      const revisionDay =
        Number(req.params.day);


      // -------------------------------
      // FIND CURRENT REVISION
      // -------------------------------

      const currentRevision =
        task.revisions.find(

          (revision) =>
            revision.day === revisionDay

        );


      if (!currentRevision) {

        return res.status(404).json({

          message:
            "Revision not found"

        });

      }


      // -------------------------------
      // CHECK REVISION AVAILABILITY
      // -------------------------------

      if (
        currentRevision.status !==
          "pending" ||

        currentRevision.unlocked !==
          true
      ) {

        return res.status(400).json({

          message:
            "Revision is not available to complete"

        });

      }


      // -------------------------------
      // COMPLETE CURRENT REVISION
      // -------------------------------

      currentRevision.status =
        "completed";

      currentRevision.unlocked =
        true;

      currentRevision.completedAt =
        new Date();


      // -------------------------------
      // FIND CURRENT INDEX
      // -------------------------------

      const currentIndex =
        task.revisions.findIndex(

          (revision) =>
            revision.day === revisionDay

        );


      // -------------------------------
      // FIND NEXT REVISION
      // -------------------------------

      const nextRevision =
        task.revisions[
          currentIndex + 1
        ];


      // -------------------------------
      // UNLOCK NEXT REVISION
      // -------------------------------

      if (nextRevision) {

        nextRevision.status =
          "pending";

        nextRevision.unlocked =
          true;

        nextRevision.emailSent =
          false;

        nextRevision.completedAt =
          null;

      }


      // -------------------------------
      // SAVE
      // -------------------------------

      await task.save();


      // -------------------------------
      // RESPONSE
      // -------------------------------

      res.status(200).json({

        message:
          `Day ${revisionDay} revision completed`,

        task

      });


    } catch (error) {

      console.error(
        "COMPLETE ERROR:",
        error
      );

      res.status(500).json({

        message:
          "Failed to complete revision"

      });

    }

  }
);


// ==========================================
// EDIT TASK
// ==========================================
// PROTECTED ROUTE
// ==========================================

app.patch(
  "/api/tasks/:id/edit",
  authMiddleware,
  async (req, res) => {

    try {

      const {
        date,
        tasks
      } = req.body;


      // -------------------------------
      // VALIDATION
      // -------------------------------

      if (!date) {

        return res.status(400).json({

          message:
            "Date is required"

        });

      }


      if (
        !tasks ||
        !Array.isArray(tasks) ||
        tasks.length === 0
      ) {

        return res.status(400).json({

          message:
            "At least one task is required"

        });

      }


      // -------------------------------
      // CREATE NEW REVISION SCHEDULE
      // -------------------------------

      const revisions =
        createRevisions(date);


      // -------------------------------
      // UPDATE TASK
      // -------------------------------

      const updatedTask =
        await Task.findOneAndUpdate(

          {
            _id:
              req.params.id,

            // Only owner's task
            user:
              req.user.userId

          },

          {
            date,
            tasks,
            revisions
          },

          {
            new: true,
            runValidators: true
          }

        );


      if (!updatedTask) {

        return res.status(404).json({

          message:
            "Task not found"

        });

      }


      res.status(200).json({

        message:
          "Task updated successfully",

        task:
          updatedTask

      });


    } catch (error) {

      console.error(
        "EDIT ERROR:",
        error
      );

      res.status(500).json({

        message:
          "Failed to update task"

      });

    }

  }
);


// ==========================================
// DELETE TASK
// ==========================================
// PROTECTED ROUTE
// ==========================================

app.delete(
  "/api/tasks/:id",
  authMiddleware,
  async (req, res) => {

    try {

      const deletedTask =
        await Task.findOneAndDelete({

          _id:
            req.params.id,

          // Only owner's task
          user:
            req.user.userId

        });


      if (!deletedTask) {

        return res.status(404).json({

          message:
            "Task not found"

        });

      }


      res.status(200).json({

        message:
          "Task deleted successfully"

      });


    } catch (error) {

      console.error(
        "DELETE ERROR:",
        error
      );

      res.status(500).json({

        message:
          "Failed to delete task"

      });

    }

  }
);


// ==========================================
// SERVER
// ==========================================

app.listen(
  process.env.PORT || 3000,

  () => {

    console.log(
      `Server running on port ${
        process.env.PORT || 3000
      }`
    );

  }
);