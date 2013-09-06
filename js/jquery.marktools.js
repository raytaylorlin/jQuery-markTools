/**
 * MarkTools - jQuery plugin
 * @author Ray Taylor Lin
 */

(function($) {
    var ToolButton = (function() {
        var ToolButton = function(attr) {
            var $btn,
                _this = this;
            attr = attr || {};

            this.attr = attr;
            this.type = attr.type;
            this.isPressed = false;
            this.container = null;

            this.$dom = divWithClass(attr.classRest);
            this.$dom.addClass('btn-marktools');
            this.$dom.click(function() {
                _this.toggle();
            });
        }

        /**
         * 切换按钮状态
         */
        ToolButton.prototype.toggle = function() {
            this.isPressed = !this.isPressed;
            this.isPressed ? this.press() : this.popup();
        };

        /**
         * 按下按钮
         */
        ToolButton.prototype.press = function() {
            this.isPressed = true;
            this.$dom.removeClass(this.attr.classRest);
            this.$dom.addClass(this.attr.classActive);
            //设置按钮组的状态
            this.container.changeType(this.type);
        };

        /**
         * 弹起按钮
         */
        ToolButton.prototype.popup = function() {
            this.isPressed = false;
            this.$dom.removeClass(this.attr.classActive);
            this.$dom.addClass(this.attr.classRest);
            this.container.activeType = 'none';
        }

        return ToolButton;
    })();

    var ToolButtonContainer = (function() {
        var ToolButtonContainer = function() {
            this.activeType = 'none';
            this.buttonList = {};
            //初始化标记工具栏容器
            this.$dom = divWithClass('marktools-container');
        }

        /**
         * 添加按钮
         * @param {ToolButton} button 要添加的按钮
         */
        ToolButtonContainer.prototype.add = function(button) {
            if (!(button instanceof ToolButton)) {
                console.error('Button type error');
                return;
            }
            this.buttonList[button.type] = button;
            button.container = this;
            //添加jquery对象
            this.$dom.append(button.$dom);
        }

        /**
         * 改变按钮组中激活的按钮
         * @param  {String} type 按钮名称
         */
        ToolButtonContainer.prototype.changeType = function(type) {
            if (this.activeType !== type && this.activeType !== 'none') {
                this.buttonList[this.activeType].popup();
            }
            this.activeType = type;
        }

        return ToolButtonContainer;
    })();

    function divWithClass(className, content) {
        var key,
            newDiv = $('<div></div>');
        newDiv.addClass(className);
        if (typeof content !== undefined) {
            newDiv = newDiv.html(content);
        }
        return newDiv;
    }

    $.fn.markTools = function(options) {
        var defaultOptions = {
            showInfo: true,
            showPin: true,
            showRegion: true,
            showRecluster: true,
            showFilter: true
        },
            currentFunc = 'none',
            toolsMap = {
                pin: {
                    type: 'pin',
                    classRest: 'btn-marktools-pin',
                    classActive: 'btn-marktools-pin-active'
                },
                region: {
                    type: 'region',
                    classRest: 'btn-marktools-region',
                    classActive: 'btn-marktools-region-active'
                }
            };


        function init() {
            var $this = $(this);

            var container = new ToolButtonContainer();
            //初始化Pin按钮
            if (options.showPin) {
                var btnPin = new ToolButton(toolsMap['pin']);
                container.add(btnPin);
            }

            //初始化Region按钮
            if (options.showRegion) {
                var btnRegion = new ToolButton(toolsMap['region']);
                container.add(btnRegion);
            }

            $this.append(container.$dom);
        }

        options = options || {};
        $.extend(options, defaultOptions);

        return this.each(init);
    };
})(jQuery);