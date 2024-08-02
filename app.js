const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');const { ConnectionError } = require('sequelize');

const app = express();


//Set up multer for file uploads
const storage= multer.diskStorage({
  destination: (req,file,cb) => {
      cb(null, 'public/images');//Directory to save uploaded files
  },
  filename: (req, file, cb) => {
      cb(null, file.originalname);
  }
});

const upload= multer({storage: storage});


// Create MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'musique_db'
});

connection.connect((err) => {
  if (err) {
      console.error('Error connecting to MySQL:', err);
      return;
  }
  console.log('Connected to MySQL database');
});

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: false }));

// Serve static files (like CSS, JS, and images)
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});



// Route to display sign-up page
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Route to handle sign-up form submission
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  
  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) throw err;
    
    // Insert user into the database
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    connection.query(query, [username, email, hashedPassword], (err, results) => {
      if (err) throw err;
      res.redirect('/login');
    });
  });
});


// Route to display login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Route to handle login form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Fetch the user from the database
  const query = 'SELECT * FROM users WHERE username = ?';
  connection.query(query, [username], (err, results) => {
    if (err) throw err;
    
    if (results.length === 0) {
      return res.send('User not found');
    }

    const user = results[0];

    // Compare the password with the hashed password in the database
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) throw err;

      if (isMatch) {
        res.send('Login successful');
      } else {
        res.send('Invalid password');
      }
    });
  });
});













// Route to display song
app.get('/library', (req, res) => {
  const sql = 'SELECT * FROM song';
  connection.query(sql, (error, results) => {
      if (error) {
          console.error('Database query error:', error.message);
          return res.status(500).send('Error retrieving songs');
      }
      res.render('library', { song: results });
  });
});


app.get('/song/:id', (req, res) => {
  const song_id = req.params.id;
  const sql = 'SELECT * FROM song WHERE song_id =?';
  connection.query(sql, [song_id], (error, results) => {
      if (error) {
          console.error('Database query error:', error.message);
          return res.status(500).send('Error Retrieving song');
      }
      if (results.length > 0) {
          res.render('song', { song: results[0] });
      } else {
          res.status(404).send('Song not found');
      }
  });
});


//Delete
app.post('/deletesong/:id', (req, res) => {
  res.render('deletesong')
});

//Delete product
app.get('/deletesong/:id', (req, res) => {
  const song_id = req.params.id;
  const sql = 'DELETE FROM song WHERE song_id = ?';
  connection.query(sql, [song_id], (error, results) => {
      if (error) {
          // Handle any error that occurs during the database operation
          console.error("Error deleting product:", error);
          res.status(500).send('Error deleting product');
      } else {
          // Send a success response
          res.redirect('/');
      }
  });
});

//Edit
app.get('/edit/:id', (req, res) => {
  const song_id = req.params.id;
  const sql = 'SELECT * FROM song WHERE song_id = ?';
  connection.query(sql, [song_id], (error, results) => {
      if (error) {
          console.error('Database query error:', error.message);
          return res.status(500).send('Error retrieving song by ID');
      }
      if (results.length > 0) {
          res.render('edit', { song: results[0] });
      } else {
          res.status(404).send('Song not found');
      }
  });
});


app.post('/edit/:id', upload.single('image'), (req, res) => {
  const song_id = req.params.id;
  const { title, artist, genre } = req.body;
  let image = null;
  if (req.file) {
      image = req.file.filename;
  }
  const sql = 'UPDATE song SET title=?,artist = ?, genre = ?, image = ? WHERE song_id = ?';
  connection.query(sql, [title, artist, genre, image, song_id], (error, results) => {
      if (error) {
          console.error('Error updating song:', error);
          return res.status(500).send('Error updating song');
      } else {
          res.redirect('/library');
      }
  });
});

//Adding of the song
app.post('/library', (req, res) => {
  //Extract song data fromt the request body
  const {title,artist,genre} = req.body;
  let image;
  if (req.file) {
      image= req.file.filename; //Save only the filename
  } else {
      image = null;
  }
  const sql = 'INSERT INTO songs (title,artist,genre,image) VALUES (?, ?, ?, ?)';
  //Insert the new song into the database
  connection.query(sql, [title, artist, genre, image], (error, results) => {
      if (error) {
          //Handle any error that occurs during the database operation
          console.error("Error adding song:", error);
          res.status(500).send('Error adding song');
      } else {
          //Send a success response
          res.redirect.apply('/')
      }
  });
});

//Add Song
app.get('/add', (req, res) => {
  res.render('add');
});

app.post('/add', upload.single('image'), (req, res) => {
  const { title,artist,genre} = req.body;
  let image = null;
  if (req.file) {
      image = req.file.filename;
  }
  const sql = 'INSERT INTO song (title,artist,genre,image) VALUES (?, ?, ?, ?)';
  connection.query(sql, [title,artist, genre,image], (error, results) => {
      if (error) {
          console.error('Error adding song:', error);
          return res.status(500).send('Error adding song');
      } else {
          res.redirect('/library');
      }
  });
});













// Route to display artist
app.get('/artists', (req, res) => {
  const sql = 'SELECT * FROM artists';
  connection.query(sql, (error, results) => {
      if (error) {
          console.error('Database query error:', error.message);
          return res.status(500).send('Error retrieving artists');
      }
      res.render('artists', { artists: results });
  });
});


app.get('/artists/:id', (req, res) => {
  const artists_id = req.params.id;
  const sql = 'SELECT * FROM artists WHERE artists_id =?';
  connection.query(sql, [artists_id], (error, results) => {
      if (error) {
          console.error('Database query error:', error.message);
          return res.status(500).send('Error Retrieving artist');
      }
      if (results.length > 0) {
          res.render('artistsDetails', { artists: results[0] });
      } else {
          res.status(404).send('Artist not found');
      }
  });
});


//Render Delete
app.post('/deleteartist/:id', (req, res) => {
  res.render('deleteartist')
});

//Delete Artist
app.get('/deleteartist/:id', (req, res) => {
  const artists_id = req.params.id;
  const sql = 'DELETE FROM artists WHERE artists_id = ?';
  connection.query(sql, [artists_id], (error, results) => {
      if (error) {
          // Handle any error that occurs during the database operation
          console.error("Error deleting artist:", error);
          res.status(500).send('Error deleting artist');
      } else {
          // Send a success response
          res.redirect('/artists');
      }
  });
});


//Adding 
app.get('/addartist', (req, res) => {
  res.render('addartist');
});

app.post('/addartist', upload.single('image'), (req, res) => {
  const {name,description} = req.body;
  let image = null;
  if (req.file) {
      image = req.file.filename;
  }
  const sql = 'INSERT INTO artists (name,description,image) VALUES (?, ?, ?)';
  connection.query(sql, [name,description,image], (error, results) => {
      if (error) {
          console.error('Error adding artist:', error);
          return res.status(500).send('Error adding artist');
      } else {
          res.redirect('/artists');
      }
  });
});




// Route to handle search form submission
app.get('/search', (req, res) => {
  const { keyword } = req.query;
  const sql = 'SELECT * FROM song WHERE title LIKE ? OR artist LIKE ?';
  const searchTerm = `%${keyword}%`; // Use SQL wildcard % for partial matching

  connection.query(sql, [searchTerm, searchTerm, searchTerm], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error searching songs');
    }

    res.render('search', { song: results, keyword: keyword });
  });
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});