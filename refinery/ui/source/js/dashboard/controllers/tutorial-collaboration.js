/**
 * Created by scott on 7/18/16.
 */
'use strict';

function collaborationTutorialCtrl ($scope, tutorialPageNavigation) {
  $scope.collabCompletedEvent = function () {
    tutorialPageNavigation.setData($scope.collaborationKey, true);
    document.getElementById('collaborationTutorialStep0_click').click();
  };

  $scope.collabExitEvent = function (event) {
    console.log(event.id, 'ExitEvent');
  };

  $scope.collabChangeEvent = function (event) {
    console.log(event.id, 'changeEvent');
  };

  $scope.collabBeforeChangeEvent = function () {
  };

  $scope.collabAfterChangeEvent = function (event) {
    console.log(event.id, 'AfterChangeEvent');
    if (event.id === 'collaborationTutorialStep0') {
      document.getElementsByClassName('introjs-showElement')[0].style[
        'background-color'] = '#525252';
    }
  };


  $scope.collabIntroOptions = {
    showStepNumbers: false,
    showBullets: false,
    exitOnOverlayClick: false,
    exitOnEsc: false,
    nextLabel: '<strong><i class="fa fa-arrow-right"></i></strong>',
    prevLabel: '<strong><i class="fa fa-arrow-left"></i></strong>',
    skipLabel: '<strong><i class="fa fa-times"></i></strong>',
    doneLabel: 'Proceed to collaboration page'
  };


  setTimeout(function () {
    $scope.collabIntroOptions.steps = [
      {
        element: document.querySelector('#collaborationTutorialStep0'),
        intro: 'Here you can collaborate with other Refinery users',
        position: 'bottom'
      }
    ];
  }, 500);
}

angular
  .module('refineryDashboard')
  .controller('collaborationTutorialCtrl', [
    '$scope',
    'tutorialPageNavigation',
    collaborationTutorialCtrl
  ]);