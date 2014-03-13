var gitty = angular.module('gitty', []);

gitty.directive('gittyCodeMirror', CodeMirrorDirective);

gitty.controller('NavController', NavController);
gitty.controller('MainController', MainController);
