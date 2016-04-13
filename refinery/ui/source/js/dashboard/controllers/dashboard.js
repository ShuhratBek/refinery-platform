function DashboardCtrl (
  // Angular modules
  $q,
  $state,
  $stateParams,
  $timeout,
  $rootScope,
  $window,
  // 3rd party library
  _,
  // Refinery modules
  pubSub,
  settings,
  dataSet,
  authService,
  projectService,
  analysisService,
  workflowService,
  UiScrollSource,
  dashboardDataSetListService,
  dashboardDataSetSearchService,
  dashboardDataSetsReloadService,
  dashboardWidthFixerService,
  dashboardExpandablePanelService,
  dashboardDataSetPreviewService,
  treemapContext,
  dashboardVisData,
  dataCart) {
  var that = this;

  // Construct Angular modules
  this.$q = $q;
  this.$rootScope = $rootScope;
  this.$state = $state;
  this.$stateParams = $stateParams;
  this.$timeout = $timeout;
  this.$window = $window;

  // Construct 3rd party library
  this._ = _;

  // Construct Refinery modules
  this.pubSub = pubSub;
  this.settings = settings;
  this.dataSet = dataSet;
  this.authService = authService;
  this.projectService = projectService;
  this.analysisService = analysisService;
  this.workflowService = workflowService;
  this.dashboardDataSetListService = dashboardDataSetListService;
  this.dashboardDataSetSearchService = dashboardDataSetSearchService;
  this.dashboardDataSetsReloadService = dashboardDataSetsReloadService;
  this.dashboardWidthFixerService = dashboardWidthFixerService;
  this.dashboardExpandablePanelService = dashboardExpandablePanelService;
  this.dashboardDataSetPreviewService = dashboardDataSetPreviewService;
  this.treemapContext = treemapContext;
  this.dashboardVisData = dashboardVisData;
  this.dataCart = dataCart;

  this.searchQueryDataSets = '';

  // Construct class variables
  this.dataSetServiceLoading = false;
  this.expandedDataSetPanelBorder = false;

  this.dataSetsPanelHeight = 1;
  this.dataCartPanelHeight = 0;

  // Check authentication
  // This should ideally be moved to the global APP controller, which we don't
  // have right now.
  this.authService.isAuthenticated().then(function (isAuthenticated) {
    this.userIsAuthenticated = isAuthenticated;
  }.bind(this));
  this.authService.isAdmin().then(function (isAdmin) {
    this.userIsAdmin = isAdmin;
  }.bind(this));

  // Set up dataSets for `uiScroll`
  this.dataSets = new UiScrollSource(
    'dashboard/dataSets',
    10,
    this.dataSet.fetchInclMeta
  );

  // Set up analyses for `uiScroll`
  this.analyses = new UiScrollSource(
    'dashboard/analyses',
    1,
    function (limit, offset, extra) {
      var params = this._.merge(this._.cloneDeep(extra) || {}, {
            limit: limit,
            offset: offset
          });

      return this.analysisService.query(params).$promise;
    }.bind(this),
    'objects',
    'total_count'
  );

  // Set up projects for `uiScroll`
  // this.projects = new UiScrollSource(
  //   'dashboard/projects',
  //   1,
  //   function (limit, offset) {
  //     return this.projectService.query({
  //       limit: limit,
  //       offset: offset
  //     }).$promise;
  //   }.bind(this)
  // );

  // Set up workflows for `uiScroll`
  this.workflows = new UiScrollSource(
    'dashboard/workflows',
    1,
    function (limit, offset, extra) {
      var params = this._.merge(this._.cloneDeep(extra) || {}, {
            limit: limit,
            offset: offset
          });

      return this.workflowService.query(params).$promise;
    }.bind(this),
    'objects',
    'total_count'
  );

  this.searchDataSets = this._.debounce(
    this.setDataSetSource,
    settings.debounceSearch
  ).bind(this);

  // Set reloader
  this.dashboardDataSetsReloadService.setReload(function (hardReset) {
    if (hardReset) {
      this.dataSets.resetCache();
    }
    // Reset current list and reload uiScroll
    if (this.dataSetsAdapter) {
      this.dataSetsAdapter.reload();
    }
  }.bind(this));

  // This is a pseudo service just to have consistent naming with
  // `dashboardDataSetsReloadService`.
  this.dashboardAnalysesReloadService = {
    reload: function () {
      if (that.analysesAdapter) {
        that.analysesAdapter.reload();
      }
    }
  };

  // This is a pseudo service just to have consistent naming with
  // `dashboardDataSetsReloadService`.
  this.dashboardWorkflowsReloadService = {
    reload: function () {
      if (that.workflowsAdapter) {
        that.workflowsAdapter.reload();
      }
    }
  };

  this.dashboardWidthFixerService.resetter.push(function () {
    this.expandedDataSetPanelBorder = false;
  }.bind(this));

  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams) {
    // We have to wait until the first digestion cycle has finished to make sure
    // that all listeners etc. are set up correctly.
    // `$timeout(function () {}, 0);` is equals one digestion cycle.
    $timeout(function () {
      $window.sizing();
      if (toParams.q) {
        this.searchQueryDataSets = toParams.q;
        this.setDataSetSource(toParams.q, true);
      }
      // Need to implement a method for finding a dataset by uuid first. The
      // reason why is that we need to link to the specific dataset object
      // which originates form the ui-scroll resource service.
      // if (toState.name === 'launchPad.preview') {
      //   // Need to wait another digestion cycle to ensure the layout is set
      //   // properly.
      //   $timeout(function () {
      //     this.expandDataSetPreview(this.findDataSet(toParams.uuid), true);
      //   }.bind(this), 0);
      // }
      if (toState.name === 'launchPad') {
        if (this.expandDataSetPanel) {
          $timeout(function () {
            this.collapseDataSetPreview();
            this.collapseDatasetExploration();
          }.bind(this), 0);
        }
      }
      if (toState.name === 'launchPad.exploration') {
        if (toParams.context) {
          this.treemapRoot = {
            branchId: toParams.branchId ? toParams.branchId : 0,
            ontId: toParams.context,
            visibleDepth: toParams.visibleDepth
          };
        }
        // Need to wait another digestion cycle to ensure the layout is set
        // properly.
        this.$timeout(function () {
          this.expandDatasetExploration(true);
        }.bind(this), 0);
      }
    }.bind(this), 0);
  }.bind(this));

  this.analysesSorting = settings.dashboard.analysesSorting;
  this.dataSetsSorting = settings.dashboard.dataSetsSorting;
  this.workflowsSorting = settings.dashboard.workflowsSorting;

  pubSub.on('resize', function () {
    this.dataSetsAdapter.reload();
    this.analysesAdapter.reload();
    this.workflowsAdapter.reload();
  }.bind(this));

  this.treemapContext.on('root', function (root) {
    this.$state.transitionTo(
      this.$state.current,
      {
        context: root ? root.ontId : null,
        branchId: root ? root.branchId : null
      },
      {
        inherit: true,
        notify: false
      }
    );
  }.bind(this));

  this.queryTerms = {};
  this.queryRelatedDataSets = {};

  this.treemapContext.on('dataSets', function (response) {
    this.$q.when(response).then(function (dataSets) {
      this.selectDataSets(dataSets);
    }.bind(this));
  }.bind(this));

  this.$rootScope.$on('dashboardVisNodeEnter', function (event, data) {
    this.dataSet.highlight(data.dataSetIds, false, 'hover');
    this.$rootScope.$digest();
  }.bind(this));

  this.$rootScope.$on('dashboardVisNodeLeave', function (event, data) {
    this.dataSet.highlight(data.dataSetIds, true, 'hover');
    this.$rootScope.$digest();
  }.bind(this));

  this.$rootScope.$on('dashboardVisNodeLock', function (event, data) {
    this.dataSet.highlight(data.dataSetIds, false, 'lock');
    this.$rootScope.$digest();
  }.bind(this));

  this.$rootScope.$on('dashboardVisNodeUnlock', function (event, data) {
    this.dataSet.highlight(data.dataSetIds, true, 'lock');
    this.$rootScope.$digest();
  }.bind(this));

  this.$rootScope.$on('dashboardVisNodeLockChange', function (event, data) {
    this.dataSet.highlight(data.unlock.dataSetIds, true, 'lock');
    this.dataSet.highlight(data.lock.dataSetIds, false, 'lock');
    this.$rootScope.$digest();
  }.bind(this));

  this.$rootScope.$on('dashboardVisNodeToggleQuery', function (event, data) {
    var uri;

    for (var i = data.terms.length; i--;) {
      uri = this.getOriginalUri(data.terms[i]);

      if (data.terms[i].query) {
        // 1. Update query terms
        if (!this.queryTerms[uri]) {
          this.queryTerms[uri] = {};
          this.queryTerms[uri].uri = uri;
          this.queryTerms[uri].dataSetIds = data.terms[i].dataSetIds;
        }
        this.queryTerms[uri].mode = data.terms[i].mode;
      } else {
        if (this.queryTerms[uri]) {
          this.queryTerms[uri] = undefined;
          delete this.queryTerms[uri];
        }
      }
    }

    // Update data set selection
    if (this.numQueryTerms) {
      this.collectDataSetIds().then(function (dsIds) {
        this.selectDataSets(dsIds);
      }.bind(this));
    } else {
      this.deselectDataSets();
    }
  }.bind(this));

  this.$rootScope.$on('dashboardVisNodeQuery', function (event, data) {
    var uri = this.getOriginalUri(data);

    // 1. Update query terms
    if (!this.queryTerms[uri]) {
      this.queryTerms[uri] = {};
      this.queryTerms[uri].uri = uri;
      this.queryTerms[uri].dataSetIds = data.dataSetIds;
    }
    this.queryTerms[uri].mode = data.mode;

    // Update data set selection
    this.collectDataSetIds().then(function (dsIds) {
      this.selectDataSets(dsIds);
    }.bind(this));
  }.bind(this));

  this.$rootScope.$on('dashboardVisNodeUnquery', function (event, data) {
    var uri = this.getOriginalUri(data);

    this.queryTerms[uri] = undefined;
    delete this.queryTerms[uri];

    if (this.numQueryTerms) {
      this.collectDataSetIds().then(function (dsIds) {
        this.selectDataSets(dsIds);
      }.bind(this));
    } else {
      this.deselectDataSets();
    }
  }.bind(this));

  this.$rootScope.$on('dashboardVisVisibleDepth', function (event, data) {
    this.$state.transitionTo(
      this.$state.current,
      {
        visibleDepth: data.visibleDepth || null
      },
      {
        inherit: true,
        notify: false
      }
    );
  }.bind(this));
}

