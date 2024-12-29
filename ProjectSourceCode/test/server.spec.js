// ********************** Initialize server **********************************
const {server,db} = require('../src/index.js'); //TODO: Make sure the path to your index.js is correctly added
// ********************** Import Libraries ***********************************
const bcrypt = require('bcryptjs');

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;


describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************
describe('Testing register route', () => {
    it('positive : /register', done => {
        chai
          .request(server)
          .post('/register')
          .send({username: '1', password:'$2a$10$UqdunLBAyvsLSxsD5wrV3uRJbucN8kIJffC7sgR4gnqyYkJvBa.BC'})
          .end((err, res) => {
            expect(res).to.have.status(200);
            done();
          });
      });
  
    it('Negative : /register. Checking invalid username and password', done => {
      chai
        .request(server)
        .post('/register')
        .send({username: '1', password:'$2a$10$UqdunLBAyvsLSxsD5wrV3uRJbucN8kIJffC7sgR4gnqyYkJvBa.BC'})
        .end((err, res) => {
          chai
            .request(server)
            .post('/register')
            .send({username: '1', password:'$2a$10$UqdunLBAyvsLSxsD5wrV3uRJbucN8kIJffC7sgR4gnqyYkJvBa.BC'})
            .end((err, res) => {
              expect(res).to.have.status(400);
              done();
            });
        });
      
    });
  });





describe('Profile Route Tests', () => {
  let agent;
  const testUser = {
    username: 'testuser',
    password: 'testpass123',
  };

  before(async () => {
    // Clear users table and create test user
    await db.query('TRUNCATE TABLE users CASCADE');
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await db.query('INSERT INTO users (username, password) VALUES ($1, $2)', [
      testUser.username,
      hashedPassword,
    ]);
  });

  beforeEach(() => {
    // Create new agent for session handling
    agent = chai.request.agent(server);
  });

  afterEach(() => {
    // Clear cookie after each test
    agent.close();
  });

  after(async () => {
    // Clean up database
    await db.query('TRUNCATE TABLE users CASCADE');
  });

  describe('testing write review', () => {
    it('positive : /writeReview', async () => {
      await agent.post('/login').send(testUser);
      
      const res = await agent.post('/writeReview').send({username: '2', reviewText:'testing review', rating:'5'})
      expect(res).to.have.status(200);
    });

    it('negative : /writeReview', async () => {
      await agent.post('/login').send(testUser);
      
      const res = await agent.post('/writeReview').send({username: '2', reviewText:'testing review'})
      expect(res).to.have.status(500);
    });
  });
});
// ********************************************************************************