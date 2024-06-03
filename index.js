const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fxja28l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const memberCollection = client.db("dbMatrimony").collection("allMember");
    const favoriteCollection = client.db("dbMatrimony").collection("favorite");
    const userCollection = client.db("dbMatrimony").collection("user");

    app.get("/members", async (req, res) => {
      const filter = req.query;
      const query = {};
      const options = {
        sort: {
          age: filter.sort === "asc" ? 1 : -1,
        },
      };
      const result = await memberCollection.find(query, options).toArray();
      res.send(result);
    });

    app.get("/membersCount", async (req, res) => {
      const count = await memberCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.get("/initialAllMembers", async (req, res) => {
      const result = await memberCollection.find().toArray();
      res.send(result);
    });

    app.get("/allMembers", async (req, res) => {
      //   console.log(req.query.gender);
      const ageSplit = req.query.age;
      const ageFirst = parseInt(ageSplit.split("-")[0]);
      const ageLast = parseInt(ageSplit.split("-")[1]);
      //   console.log(ageFirst, ageLast);
      const query = {
        biodata_type: req.query.gender,
        permanent_division_name: req.query.division,
        age: { $lt: ageLast, $gt: ageFirst },
      };

      const result = await memberCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/members/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      // console.log(typeof id)
      const query = { biodata_id: id };
      const result = await memberCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/initialAllMembers/:email", async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const query = { email: email };
      const result = await memberCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/premium", async (req, res) => {
      const query = { status: { $in: ["pending", "premium"] } };
      const result = await memberCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/premium/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const filter = { biodata_id: id };
      const updatedDoc = {
        $set: {
          status: "premium",
        },
      };
      const result = await memberCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.get("/similarMembers", async (req, res) => {
      console.log(req.query);
      const query = { biodata_type: req.query.gender };
      const result = await memberCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/members", async (req, res) => {
      const profileBiodata = req.body;
      const result = await memberCollection.insertOne(profileBiodata);
      res.send(result);
    });

    app.patch("/initialAllMembers/premium/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      console.log(typeof id);
      const filter = { biodata_id: id };
      const updatedDoc = {
        $set: {
          status: "pending",
        },
      };
      const result = await memberCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.get("/favoriteBiodata", async (req, res) => {
      const result = await favoriteCollection.find().toArray();
      res.send(result);
    });

    app.post("/favoriteBiodata", async (req, res) => {
      const biodata = req.body;
      const result = await favoriteCollection.insertOne(biodata);
      res.send(result);
    });

    app.delete("/favoriteBiodata/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const query = { biodata_id: id };
      const result = await favoriteCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/userSearch", async (req, res) => {
      console.log(req.query);
      const searchText = req.query.search;
      const query = {
        name: {
          $regex: searchText,
          $options: "i",
        },
      };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const users = req.body;
      const query = { email: users.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "users already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(users);
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.patch("/users/premium/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "premium",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Project Matrimony Running");
});

app.listen(port, () => {
  console.log(`project running on port ${port}`);
});