DashboardCtrl.prototype.collectDataSetIds = function () {
  var deferred = this.$q.defer();
  var queryTermUris = Object.keys(this.queryTerms);
  var andOrNotTerms = this.collectAndOrNotTerms(queryTermUris);
  var dataSets = {};

  // Collection exclusions of all _NOTs_
  var notUnion = [];
  for (i = andOrNotTerms.notTerms.length; i--;) {
    notUnion = this._.union(
      notUnion,
      Object.keys(andOrNotTerms.notTerms[i].dataSetIds)
    );
  }

  // Collection intersection of all _ANDs_
  var andIntersection = [];
  for (i = andOrNotTerms.andTerms.length; i--;) {
    if (i === andOrNotTerms.andTerms.length - 1) {
      andIntersection = Object.keys(andOrNotTerms.andTerms[i].dataSetIds);
    } else {
      andIntersection = this._.intersection(
        andIntersection,
        Object.keys(andOrNotTerms.andTerms[i].dataSetIds)
      );
    }
  }

  // Collection union of all _ORs_
  var orUnion = [];
  for (i = andOrNotTerms.orTerms.length; i--;) {
    orUnion = this._.union(
      orUnion,
      Object.keys(andOrNotTerms.orTerms[i].dataSetIds)
    );
  }
  // Final intersection of intersection of _ANDs_ with union of all _ORs_
  var allDsIds = orUnion;
  if (andIntersection.length && !orUnion.length) {
    allDsIds = andIntersection;
  }
  if (andIntersection.length && orUnion.length) {
    allDsIds = this._.intersection(allDsIds, andIntersection);
  }

  // In case only **nots** are available
  if (!andIntersection.length && !orUnion.length) {
    allDsIds = this.dataSet.allIds;
  } else {
    allDsIds = this.$q.when(allDsIds);
  }

  allDsIds.then(function (allIds) {
    if (allIds.length && this._.isFinite(allIds[0])) {
      allIds = this._.map(allIds, function (el) {
        return el.toString();
      });
    }
    if (notUnion.length) {
      deferred.resolve(this._.difference(allIds, notUnion));
    } else {
      deferred.resolve(allDsIds);
    }
  }.bind(this));

  return deferred.promise;
};

