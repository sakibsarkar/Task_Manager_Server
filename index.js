require('dotenv').config()
const express = require("express")
const port = process.env.PORT || 5000
const app = express()
const cors = require("cors")
const cookieParser = require('cookie-parser')
const jwt = require("jsonwebtoken")

// midlewere
app.use(express.json())
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}))
app.use(cookieParser())


const varifyToken = (req, res, next) => {
    const token = req.query.token
    if (!token) {
        res.status(401).send({ messege: "unAuthorized Access" })
        return
    }

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ messege: "Access Forbidden" })
        }
        req.user = decoded

        next()
    })

}








const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.xbiw867.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });

        // ------onst collections-----------
        const taskCollection = client.db("TaskManager").collection("tasks")
        const userCollection = client.db("TaskManager").collection("users")


        // --------- user related api-----------

        // user token api
        app.post("/api/user/token", async (req, res) => {
            const email = req.body
            const token = jwt.sign(email, process.env.SECRET, { expiresIn: "365d" })
            res.send(token)
        })

        // add user 
        app.post("/api/add/user", varifyToken, async (req, res) => {
            const body = req.body
            const { email } = req.user

            const isExist = await userCollection.findOne({ email: email })
            if (isExist) {
                return res.send({ isExist: true })
            }

            const result = await userCollection.insertOne(body)
            res.send(result)
        })



        // -------------task related api-----------

        // add task
        app.post("/api/addTask", varifyToken, async (req, res) => {
            const body = req.body
            const result = await taskCollection.insertOne(body)
            res.send(result)
        })


        // get all type task 
        app.get("/api/all/task", varifyToken, async (req, res) => {
            const { email } = req.user

            const toDo = await taskCollection.find({
                user_email: email,
                status: "To-do"
            }).toArray()

            const onGoing = await taskCollection.find({
                user_email: email,
                status: "Ongoing"
            }).toArray()

            const completed = await taskCollection.find({
                user_email: email,
                status: "Completed"
            }).toArray()

            res.send({ toDo, onGoing, completed })
        })




        // change task status in To-do
        app.put("/api/change/todo", varifyToken, async (req, res) => {
            const id = req.query.id
            const result = taskCollection.updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    status: "To-do"
                }
            })
            res.send(result)
        })


        // change task status in ongoing
        app.put("/api/change/ongoing", varifyToken, async (req, res) => {
            const id = req.query.id
            const result = taskCollection.updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    status: "Ongoing"
                }
            })
            res.send(result)
        })


        // change task status in completed
        app.put("/api/change/completed", varifyToken, async (req, res) => {
            const id = req.query.id
            const result = taskCollection.updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    status: "Completed"
                }
            })
            res.send(result)
        })



        // delete task
        app.delete("/api/delete/task", varifyToken, async (req, res) => {
            const id = req.query.id
            const result = await taskCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })


        // user all todo task
        app.get("/api/all/todo", varifyToken, async (req, res) => {
            const { email } = req.user
            const result = await taskCollection.find({
                user_email: email,
                status: "To-do"
            }).toArray()

            res.send(result)
        })
        // user all ongoing task
        app.get("/api/all/ongoing", varifyToken, async (req, res) => {
            const { email } = req.user
            const result = await taskCollection.find({
                user_email: email,
                status: "Ongoing"
            }).toArray()

            res.send(result)
        })



        // single id based todo
        app.get("/api/single/todo", varifyToken, async (req, res) => {
            const id = req.query.id

            const result = await taskCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })


        // update tast
        app.put("/api/task/update", varifyToken, async (req, res) => {

            const { title, description, deadline, id } = req.body
            const find = { _id: new ObjectId(id) }

            const update = {
                $set: {
                    title: title,
                    description: description,
                    deadline: deadline
                }
            }


            const result = await taskCollection.updateOne(find, update)
            res.send(result)
        })



        app.get("/", async (req, res) => {
            res.send({ message: "hello from server" })
        })
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port)
