function MainController($scope) {
  var fs    = require('fs'),
      path  = require('path'),
      spawn = require('child_process').spawn,
      gui   = require('nw.gui');

  var ARGV      = gui.App.argv,
      PWD       = process.env['PWD'],
      DIRECTORY = ARGV[0] ? path.resolve(PWD, ARGV[0]) : PWD;

  runCommand('git', ['status'], function(output) {
    $scope.stage = output;
  });

  runCommand('git', ['diff'], function(output) {
    $scope.diff = output;
  });

  runCommand('ls', [], function(output) {
    $scope.files = output.split('\n');
  });

  function runCommand(command, args, callbacks) {
    args      || (args = []);
    callbacks || (callbacks = {});

    if (typeof callbacks === 'function') {
      callbacks = { stdout: callbacks };
    }

    var proc = spawn(command, args, {
      cwd: DIRECTORY
    });

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', callbacks.stdout || function() {});

    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', callbacks.stderr || function() {});
  }

  function listFiles(files, directory) {
    mainArea.innerHTML = '';

    var list = insertElement(mainArea, 'UL');

    forEach(files, function(file) {
      // Skip blank filenames.
      if ((/^\s*$/).test(file)) {
        return;
      }

      var item = insertElement(list, 'LI'),
          link = insertElement(item, 'A');

      // Yeah yeah, I know... boo hoo.
      link.setAttribute('href', 'javascript:void(0);');

      link.addEventListener('click', function() {
        openFile(file, directory);
      });

      link.textContent = file;
    });
  }

  function openFile(relativePath, directory) {
    directory || (directory = DIRECTORY);

    var absolutePath = path.join(directory, relativePath);

    fs.stat(absolutePath, function(err, stats) {
      if (err) {
        displayError(err);
        return;
      }

      if (stats.isDirectory()) {
        fs.readdir(absolutePath, function(err, files) {
          if (err) {
            displayError(err);
            return;
          }

          listFiles(files, absolutePath);
        });

        return;
      }

      fs.readFile(absolutePath, 'utf8', function(err, text) {
        if (err) {
          displayError(err);
          return;
        }

        renderInCodeMirror(text, {
          mode: guessCodeMirrorMode(absolutePath)
        });
      });
    });
  }

  function renderInCodeMirror(content, options) {
    options || (options = {});

    mainArea.innerHTML = '';
    var textarea = insertElement(mainArea, 'TEXTAREA');
    textarea.value = content;

    return CodeMirror.fromTextArea(textarea, options);
  }

  function guessCodeMirrorMode(fileName) {
    switch (path.extname(fileName).toLowerCase()) {
      case '.html': return 'htmlmixed';
      case '.css': return 'css';
      default: return 'javascript';
    }
  }
}

MainController.$inject = ['$scope'];
