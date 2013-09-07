/**
 * MarkTools - jQuery plugin
 * @author Ray Taylor Lin
 */

(function($) {
    var ToolButton = (function() {
        var ToolButton = function(attr, $callObject) {
            var _this = this;
            attr = attr || {};

            //相关属性
            this.attr = attr;
            //按钮类型
            this.type = attr.type;
            //是否被按下
            this.isPressed = false;
            //容纳按钮的容器
            this.container = null;
            //激活时的鼠标指针
            this.activeCursor = null;

            //调用插件的jquery对象
            this.$callObject = $callObject;
            //按钮对应的jquery对象
            this.$dom = divWithClass(attr.classRest);
            this.$dom.addClass('btn-marktools');
            this.$dom.click(function() {
                _this.toggle();
            });

            //创建光标cursor的div并隐藏
            this.$cursor = $('<div class="' + attr.classCursor + '"></div>')
            this.$cursor.hide();
            this.$callObject.append(this.$cursor);

            //按下按钮触发的方法
            this.onPress = attr.onPress;
        };

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
            // this.$callObject.addClass(this.attr.classCursor);
            var $cursor = this.$cursor;
            $cursor.show();
            this.$callObject.mousemove(function(e) {
                var offset = getMouseOffset($(this), e);
                var pos = {
                    left: offset.left - parseInt($cursor.width() / 2),
                    top: offset.top - $cursor.height()
                };
                $cursor.css(pos);
                console.log(pos);
                // $(this).css('cursor', 'default');
            });

            console.log('click button');
            //触发按钮按下的事件
            this.onPress();
        };

        /**
         * 弹起按钮
         */
        ToolButton.prototype.popup = function() {
            this.isPressed = false;
            this.$dom.removeClass(this.attr.classActive);
            this.$dom.addClass(this.attr.classRest);

            this.container.activeType = 'none';
            this.$callObject.removeClass(this.attr.classCursor);
        }

        function createCursor($callObject, cursorId) {

        }


        return ToolButton;
    })();

    var ToolButtonContainer = (function() {
        var ToolButtonContainer = function($callObject) {
            this.activeType = 'none';
            this.buttonList = {};
            //初始化标记工具栏容器
            this.$dom = divWithClass('marktools-container');
            this.$callObject = $callObject;


            //调整位置
            var _this = this;
            var adjust = function() {
                var offset = $callObject.offset();
                _this.$dom.css({
                    left: offset.left + 20,
                    top: offset.top + 20
                });
            };
            adjust();
            $(window).resize(adjust);

            //在调用插件的容器后面添加
            $callObject.after(this.$dom);
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
            switch (this.activeType) {
                case 'none':

                    break;
            }
        }

        ToolButtonContainer.prototype.popupAll = function() {
            this.buttonList[this.activeType].popup();
            this.activeType = 'none';
            this.$callObject.unbind();
        };

        return ToolButtonContainer;
    })();

    /**
     * 给所有jquery对象新增一个查询是否存在的方法
     * @return {Boolean} 查找的jquery对象是否存在
     */
    $.fn.exists = function() {
        return this.length > 0;
    };

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
                    classActive: 'btn-marktools-pin-active',
                    classCursor: 'cursor-pin',
                    onPress: function() {
                        var tbc = this.container;
                        this.$callObject.bind('click', function(e) {
                            console.log('click container');
                            var markDialog = showMarkDialog(getMouseOffset($(this), e));
                            $(this).append(markDialog);
                            $(this).unbind('click');
                            tbc.popupAll();
                        });
                    }
                },
                region: {
                    type: 'region',
                    classRest: 'btn-marktools-region',
                    classActive: 'btn-marktools-region-active',
                    classCursor: 'cursor-region'
                }
            },
            toolButtonContainer;


        function init() {
            var $this = $(this);

            toolButtonContainer = new ToolButtonContainer($this);
            //初始化Pin按钮
            if (options.showPin) {
                var btnPin = new ToolButton(toolsMap['pin'], $this);
                toolButtonContainer.add(btnPin);
            }

            //初始化Region按钮
            if (options.showRegion) {
                var btnRegion = new ToolButton(toolsMap['region'], $this);
                btnRegion.onPress = function() {
                    console.log('region');
                };
                toolButtonContainer.add(btnRegion);
            }
        }

        options = options || {};
        $.extend(options, defaultOptions);

        //窗口缩放时，应调整工具栏的位置
        // $(window).resize(function() {

        // });

        return this.each(init);
    };


    function divWithClass(className, content) {
        var key,
            newDiv = $('<div></div>');
        newDiv.addClass(className);
        if (typeof content !== undefined) {
            newDiv = newDiv.html(content);
        }
        return newDiv;
    }

    function setOffset(obj, offset) {
        obj.css({
            left: offset.left,
            top: offset.top
        });
    }

    function showMarkDialog(mousePos) {
        var $markDialog = $('.mark-dialog');
        if ($markDialog.exists()) {
            setOffset($markDialog, mousePos);
            $markDialog.show();
        } else {
            $markDialog = $(
                '<div class="mark-dialog">' +
                '<div class="mark-dialog-control">' +
                '<label for="title">Title</label>' +
                '<input type="text" name="title"/>' +
                '</div>' +
                '<div class="mark-dialog-control">' +
                '<label for="description">Description</label>' +
                '<textarea name="description"></textarea>' +
                '</div>' +
                '<a class="mark-dialog-button" href="javascript:void(0)">Cancel</a>' +
                '<a class="mark-dialog-button" href="javascript:void(0)">Save</a>' +
                '</div>');
        }
        setOffset($markDialog, mousePos);
        return $markDialog;
    }

    /**
     * 获取鼠标相对于某个容器的偏移量
     * @param  {jQuery Object}} obj 计算偏移量的容器
     * @param  {Event} e 鼠标事件
     * @return {Object} 鼠标位置偏移量
     */
    function getMouseOffset(obj, e) {
        var x, y;
        x = e.pageX - obj.offset().left;
        y = e.pageY - obj.offset().top;
        return {
            left: x,
            top: y
        };
    }

})(jQuery);