DashboardCtrl.prototype.collectAndOrNotTerms = function (termUris) {
  var andTerms = [], orTerms = [], notTerms = [];

  for (var i = termUris.length; i--;) {
    if (this.queryTerms[termUris[i]].mode === 'and') {
      andTerms.push(this.queryTerms[termUris[i]]);
    } else if (this.queryTerms[termUris[i]].mode === 'or') {
      orTerms.push(this.queryTerms[termUris[i]]);
    } else {
      notTerms.push(this.queryTerms[termUris[i]]);
    }
  }

  return {
    andTerms: andTerms,
    orTerms: orTerms,
    notTerms: notTerms,
  };
};

DashboardCtrl.prototype.getOriginalUri = function (eventData) {
  return eventData.clone ? eventData.clonedFromUri : eventData.nodeUri;
};

/*
 * -----------------------------------------------------------------------------
 * Define prototype
 * -----------------------------------------------------------------------------
 */
Object.defineProperty(
  DashboardCtrl.prototype,
  'visibleDataSets', {
    enumerable: true,
    get: function () {
      return this.dataSetsAdapter.visibleItems('uuid');
    }
});

Object.defineProperty(
  DashboardCtrl.prototype,
  'expandDataSetPanel', {
    enumerable: true,
    value: false,
    writable: true
});

