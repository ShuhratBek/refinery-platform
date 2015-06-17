angular
  .module('refineryApp')
  .factory('dataSetsService', ['$resource', 'settings',
    function ($resource, settings) {

      var dataSets = $resource(
        settings.appRoot + settings.refineryApi + '/data_sets/',
        {
          format: 'json'
        },
        {
          query: {
            method: 'GET',
            isArray: false,
          }
        }
      );

      return dataSets;
    }
  ]);
