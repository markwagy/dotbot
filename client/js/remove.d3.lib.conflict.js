/*
  <sigh> the global object for the D3 viz lib "d3" 
  conflicts with a global function in ammo.js. 
  This is a hack to avoid the conflict.
  Welcome to Javascript.
*/
var d3noconflict = d3;
