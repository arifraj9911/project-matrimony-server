const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
    const contactRequestCollection = client
      .db("dbMatrimony")
      .collection("contactRequest");
    const paymentCollection = client.db("dbMatrimony").collection("payments");

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
        age: { $lte: ageLast, $gte: ageFirst },
      };

      const result = await memberCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/members/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      // console.log(typeof id)
      const query = { biodata_id: id };
      const result = await memberCollection.findOne(query);
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
      const query = { email: profileBiodata.email };
      const existingBiodata = await memberCollection.findOne(query);
      if (existingBiodata) {
        return res.send({
          message:
            "biodata already created with this email, please use another email for created your biodata",
          insertedId: null,
        });
      }
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
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
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

    app.get("/contactRequest/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const query = { biodata_id: id };
      const result = await memberCollection.findOne(query);
      res.send(result);
    });

    app.post("/contactRequestSend", async (req, res) => {
      const requestData = req.body;
      const result = await contactRequestCollection.insertOne(requestData);
      res.send(result);
    });

    app.get("/myRequestContact", async (req, res) => {
      const result = await contactRequestCollection.find().toArray();
      res.send(result);
    });

    app.put("/myRequestContact/contactApproval/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const filter = { biodata_id: id };
      const updatedDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await contactRequestCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });

    // payment api
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      console.log(req.body);
      const amount = parseInt(price * 100);

      console.log(amount, "inside the payment");

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", async (req, res) => {
      const payments = req.body;
      const result = await paymentCollection.insertOne(payments);
      res.send(result);
    });

    app.delete("/myRequestContact/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const query = { biodata_id: id };
      const result = await contactRequestCollection.deleteOne(query);
      res.send(result);
    });

    // admin stats
    app.get("/admin-stats", async (req, res) => {
      const totalBiodata = await memberCollection.estimatedDocumentCount();

      // male biodata
      const maleQuery = { biodata_type: "Male" };
      const maleBiodata = await memberCollection.countDocuments(maleQuery);

      // female biodata
      const femaleQuery = { biodata_type: "Female" };
      const femaleBiodata = await memberCollection.countDocuments(femaleQuery);

      // premium biodata
      const premiumQuery = { status: "premium" };
      const premiumBiodata = await memberCollection.countDocuments(
        premiumQuery
      );

      // total revenue
      const result = await paymentCollection
        .aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: "$price",
              },
            },
          },
        ])
        .toArray();

      const revenue = result[0] ? result[0].totalRevenue : 0;

      res.send({
        totalBiodata,
        maleBiodata,
        femaleBiodata,
        premiumBiodata,
        revenue,
      });
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
