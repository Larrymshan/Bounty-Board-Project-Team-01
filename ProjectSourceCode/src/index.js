
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
const nodemailer = require('nodemailer');//for emailing password reset

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

// reset routes
app.get('/resetPassword1', (req, res) => {
  res.render('pages/resetPassword1')
});

app.post('/resetPassword1', async (req, res) => {
  const q = "SELECT * FROM users WHERE username = $1";
  const u = req.body.username;
  try{
    const temp = await db.oneOrNone(q,u);
    if (!temp) {
      throw new Error("User doesnt exists");
    }
    res.redirect(`/resetPassword2?userName=${u}`);
  }catch(error){
    // console.error('No such user exists.', error);
    res.render(`pages/resetPassword1`, {message: "No such user exists."});

  }
  // try {
  //   const transporter = nodemailer.createTransport({
  //     service: 'smtp.mail.yahoo.com',
  //     port: 465, 
  //     secure: true, 
  //     auth: {
  //       user: 'BountyBoardWebsite@yahoo.com', 
  //       pass: 'CSCI3308Project',    
  //     },
  //   });
  //   const code = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
  //   // Email options
  //   const mailOptions = {
  //     from: 'bountyboardwebsite@yahoo.com',
  //     to: req.body.username,
  //     subject: 'Password Reset Request',
  //     text: 'Your password reset code is: ',
  //   };

  //   // Send email
  //   const info = await transporter.sendMail(mailOptions);
  //   const userName = req.body.username; 
  //   res.redirect(`/resetPassword2?userName=${userName}?code=${code}`);
  // } catch (error) {
  //   console.error('Error sending email:', error);
  //   res.status(500).json({ error: 'Failed to send email' });
  // }
});

app.get('/resetPassword2', (req, res) => {
  const userName = req.query.userName;
  // const code = req.query.code;
  res.render('pages/resetPassword2', {userName})
});

app.post("/resetPassword2", async(req,res)=>{
  const email = req.body.userName;

  // const code = req.body.code;
  const userQuery = "SELECT * FROM users u WHERE u.username = $1";
  const userName = req.body.userName;
  const q3 = await db.oneOrNone(userQuery,[userName]);

  // if(code == req.body.code){
    const hash = await bcrypt.hash(req.body.newPassword, 10);
    const q = "UPDATE users SET password = $1 WHERE username = $2";
    const profileData = await db.any(q, [hash, userName]);
  // }
  res.redirect("/login");
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
          console.log(reviews);
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
  if (!req.session.user) {
    console.log('User not logged in to submit a review');
    return res.redirect('/login');
  }
  
  const { username, rating, review_text } = req.body;
  const reviewer = req.session.user.username;

  const query = `INSERT INTO reviews (reviewer_name, user_reviewed, rating, review_text) VALUES ($1, $2, $3, $4)`;
  const noti_q = 'INSERT INTO notifications (sender_name, title, descript, noti_type, link) VALUES ($1, $2, $3, $4, $5)';

  db.none(query, [reviewer, username, rating, review_text])
  .then(() => {
    console.log('Review successfully added');
    res.redirect('/reviewsByMe');

    const notificationText = "You have a new review.";
    const link = "/reviews";
    const type_of = "review";

    return db.none(noti_q, [username, "New Review", notificationText, type_of, link]);
  })
  .catch(error => {
    console.error('Error submitting review:', error);
    res.status(500).send('An error occurred while submitting the review.');
  });
});



app.get('/reviewsByMe', (req, res) => {
  if (!req.session.user) {
    console.log('User not logged in to view reviews');
    return res.redirect('/login');
  }

  const current = req.session.user.username;

  const query = 'SELECT review_text, rating, user_reviewed, review_num FROM reviews WHERE reviewer_name = $1';

  db.any(query, [current])
    .then(reviews => {
      console.log(reviews);
      res.render('pages/reviewsByMe', {
        reviews: reviews
      });
    })
    .catch(error => {
      console.error('Error fetching reviews:', error);
      res.status(500).send('An error occurred while fetching reviews.');
    });
});

app.post('/reviewsByMe', (req, res) => {
  const review_id = parseInt(req.body.review_id);
  console.log('Received ReviewNum:', review_id);

  const del = `DELETE FROM reviews WHERE review_num = $1`;

  db.none(del, [review_id])
    .then(() => {
      res.redirect('/reviewsByMe');
    })
    .catch((error) => {
      console.error('Error deleting review:', error);
      res.status(500).json({ message: 'Failed to delete review', error: error.message });
    });
});