Object.defineProperty(
  DashboardCtrl.prototype,
  'numQueryTerms', {
    enumerable: true,
    get: function () {
      return Object.keys(this.queryTerms).length;
    }
});

Object.defineProperty(
  DashboardCtrl.prototype,
  'analysesIsFilterable', {
    enumerable: true,
    get: function () {
      if (!this._analysesIsFilterable && this.analyses.totalReadable) {
        this._analysesIsFilterable = true;
      }
      return this._analysesIsFilterable;
    }
});

Object.defineProperty(
  DashboardCtrl.prototype,
  'dataSetsFilterOwner', {
    enumerable: true,
    get: function () {
      return this._dataSetsFilterOwner;
    },
    set: function (value) {
      this._dataSetsFilterOwner = value;
      if (value) {
        this.dataSet.filter({
          'is_owner': 'True'
        });
      } else {
        this.dataSet.all();
      }
      this.dataSets.newOrCachedCache(undefined, true);
      this.dashboardDataSetsReloadService.reload();
      this.checkDataSetsFilter();
      this.checkAllCurrentDataSetsInDataCart();
    }
});

Object.defineProperty(
  DashboardCtrl.prototype,
  'dataSetsFilterPublic', {
    enumerable: true,
    get: function () {
      return this._dataSetsFilterPublic;
    },
    set: function (value) {
      this._dataSetsFilterPublic = value;
      if (value) {
        this.dataSet.filter({
          'public': 'True'
        });
      } else {
        this.dataSet.all();
      }
      this.dataSets.newOrCachedCache(undefined, true);
      this.dashboardDataSetsReloadService.reload();
      this.checkDataSetsFilter();
      this.checkAllCurrentDataSetsInDataCart();
    }
});

Object.defineProperty(
  DashboardCtrl.prototype,
  'dataSetsSortBy', {
    enumerable: true,
    get: function () {
      return this._dataSetsSortBy;
    },
    set: function (value) {
      this._dataSetsSortBy = value;
      this.dataSetsSortOrder = 0;
      this.dataSetsSortDesc = false;

      this.triggerSorting('dataSets');
      this.checkDataSetsSort();
    }
});

Object.defineProperty(
  DashboardCtrl.prototype,
  'analysesFilterStatus', {
    enumerable: true,
    get: function () {
      return this._analysesFilterStatus;
    },
    set: function (value) {
      this.analysesFilterStatusCounter = 0;
      this._analysesFilterStatus = value;
      if (value) {
        this.analyses.extraParameters['status'] = value;
      } else {
        delete this.analyses.extraParameters['status'];
      }
      this.analyses.newOrCachedCache(undefined, true);
      this.dashboardAnalysesReloadService.reload();
      this.checkAnalysesFilterSort();
    }
});

