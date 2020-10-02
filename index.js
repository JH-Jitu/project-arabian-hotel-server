const express = require('express');

// Body parser আনতে হবে কারণ body থেকে information নিতে গেলে এদের মধ্যে ক্রস অরিজিন হয় যদি এর সেইম  ip address এ না থাকে। তাই Cors কে ডিফাইন করতে হবে।
const bodyParser = require('body-parser');
const cors = require('cors');

// firebase backend controller
const admin = require('firebase-admin');

const port = 4200

///// উপরে যেগুলো  ডিফাইন করা হয়েছে সেগুলোকে ইউজ করা হচ্ছে এখন////
const app = express();
// using body-parser and cors
app.use(cors());
app.use(bodyParser.json());

// Using firebase backend controller

var serviceAccount = require("./earn-2018-firebase-adminsdk-7kbrn-e239f4c90e.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});

// .env => for making pass and username secure!
require('dotenv').config();
console.log(process.env.DB_PASS)


//// Mongo Client => connect থেকে নেওয়া হয়েছে//// Username, Password, DataBase name সহ সব।
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hdbqd.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    // নিচের এই জিনিসটা error থেকে আনতে হবে।//
    useUnifiedTopology: true
});
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");

    //   // CRUD এর  Create method (C) //     //
    app.post("/addBooking", (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                //   console.log(result);
                res.send(result.insertedCount > 0);
            })
        //   console.log(newBooking)
    })

    //   // CRUD এর  READ method (R) //     //
    app.get("/bookings", (req, res) => {
        const bearer = req.headers.authorization
        if (bearer && bearer.startsWith('Bearer ')) {

            const idToken = bearer.split(' ')[1];
            console.log({ idToken })

            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    // let uid = decodedToken.uid;
                    // console.log({uid});
                    
                    // // custom verification with email // //
                    if (tokenEmail == queryEmail) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else{
                        res.status(401).send("Unauthorized access!!")
                    }
                }).catch(function (error) {
                    res.status(401).send("Unauthorized access!!")
                    // Handle error
                });
        }

        else{
            res.status(401).send("Unauthorized access!!")
        }
    })

    // Data অন্য server এ পাঠানোর জন্যে নিচের গুলো কমেন্ট করা হয়েছে।
    //   console.log("db connection succeed")
    //   // perform actions on the collection object
    //   client.close();
});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port)