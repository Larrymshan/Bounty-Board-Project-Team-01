
// Section 1 : Import Dependencies 

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object.
const bcrypt = require('bcryptjs'); //  To hash passwords

// Connect to DB 

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test database

db.connect()
  .then(obj => {
    console.log('Database connection successful');
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// App Settings

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


// API routes

app.get('/', (req, res) => {
  res.redirect('/login');
});

//login routes

app.get('/login', (req, res) => {
  res.render('pages/login')

});

app.post('/login', async (req, res) => {
  try {
    const user = await db.one(
      'SELECT * FROM users WHERE username = $1',
      [req.body.username]
    );
    if (user.username) {
      const match = await bcrypt.compare(req.body.password, user.password);
      if (!match) {
        res.render('pages/login', {
          message: `Incorrect username or password`
        });
      }
      else {
        console.log('LOGGED IN')
        req.session.user = user;
        req.session.save();
        res.redirect('/home');
        // res.redirect('/profile');
      }
    }
    else {
      res.redirect('/register');
    }
  }
  catch (err) {
    console.log(err)
    res.redirect('/register');
  }
});
app.use((req, res, next) => {
  // Make user data globally available in all templates
  res.locals.user = req.session.user || null;
  next();
});

// Register routes

app.get('/register', (req, res) => {
  res.render('pages/register')

});

app.post('/register', async (req, res) => {
  const userQuery = "SELECT * FROM users WHERE username = $1";

  try {

    if (req.body.password == '' || req.body.username == '') {
      throw new Error("Invalid username or password.");
    }

    const q = await db.oneOrNone(userQuery,[req.body.username]);
    if (q) {
      throw new Error("User already exists");
    }

    //hash the password using bcrypt library
    const hash = await bcrypt.hash(req.body.password, 10);

    await db.none('INSERT INTO users(username, password) VALUES($1, $2)', [req.body.username, hash]);
    const userName = req.body.username; 
    res.redirect(`/createProfile?userName=${userName}`);
    //if there is an error inserting such as there is already that user name and password then rederrect to the regiser page
    // error is turned to true so that message partial shows danger background color and message value is set to appropriate message
  }
  catch (error) {
    res.status(400).render('pages/register', { message: 'Registration failed username or password already exists or invalid input', error: true });

  }
});
app.get('/createProfile', (req, res) => {
  const userName = req.query.userName;
  res.render('pages/createProfile', {userName})
});

app.post('/createProfile', async (req, res) => {
  const userQuery = "SELECT * FROM users u WHERE u.username = $1";
  const userName = req.body.userName;
  try {
    const q3 = await db.oneOrNone(userQuery,[userName]);
    
    if (!q3) {
      throw  new Error("User already exists");
    }

    await db.none('INSERT INTO profiles(userid, first_name, last_name, profile_bio) VALUES($1, $2, $3, $4)', [q3.userid, req.body.first_name, req.body.last_name, req.body.bio]);
    res.redirect('/login');
  } 
  catch (error) {
    res.status(400).render('pages/createProfile', { message: 'creation failed something went wrong', error: true });
    
  }
});


//Logout Route
//-----------------------
app.get("/logout", (req, res) => {
  req.session.destroy()
  res.render('pages/logout')
});
//-----------------------

//test route
//-----------------------
app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});
//-----------------------


// authentification
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

// // code after this will be required to log in to get to
// Authentication Required
app.use(auth);
//**********************************************************
//**********************************************************
//**********************************************************


//get reviews
app.get('/reviews', (req, res) => {
  if (!req.session.user) {
    console.log('User not logged in to view reviews');
    return res.redirect('/login');
  }

  const current = req.session.user.username;

  const query = 'SELECT review_text, rating, reviewer_name, review_id FROM reviews WHERE user_reviewed = $1';

  db.any(query, [current])
    .then(reviews => {
      console.log(reviews); // Check to see data
      res.render('pages/reviews', {
        reviews: reviews
      });
    })
    .catch(error => {
      console.error('Error fetching reviews:', error);
      res.status(500).send('An error occurred while fetching reviews.');
    });
});

