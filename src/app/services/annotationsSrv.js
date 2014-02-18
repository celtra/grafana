define([
  'angular',
  'underscore',
  'config',
  'moment'
], function (angular, _, config, moment) {
  'use strict';

  var module = angular.module('kibana.services');

  module.service('annotationsSrv', function(dashboard, datasourceSrv, $q, alertSrv) {

    this.init = function() {
      this.annotationList = config.annotationList;
    };

    this.getAnnotations = function(rangeUnparsed) {
      var graphiteAnnotations = _.where(this.annotationList, { type: 'graphite-target', enabled: true });
      var graphiteTargets = _.map(graphiteAnnotations, function(annotation) {
        return { target: annotation.target };
      });

      if (graphiteTargets.length === 0) {
        return $q.when(null);
      }

      var graphiteQuery = {
        range: rangeUnparsed,
        targets: graphiteTargets,
        format: 'json',
        maxDataPoints: 100
      };


      return datasourceSrv.default.events(graphiteQuery)
        .then(function(results) {
          var list = [];
          _.each(results.data, function (event) {
            console.log(event);
            list.push({
              min: event.when * 1000,
              max: event.when * 1000,
              eventType: "annotation",
              title: event.what,
              description: "<small><b>" + event.what + "</b><br/><i>" +
                moment(event.when * 1000).format('YYYY-MM-DD HH:mm:ss') +
                "</i><br/>" + event.data +'</small>',
              score: 1
            });
          });
          return list;
        })
        .then(null, function() {
          alertSrv.set('Annotations','Could not fetch annotations','error');
        });
    };

    // Now init
    this.init();
  });

});