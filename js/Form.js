(function($) {

    var Alpaca = $.alpaca;

    Alpaca.Form = Base.extend(
    /**
     * @lends Alpaca.Form.prototype
     */
    {
        /**
         * @constructs
         *
         * @class This class is for managing HTML form control.
         *
         * @param {Object} container Field container.
         * @param {Object} options Field options.
         * @param {Object|String} view Field view.
         * @param {Alpaca.Connector} connector Field connector.
         * @param {Function} errorCallback Error callback.
         */
        constructor: function(container, options, view, connector, errorCallback) {
            var _this = this;

            // container
            this.container = container;

            // parent
            this.parent = null;

            this.connector = connector;
            this.errorCallback = errorCallback;

            // options
            this.options = options;

            if (this.options.attributes) {
                this.attributes = this.options.attributes;
            } else {
                this.attributes = {};
            }

            if (this.options.buttons) {
                if (this.options.buttons.submit) {
                    if (!this.options.buttons.submit.type) {
                        this.options.buttons.submit.type = 'submit';
                    }
                    if (!this.options.buttons.submit.name) {
                        this.options.buttons.submit.name = 'submit';
                    }
                    if (!this.options.buttons.submit.value) {
                        this.options.buttons.submit.value = 'Submit';
                    }
                }
                if (this.options.buttons.reset) {
                    if (!this.options.buttons.reset.type) {
                        this.options.buttons.reset.type = 'reset';
                    }
                    if (!this.options.buttons.reset.name) {
                        this.options.buttons.reset.name = 'reset';
                    }
                    if (!this.options.buttons.reset.value) {
                        this.options.buttons.reset.value = 'Reset';
                    }
                }
            }

            if (this.attributes.id) {
                this.id = this.attributes.id;
            } else {
                this.id = Alpaca.generateId();
                this.attributes.id = this.id;
            }

            this.viewType = options.viewType;

            // set a view
            this.view = new Alpaca.View(view, this);
        },

        /**
         * Renders this form into the container.
         *
         * @param {Function} onSuccess onSuccess callback.
         */
        render: function(onSuccess) {
            var _this = this;

            this.template = this.view.getTemplate("form");

            // remove the previous outerEl if it exists
            if (this.outerEl) {
                this.outerEl.remove();
            }

            // load the appropriate template and render it
            this.processRender(this.container, function() {
                // bind our field dom element into the container
                _this.outerEl.appendTo(_this.container);

                // add default class
                _this.outerEl.addClass("alpaca-form");

                // execute callback
                if (onSuccess)
                    onSuccess(_this);
            });
        },

        /**
         * Responsible for fetching any templates needed so as to render the
         * current mode for this field.
         *
         * Once completed, the onSuccess method is called.
         *
         * @param {Object} parentEl Field container.
         * @param {Function} onSuccess onSuccess callback.
         */
        processRender: function(parentEl, onSuccess) {
            var _this = this;

            // lookup the template we should use to render
            var template = this.getTemplate();

            this.connector.loadTemplate(template, function(loadedTemplate) {
                _this._renderLoadedTemplate(parentEl, loadedTemplate, onSuccess);
            }, function(error) {
                alert(error);
            });

            if (onSuccess)
                onSuccess();
        },

        /**
         * Renders the loaded template.
         *
         * @private
         *
         * @param {Object} parentEl Field container.
         * @param {String} templateString Template.
         * @param {Function} onSuccess onSuccess callback.
         */
        _renderLoadedTemplate: function(parentEl, templateString, onSuccess) {
            var context = {
                id: this.getId(),
                options: this.options,
                view: this.view.viewObject
            };
            var renderedDomElement = $.tmpl(templateString, context, {});
            renderedDomElement.appendTo(parentEl);

            this.outerEl = renderedDomElement;

            if (Alpaca.isEmpty(this.outerEl.attr("id"))) {
                this.outerEl.attr("id", this.getId() + "-form-outer");
            }
            if (Alpaca.isEmpty(this.outerEl.attr("alpaca-field-id"))) {
                this.outerEl.attr("alpaca-field-id", this.getId());
            }

            // get container for forms
            if ($('.alpaca-form-fields-container', this.outerEl)) {
                this.formFieldsContainer = $('.alpaca-form-fields-container', this.outerEl);
            } else {
                this.formFieldsContainer = this.outerEl;
            }

            // add all provided attributes
            this.field = $('form', this.container);
            if (this.field) {
                this.field.attr(this.attributes);
            }

            // populate the buttons as well
            this.buttons = {};
            var _this = this;
            $.each($('.alpaca-form-button', this.container),function(k,v) {
                $(v).mousedown(function() {
                    var _this = $(this);
                    _this.attr("button-pushed","true");
                    setTimeout(function() {
                        if (_this.attr("button-pushed") && _this.attr("button-pushed") == "true" ) {
                            _this.click();
                        }
                    }, 150);
                });
                $(v).click(function() {
                    $(this).removeAttr("button-pushed");
                });
                _this.buttons[$(v).attr('data-key')] = $(v);
            })
        },

        /**
         * Retrieve the form container.
         *
         * @returns {Object} Form container.
         */
        getEl: function() {
            return this.outerEl;
        },

        /**
         * Returns the id of the form.
         *
         * @returns {String} Form id
         */
        getId: function() {
            return this.id;
        },

        /**
         * Returns form type.
         *
         * @returns {String} Form type.
         */
        getType: function() {
            return this.type;
        },

        /**
         * Returns this form's parent.
         *
         * @returns {Object} Form parent.
         */
        getParent: function() {
            return this.parent;
        },

        /**
         * Returns the value of the JSON rendered by this form.
         *
         * @returns {Any} Value of the JSON rendered by this form.
         */
        getValue: function() {
            return this.topControl.getValue();
        },

        /**
         * Sets the value of the JSON to be rendered by this form.
         *
         * @param {Any} value Value to be set.
         */
        setValue: function(value) {
            this.topControl.setValue(value);
        },

        /**
         * Initializes events handling (Form Submission) for this form.
         */
        initEvents: function() {
            var _this = this;
            if (this.field) {
                var v = this.getValue();
                $(this.field).submit(v, function(e) {
                    return _this.onSubmit(e);
                });
            }
        },

        /**
         * Handles form submit events.
         *
         * @param {Object} e Submit event.
         */
        onSubmit: function(e) {
            if (this.submitHandler) {
                return this.submitHandler(e);
            }
        },

        /**
         * Registers a custom submit handler.
         *
         * @param {Object} func Submit handler to be registered.
         */
        registerSubmitHandler: function (func) {
            if (Alpaca.isFunction(func)) {
                this.submitHandler = func;
            }
        },

        /**
         * Displays validation information of all fields of this form.
         *
         * @returns {Object} Form validation state.
         */
        renderValidationState: function() {
            this.topControl.renderValidationState();
        },

        /**
         * Disables this form.
         */
        disable: function() {
            this.topControl.disable();
        },

        /**
         * Enables this form.
         */
        enable: function() {
            this.topControl.enable();
        },

        /**
         * Focuses on this form.
         */
        focus: function() {
            this.topControl.focus();
        },

        /**
         * Purge any event listeners and remove the form from the DOM.
         */
        destroy: function() {

            // clean up Alpaca.fieldInstances static reference (used for convenience access to previous rendered fields)
            if (Alpaca && Alpaca.fieldInstances) {
                delete Alpaca.fieldInstances[this.getId()];
                Alpaca.fieldInstances[this.getId()] = null;
            }

            this.topControl.destroy();

            this.getEl().remove();
        },

        /**
         * Shows the form.
         */
        show: function() {
            this.getEl().css({
                "display": ""
            });
        },

        /**
         * Hides the form.
         */
        hide: function() {
            this.getEl().css({
                "display": "none"
            });
        },

        /**
         * Clears the form and resets values of its fields.
         *
         * @param stopUpdateTrigger If false, triggers the update event of this event.
         */
        clear: function(stopUpdateTrigger) {
            this.topControl.clear(stopUpdateTrigger);
        },

        /**
         * Checks if form is empty.
         *
         * @returns {Boolean} True if the form is empty, false otherwise.
         */
        isEmpty: function() {
            return this.topControl.isEmpty();
        },

        /**
         * Returns the form template.
         *
         * @returns {Object|String} template Form template.
         */
        getTemplate: function() {
            return this.template;
        },

        /**
         * Sets the form template.
         *
         * @param {String} template Template to be set
         */
        setTemplate: function(template) {
            // if template is a function, evaluate it to get a string
            if (Alpaca.isFunction(template)) {
                template = template();
            }
            // trim for good measure
            template = $.trim(template);

            this.template = template;
        }
    });

})(jQuery);