app.get('/writeReview', (req, res) => {
  res.render('pages/writeReview')

});

app.post('/report', (req, res) => {
  const review_id = req.body.review_id;
  console.log('Received request body:', req.body);

  const query = 'UPDATE reviews SET flagged = TRUE WHERE review_id = $1';

  db.none(query, [review_id])
    .then(() => {
      const current = req.session.user.username;

      const query1 = 'SELECT review_text, rating, reviewer_name, review_id FROM reviews WHERE user_reviewed = $1 ORDER BY review_id';

      db.any(query1, [current])
        .then(reviews => {
          console.log(reviews); // Check to see data
          res.render('pages/reviews', {
            reviews: reviews
          });
        })

    })
    .catch(error => {
      console.error('Error updating the review:', error);
      res.status(500).send('An error occurred while updating the review.');
    });
});


// post writeReview
app.post('/writeReview', (req, res) => {

  const username = req.body.username;
  const reviewText = req.body.reviewText;
  const rating = req.body.rating;
  const review_by = req.session.user.username;

  const query = `INSERT INTO reviews (review_text, user_reviewed, rating, reviewer_name) VALUES ($1, $2, $3, $4)`;

  db.none(query, [reviewText, username, rating, review_by])
    .then(() => {
      res.redirect('reviewsByMe');
    })
    .catch(error => {
      console.error('Error inserting data:', error);
      res.status(500).send('An error occurred while inserting the review.');
    });
});

app.get('/reviewsByMe', (req, res) => {
  if (!req.session.user) {
    console.log('User not logged in to view reviews');
    return res.redirect('/login');
  }

  const current = req.session.user.username;

  const query = 'SELECT review_text, rating, user_reviewed FROM reviews WHERE reviewer_name = $1';

  db.any(query, [current])
    .then(reviews => {
      console.log(reviews); // Check to see data
      res.render('pages/reviewsByMe', {
        reviews: reviews
      });
    })
    .catch(error => {
      console.error('Error fetching reviews:', error);
      res.status(500).send('An error occurred while fetching reviews.');
    });
});
app.get("/home", (req, res) => {
  res.render('pages/home')
});

//Write Messages
app.post("/writeMessage", async (req, res) => {
  const sender_name = req.session.username;
  const { reciever_name, title, message_text } = req.body;
  if (!reciever_name || reciever_name.length > 50) {
    return res.status(400).json({ error: "Receiver name is required and should not exceed 50 characters." });
  }
  if (!title || title.length > 50) {
    return res.status(400).json({ error: "Title is required and should not exceed 50 characters." });
  }
  if (!message_text || message_text.length > 500) {
    return res.status(400).json({ error: "Message text should not exceed 500 characters." });
  }

  try {
    await db.none(
      'INSERT INTO messages (reciever_name, sender_name, title, message_text) VALUES ($1, $2, $3, $4)',
      [reciever_name, sender_name, title, message_text]
    );

    res.status(201).json({ message: "Message written successfully" });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: "A message with this title already exists for this receiver" });
    } else {
      console.error("Error occurred:", error);
      res.status(500).json({ error: "An internal server error occurred" });
    }
  }
});

//message page
app.get("/message_page", async (req, res) => {
  const { username } = req.session.username;

  if (!req.session.user) {
    console.log('User not logged in to view messages');
    return res.redirect('/login');
  }

  try {
    const recievedMessages = await db.any(
      'SELECT reciever_name, sender_name, title, message_text FROM messages WHERE reciever_name = $1',
      [username]
    );
    const sentMessages = await db.any(
      'SELECT reciever_name, sender_name, title, message_text FROM messages WHERE sender_name = $1',
      [username]
    );
    res.render("message_page", {
      username,
      recievedMessages,
      sentMessages
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }

});

app.get("/profile", async (req,res) =>{
  const q = "SELECT * FROM profiles p, users u WHERE p.userid = u.userid";
  const profileData = await db.any(q);
  res.render('pages/profile', { profile: profileData[0] });
});

// start the server
const server = app.listen(3000);
module.exports = { server, db }
console.log('Server is listening on port 3000');