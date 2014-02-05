var fs    = require('fs'),
    path  = require('path'),
    spawn = require('child_process').spawn;

window.addEventListener('load', function() {
  var navLinks = document.querySelectorAll('body > nav > ul > li > a'),
      mainArea = document.querySelector('body > main');

  var sections = {
    stage: {
      init: function init() {
        runCommand('git', ['status']);
      }
    },

    files: {
      init: function files() {
        runCommandThen('ls', [], function(data) {
          var list = insertElement(mainArea, 'UL');

          forEach(data.split('\n'), function(line) {
            // Skip blank lines.
            if ((/^\s*$/).test(line)) {
              return;
            }

            var item = insertElement(list, 'LI'),
                link = insertElement(item, 'A');

            // Yeah yeah, I know... boo hoo.
            link.setAttribute('href', 'javascript:void(0);');

            link.addEventListener('click', function() {
              openFile(line);
            });

            link.textContent = line;
          });
        });
      }
    }
  };

  forEach(navLinks, function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      var section = link.getAttribute('href').substring(1);
      visitSection(section);
    });
  });

  function forEach(collection, fn) {
    return Array.prototype.forEach.call(collection, fn);
  }

  function peek(collection) {
    return collection[collection.length - 1];
  }

  function visitSection(section) {
    section = sections[section];
    mainArea.innerHTML = '';
    section.init();
  }

  function insertElement(parent, name, className) {
    var element = document.createElement(name);
    if (className) {
      element.className = className;
    }
    parent.appendChild(element);
    return element;
  }

  function runCommandThen(command, args, callbacks) {
    args      || (args = []);
    callbacks || (callbacks = {});

    if (typeof callbacks === 'function') {
      callbacks = { stdout: callbacks };
    }

    var proc = spawn(command, args, {
      cwd: process.env['PWD']
    });

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', callbacks.stdout || function() {});

    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', callbacks.stderr || function() {});
  }

  function runCommand(command, args) {
    runCommandThen(command, args, {
      stdout: function(data) {
        var pre = insertElement(mainArea, 'PRE');
        pre.textContent = data;
      },

      stderr: function(data) {
        var pre = insertElement(mainArea, 'PRE', 'error');
        pre.textContent = data;
      }
    });
  }

  function openFile(relativePath) {
    var absolutePath = path.join(process.env['PWD'], relativePath);

    fs.readFile(absolutePath, 'utf8', function(err, text) {
      if (err) {
        console.error(err);
        return;
      }

      mainArea.innerHTML = '';
      var textarea = insertElement(mainArea, 'TEXTAREA');
      textarea.value = text;

      CodeMirror.fromTextArea(textarea, {
        mode: guessCodeMirrorMode(relativePath)
      });
    });
  }

  function guessCodeMirrorMode(fileName) {
    switch (path.extname(fileName).toLowerCase()) {
      case '.html': return 'htmlmixed';
      case '.css': return 'css';
      default: return 'javascript';
    }
  }
});
