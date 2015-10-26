// This script requires browserify!
//
// To build it, just type:
// browserify -t brfs script.js > assets/js/script.js

var fs = require('fs');
var $ = require('jquery');
var Handlebars = require('handlebars');

// Set up drawer
var drawer = $('#drawer'),
    handle = drawer.find('.handle');

handle.click(function(){
  var classname = 'expanded';
  drawer
    .toggleClass(classname)
    .animate({ height : drawer.hasClass(classname) ? 400 : 30 });
});

// Start ACE editor
var ace = require('brace');
require('brace/mode/html');
require('brace/mode/json');

var code = ace.edit('left'),
    cses = code.getSession();

code.setShowPrintMargin(false);
cses.setMode('ace/mode/html');
cses.setValue(
  fs.readFileSync(__dirname + '/example.html', 'utf8')
);
cses.on('change', update);

var data = ace.edit('data'),
    dses = data.getSession();

data.setShowPrintMargin(false);
dses.setMode('ace/mode/json');
dses.setValue(
  fs.readFileSync(__dirname + '/data.json', 'utf8')
);
dses.on('change', update);

function update(evt, session){

  var str = cses.getValue(), 
      json = cses.getValue(),
      obj;

  try {
    obj = JSON.parse(json);
  } catch(e){
    console.log('oh no!');
    return;
  }

  // Compile and display
  var template = Handlebars.compile(str),
      result = template(json);

  $('#right').html(result);
}
update();
