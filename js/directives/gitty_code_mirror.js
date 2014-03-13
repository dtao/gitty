function CodeMirrorDirective($timeout) {

  return {
    link: function(scope, element, attrs) {
      $timeout(function() {
        CodeMirror.fromTextArea(element[0], {
          lineNumbers: true,
          mode: attrs.gittyCodeMirror
        });
      });
    }
  };

}

CodeMirrorDirective.$inject = ['$timeout'];
