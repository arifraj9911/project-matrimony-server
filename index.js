const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

    app.get("/members/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      // console.log(typeof id)
      const query = { biodata_id: id };
      const result = await memberCollection.find(query).toArray();
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
