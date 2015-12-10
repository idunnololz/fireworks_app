# Fireworks: The complete project
Hello! This is the full source for the game Fireworks as seen [here](http://fireworks.idunnololz.com/) which is an online port of the card game Hanabi.

## Organization and explanation
This project is organized into two parts main parts, the client side project and the server size project. They can be found within the `fireworks-client/src` folder and the `fireworks-server` folder respectively. 

The reason why the project is set up in such a way is simply because of my limited resources as this is merely a fun side project and nothing serious. I have a domain, a shared hosting subscription and Heroku (free tier) to work with. Thus, my site would get the best performance if I were to use my hosting service to host the front end. However since I don't own a dedicated server, I had to rely on Heroku to actually host the server code. This meant that I had to break the project up into two pieces as opposed to having just one big nodejs project like i've seen many other web developers do.

## Technologies
The client side project uses
 - **SCSS (Sass)** for styling
 - **HTML** for the base page source
 - **JSX with React** for dynamic rendering of all of the pages
 - **JSX with harmony** for ES6 support
 - **RequireJS** for a more modular approach to web development
 - **GSAP** for some animations
 - **JQuery** for... stuff
 - **Tooltip** from JQueryUI for tooltips
 - **Nanoscroller** for lightweight customizable scroll bars
 - **SocketIO** for client-server communication
 
The server side project uses
 - **SocketIO** for client-server communication
 - **Express** because SocketIO needs it? Not too sure. I don't do much server development.
 - **NodeJS**
 - **babel** for ES6 support