Object.defineProperty(
  DashboardCtrl.prototype,
  'analysesSortBy', {
    enumerable: true,
    get: function () {
      return this._analysesSortBy;
    },
    set: function (value) {
      this._analysesSortBy = value;
      this.analysesSortOrder = 0;
      this.analysesSortDesc = false;

      this.triggerSorting('analyses');
      this.checkAnalysesFilterSort();
    }
});

Object.defineProperty(
  DashboardCtrl.prototype,
  'explorationEnabled', {
    enumerable: true,
    get: function () {
      return this.settings.djangoApp.numOntologiesImported > 0;
    }
});

Object.defineProperty(
  DashboardCtrl.prototype,
  'workflowsSortBy', {
    enumerable: true,
    get: function () {
      return this._workflowsSortBy;
    },
    set: function (value) {
      this._workflowsSortBy = value;
      this.workflowsSortOrder = 0;
      this.workflowsSortDesc = false;

      this.triggerSorting('workflows');
      this.checkWorkflowsFilterSort();
    }
});

Object.defineProperty(
  DashboardCtrl.prototype,
  'treemapRoot', {
    enumerable: true,
    get: function () {
      return this.treemapContext.get('root');
    },
    set: function (value) {
      this.treemapContext.set('root', value);
    }
});

DashboardCtrl.prototype.toogleRadio = function () {
  if (this['analysesFilterStatusCounter']++) {
    this['analysesFilterStatus'] = undefined;
  }
};

DashboardCtrl.prototype.checkAnalysesFilterSort = function () {
  if (this.analysesFilterStatus) {
    this.analysesFilterSort = true;
    return;
  }
  if (this.analysesSortBy) {
    this.analysesFilterSort = true;
    return;
  }
  this.analysesFilterSort = false;
};

DashboardCtrl.prototype.checkDataSetsFilter = function () {
  if (this.dataSetsFilterOwner) {
    this.dataSetsFilter = true;
    return;
  }
  if (this.dataSetsFilterPublic) {
    this.dataSetsFilter = true;
    return;
  }
  this.dataSetsFilter = false;
};

DashboardCtrl.prototype.checkDataSetsSort = function () {

  if (this.dataSetsSortBy) {
    this.dataSetsSort = true;
    return;
  }
  this.dataSetsSort = false;
};

DashboardCtrl.prototype.checkWorkflowsFilterSort = function () {
  if (this.workflowsSortBy) {
    this.workflowsFilterSort = true;
    return;
  }
  this.workflowsFilterSort = false;
};

DashboardCtrl.prototype.triggerSorting = function (source) {
  var sortBy = source + 'SortBy',
      sortDesc = source + 'SortDesc',
      reloadService = 'dashboard' + source.charAt(0).toUpperCase() + source.slice(1) + 'ReloadService';

  if (this[sortBy]) {
    var params = this[sortDesc] ? '-' + this[sortBy] : this[sortBy];
    // Todo: Unify data sources. Currently datasets are handled nicely and
    // more generic than others e.g. analyses and workflows.
    if (source === 'dataSets') {
      this.dataSet.order(params);
    } else {
      this[source].extraParameters['order_by'] = params;
    }
  } else {
    if (source === 'dataSets') {
      this.dataSet.all();
    } else {
      delete this[source].extraParameters['order_by'];
    }
  }

  this[source].newOrCachedCache(undefined, true);
  this[reloadService].reload();
};

DashboardCtrl.prototype.toggleSortOrder = function (source) {
  var sortBy = source + 'SortBy',
      sortDesc = source + 'SortDesc',
      sortOrder = source + 'SortOrder';

  this[sortOrder] = (this[sortOrder] + 1) % 3;

  if (this[sortOrder] === 0) {
    this[sortBy] = undefined;
  }

  if (this[sortOrder] === 2) {
    this[sortDesc] = true;
    this.triggerSorting(source);
  }
};

DashboardCtrl.prototype.getDataSetOptions = function () {
  this.dataSets
    .get(1, 1, function () {})
    .then(function (data) {
      this.dataSetOptions = Object.keys(data[0]);
    }.bind(this));
};

DashboardCtrl.prototype.resetDataSetSearch = function () {
  this.searchQueryDataSets = '';
  this.setDataSetSource();
};

