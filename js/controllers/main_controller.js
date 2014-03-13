function MainController($scope) {
  var fs    = require('fs'),
      path  = require('path'),
      spawn = require('child_process').spawn,
      gui   = require('nw.gui');

  var ARGV      = gui.App.argv,
      PWD       = process.env['PWD'],
      DIRECTORY = ARGV[0] ? path.resolve(PWD, ARGV[0]) : PWD;

  // Initialize scope
  $scope.stage         = null;
  $scope.diff          = null;
  $scope.files         = [];
  $scope.currentFolder = DIRECTORY;
  $scope.currentFile   = null;

  runCommand('git', ['status'], function(output) {
    $scope.stage = output;
  });

  runCommand('git', ['diff'], function(output) {
    $scope.diff = output;
  });

  runCommand('ls', [], function(output) {
    $scope.files = readFiles(output, DIRECTORY);
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

    proc.stdout.on('end', function() {
      $scope.$apply();
    });
  }

  function readFiles(files, directory) {
    if (typeof files === 'string') {
      files = files.split('\n');
    }

    files.forEach(function(line, i) {
      var filePath = path.join(directory, line),
          stats    = fs.statSync(filePath);

      files[i] = {
        type: stats.isDirectory() ? 'folder' : 'file',
        path: filePath,
        name: line
      };
    });

    files.sort(function(x, y) {
      return compare(x.type, y.type) || compare(x.name, y.name);
    });

    return files;
  }

  function openFile(file, e) {
    if (e) {
      e.preventDefault();
    }

    $scope.currentFile = null;

    if (file.type === 'folder') {
      openFolder(file.path);
      return;
    }

    fs.readFile(file.path, 'utf8', function(err, text) {
      if (err) {
        displayError(err);
        return;
      }

      $scope.currentFile = {
        path: file.path,
        name: file.name,
        type: guessCodeMirrorMode(file.name),
        content: text
      };

      $scope.$apply();
    });
  }

  function openFolder(folderPath) {
    fs.readdir(folderPath, function(err, files) {
      if (err) {
        displayError(err);
        return;
      }

      $scope.currentFolder = folderPath;
      $scope.files = readFiles(files, folderPath);
      $scope.$apply();
    });
  }

  function upToFolder() {
    if ($scope.currentFile) {
      $scope.currentFile = null;
      return;
    }

    if (atRootFolder()) {
      return;
    }

    openFolder(path.dirname($scope.currentFolder));
  }

  function atRootFolder() {
    return $scope.currentFolder === DIRECTORY && !$scope.currentFile;
  }

  function guessCodeMirrorMode(fileName) {
    switch (path.extname(fileName).toLowerCase()) {
      case '.html': return 'htmlmixed';
      case '.css': return 'css';
      default: return 'javascript';
    }
  }

  function compare(x, y) {
    if (x === y) return 0;
    return x > y ? 1 : -1;
  }

  // Expose methods to the UI
  $scope.openFile = openFile;
  $scope.upToFolder = upToFolder;
  $scope.atRootFolder = atRootFolder;
}

MainController.$inject = ['$scope'];
