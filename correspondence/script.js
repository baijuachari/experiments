// This script requires watchify!
// Install via "npm install -g watchify"
//
// To monitor this file for changes and rebuild automatically, type:
// watchify -v -t brfs script.js -o assets/js/script.js

var fs = require('fs');
var Handlebars = require('handlebars');

// Set up drawer
var drawer = $('#drawer'),
    main = $('#main'),
    handle = drawer.find('.handle');

handle.click(function(){
  var classname = 'expanded';
  drawer
    .toggleClass(classname)
    .animate({ height : drawer.hasClass(classname) ? 400 : 30 });

  main
    .animate({ bottom : drawer.hasClass(classname) ? 400 : 30 });
});


var ace = require('brace');
require('brace/mode/json');

CKEDITOR.config.skin = 'office2013';
var editor = CKEDITOR.replace('editor');

// Resize editor window to fit div
CKEDITOR.on('instanceReady', resize); 

$(window).on('resize', resize); 

function resize() {
    editor.element.show();
    var h = $('#left').height();
    editor.element.hide();
    editor.resize('100%', h - 123, true);
}


editor.on('change', update);

// Set up tag editor interface
var tagPicker = require('./tag.js');

// Set up menu interface
var list = require('./list.js'),
    target = $('#menu'),
    menu = require('./menu.js');

menu(target, list.templates, 'templates', editor);
menu(target, list.partials, 'partials', editor);

$('body').on('switch-template', update);

// via http://stackoverflow.com/questions/20889174
var handler = function(e){
  var editor = e.editor,
      rows = editor.session.doc.getAllLines(),
      pos = editor.getCursorPosition(),
      token = getToken(rows,pos);

  if (token){
    var json = dses.getValue();
    tagPicker(e, token.string, obj, function(result){
      var row = rows[token.row],
          Range = ace.acequire('ace/range').Range,
          rng = new Range(token.row, token.beginning + 1, token.row, token.end - 1),
          doc = editor.session.doc;

      doc.replace(rng, result);
    }); 
  }

  // Cheesy function to see if this a cursor position is actually inside of a handlebars tag 
  function getToken(lines, pos){

    var row = rows[pos.row],
        beginning,
        end,
        i,
        c;

    // Move left to find tag beginning
    for (i=pos.column; i>0; i--){
      c = row[i-1] + row[i];
      if (c === '{{'){
        beginning = i;
      }
    }
    
    // Move right to find tag end
    for (i=pos.column; i<row.length; i++){
      c = row[i-1] + row[i];
      if (c === '}}'){
        end = i;
      }
    }
      
    if (beginning && end){
      return {
        beginning : beginning,
        end: end,
        row: pos.row,
        string: row.substr(beginning+1, end-3)
      };
    } 
  }
};
// code.on("click", handler);

var data = ace.edit('data'),
    dses = data.getSession();

data.setShowPrintMargin(false);
dses.setMode('ace/mode/json');
dses.setValue(
  fs.readFileSync(__dirname + '/data.json', 'utf8')
);
dses.on('change', update);

// Select demo template
target.find('select:eq(0) option:eq(1)').prop('selected', 'selected').trigger('change');

var obj;
function update(evt, session){

  var str = editor.getData(),
      json = dses.getValue();

  try {
    obj = JSON.parse(json);
  } catch(e){
    console.log('oh no!');
    return;
  }

  // Compile and display
  var result;

  try {
    var find = '{{\&gt\;';
    var re = new RegExp(find, 'g');
    str = str.replace(re, '{{>');

    // console.log(str);

    var template = Handlebars.compile(str);
    result = template(obj);

    // Reregister partials
    list.partials.forEach(function(d){
      Handlebars.unregisterPartial(d.name);
      Handlebars.registerPartial(d.name, d.data);
    });

  } catch(e){
    result = '<div class="usa-alert usa-alert-error" role="alert"><div class="usa-alert-body"><h3 class="usa-alert-heading">Error:</h3> <p class="usa-alert-text">' + e.toString() + '</p></div></div>';
  }

  $('#right').html(result);
}
update();
