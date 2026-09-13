import cron from "node-cron";
import User from "../models/User.js";
import Task from "../models/task.js";
import sendMail from "../utils/sendEmail.js";


// ------------------------------------
// Send today's revision emails
// ------------------------------------
const sendDailyRevisionEmails = async () => {
  try {
    console.log("Checking today's revisions...");

    // Today's date
    const today = new Date().toISOString().split("T")[0];

    // Get all registered users
    const users = await User.find();

    for (const user of users) {

      // Get tasks belonging to this user
      const tasks = await Task.find({
        user: user._id
      });

      for (const task of tasks) {

        // Find revisions that are:
        // 1. Due today
        // 2. Pending
        // 3. Unlocked
        // 4. Email not sent yet
        const dueRevisions = task.revisions.filter((revision) => {
          return (
            revision.date === today &&
            revision.status === "pending" &&
            revision.unlocked === true &&
            revision.emailSent === false
          );
        });

        // No revision due for this task
        if (dueRevisions.length === 0) {
          continue;
        }


        // ------------------------------------
        // Create revision list for email
        // ------------------------------------

        let message = "";

        dueRevisions.forEach((revision) => {

          task.tasks.forEach((concept) => {
            message += `• ${concept} - Revision Day ${revision.day}\n`;
          });

        });


        // ------------------------------------
        // Email subject
        // ------------------------------------

        const emailSubject =
          "TrackMe — Your revisions are due today 🧠";


        // ------------------------------------
        // Email content
        // ------------------------------------

        const emailMessage = `
Hi ${user.fullName},

You have revisions due today:

${message}

Take a few minutes to review these concepts and strengthen your memory.

Open TrackMe and complete your revisions.

Keep learning. Keep remembering. 🚀

— TrackMe
`;


        // ------------------------------------
        // Send email
        // ------------------------------------

        await sendMail(
          user.email,
          emailSubject,
          emailMessage
        );


        // ------------------------------------
        // Mark email as sent
        // ------------------------------------

        dueRevisions.forEach((revision) => {
          revision.emailSent = true;
        });


        // Save changes to MongoDB
        await task.save();


        console.log(
          `Revision email sent to ${user.email}`
        );
      }
    }

    console.log("Today's revision email check completed.");

  } catch (error) {
    console.error(
      "DAILY REVISION EMAIL ERROR:",
      error
    );
  }
};


// ------------------------------------
// Run scheduler
// ------------------------------------

// Every day at 8:00 AM
cron.schedule(
  "* * * * *",
  () => {
    console.log("Daily revision email scheduler started.");
    sendDailyRevisionEmails();

  },
  {
    timezone: "Asia/Kolkata"
  }
);


export default sendDailyRevisionEmails;