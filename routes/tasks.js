

const Task = require("../models/task");
const User = require("../models/user");

module.exports = function (router) {
  var taskRoute = router.route("/");

  // GET /api/tasks
  taskRoute.get(async function (req, res) {
      try {
          let where = {};
          let sort = {};
          let select = {};
          let skip = 0;
          let limit = 0;

          if (req.query.where) {
              where = JSON.parse(req.query.where);  // <-- parse the JSON string
          }
          
          if (req.query.sort) {
              sort = JSON.parse(req.query.sort);
          }

          if (req.query.select && req.query.select !== "undefined") {
              select = JSON.parse(req.query.select);
          }

          if (req.query.skip) {
              skip = parseInt(req.query.skip);
          }

          if (req.query.limit) {
              limit = parseInt(req.query.limit);
          }

          const tasks = await Task.find(where).sort(sort).select(select).skip(skip).limit(limit);

          if (tasks.length === 0) {
              res.status(200).json({
                message: "No tasks found",
                data: []
              })
          } else {
              res.json({
                message: "OK",
                data: tasks
              });
          }
        
      } catch (err) {
          console.error(err);
          res.status(500).json({ error: "Failed to fetch tasks" });
      }
  });

  // POST /api/tasks
  taskRoute.post(async function (req, res) {
      try {
          if (!req.body.name || !req.body.deadline) {
              return res.status(400).json({message: "Missing name or deadline"});
          }

          const newTask = new Task({
              name: req.body.name,
              description: req.body.description || "",
              deadline: req.body.deadline,
              assignedUser: req.body.assignedUser || "",
              assignedUserName: req.body.assignedUserName || "unassigned",
              completed: req.body.completed === "true"
          });

          // Do I have to check whether a new taskid is unique?
          // Nah, but I do have to make sure that the corresponding User's
          // pendingTasks is updated

          if (req.body.assignedUser !== undefined && req.body.assignedUser !== null && req.body.assignedUser !== "") {
              const user = await User.findById(req.body.assignedUser);
              // Make sure pendingTasks is an array
              if (!Array.isArray(user.pendingTasks)) {
                  user.pendingTasks = [];
              }

              // Push only if it's not on pendingTasks already
              if (!user.pendingTasks.includes(newTask.id)) {
                  console.log(user.pendingTasks);
                  console.log("Pushing onto " + user.name + " " + newTask.id);
                  user.pendingTasks.push(newTask.id);
              }
              await user.save();
          }

          await newTask.save();
          res.status(201).json({ data: newTask });
      } catch (err) {
          console.error(err);
          res.status(500).json({ error: "Failed to create task" });
      }
  });


  const taskByIdRoute = router.route("/:id");

  // GET /api/tasks/:id
  taskByIdRoute.get(async (req, res) => {
      try {
          const task = await Task.findById(req.params.id);
          if (!task) {
            return res.status(404).json({ error: "Task not found" });
          }
          res.status(200).json({message: "OK", data: task });
      } catch (err) {
          console.error(err);
          res.status(500).json({ error: "Failed to fetch task" });
      }
  });

  // PUT /api/tasks/:id

  taskByIdRoute.put(async (req, res) => {
    try {
      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          description: req.body.description || "",
          deadline: req.body.deadline,
          assignedUser: req.body.assignedUser || "",
          assignedUserName: req.body.assignedUserName || "unassigned",
          completed: req.body.completed === "true"
        },
        { new: true, runValidators: true }
      );

      // if (updatedTask.assignedUser !== "") {
      //     const users = await User.find({_id: updatedTask.assignedUser});
      //     if (users.length > 1) {
      //         return res.status(400).json({error: "A different user already has that task assigned"});
      //     } else if (users.length < 1) {
      //         return res.status(400).json({error: "No user by that ID exists"}); 
      //     }

      //     const user = users[0];

      //     if (!Array.isArray(user.pendingTasks)) {
      //         user.pendingTasks = [];
      //     }

      //     // Push only if it's not on pendingTasks already
      //     if (!user.pendingTasks.includes(newTask.id)) {
      //         console.log(user.pendingTasks);
      //         console.log("Pushing onto " + user.name + " " + newTask.id);
      //         user.pendingTasks.push(newTask.id);
      //     }
      //     await user.save();          

      // }

      if (!updatedTask) return res.status(404).json({ error: "Task not found" });
      res.json({ data: updatedTask });
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: "Failed to update task" });
    }
  });

  // DELETE /api/tasks/:id
  taskByIdRoute.delete(async (req, res) => {
    try {
      const deletedTask = await Task.findByIdAndDelete(req.params.id);
      if (!deletedTask) return res.status(404).json({ error: "Task not found" });

      if (deletedTask.assignedUser !== "") {
          // Go to the user's tasks and remove it from the list
          const user = await User.findById(deletedTask.assignedUser);
          if (user === null) {
              return res.json({ data: deletedTask});
          }
          var arr = user.pendingTasks.filter(item => item !== deletedTask.id);
          await User.findByIdAndUpdate(deletedTask.assignedUser, {
              pendingTasks: arr
          });
      }

      res.json({ data: deletedTask });
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: "Failed to delete task" });
    }
  });


  return router;
};