DashboardCtrl.prototype.setDataSetSource = function (
  searchQuery,
  fromStateEvent
) {
  this.showFilterSort = false;

  if (!fromStateEvent) {
    var stateChange = this.$state.go(
      '.',
      {
        q: searchQuery ? searchQuery : null
      }
    );

    stateChange.then(function () {
      // ! HACK !
      // Currently state changes do not trigger a controller reload, hence no
      // `$stateChangeSuccess` is triggered. Without triggering this event the
      // root controller doesn't recognize any changes of the query parameter.
      // If we inform the root controller and trigger the event the template
      // will be refreshed, which causes an ugly usability bug in which the
      // search input is deselected for a short moment and preventing from
      // typing further...
      this.$rootScope.$emit('$reloadlessStateChangeSuccess', this.$state.current);
    }.bind(this));
  }

  if (searchQuery) {
    if (searchQuery.length > 1) {
      if (this.numQueryTerms && !this.oldTotalDs) {
        this.oldTotalDs = this.dataSets.totalReadable;
      }

      this.searchDataSet = true;
      var annotations = this.dataSet.search(searchQuery).getCurrentAnnotations();
      this.dataSets.newOrCachedCache(searchQuery);
      // Sometimes the `ui-scroll` didn't stop showing the loading spinner. It
      // seems like we need to wait for one digestion cycle before reloading the
      // directive.
      this.$timeout(function() {
        this.dashboardDataSetsReloadService.reload();
      }.bind(this), 0);

      this.dashboardVisData.updateGraph(annotations);
    }
  } else {
    this.oldTotalDs = undefined;

    this.dataSet.all();

    var browseState = this.dataSet.getCurrentBrowseState();

    if (
      browseState &&
      browseState.type === 'select' &&
      this._.isString(browseState.query)
    ) {
      browseState = 'selection.' + browseState.query;
    }

    this.dataSets.newOrCachedCache(browseState);
    this.searchDataSet = false;
    this.dashboardDataSetsReloadService.reload();

    this.dataSet.allIds.then(function (allDsIds) {
      this.$rootScope.$emit('dashboardVisSearch', {
        dsIds: allDsIds,
        source: 'dashboard'
      });
    }.bind(this));
  }
  this.checkAllCurrentDataSetsInDataCart();
};

DashboardCtrl.prototype.expandDataSetPreview = function (
  dataSet, fromStateEvent
) {
  if (this.dataSetExploration) {
    this.dataSetExplorationTempHidden = true;
    this.pubSub.trigger('vis.tempHide');
  } else {
    if (!fromStateEvent) {
      this.$state.transitionTo(
        'launchPad.preview',
        {
          uuid: dataSet.uuid
        },
        {
          inherit: true,
          notify: false
        }
      );
    }
  }

  if (!this.dashboardDataSetPreviewService.previewing) {
    if (!this.expandDataSetPanel) {
      this.expandDataSetPanel = true;
      this.expandedDataSetPanelBorder = true;
      this.dashboardWidthFixerService.trigger('fixer');
      this.dashboardExpandablePanelService.trigger('expander');
    }
    this.dashboardDataSetPreviewService.preview(dataSet);
    this.dataSetPreview = true;
  } else {
    if (dataSet.preview) {
      this.collapseDataSetPreview(dataSet);
    } else {
      this.dashboardDataSetPreviewService.preview(dataSet);
    }
  }
};

DashboardCtrl.prototype.collapseDataSetPreview = function (dataSet) {
  if (this.dataSetExploration) {
    this.dataSetExplorationTempHidden = false;
    this.pubSub.trigger('vis.show');
  } else {
    this.$state.transitionTo(
      'launchPad',
      {},
      {
        inherit: true,
        notify: false
      }
    );

    this.expandDataSetPanel = false;
    this.dashboardExpandablePanelService.trigger('collapser');
  }

  this.dataSetPreview = false;
  this.dashboardDataSetPreviewService.close();
};

DashboardCtrl.prototype.toggleDataSetsExploration = function () {
  this.dataSetPreview = false;
  this.dashboardDataSetPreviewService.close();

  if (this.dataSetExploration && this.expandDataSetPanel) {
    this.collapseDatasetExploration();
  } else {
    this.expandDatasetExploration();
  }
};

