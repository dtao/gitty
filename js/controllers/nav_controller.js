function NavController($rootScope) {
  $rootScope.currentSection = 'stage';

  $rootScope.isCurrentSection = function(name) {
    return name === $rootScope.currentSection;
  };

  $rootScope.showSection = function(name) {
    $rootScope.currentSection = name;
  };

  $rootScope.sectionClass = function(name) {
    return $rootScope.isCurrentSection(name) ? 'active' : '';
  }
}

NavController.$inject = ['$rootScope'];
