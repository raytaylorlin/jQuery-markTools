/**
 * MarkTools - jQuery plugin
 * @author Ray Taylor Lin
 */

(function($) {
    var ToolButton = (function() {
        var ToolButton = function(attr) {
            var $btn,
                _this = this;
            this.attr = attr;
            this.isPressed = false;

            $btn = this.container = divWithClass(attr.classRest);
            $btn.addClass('btn-marktools');
            $btn.click(function() {
                _this.toggle();
            });

            return this.container;
        }

        ToolButton.prototype.toggle = function() {
            this.isPressed = !this.isPressed;
            if (this.isPressed) {
                this.container.removeClass(this.attr.classRest);
                this.container.addClass(this.attr.classActive);
            } else {
                this.container.removeClass(this.attr.classActive);
                this.container.addClass(this.attr.classRest);
            }
        }

        return ToolButton;
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
                    classRest: 'btn-marktools-pin',
                    classActive: 'btn-marktools-pin-active'
                },
                region: {
                    classRest: 'btn-marktools-region',
                    classActive: 'btn-marktools-region-active'
                }
            };


        function init() {
            var $this = $(this);

            //初始化标记工具栏容器
            var $markToolsContainer = divWithClass('marktools-container');

            //初始化Pin按钮
            if (options.showPin) {
                var divPin = new ToolButton(toolsMap['pin']);
                // var divPin = div({
                //     class: 'btn-marktools btn-marktools-pin'
                // }).click(function() {
                //     var c = $(this).attr('class');
                //     if (c.indexOf('btn-marktools-pin-active') >= 0) {
                //         $(this).attr('class', c.replace('btn-marktools-pin-active', 'btn-marktools-pin'));
                //     } else if (c.indexOf('btn-marktools-pin') >= 0) {
                //         $(this).attr('class', c.replace('btn-marktools-pin', 'btn-marktools-pin-active'));
                //     }

                //     console.log($(this).attr('class'));
                // });
                $markToolsContainer.append(divPin);
            }

            //初始化Region按钮
            if (options.showRegion) {
                // $markToolsContainer.append(div({
                // class: 'btn-marktools btn-marktools-region'
                // }));
            }

            $this.append($markToolsContainer);
        }

        options = options || {};
        $.extend(options, defaultOptions);

        return this.each(init);
    };
})(jQuery);