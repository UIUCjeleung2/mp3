
// So I'm starting to understand what this assignment is doing
// I need to use mongoose functions within each API endpoint to 
// update my DB and whatnot

// After that, I just need to poll the correct information and return that as a JSONObject.

const { mongo } = require("mongoose");
const User = require("../models/user");
const Task = require("../models/task");

module.exports = function (router) {    
    console.log("I'm in users.js")
    var homeRoute = router.route('/');

    homeRoute.get(async function (req, res) {
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

            const users = await User.find(where).sort(sort).select(select).skip(skip).limit(limit);  // filter for the model

            if (users.length === 0) {
                res.status(200).json({
                    message: "No users found",
                    data: []
                })
            } else {
                res.status(200).json({ 
                    message: "OK",
                    data: users });                
            }


        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Failed to fetch user(s)" });
        }
    });

    homeRoute.post(async function (req, res) {
        try {

            if (!req.body.name || !req.body.email) {
                return res.status(400).json({message: "Bad request"});
            }

            const newUser = new User({
                name: req.body.name,
                email: req.body.email, 
                pendingTasks: req.body.pendingTasks || [],
            });

            // If there are pendingTasks, gotta assign them on Tasks
            if (req.body.pendingTasks) {
                for (const id of req.body.pendingTasks) {
                    // If the task is already assigned to someone else, you cannot take it
                    const task = await Task.findById(id);
                    if (task) {
                        if (task.assignedUser !== "" || task.assignedUserName !== "unassigned") {
                            return res.status(400).json({ error: "Task is already assigned: " + task.id + " " + task.name});
                        }                       
                    } else {
                        return res.status(400).json({ error: "Tried to assign a task that doesn't exist"});
                    }

                    // Change each task's fields
                    await Task.findByIdAndUpdate(id, {
                        assignedUser: req.params.id,
                        assignedUserName: updatedUser.name
                    });
                }
            }



            // Do a check to make sure no one else has the same email
            const user = await User.findOne({ email: req.body.email });
            if (user) {
                return res.status(400).json({message: "User already exists"});
            }

            await newUser.save();       // Save to MongoDB
            res.status(201).json({ data: newUser });
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Failed to create user"});
        }
    });


    var idRoute = router.route('/:id');
    idRoute.get(async function(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({message: "User not found"});
            }
            res.status(200).json({message: "OK", data: user});
        } catch (err) {
            console.error(err);
            res.status(500).json({error: "Failed to fetch user"});
        }
    }) 


    // I need to test this on Postman. When I update the user's pending tasks, I need to go through
    // all the tasks and set the assignedUser field to the userID.


    idRoute.put(async function(req, res) {
        try {            
            // If the body of the PUT has an email, check if we can change it validly
            if (req.body.email) {
                const existingUser = await User.findOne({email: req.body.email});
                if (existingUser) {
                    return res.status(400).json({error: "A different user already has the email: " + req.body.email});
                }
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,       // ID from URL
                req.body,            // Fields to update
                { new: true }        // Return the updated document
            );
            
            if (!updatedUser) {
                return res.status(404).json({ error: "User not found" });
            }
            
            // The pendingTasks array is full of IDs of the tasks, I believe.
            if (req.body.pendingTasks) {
                for (const id of req.body.pendingTasks) {
                    // If the task is already assigned to someone else, you cannot take it
                    const task = await Task.findById(id);
                    if (task) {
                        if (task.assignedUser !== "" || task.assignedUserName !== "unassigned") {
                            return res.status(400).json({ error: "Task is already assigned: " + task.id + " " + task.name});
                        }                       
                    } else {
                        return res.status(400).json({ error: "Tried to assign a task that doesn't exist"});
                    }

                    // Change each task's fields
                    await Task.findByIdAndUpdate(id, {
                        assignedUser: req.params.id,
                        assignedUserName: updatedUser.name
                    });
                }
            }

            res.status(200).json({ data: updatedUser });
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Failed to update user" });
        }
    });

    idRoute.delete(async (req, res) => {
        try {
            const deletedUser = await User.findByIdAndDelete(req.params.id);
            if (!deletedUser) return res.status(404).json({ error: "User not found" });

            // Gotta get all the tasks inside the deleted User's pendingTasks and unassign them
            for (const id of deletedUser.pendingTasks) {
                // Change each task's fields
                await Task.findByIdAndUpdate(id, {
                    assignedUser: "",
                    assignedUserName: "unassigned"
                });
            }
            res.status(204).send();
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Failed to delete user" });
        }
    });

    return router;
}