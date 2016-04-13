angular
  .module('refineryDataSetNav')
  .controller(
    'refineryDataSetNavFilesCtrl',
    [
      '$rootScope',
      '$timeout',
      '$window',
      '$',
      function($rootScope, $timeout, $window, $) {
        $rootScope.mode = "browse";
        $rootScope.showCtrlTab = false;
        $rootScope.mainTabSpanSize = "col-md-12 no-margin";
        $rootScope.ctrlTabSpanSize = "";

        // calls global resizing function implemented in base.html to rescale
        // height of scrollable elements timeout is needed to execute after DOM
        // changes
        if ($window.sizing) {
          $timeout(sizing, 0);
        }

        $($window).trigger('refinery/floatThead/reflow');
      }
    ]
  );

angular
  .module('refineryDataSetNav')
  .controller(
    'refineryDataSetNavFilesBrowseCtrl',
    [
      '$rootScope',
      '$timeout',
      '$window',
      '$',
      function($rootScope, $timeout, $window, $) {
        $('#filesTab').addClass('active');
        $rootScope.mode = "browse";
        $rootScope.showCtrlTab = false;
        $rootScope.mainTabSpanSize = "col-md-12 no-margin";
        $rootScope.ctrlTabSpanSize = "";

        // calls global resizing function implemented in base.html to rescale
        // height of scrollable elements timeout is needed to execute after DOM
        // changes
        if ($window.sizing) {
          $timeout(sizing, 0);
        }

        $($window).trigger('refinery/floatThead/reflow');
      }
    ]
  );

angular
  .module('refineryDataSetNav')
  .controller(
    'refineryDataSetNavAnalyzeCtrl',
    [
      '$rootScope',
      '$timeout',
      '$window',
      '$',
      function($rootScope, $timeout, $window, $) {
        $('#filesTab').addClass('active');
        $rootScope.mode = "analyze";
        $rootScope.showCtrlTab = true;
        $rootScope.mainTabSpanSize = "col-md-10";
        $rootScope.ctrlTabSpanSize = "col-md-2";

        // calls global resizing function implemented in base.html to rescale
        // height of scrollable elements timeout is needed to execute after DOM
        // changes
        if ($window.sizing) {
          $timeout(sizing, 0);
        }

        $($window).trigger('refinery/floatThead/reflow');
      }
    ]
  );

angular
  .module('refineryDataSetNav')
  .controller(
    'refineryDataSetNavVisualizeCtrl',
    [
      '$rootScope',
      '$timeout',
      '$window',
      '$',
      function($rootScope, $timeout, $window, $) {
        $('#filesTab').addClass('active');
        $rootScope.mode = "visualize";
        $rootScope.showCtrlTab = true;
        $rootScope.mainTabSpanSize = "col-md-10";
        $rootScope.ctrlTabSpanSize = "col-md-2";

        // calls global resizing function implemented in base.html to rescale
        // height of scrollable elements timeout is needed to execute after DOM
        // changes
        if ($window.sizing) {
          $timeout(sizing, 0);
        }

        $($window).trigger('refinery/floatThead/reflow');
      }
    ]
  );

// This is just a placeholder controller until we re-implement that tab's
// content in Angular.
angular
  .module('refineryDataSetNav')
  .controller(
    'refineryDataSetNavBlueprintCtrl',
    [
      '$timeout',
      '$window',
      '$',
      function($timeout, $window, $) {
        if ($window.sizing) {
          $timeout(sizing, 0);
        }
      }
    ]
  );

angular
  .module('refineryDataSetNav')
  .config(['refineryStateProvider', 'refineryUrlRouterProvider',
    function (refineryStateProvider, refineryUrlRouterProvider) {

      refineryStateProvider
        .state(
          'files',
          {
            url: '/files/',
            templateUrl: '/static/partials/data-set-ui-mode-browse.html',
            controller: 'refineryDataSetNavFilesCtrl'
          },
          '^\/data_sets\/.*\/$',
          true
        )
        .state(
          'browse',
          {
            url: '/files/browse',
            templateUrl: '/static/partials/data-set-ui-mode-browse.html',
            controller: 'refineryDataSetNavFilesBrowseCtrl'
          },
          '^\/data_sets\/.*\/$',
          true
        )
        .state(
          'analyze',
          {
            url: '/files/analyze/',
            templateUrl: '/static/partials/data-set-ui-mode-analyze.html',
            controller: 'refineryDataSetNavAnalyzeCtrl'
          },
          '^\/data_sets\/.*\/$',
          true
          )
        .state(
          'visualize',
          {
            templateUrl: "/static/partials/data-set-ui-mode-visualize.html",
            url: '/files/visualize/',
            controller: 'refineryDataSetNavVisualizeCtrl'
          },
          '^\/data_sets\/.*\/$',
          true
        )
        .state(
          'analyses',
          {
            url: '/analyses/',
            templateUrl: '/static/partials/analysis-monitor/partials/analyses-list.html',
            controller: 'refineryDataSetNavBlueprintCtrl'
          },
          '^\/data_sets\/.*\/$',
          true
        )
        .state(
          'attributes',
          {
            url: '/attributes/',
            controller: 'refineryDataSetNavBlueprintCtrl'
          },
          '^\/data_sets\/.*\/$',
          true
        )
        .state(
          'details',
          {
            url: '/details/',
            controller: 'refineryDataSetNavBlueprintCtrl'
          },
          '^\/data_sets\/.*\/$',
          true
        )
        .state(
          'sharing',
          {
            url: '/sharing/',
            controller: 'refineryDataSetNavBlueprintCtrl'
          },
          '^\/data_sets\/.*\/$',
          true
        )
                .state(
          'files',
          {
            url: '/files/',
            templateUrl: '/static/partials/file-browser/partials/assay-files.html',
            controller: 'refineryDataSetNavFilesCtrl'
          },
          '^\/data_sets2\/.*\/$',
          true
        )
        .state(
          'browse',
          {
            url: '/files/browse',
            templateUrl: '/static/partials/data-set-ui-mode-browse.html',
            controller: 'refineryDataSetNavFilesBrowseCtrl'
          },
          '^\/data_sets2\/.*\/$',
          true
        )
        .state(
          'analyze',
          {
            url: '/files/analyze/',
            templateUrl: '/static/partials/data-set-ui-mode-analyze.html',
            controller: 'refineryDataSetNavAnalyzeCtrl'
          },
          '^\/data_sets2\/.*\/$',
          true
          )
        .state(
          'visualize',
          {
            templateUrl: "/static/partials/data-set-ui-mode-visualize.html",
            url: '/files/visualize/',
            controller: 'refineryDataSetNavVisualizeCtrl'
          },
          '^\/data_sets2\/.*\/$',
          true
        )
        .state(
          'analyses',
          {
            url: '/analyses/',
            templateUrl: '/static/partials/analysis-monitor/partials/analyses-list.html',
            controller: 'refineryDataSetNavBlueprintCtrl'
          },
          '^\/data_sets2\/.*\/$',
          true
        )
        .state(
          'details',
          {
            url: '/details/',
            controller: 'refineryDataSetNavBlueprintCtrl'
          },
          '^\/data_sets2\/.*\/$',
          true
        );

      refineryUrlRouterProvider
        .otherwise(
          '/files/browse',
          '^\/data_sets\/.*\/$',
          true
        )
        .otherwise(
          '/files/browse',
          '^\/data_sets2\/.*\/$',
          true
        );
    }
  ]
);