app.get("/home", (req, res) => {

  const query = 'SELECT title, job_description, price, poster, job, is_taken FROM Bounty ORDER BY job';

  db.any(query,)
  .then(Bounty => {
    console.log(Bounty); // Check to see data
    res.render('pages/home', {
      Bounty: Bounty
    });
  })
  .catch(error => {
    console.error('Error fetching reviews:', error);
    res.status(500).send('An error occurred while fetching reviews.');
  });
});

//Write Messages
app.post("/writeMessage", async (req, res) => {
  if(!req.session.user)
  {
    console.log('User not logged in to view reviews');
    return res.redirect('/login');
  }
  const sender_name = req.session.user.username;
  const { receiver_name, title, message_text } = req.body;
  if (!receiver_name || receiver_name.length > 50) {
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
      'INSERT INTO messages (receiver_name, sender_name, title, message_text) VALUES ($1, $2, $3, $4)',
      [receiver_name, sender_name, title, message_text]
    );

    const notificationText = "You have recieved a new message.";
    const link = '/message_page';
    const type_of = "message"
    await db.none(
      'INSERT INTO notifications (sender_name, title, descript, noti_type, link) VALUES ($1, $2, $3, $4, $5)',
      [sender_name, title, notificationText, type_of, link]
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
  const username = req.session.user.username;

  if (!req.session.user) {
    console.log('User not logged in to view messages');
    return res.redirect('/login');
  }

  try {
    const receivedMessages = await db.any(
      'SELECT receiver_name, sender_name, title, message_text FROM messages WHERE receiver_name = $1',
      [username]
    );
    const sentMessages = await db.any(
      'SELECT receiver_name, sender_name, title, message_text FROM messages WHERE sender_name = $1',
      [username]
    );

    res.render("pages/message_page", {
      username,
      receivedMessages,
      sentMessages
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }

});
//profile
app.get("/profile", async (req,res) =>{
  const q = "SELECT * FROM profiles p, users u WHERE p.userid = u.userid AND u.username = $1";
  const profileData = await db.any(q, req.session.user.username);
  res.render('pages/profile', { profile: profileData[0] });
});

app.get('/CreateBounty', (req, res) => {
  res.render('pages/CreateBounty')

});

app.post('/CreateBounty', (req, res) => {
  if (!req.session.user) {
    console.log('User not logged in to submit a review');
    return res.redirect('/login');
  }
  
  const { title, job_description, price } = req.body;
  const poster = req.session.user.username;

  console.log(req.body); 

  const query = `INSERT INTO Bounty (title, job_description, price, poster) VALUES ($1, $2, $3, $4)`;
  
  db.none(query, [title, job_description, price, poster])
    .then(() => {
      console.log('Bounty successfully added');
      res.redirect('/home');
    })
    .catch(error => {
      console.error('Error submitting Bounty', error);
      res.status(500).send('An error occurred while submitting the bounty.');
    });
});

//edit profile
app.post("/editProfile", async(req,res)=>{
  const id = req.session.user.userid;
  if(req.body.first_name){
    const q = "UPDATE profiles SET first_name = $1 WHERE userid = $2";
    const profileData = await db.any(q, [req.body.first_name, id]);
  }
  if(req.body.last_name){
    const q = "UPDATE profiles SET last_name = $1 WHERE userid = $2";
    const profileData = await db.any(q, [req.body.last_name, id]);
  }
  if(req.body.bio){
    const q = "UPDATE profiles SET profile_bio = $1 WHERE userid = $2";
    const profileData = await db.any(q, [req.body.bio, id]);
  }
  res.redirect("/profile");
});

app.get("/editProfile", async (req,res) =>{
  const q = "SELECT * FROM profiles p, users u WHERE p.userid = u.userid AND u.username = $1";
  const profileData = await db.any(q, req.session.user.username);
  res.render('pages/editProfile', { profile: profileData[0] });
});


app.get('/deleteProfile', (req, res) => {
  res.render('pages/deleteProfile')
});

app.post('/deleteProfile', async (req, res) => {
  const u = req.session.user;
  if(req.body.password == req.body.password2){
    const id = u.userid;
    const q = "DELETE FROM users WHERE userid = $1";
    db.none(q,id);
    req.session.destroy() 
    res.render('pages/logout', {message: 'successfully deleted account'})
  }
  else{
    res.render('pages/deleteProfile', { message: 'passwords did not match', error: true });
  }
});

app.post('/home', (req, res) => {
  const bountyId = parseInt(req.body.BountyID);
  const u = req.session.user;
  const takenBy = u.username;
  console.log('Received BountyID:', bountyId);
  console.log('Taken by:', takenBy);

  if (!bountyId || isNaN(bountyId)) {
    return res.status(400).send('Invalid or missing BountyID.');
  }

  const query = `SELECT is_taken FROM Bounty WHERE BountyID = $1`;
  db.one(query, [bountyId])
    .then((bounty) => {
      if (bounty.is_taken) {
        return res.status(400).send('This bounty has already been taken.');
      }

      const query = `UPDATE Bounty SET is_taken = TRUE, taken_by = $2 WHERE BountyID = $1
      `;
      db.none(query, [bountyId, takenBy])
        .then(() => {
          res.redirect('/home');
        })
        .catch((error) => {
          console.error('Error updating bounty status:', error);
          res.status(500).send('An error occurred while taking the bounty.');
        });
    })
    .catch((error) => {
      console.error('Error checking bounty status:', error);
      res.status(500).send('An error occurred while checking the bounty.');
    });
});

app.get("/activeBounties", (req, res) => {
  const u = req.session.user;
  const taken= u.username;

  const query = 'SELECT title, job_description, price, poster, job FROM Bounty WHERE taken_by = $1 AND is_complete = false';


  db.any(query,[taken])
  .then(Bounty => {
    res.render('pages/activeBounties', {
      Bounty: Bounty
    });
  })
});

app.post('/activeBounties', (req, res) => {
  const bountyId = parseInt(req.body.BountyID, 10);

  if (!bountyId || isNaN(bountyId)) {
    return res.status(400).send('Invalid or missing BountyID.');
  }

  const query = `UPDATE Bounty SET taken_by = NULL, is_taken = FALSE WHERE BountyID = $1`;

  db.query(query, [bountyId])
    .then(() => {
      res.redirect('/activeBounties');
    })
});

app.get('/addFunds', (req, res) => {
  res.render('pages/addFunds')
});

app.get("/yourCreatedBounties", (req, res) => {
  const u = req.session.user;
  const createdBy = u.username;

  const query = 'SELECT title, job_description, price, poster, job, is_complete FROM Bounty WHERE poster = $1';

  db.any(query,[createdBy])
  .then(Bounty => {
    res.render('pages/yourCreatedBounties', {
      Bounty: Bounty
    });
  })
});

app.post('/deleteBounty', (req, res) => {
  const BountyID = parseInt(req.body.BountyID);
  console.log('Received ReviewNum:', BountyID);

  const del = `DELETE FROM Bounty WHERE job = $1`;

  db.none(del, [BountyID])
    .then(() => {
      res.redirect('/yourCreatedBounties');
    })
    .catch((error) => {
      console.error('Error deleting bounty:', error);
      res.status(500).json({ message: 'Failed to delete bounty', error: error.message });
    });
});

app.post('/markComplete', (req, res) => {
  const BountyID = req.body.BountyID;
  console.log('Received request body:', req.body);

  const query = 'UPDATE Bounty SET is_complete = TRUE WHERE BountyID = $1';

  db.none(query, [BountyID])
    .then(() => {
      const current = req.session.user.username;
      res.render('pages/activeBounties')

    })
    .catch(error => {
      console.error('Error updating the review:', error);
      res.status(500).send('An error occurred while marking complete.');
    });
});

app.get("/completeBounties", (req, res) => {
  const u = req.session.user;
  
  // Ensure `u` exists and has a username
  if (!u || !u.username) {
    return res.status(401).send("User not authenticated.");
  }

  const createdBy = u.username;

  const query = 'SELECT title, job_description, price, poster, job FROM Bounty WHERE poster = $1 AND is_complete = true';

  db.any(query, [createdBy])
    .then(Bounty => {
      res.render('pages/completeBounties', {
        Bounty: Bounty
      });
    })
    .catch(error => {
      console.error("Error querying complete bounties:", error);
      res.status(500).send("Error retrieving complete bounties.");
    });
});

app.get("/notification_page", async (req, res) => {

  if(!req.session.user)
  {
    console.log("User not logged in");
    return res.redirect("/login");
  }

  const username = req.session.username;

  try{
    const recieved_notifications = await db.any(
      "SELECT receiver_name, title, descript, noti_type, link, time_stamp FROM notifications WHERE receiver_name = $1 ORDER BY time_stamp DESC",
      [username]
    );

    res.render("pages/notification_page", {
      username,
      recieved_notifications
    });
  }catch(error){
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// start the server
const server = app.listen(3000);
module.exports = { server, db }
console.log('Server is listening on port 3000');