DashboardCtrl.prototype.expandDatasetExploration = function (fromStateEvent) {
  if (!fromStateEvent) {
    this.$state.transitionTo(
      'launchPad.exploration',
      {},
      {
        inherit: true,
        notify: false
      }
    );
  }

  this.dataSetExploration = true;

  if (!this.expandDataSetPanel) {
    this.expandDataSetPanel = true;
    this.expandedDataSetPanelBorder = true;
    this.dashboardWidthFixerService.trigger('fixer');
    this.dashboardExpandablePanelService.trigger('expander');
  } else {
    this.$timeout(function () {
      this.pubSub.trigger('vis.show');
    }.bind(this), 0);
  }
};

DashboardCtrl.prototype.collapseDatasetExploration = function () {
  this.$state.transitionTo(
    'launchPad',
    {},
    {
      inherit: true,
      notify: false
    }
  );

  this.dataSetExploration = false;
  this.expandDataSetPanel = false;
  this.deselectDataSets();
  this.dashboardExpandablePanelService.trigger('collapser');

  this.dataSet.highlight(this.treemapContext.get('highlightedDataSets'), true);
};

DashboardCtrl.prototype.findDataSet = function (uuid) {
  // Need to implement a method that can find an item in a ui-scroll resource.
};

DashboardCtrl.prototype.selectDataSets = function (ids) {
  var queryTermUris = Object.keys(this.queryTerms);
  var query = this.treemapRoot.ontId;

  if (queryTermUris && queryTermUris.length) {
    query = '';
    for (var i = queryTermUris.length; i--;) {
      query += (
        queryTermUris[i] +
        '.' +
        this.queryTerms[queryTermUris[i]].mode +
        '+'
      );
    }
    // Remove last `+`
    query = query.slice(0, -1);
  }

  this.dataSet.select(ids, query);
  this.dataSets.newOrCachedCache(
    'selection.' + query
  );
  this.$timeout(function() {
    this.dashboardDataSetsReloadService.reload();
  }.bind(this), 0);

  this.$rootScope.$emit('dashboardDsSelected', {
    ids: ids
  });
  this.checkAllCurrentDataSetsInDataCart();
};

DashboardCtrl.prototype.deselectDataSets = function () {
  this.dataSet.deselect();
  this.dataSets.newOrCachedCache();
  this.$timeout(function() {
    this.dashboardDataSetsReloadService.reload();
  }.bind(this), 0);

  this.checkAllCurrentDataSetsInDataCart();
  this.$rootScope.$emit('dashboardDsDeselected');
};

DashboardCtrl.prototype.dataSetMouseEnter = function (dataSet) {
  this.$rootScope.$emit('dashboardVisNodeFocus', {
    terms: dataSet.annotations,
    source: 'resultsList'
  });
  if (this.listGraphHideUnrelatedNodes !== dataSet.id) {
    this.listGraphHideUnrelatedNodes = undefined;
  }
};

DashboardCtrl.prototype.dataSetMouseLeave = function (dataSet) {
  this.$rootScope.$emit('dashboardVisNodeBlur', {
    terms: dataSet.annotations,
    source: 'resultsList'
  });
  this.listGraphHideUnrelatedNodes = undefined;
  this.listGraphZoomedOut = false;
};

DashboardCtrl.prototype.readibleDate = function (dataSet, property) {
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec'];

  if (dataSet[property] && !dataSet[property + 'Readible']) {
    dataSet[property + 'Readible'] =
      months[dataSet[property].getMonth()] + ' ' +
      dataSet[property].getDate() + ', ' +
      dataSet[property].getFullYear();
  }

  return dataSet[property + 'Readible'];
};

DashboardCtrl.prototype.toggleDataCart = function (forceClose) {
  if (this.dataCart.length || forceClose) {
    if (this.showDataCart || forceClose) {
      this.dataSetsPanelHeight = 1;
      this.dataCartPanelHeight = 0;
    } else {
      this.dataSetsPanelHeight = 0.75;
      this.dataCartPanelHeight = 0.25;
    }

    this.showDataCart = forceClose ? false : !!!this.showDataCart;

    this.pubSub.trigger('refineryPanelUpdateHeight', {
      ids: {
        dataCart: true,
        dataSets: true
      }
    });

    this.$timeout(function () {
      // Reload dataSet infinite scroll adapter
      if (this.dataSetsAdapter) {
        this.dataSetsAdapter.reload();
      }
    }.bind(this), 250);
  }
};

