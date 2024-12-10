# Bounty-Board-Project

Bounty board is an app where users can post any task from homework help to yard work. 
Users who want to post bounties can put a price on anything they want done. 
They can choose from pricing by a set price. 
Users that want to complete bounties can upload a resume and sort through bounties by categories and price.

"To be the one stop solution for all the problems that a person can encounter."

Team Members: 
  Larry Shan (github: LarrymShan - email: lash8147@colorado.edu), 
  Grayson Smillie (github: CanadaDry47 -  email: grsmm4458@colorado.edu), 
  Jacob Lehman (github: JacobLehman7842 -  email: jale6271@colorado.edu), 
  Trevor Schmuckley (github: tschmuckley - email: trsc9818@colorado.edu), 
  Jacob Ehl (github: Jacob-Ehl, email: jaeh5902@colorado.edu)
  Alessandro Cantele (github: alca2205, email: alca2258@colorado.edu)

  The technology stack used for this project include for the front end HTML, Handlebars, Bootstrap,
  CSS. We are running our server using nodeJS with the framework express in node. Our backend 
  database include PostgresSQL. We have chose to web host our website using render.

  The directory structure is as follows;
  root directory

  ├─<ProjectRepository>/
  ├─ TeamMeetingLogs
  ├─ MilestoneSubmissions
  ├─ ProjectSourceCode
  ├─ Readme.md

ProjectSourceCode has all of the projects code including front end code,
server code, database structure and postgreSQL quires this also include styling rules
and images used in the website

├─ ProjectSourceCode
  ├─ docker-compose.yaml
  ├─ .gitignore
  ├─ node_modules
  ├─ package.json
  ├─ src
    ├─ views
      ├─ pages
        ├─ home.hbs
        ├─ login.hbs
        ├─ register.hbs
      ├─ partials
        ├─ header.hbs
        ├─ footer.hbs
      ├─ layouts
      ├─ main.hbs
|    ├─ resources
      ├─ css
        ├─ style.css
      ├─ js
        ├─ script.js
      ├─ img
        ├─ home.png
      ├─ index.js
      ├─ init_data
        ├─ create.sql
        ├─ insert.sql
    ├─ test
      ├─ server.spec.js

To run our project using our remote deployment system render click the link below
https://bounty-board-project-team-01.onrender.com

To run the project on your local computer you can download the code in the repository.
- Download install and run the docker app for your operating system
- Next using VS code navigate to the project source code directory using the following command 'cd Bounty-Board-Project-Team-01/ProjectSourceCode/'
- Once in the directory run the following command in your terminal 'docker compose up'
- Open the browser of your choice and enter 'http://localhost:3000/' you should see bounty board open in your browser
- To exit the program close your browser tab
- Go back to VS code and type the following into your terminal 'docker compose down' to close docker or 'docker compose down -v'
if you want to close docker and reset the database

