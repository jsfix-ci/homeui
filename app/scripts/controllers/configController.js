class ConfigCtrl {
    constructor(
        $scope,
        $element,
        $stateParams,
        rolesFactory,
        ConfigEditorProxy,
        whenMqttReady,
        PageState,
        LogsProxy,
        errors,
        LogsService,
    ) {
        "ngInject";

        this.haveRights = rolesFactory.checkRights(rolesFactory.ROLE_THREE);
        if (!this.haveRights) {
            return;
        }

        angular.extend(this, {
            scope: $scope,
            LogsProxy: LogsProxy,
        });


        this.$element = $element;
        this.allowLoading = false;
        this.updatedTimerId = null;

        $scope.logsService = LogsService;

        $scope.file = {
            schemaPath: $stateParams.path,
            configPath: "",
            loaded: false,
            valid: true,
            content: {},
            errors,
        };

        this.createLogsVisibility();

        $scope.editorOptions = {};
        if (!/^\//.test($scope.file.schemaPath))
            $scope.file.schemaPath = "/" + $scope.file.schemaPath;

        $scope.canSave = function () {
            return PageState.isDirty() && $scope.file.valid;
        };

        $scope.onChange = function (content, errors) {
            if (!angular.equals($scope.file.content, content)) {
                PageState.setDirty(true);
                $scope.file.content = content;
            }
            $scope.file.valid = !errors.length;
        };

        var load = () => {
            ConfigEditorProxy.Load({
                path: $scope.file.schemaPath,
            })
                .then((r) => {
                    $scope.editorOptions = r.schema.strictProps
                        ? { no_additional_properties: true }
                        : {};

                    if (r.schema.limited) {
                        angular.extend($scope.editorOptions, {
                            disable_properties: true,
                            disable_edit_json: true,
                        });
                    }

                    $scope.file.configPath = r.configPath;
                    $scope.file.content = r.content;
                    $scope.file.schema = r.schema;
                    $scope.file.loaded = true;

                    this.scope.logsService.waitBootsAndServices = false;
                    this.scope.logsService.selectedBoot = null;
                    this.scope.logsService.selectedService = {
                        name:
                            this.scope.file.schema.configFile.service +
                            ".service",
                    };

                    this.scope.logsService.update();
                })
                .catch(errors.catch("configurations.errors.load"));
        };

        $scope.save = () => {
            this.scope.logsService.savedTime = Date.now();

            if (this.updatedTimerId) {
                clearInterval(this.updatedTimerId);
                this.updatedTimerId = null;
            }

            PageState.setDirty(false);
            ConfigEditorProxy.Save({
                path: $scope.file.schemaPath,
                content: $scope.file.content,
            })
                .then(() => {
                    if ($scope.file.schema.needReload) {
                        load();
                    }

                    $scope.logsService.logs = [];
                    $scope.logsService.isError = false;

                    this.updatedTimerId = setInterval(() => {
                        $scope.logsService.update();
                    }, 1000);
                })
                .catch((e) => {
                    PageState.setDirty(true);
                    errors.showError(
                        {
                            msg: "configuration.errors.save",
                            data: { name: $scope.file.configPath },
                        },
                        e
                    );
                });
        };

        whenMqttReady().then(load);

        $scope.$on("$destroy", () => {
            $scope = null;

            if (this.updatedTimerId) {
                clearInterval(this.updatedTimerId);
                this.updatedTimerId = null;
            }
        });
    }

    createLogsVisibility() {
        if (!window.localStorage.configLogsVisibility) {
            window.localStorage.setItem(
                "configLogsVisibility",
                JSON.stringify({
                    isOpen: false,
                })
            );
        }
    }

    getLogsVisibility() {
        return JSON.parse(window.localStorage.configLogsVisibility);
    }

    invertLogsVisibility() {
        const configLogsVisibility = this.getLogsVisibility();
        configLogsVisibility.isOpen = !configLogsVisibility.isOpen;
        window.localStorage.setItem(
            "configLogsVisibility",
            JSON.stringify(configLogsVisibility)
        );
    }

    getLogsClasses() {
        return {
            "panel-danger": this.scope.logsService.isError,
        };
    }

    getLogsShevronClasses() {
        const isOpen = this.getLogsVisibility().isOpen;
        return {
            "glyphicon-chevron-down": isOpen,
            "glyphicon-chevron-right": !isOpen,
        };
    }
}

//-----------------------------------------------------------------------------
export default angular
    .module('homeuiApp.config', [])
    .controller('ConfigCtrl', ConfigCtrl);
