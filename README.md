# dotbot

Client code for connect-the-dot bots. For a working example of the client code (without the back-end and middleware enabled), see here: http://www.uvm.edu/~mwagy/robots/dotbot

### Client Code Overview ##

The code mainly relies on four libraries: D3.js, jQuery.js, Three.js and Ammo.js for interactive graphics, DOM selection, 3D rendering and 3D physics simulation, respectively.

The MyDemoApplication class is a variation of the DemoApplication class found here: https://github.com/schteppe/ammo.js-demos.git.


### Back-end and Middleware (not included) ###

Note that this front-end works with middleware and a back-end that is specific to how you want to store the data that is returned from the site. XMLHttpRequest objects are used to send HTTP to a server (set up in the config file).

