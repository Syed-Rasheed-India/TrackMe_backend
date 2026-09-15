import cron from "node-cron";
import User from "../models/User.js";
import Task from "../models/task.js";
import sendMail from "../utils/sendEmail.js";

// ======================================================
// Get today's date in India
// ======================================================

const getTodayIndia = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};


// ======================================================
// Send today's revision emails
// ======================================================

const sendDailyRevisionEmails = async () => {
  try {
    console.log("======================================");
    console.log("Checking today's revisions...");
    console.log("======================================");

    // Today's date in India
    const today = getTodayIndia();

    console.log("Today's date:", today);

    // ==================================================
    // Get all registered users
    // ==================================================

    const users = await User.find();

    console.log("Total users:", users.length);

    // ==================================================
    // Process each user
    // ==================================================

    for (const user of users) {

      console.log("--------------------------------------");
      console.log("Checking user:", user.email);
      console.log("--------------------------------------");

      // ==================================================
      // Find only this user's tasks
      // ==================================================

      const tasks = await Task.find({
        user: user._id,
      });

      console.log("Tasks found:", tasks.length);

      // ==================================================
      // Process each task
      // ==================================================

      for (const task of tasks) {

        console.log("Task concepts:", task.tasks);
        console.log("Task date:", task.date);

        // ==================================================
        // Print all revisions for debugging
        // ==================================================

        task.revisions.forEach((revision) => {
          console.log({
            day: revision.day,
            date: revision.date,
            status: revision.status,
            unlocked: revision.unlocked,
            emailSent: revision.emailSent,
          });
        });

        // ==================================================
        // Find revisions due today
        // ==================================================

        const dueRevisions = task.revisions.filter((revision) => {
          return (
            revision.date === today &&
            revision.status === "pending" &&
            revision.unlocked === true &&
            revision.emailSent !== true
          );
        });

        // ==================================================
        // No revision due
        // ==================================================

        if (dueRevisions.length === 0) {
          console.log("No revision due for this task.");
          continue;
        }

        console.log(
          "Due revisions found:",
          dueRevisions.length
        );

        // ==================================================
        // Create email revision list
        // ==================================================

        let message = "";

        dueRevisions.forEach((revision) => {

          task.tasks.forEach((concept) => {

            message +=
              `• ${concept} - Revision Day ${revision.day}\n`;

          });

        });

        // ==================================================
        // Email subject
        // ==================================================

        const emailSubject =
          "TrackMe — Your revisions are due today 🧠";


        // ==================================================
        // Email content
        // ==================================================

        const emailMessage = `
Hi ${user.fullName},

You have revisions due today:

${message}

Take a few minutes to review these concepts and strengthen your memory.

Open TrackMe and complete your revisions.

Keep learning. Keep remembering. 🚀

— TrackMe
`;


        // ==================================================
        // Send email
        // ==================================================

        console.log(
          `Sending email to: ${user.email}`
        );

        await sendMail(
          user.email,
          emailSubject,
          emailMessage
        );


        // ==================================================
        // Mark email as sent
        // ==================================================

        dueRevisions.forEach((revision) => {
          revision.emailSent = true;
        });


        // ==================================================
        // Save to MongoDB
        // ==================================================

        await task.save();


        console.log(
          `✅ Revision email sent to ${user.email}`
        );
      }
    }

    console.log("======================================");
    console.log("Today's revision email check completed.");
    console.log("======================================");

  } catch (error) {

    console.error("======================================");
    console.error("❌ DAILY REVISION EMAIL ERROR");
    console.error(error);
    console.error("======================================");

  }
};


// ======================================================
// SCHEDULER
// ======================================================

// TESTING MODE
// Runs every minute

cron.schedule(
  "* * * * *",
  () => {

    console.log("");
    console.log("📧 Daily revision email scheduler started.");

    sendDailyRevisionEmails();

  },
  {
    timezone: "Asia/Kolkata",
  }
);


// ======================================================
// Export
// ======================================================

export default sendDailyRevisionEmails;