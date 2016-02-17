describe('Controller: AnalysisMonitorCtrl', function(){

  var ctrl,
      scope,
      factory,
      valid_uuid = 'x508x83x-x9xx-4740-x9x7-x7x0x631280x',
      invalid_uuid = 'xxxxx';

  beforeEach(module('refineryApp'));
  beforeEach(module('refineryAnalysisMonitor'));
  beforeEach(inject(function($rootScope, _$controller_, _analysisMonitorFactory_) {
    scope = $rootScope.$new();
    $controller = _$controller_;
    ctrl = $controller('AnalysisMonitorCtrl', {$scope: scope});
    factory = _analysisMonitorFactory_;
  }));

  it('AnalysisMonitorCtrl ctrl should exist', function() {
    expect(ctrl).toBeDefined();
  });

  describe('Canceling Analyses', function(){
    var mockCancelFlag = false;

    beforeEach(inject(function() {

      spyOn(factory, "postCancelAnalysis").and.callFake(function() {
        return {
          then: function () {
            mockCancelFlag = true;
          }
        };
      });

      ctrl.analysesDetail[valid_uuid] = {
          "refineryImport": [{status: "PROGRESS", percent_done: 30}],
          "galaxyImport": [{status: "", percent_done: ""}],
          "galaxyAnalysis": [{status: "", percent_done:""}],
          "galaxyExport": [{status: "", percent_done: ""}],
          "overrall": "RUNNING"
        };
     }));

    it("cancelAnalysis and setCancelAnalysisFlag are methods", function(){
      expect(angular.isFunction(ctrl.cancelAnalysis)).toBe(true);
      expect(angular.isFunction(ctrl.setCancelAnalysisFlag)).toBe(true);
    });

    it("cancelAnalysis, check postCancelAnalysis is called", function(){
      expect(mockCancelFlag).toEqual(false);
      ctrl.cancelAnalysis(valid_uuid);
      expect(mockCancelFlag).toEqual(true);
    });

    it("setCancelAnalysisFlag", function(){
      response = ctrl.setCancelAnalysisFlag(true, invalid_uuid);
      expect(ctrl.initializedFlag[invalid_uuid]).toEqual(true);

      response = ctrl.setCancelAnalysisFlag(false, valid_uuid);
      expect(ctrl.analysesDetail[valid_uuid].cancelingAnalyses).toEqual(false);

      response = ctrl.setCancelAnalysisFlag(true, valid_uuid);
      expect(ctrl.analysesDetail[valid_uuid].cancelingAnalyses).toEqual(true);

    });
  });

  describe('HTML helper functions', function(){
    beforeEach(inject(function($rootScope, $controller){
      scope = $rootScope.$new();

      ctrl.analysesDetail[valid_uuid]={
            "refineryImport": [{status: "PROGRESS", percent_done: 30}],
            "galaxyImport": [{status: "", percent_done: ""}],
            "galaxyAnalysis": [{status: "", percent_done:""}],
            "galaxyExport": [{status: "", percent_done: ""}],
            "overrall": "RUNNING"
          };
    }));

    it("setAnalysesLoadingFlag method", function(){
      expect(angular.isFunction(ctrl.setAnalysesLoadingFlag)).toBe(true);
    });

    it("setAnalysesLoadingFlag responds correctly", function(){
      //Default of analysesList should be 0.
      ctrl.setAnalysesLoadingFlag();
      expect(ctrl.analysesLoadingFlag).toEqual("EMPTY");

      ctrl.analysesList = [{},{},{}];
      ctrl.setAnalysesLoadingFlag();
      expect(ctrl.analysesLoadingFlag).toEqual("DONE");
    });

    it("setAnalysesGlobalLoadingFlag method", function(){
      expect(angular.isFunction(ctrl.setAnalysesGlobalLoadingFlag)).toBe(true);
    });

    it("setAnalysesGlobalLoadingFlag responds correctly", function(){
      //Default of analysesList should be 0.
      ctrl.setAnalysesGlobalLoadingFlag();
      expect(ctrl.analysesGlobalLoadingFlag).toEqual("EMPTY");

      ctrl.analysesGlobalList = [{},{},{}];
      ctrl.setAnalysesGlobalLoadingFlag();
      expect(ctrl.analysesGlobalLoadingFlag).toEqual("DONE");
    });

    it("isAnalysesRunning method", function(){
      expect(angular.isFunction(ctrl.isAnalysesRunning)).toBe(true);
    });

    it("isAnalysesRunning responds correctly", function(){
      ctrl.analysesRunningList = undefined;
      var response_invalid = ctrl.isAnalysesRunning();
      expect(response_invalid).toEqual(false);

      ctrl.analysesRunningList = [{},{},{}];
      var response_valid = ctrl.isAnalysesRunning();
      expect(response_valid).toEqual(true);
    });

    it("isAnalysesRunningGlobal method", function(){
       expect(angular.isFunction(ctrl.isAnalysesRunningGlobal)).toBe(true);
    });

    it("isAnalysesRunningGlobal responds correctly", function(){
      ctrl.analysesRunningGlobalList = undefined;
      var response_invalid = ctrl.isAnalysesRunningGlobal();
      expect(response_invalid).toEqual(false);

      ctrl.analysesRunningGlobalList = [{},{},{}];
      var response_valid = ctrl.isAnalysesRunningGlobal();
      expect(response_valid).toEqual(true);
    });

    it("isEmptyAnalysesGlobalList method", function(){
       expect(angular.isFunction(ctrl.isEmptyAnalysesGlobalList)).toBe(true);
    });

    it("isEmptyAnalysesGlobalList responds correctly", function(){
      ctrl.analysesRunningList = undefined;
      var response_invalid = ctrl.isEmptyAnalysesGlobalList();
      expect(response_invalid).toEqual(true);

      ctrl.analysesRunningList = [{},{},{}];
      ctrl.analysesGlobalList = [{},{},{}];
      var response_valid = ctrl.isEmptyAnalysesGlobalList();
      expect(response_valid).toEqual(false);
    });

    it("isAnalysisDetailLoaded method", function(){
       expect(angular.isFunction(ctrl.isAnalysisDetailLoaded)).toBe(true);
    });

    it("isAnalysisDetailLoaded responds correctly", function(){
      var response_valid = ctrl.isAnalysisDetailLoaded(valid_uuid);
      expect(response_valid).toEqual(true);
      var response_invalid = ctrl.isAnalysisDetailLoaded(invalid_uuid);
      expect(response_invalid).toEqual(false);
    });

  });

});