// This is a hack as Angular doesn't like two-way data binding for primitives
DashboardCtrl.prototype.getDataSetsPanelHeight = function () {
  return this.dataSetsPanelHeight;
};

// This is a hack as Angular doesn't like two-way data binding for primitives
DashboardCtrl.prototype.getDataCartPanelHeight = function () {
  return this.dataCartPanelHeight;
};

DashboardCtrl.prototype.addToDataCart = function (dataSet) {
  this.dataCart.add(dataSet);
  this.checkAllCurrentDataSetsInDataCart();
};

DashboardCtrl.prototype.removeFromDataCart = function (dataSet) {
  this.dataCart.remove(dataSet);
  this.checkAllCurrentDataSetsInDataCart();
};

DashboardCtrl.prototype.addAllCurrentToDataCart = function () {
  this.dataSet.allIds.then(function (allIds) {
    var promisedDataSets = [];
    for (var i = allIds.length; i--;) {
      promisedDataSets.push(this.dataSet.get(allIds[i]));
    }
    this.$q.all(promisedDataSets).then(function (dataSets) {
      this.dataCart.add(dataSets);
      this.allCurrentDataSetsInDataCart = 2;
    }.bind(this));
  }.bind(this));
};

DashboardCtrl.prototype.removeAllCurrentToDataCart = function () {
  this.dataSet.allIds.then(function (allIds) {
    this.dataCart.remove(allIds, true);
    this.allCurrentDataSetsInDataCart = 0;
  }.bind(this));
};

DashboardCtrl.prototype.checkAllCurrentDataSetsInDataCart = function () {
  this.dataSet.allIds.then(function (allIds) {
    this.allCurrentDataSetsInDataCart = this.dataCart.added(allIds);
  }.bind(this));
};

DashboardCtrl.prototype.clearDataCart = function () {
  this.dataCart.clear();
  this.allCurrentDataSetsInDataCart = 0;
  this.toggleDataCart(true);
};

DashboardCtrl.prototype.showNotification = function () {
  return (
    this.dataSets.error ||
    this.dataSets.total === 0 ||
    this.searchQueryDataSets.length === 1 || (
      this.searchQueryDataSets.length > 1 && this.dataSets.total === 0
    )
  );
};

DashboardCtrl.prototype.toggleListGraphZoom = function (dataSet) {
  if (this.listGraphZoomedOut) {
    this.$rootScope.$emit('dashboardVisNodeFocus', {
      terms: dataSet.annotations,
      source: 'resultsList',
      hideUnrelatedNodes: this.listGraphHideUnrelatedNodes === dataSet.id
    });
  } else {
    this.$rootScope.$emit('dashboardVisNodeFocus', {
      terms: dataSet.annotations,
      zoomOut: true,
      source: 'resultsList',
      hideUnrelatedNodes: this.listGraphHideUnrelatedNodes === dataSet.id
    });
  }
  this.listGraphZoomedOut = !!!this.listGraphZoomedOut;
};

DashboardCtrl.prototype.toggleListUnrelatedNodes = function (dataSet) {
  if (this.listGraphHideUnrelatedNodes === dataSet.id) {
    this.$rootScope.$emit('dashboardVisNodeFocus', {
      terms: dataSet.annotations,
      source: 'resultsList',
      zoomOut: this.listGraphZoomedOut
    });
    this.listGraphHideUnrelatedNodes = undefined;
  } else {
    this.$rootScope.$emit('dashboardVisNodeFocus', {
      terms: dataSet.annotations,
      source: 'resultsList',
      zoomOut: this.listGraphZoomedOut,
      hideUnrelatedNodes: true
    });
    this.listGraphHideUnrelatedNodes = dataSet.id;
  }
};

angular
  .module('refineryDashboard')
  .controller('DashboardCtrl', [
    '$q',
    '$state',
    '$stateParams',
    '$timeout',
    '$rootScope',
    '$window',
    '_',
    'pubSub',
    'settings',
    'dataSet',
    'authService',
    'projectService',
    'analysisService',
    'workflowService',
    'UiScrollSource',
    'dashboardDataSetListService',
    'dashboardDataSetSearchService',
    'dashboardDataSetsReloadService',
    'dashboardWidthFixerService',
    'dashboardExpandablePanelService',
    'dashboardDataSetPreviewService',
    'treemapContext',
    'dashboardVisData',
    'dataCart',
    DashboardCtrl
  ]);
