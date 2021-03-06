﻿/// <reference path="../Libs/angular.min.js" />
/// <reference path="../Libs/angular-route.min.js" />

(function (angular) {

    var app = angular.module("ttidAdmScopes", ['ngRoute', 'ttidAdm', 'ttidAdmUI']);
    function config($routeProvider, PathBase) {
        $routeProvider
            .when("/scopes/list/:filter?/:page?", {
                controller: 'ListScopesCtrl',
                resolve: { scopes: "idAdmScopes" },
                templateUrl: PathBase + '/assets/Templates.scopes.list.html'
            })
            .when("/scopes/create", {
                controller: 'NewScopeCtrl',
                resolve: {
                    api: function (idAdmApi) {
                        return idAdmApi.get();
                    }
                },
                templateUrl: PathBase + '/assets/Templates.scopes.new.html'
            })
            .when("/scopes/edit/:subject", {
                controller: 'EditScopeCtrl',
                resolve: { scopes: "idAdmScopes" },
                templateUrl: PathBase + '/assets/Templates.scopes.edit.html'
            });
    }
    config.$inject = ["$routeProvider", "PathBase"];
    app.config(config);

    function ListScopesCtrl($scope, idAdmScopes, idAdmPager, $routeParams, $location) {
        var model = {
            message: null,
            scopes: null,
            pager: null,
            waiting: true,
            filter: $routeParams.filter,
            page: $routeParams.page || 1
        };
        $scope.model = model;

        $scope.search = function (filter) {
            var url = "/scopes/list";
            if (filter) {
                url += "/" + filter;
            }
            $location.url(url);
        };

        var itemsPerPage = 10;
        var startItem = (model.page - 1) * itemsPerPage;

        idAdmScopes.getScopes(model.filter, startItem, itemsPerPage).then(function (result) {
            $scope.model.waiting = false;
   
            $scope.model.scopes = result.data.items;
            if (result.data.items && result.data.items.length) {
                $scope.model.pager = new idAdmPager(result.data, itemsPerPage);
            }
        }, function (error) {
            $scope.model.message = error;
            $scope.model.waiting = false;
        });
    }
    ListScopesCtrl.$inject = ["$scope", "idAdmScopes", "idAdmPager", "$routeParams", "$location"];
    app.controller("ListScopesCtrl", ListScopesCtrl);

    function NewScopeCtrl($scope, idAdmScopes, api, ttFeedback) {
        var feedback = new ttFeedback();
        $scope.feedback = feedback;
        if (!api.links.createScope) {
            feedback.errors = "Create Not Supported";
            return;
        }
        else {
            var properties = api.links.createScope.meta
                .map(function (item) {
                    return {
                        meta: item,
                        data: item.dataType === 5 ? false : undefined
                    };
                });
            $scope.properties = properties;
            $scope.create = function (properties) {
                var props = properties.map(function (item) {
                    return {
                        type: item.meta.type,
                        value: item.data
                    };
                });
                idAdmScopes.createScope(props)
                    .then(function (result) {
                        $scope.last = result;
                        feedback.message = "Create Success";
                    }, feedback.errorHandler);
            };
        }
    }
    NewScopeCtrl.$inject = ["$scope", "idAdmScopes", "api", "ttFeedback"];
    app.controller("NewScopeCtrl", NewScopeCtrl);

    function EditScopeCtrl($scope, idAdmScopes, $routeParams, ttFeedback, $location) {
        var feedback = new ttFeedback();
        $scope.feedback = feedback;

        function loadScope() {
            return idAdmScopes.getScope($routeParams.subject)
                .then(function (result) {
                    $scope.scope = result;
                    if (!result.data.properties) {
                        $scope.tab = 1;
                    }

                }, feedback.errorHandler);
        };
        loadScope();

        $scope.setProperty = function (property) {
            idAdmScopes.setProperty(property)
                .then(function () {
                    if (property.meta.dataType !== 1) {
                        feedback.message = property.meta.name + " Changed to: " + property.data;
                    }
                    else {
                        feedback.message = property.meta.name + " Changed";
                    }
                    loadScope();
                }, feedback.errorHandler);
        };

        $scope.deleteScope = function (scope) {
            idAdmScopes.deleteScope(scope)
                   .then(function () {
                       feedback.message = "Scope Deleted";
                       $scope.scope = null;
                       $location.path('/scopes/list');
                   }, feedback.errorHandler);
        };

        //Claims
        $scope.addScopeClaim = function (scopeClaims, scopeClaim) {
            idAdmScopes.addScopeClaim(scopeClaims, scopeClaim)
                .then(function () {
                    feedback.message = "Scope Claim Added : " + scopeClaim.name + ", " + scopeClaim.description;
                    loadScope().then(function () {
                        $scope.claim = scopeClaim.data;
                    });
                    loadScope();
                }, feedback.errorHandler);
        };
        $scope.removeScopeClaim = function (scopeClaim) {
            idAdmScopes.removeScopeClaim(scopeClaim)
                .then(function () {
                    feedback.message = "Scope Claim Removed : " + scopeClaim.data.name + ", " + scopeClaim.data.description;
                    loadScope().then(function () {
                        $scope.claim = scopeClaim.data;
                    });
                }, feedback.errorHandler);
        };
        
    }
    EditScopeCtrl.$inject = ["$scope", "idAdmScopes", "$routeParams", "ttFeedback", "$location"];
    app.controller("EditScopeCtrl", EditScopeCtrl);

})(angular);
