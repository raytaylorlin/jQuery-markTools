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
            // this.onPress = attr.onPress;
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

            //显示光标并绑定到鼠标移动事件
            var $cursor = this.$cursor;
            $cursor.show();
            this.$callObject.bind('mousemove', function(e) {
                var offset = getMouseOffset($(this), e);
                $cursor.css(offset);
            });

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

            //隐藏光标
            this.$cursor.hide();
            this.$callObject.unbind();

            this.container.activeType = 'none';
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
            showFilter: true,
            markDialogId: 'mark-dialog',
            markBoxClass: 'mark-box',
            onSaveMark: null
        },
            currentFunc = 'none',
            toolsMap = {
                pin: {
                    type: 'pin',
                    classRest: 'btn-marktools-pin',
                    classActive: 'btn-marktools-pin-active',
                    classCursor: 'cursor-pin',
                },
                region: {
                    type: 'region',
                    classRest: 'btn-marktools-region',
                    classActive: 'btn-marktools-region-active',
                    classCursor: 'cursor-region'
                }
            },
            toolButtonContainer,
            $markDialog;


        function init() {
            //$this为调用插件的jQuery对象，对应组件中的$callObject
            var $this = $(this);

            toolButtonContainer = new ToolButtonContainer($this);
            //初始化Pin按钮
            if (options.showPin) {
                var btnPin = new ToolButton(toolsMap['pin'], $this);
                btnPin.onPress = function() {
                    var tbc = this.container;
                    this.$callObject.bind('click', function(e) {
                        //创建静态图钉
                        var $staticPin = divWithClass('static-pin');
                        //获取鼠标偏移量，显示并定位对话框
                        var offset = getMouseOffset($(this), e);
                        var markDialog = showMarkDialog(offset, $staticPin);
                        $(this).append(markDialog);
                        //弹起所有按钮
                        tbc.popupAll();
                    });
                };
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

            //初始化mark对话框
            //options.markDialogId为用户自定义的对话框DOM的Id
            if ($('#' + options.markDialogId).exists()) {
                $markDialog = $('#' + options.markDialogId);
            } else {
                $markDialog = $(
                    '<div id="' + options.markDialogId + '">' +
                    '<div class="mark-dialog-control">' +
                    '<label for="title">Title</label>' +
                    '<input type="text" name="title"/>' +
                    '</div>' +
                    '<div class="mark-dialog-control">' +
                    '<label for="description">Description</label>' +
                    '<textarea name="description"></textarea>' +
                    '</div>' +
                    '<a class="mark-dialog-button mark-dialog-button-cancel" href="javascript:void(0)">Cancel</a>' +
                    '<a class="mark-dialog-button mark-dialog-button-save" href="javascript:void(0)">Save</a>' +
                    '<div class="clearfix"></div>' +
                    '</div>');
                //Cancel按钮事件
                $markDialog.find('.mark-dialog-button-cancel').bind('click', function() {
                    $(this).parent().hide();
                    $markDialog.prev().remove();
                });
                //Save按钮事件
                $markDialog.find('.mark-dialog-button-save').bind('click', function() {
                    var $title = $markDialog.find('input[name=title]'),
                        $description = $markDialog.find('textarea'),
                        title = $title.val(),
                        description = $description.val(),
                        $markContainer = $markDialog.parent(),
                        $markBox;
                    if (title.trim() === '' || description.trim === '') {
                        console.log('Title or description cannot be empty.');
                        return;
                    }
                    $markDialog.hide();
                    $title.val('');
                    $description.val('');
                    //TODO: 由用户指定的单击Save按钮事件
                    if (options.onSaveMark) {
                        options.onSaveMark($markContainer);
                    } else {
                        if ($('.' + options.markBoxClass).exists()) {
                            $markBox = $('.' + options.markBoxClass);
                        } else {
                            $markBox = $(
                                '<div class="mark-box">' +
                                '<p class="mark-box-title"></p>' + 
                                '<p class="mark-box-description"></p>' + 
                                '</div>'
                            );
                        }
                        $markBox.find('.mark-box-title').html(title);
                        $markBox.find('.mark-box-description').html(description);
                        $markContainer.append($markBox);
                    }
                });
            }
            $markDialog.hide();
        }

        /**
         * 显示标记对话框和预览的标记
         * 对话框如果不存在会先创建，否则显示已有的对话框
         * @param  {Object} mousePos 鼠标相对父容器的偏移量
         * @param {Number} mousePos.left
         * @param {Number} mousePos.top
         * @param  {jQuery Object} [$markObj] 预览的标记DOM对应的jQuery对象
         * @return {jQuery Object} 包括预览的标记对话框jQuery对象
         */

        function showMarkDialog(mousePos, $markObj) {
            var markDialogId = options.markDialogId;
            var $markContainer = $(
                    '<div class="mark-container">' +
                    '</div>');
            //     $markContainer = $('.mark-container');
            // if ($markContainer.exists()) {
            //     $markContainer.show();
            // } else {
            //     $markContainer = $(
            //         '<div class="mark-container">' +
            //         '</div>');
            // }
            if ($markObj !== undefined) {
                $markContainer.append($markObj);
            }
            $markContainer.append($markDialog.show());


            setOffset($markContainer, mousePos);
            return $markContainer;
        }


        options = options || {};
        $.extend(options, defaultOptions);

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