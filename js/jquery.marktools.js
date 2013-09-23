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
            //样式选择器
            this.stylePicker = null;

            //调用插件的jquery对象
            this.$callObject = $callObject;
            //按钮对应的jquery对象
            this.$dom = divWithClass(attr.classRest);
            this.$dom.addClass('btn-marktools');
            this.$dom.click(function() {
                _this.toggle();
            });

            //创建光标cursor的div并隐藏
            this.$cursor = divWithClass(attr.classCursor);
            this.$cursor.hide();
            $('body').append(this.$cursor);

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

            //若样式选择器存在则显示
            if (this.stylePicker) {
                this.stylePicker.$dom.show();
            }

            //设置按钮组的状态
            this.container.changeType(this.type);

            //显示光标并绑定到鼠标移动事件
            var $cursor = this.$cursor;
            $cursor.show();
            this.$callObject.bind('mousemove', function(e) {
                var offset = {
                    left: e.clientX,
                    top: e.clientY
                };
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

            if (this.stylePicker) {
                this.stylePicker.$dom.hide();
            }

            //隐藏光标
            this.$cursor.hide();
            this.$callObject.unbind();

            this.container.activeType = 'none';
        }

        ToolButton.prototype.addStylePicker = function(stylePicker) {
            if (this.stylePicker === null) {
                this.stylePicker = stylePicker;
                this.$dom.after(stylePicker.$dom);
            }
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

    var StylePicker = (function() {
        var StylePicker = function(callObject) {
            //颜色
            this.color = '#000000';
            //笔宽
            this.width = 1;
            this.$callObject = callObject;
            this.$dom = $(
                '<div class="style-picker">' +
                '<div class="mark-dialog-control">' +
                '<label>Color</label><input type="text" class="color" name="color"/>' +
                '</div>' +
                '<div class="mark-dialog-control">' +
                '<label>Width</label><input type="text" name="width" value="1"/>' +
                '</div>' +
                '<a class="style-picker-button">OK</a>' +
                '<div class="clearfix"></div>' +
                '</div>');
        };

        StylePicker.prototype.bind = function(onFinishDraw) {
            //激活颜色面板
            jscolor.bind();

            var _this = this;
            this.$dom.one('click', '.style-picker-button', function() {
                //获取颜色值和笔宽值，并隐藏面板
                var $dom = $(this).parent(),
                    drawingCanvas = new DrawingCanvas(_this.$callObject, null, onFinishDraw);
                drawingCanvas.color = '#' + $dom.find('input[name=color]').val();
                drawingCanvas.penWidth = parseInt($dom.find('input[name=width]').val());
                $dom.hide();

                _this.$callObject.append(drawingCanvas.$dom);
            });
        }

        return StylePicker;
    })();

    var DrawingCanvas = (function() {
        var DrawingCanvas = function($callObject, onDraw, onFinishDraw) {
            var canvas;
            //canvas宽高
            this.width = $callObject.width();
            this.height = $callObject.height();
            //画笔颜色
            this.color = '#000000';
            //笔宽
            this.lineWidth = 1;
            //canvas边距
            this.margin = 10;
            //是否开始在canvas上拖拽的标记
            this.startDrag = false;
            this.onDraw = onDraw;
            this.onFinishDraw = onFinishDraw;
            this.$callObject = $callObject;

            //初始化canvas并添加到调用插件的主容器
            this.$dom = canvas = $('<canvas></canvas>')
                .attr('class', 'draw-canvas')
                .attr('width', this.width)
                .attr('height', this.height);
            $callObject.append(this.$dom);

            this.context = canvas.get(0).getContext("2d");

            var selection = {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            }, _this = this;

            this.clear();
            //绑定canvas的鼠标事件
            canvas.mousedown(
                function(e) {
                    if (!_this.startDrag) {
                        //开始拖动
                        _this.startDrag = true;
                        selection.x1 = e.offsetX;
                        selection.y1 = e.offsetY;
                    }
                }).mousemove(
                function(e) {
                    if (_this.startDrag) {
                        selection.x2 = e.offsetX;
                        selection.y2 = e.offsetY;

                        _this.clear();
                        _this.setStyle(_this.color, _this.penWidth);
                        _this.context.strokeRect(selection.x1, selection.y1,
                            selection.x2 - selection.x1, selection.y2 - selection.y1);
                    }
                }).mouseup(
                function(e) {
                    if (_this.startDrag) {
                        var width = selection.x2 - selection.x1,
                            height = selection.y2 - selection.y1;

                        _this.startDrag = false;
                        canvas.attr('width', width + _this.margin * 2).
                        attr('height', height + _this.margin * 2);

                        _this.clear();
                        _this.setStyle(_this.color, _this.penWidth);
                        _this.context.strokeRect(_this.margin, _this.margin,
                            width, height);

                        if (_this.onFinishDraw) {
                            _this.onFinishDraw(_this, e);
                        }
                    }
                });
        };

        DrawingCanvas.prototype.setStyle = function(color, penWidth) {
            this.context.strokeStyle = color;
            this.context.lineWidth = penWidth;
        };

        DrawingCanvas.prototype.clear = function() {
            this.context.clearRect(0, 0, this.width, this.height);
        };

        return DrawingCanvas;
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

            //TODO: 考虑引入一个marktools-template的div专门存放模板
            markDialogClass: 'mark-dialog',
            markBoxClass: 'mark-box',
            onSaveMark: null
        },
            currentOptions = defaultOptions,
            currentFunc = 'none',
            toolsMap = {
                pin: {
                    type: 'pin',
                    classRest: 'btn-marktools-pin',
                    classActive: 'btn-marktools-pin-active',
                    classCursor: 'cursor-pin'
                },
                region: {
                    type: 'region',
                    classRest: 'btn-marktools-region',
                    classActive: 'btn-marktools-region-active',
                    classCursor: 'cursor-region'
                }
            },
            toolButtonContainer,
            $markDialogTemplate;


        function init() {
            //$this为调用插件的jQuery对象，对应组件中的$callObject
            var $this = $callObject = $(this);

            toolButtonContainer = new ToolButtonContainer($this);
            //初始化Pin按钮
            if (currentOptions.showPin) {
                var btnPin = new ToolButton(toolsMap['pin'], $this);
                btnPin.onPress = function() {
                    $callObject.bind('click', function(e) {
                        //创建静态图钉
                        var $staticPin = divWithClass('static-pin');
                        $callObject.append($staticPin);
                        //获取鼠标偏移量，显示并定位对话框
                        var offset = getMouseOffset($(this), e);
                        console.log(offset);
                        var markDialog = showMarkDialog(offset, $staticPin);
                        $(this).append(markDialog);
                        //弹起所有按钮
                        btnPin.popup();
                    });
                };
                toolButtonContainer.add(btnPin);
            }

            //初始化Region按钮
            if (currentOptions.showRegion) {
                var btnRegion = new ToolButton(toolsMap['region'], $this),
                    stylePicker = new StylePicker($this);

                btnRegion.onPress = function() {
                    btnRegion.addStylePicker(stylePicker);
                    //绑定绘画结束事件
                    stylePicker.bind(function(drawingCanvas, e) {
                        //获取鼠标偏移量，显示并定位对话框
                        var offset = getMouseOffset($callObject, e),
                            $canvas = drawingCanvas.$dom,
                            margin = drawingCanvas.margin;

                        var markDialog = showMarkDialog({
                            left: offset.left + margin - $canvas.width() / 2,
                            top: offset.top
                        }, $canvas, drawingCanvas.margin);

                        $callObject.append(markDialog);
                        //弹起按钮
                        btnRegion.popup();

                        $canvas.unbind();
                        //将canvas转换为静态canvas（绘画canvas拥有相对最高的z-index）
                        $canvas.removeClass('draw-canvas');
                        $canvas.addClass('static-canvas');
                    });
                };
                toolButtonContainer.add(btnRegion);
            }

            var $marktoolsTemplate = $('#marktools-template'),
                markDialogTemplateHtml =
                    '<div class="' + currentOptions.markDialogClass + '">' +
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
                    '</div>',
                markBoxTemplateHtml =
                    '<div class="mark-box">' +
                    '<p class="mark-box-title"></p>' +
                    '<p class="mark-box-description"></p>' +
                    '</div>',
                $markDialogTemplate = $(markDialogTemplateHtml).hide(),
                $markBoxTemplate = $(markBoxTemplateHtml).hide();
            //若模板不存在则创建一个默认的模板div
            if (!$marktoolsTemplate.exists()) {
                $marktoolsTemplate = $('<div id="marktools-template"></div>');
                $('body').append($marktoolsTemplate);

                $marktoolsTemplate.append($markDialogTemplate);
                $marktoolsTemplate.append($markBoxTemplate);
            } else {
                /* 后续生成的对话框均由此模板clone而成 */

                //currentOptions.markDialogClass为用户自定义的对话框DOM模板的class
                if (!$('.' + currentOptions.markDialogClass).exists()) {
                    //插件默认的对话框
                    $marktoolsTemplate.append($markDialogTemplate);
                } else {
                    //用户自定义的对话框
                    $markDialogTemplate = $('.' + currentOptions.markDialogClass);
                }

                //currentOptions.markBoxClass为用户自定义的标记内容框DOM模板的class
                if (!$('.' + currentOptions.markBoxClass).exists()) {
                    //插件默认的标记内容框
                    $marktoolsTemplate.append($markBoxTemplate);
                } else {
                    //用户自定义的标记内容框
                    $markBoxTemplate = $('.' + currentOptions.markBoxClass);
                }
            }

            //Cancel按钮事件
            $markDialogTemplate.on('click', '.mark-dialog-button-cancel',
                function() {
                    //移除整个mark-container
                    //$(this)为按钮，上2级父节点即mark-container
                    $(this).parent().parent().remove();
                });
            //Save按钮事件
            $markDialogTemplate.on('click', '.mark-dialog-button-save',
                function() {
                    var $markDialog = $(this).parent(),
                        $markContainer = $markDialog.parent(),
                        $title = $markDialog.find('input[name=title]'),
                        $description = $markDialog.find('textarea'),
                        title = $title.val(),
                        description = $description.val(),

                        $markBox,
                        $markObject;
                    if (title.trim() === '' || description.trim === '') {
                        alert('Title or description cannot be empty.');
                        return;
                    }
                    $markObject = $markDialog.prev();
                    $markDialog.remove();
                    $title.val('');
                    $description.val('');
                    //TODO: 由用户指定的单击Save按钮事件
                    if (currentOptions.onSaveMark) {
                        currentOptions.onSaveMark($markContainer, $markBox);
                    } else {
                        //创建新的markBox
                        $markBox = $.markTools.createMarkBox($markBoxTemplate, {
                            title: title,
                            description: description
                        });
                        //填充内容
                        // $markBox.find('.mark-box-title').html(title);
                        // $markBox.find('.mark-box-description').html(description);
                        $markContainer.append($markBox);
                    }

                    $markObject.bind('click', function() {
                        $markBox.toggle();
                    });
                });
        }


        /**
         * 显示标记对话框和预览的标记
         * 对话框如果不存在会先创建，否则显示已有的对话框
         * @param  {Object} mousePos 鼠标相对父容器的偏移量
         * @param {Number} mousePos.left
         * @param {Number} mousePos.top
         * @param  {jQuery Object} [$markObj] 预览的标记DOM对应的jQuery对象
         * @param {margin} [margin] 标记DOM的margin值，一般用于canvas
         * @return {jQuery Object} 包括预览的标记对话框jQuery对象
         */

        function showMarkDialog(mousePos, $markObj, margin) {
            var $markDialog = $('.' + currentOptions.markDialogClass).first();
            var $markContainer = $(
                '<div class="mark-container">' +
                '</div>');
            $markContainer.attr('id', "mark-container-" + Math.floor(Math.random() * 10000000));
            if ($markObj !== undefined) {
                $markObj.css({
                    'margin-left': -$markObj.width() / 2 + 'px',
                    'margin-top': -$markObj.height() + (margin ? margin : 0) + 'px'
                });
                $markContainer.append($markObj);
            }
            $markContainer.append($markDialog.clone(true).show());


            setOffset($markContainer, mousePos);
            return $markContainer;
        }

        $.extend(currentOptions, options);

        return this.each(init);
    };

    $.markTools = {
        createMarkBox: function($template, data) {
            var key,
                $newMarkBox = $template.clone(true).show();
            for(key in data){
                $newMarkBox.find('.' + $template.attr('class') + '-' + key).html(data[key]);
            }
            return $newMarkBox;
        }
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