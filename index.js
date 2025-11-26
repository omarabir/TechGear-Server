const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ojsqemw.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri);

async function run() {
  try {
    // await client.connect();
    const db = client.db("techgear_db");
    const productsCollection = db.collection("products");

    console.log("Database Connected Successfully!");

    app.get("/products", async (req, res) => {
      try {
        const { search, sort } = req.query;

        const query = {};

        if (search) {
          query.$or = [
            { title: { $regex: search, $options: "i" } },
            { shortDescription: { $regex: search, $options: "i" } },
          ];
        }

        let sortOption = {};
        if (sort === "low") sortOption = { price: 1 };
        else if (sort === "high") sortOption = { price: -1 };

        const result = await productsCollection
          .find(query)
          .sort(sortOption)
          .toArray();

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const product = await productsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!product) {
          return res.status(404).send({ message: "Product not found" });
        }

        res.send(product);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const { title, price, shortDesc, description, image, priority } =
        req.body;

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title: title,
          price: parseFloat(price),
          description: description,
          image: image,
          priority: priority,
          updatedAt: new Date().toISOString(),
        },
      };

      const result = await productsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("TechGear Backend is Running!");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
