"use strict";

angular.module("homeuiApp")
  .directive("cell", function (DeviceData) {
    class CellController {
      constructor ($scope, $element, $attrs) {
        this.cell = $scope.cell = DeviceData.proxy($attrs.cell);
      }
    }

    return {
      restrict: "A",
      scope: true,
      priority: 1, // take precedence over ng-model
      controller: CellController
    };
  });