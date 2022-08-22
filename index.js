const path = require("path");
require("dotenv").config();

const express = require("express");
const MongoClient = require("mongodb").MongoClient;

const app = express();
app.use(express.static(path.join(__dirname, "/src/build")));
app.use(express.json());

const connectDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect(process.env.DB_URL, {
      useNewUrlParser: true,
    });
    const db = client.db("react-blog");
    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
};
app.get("/api/articles/:name", async (req, res) => {
  connectDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(articleInfo);
  }, res);
});

app.post("/api/articles/:name/upvote", async (req, res) => {
  connectDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1,
        },
      }
    );
    const updateArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updateArticleInfo);
  }, res);
});

app.post("/api/articles/:name/add-comment", (req, res) => {
  connectDB(async (db) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text }),
        },
      }
    );
    const updateArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updateArticleInfo);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/src/build/index.html"));
});
app.listen(8000, () => {
  console.log("listening on port 8000");
});
