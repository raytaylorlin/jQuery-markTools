/**
 * MarkTools - jQuery plugin
 * @author Ray Taylor Lin
 * //TODO 这个插件应该是一个单例模式，一个页面均允许存在一个插件实例
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
            $.markTools.options.onToolButtonActivated();
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
            var _this = this;
            if (this.stylePicker === null) {
                this.stylePicker = stylePicker;
                this.$dom.after(stylePicker.$dom);

                $('.color-block').on('click', function() {
                    var color = $(this).css('background-color');
                    $.markTools.options.color = color;
                    $('.color-show-block').css('background-color', color);
                    _this.popup();
                });
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
                    left: offset.left,
                    top: offset.top + 40
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
                '<div class="color-block color-block-red"></div>' +
                '<div class="color-block color-block-yellow"></div>' +
                '<div class="color-block color-block-blue"></div>' +
                '<div class="color-block color-block-green"></div>' +
                '<div class="clearfix"></div>' +
                '</div>');
        };

        StylePicker.prototype.bind = function(onDraw, onFinishDraw) {
            var _this = this;
            this.$dom.one('click', '.style-picker-button', function() {
                //获取颜色值和笔宽值，并隐藏面板
                var $dom = $(this).parent(),
                    drawingCanvas = new DrawingCanvas(_this.$callObject, onDraw, onFinishDraw);
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
                        selection.x1 = e.offsetX || (e.clientX - $(e.target).offset().left);
                        selection.y1 = e.offsetY || (e.clientY - $(e.target).offset().top);
                    }
                }).mousemove(
                function(e) {
                    if (_this.startDrag) {
                        selection.x2 = e.offsetX || (e.clientX - $(e.target).offset().left);
                        selection.y2 = e.offsetY || (e.clientY - $(e.target).offset().top);

                        _this.clear();
                        _this.refreshStyle();
                        _this.onDraw(_this.context, selection);
                    }
                }).mouseup(
                function(e) {
                    if (_this.startDrag) {
                        var drawData = {
                            selection: selection,
                            onDraw: _this.onDraw,
                            color: $.markTools.options.color,
                            penWidth: $.markTools.options.penWidth
                        };
                        _this.startDrag = false;

                        if (_this.onFinishDraw) {
                            _this.onFinishDraw(_this, e, drawData);
                        }
                    }
                });
        };

        DrawingCanvas.prototype.refreshStyle = function() {
            this.context.strokeStyle = $.markTools.options.color;
            this.context.lineWidth = $.markTools.options.penWidth;
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
        var currentFunc = 'none',
            toolsMap = {
                pin: {
                    type: 'pin',
                    classRest: 'btn-marktools-pin',
                    classActive: 'btn-marktools-pin-active',
                    classCursor: 'cursor-pin'
                },
                region: {
                    type: 'region',
                    classRest: 'btn-marktools-rect',
                    classActive: 'btn-marktools-rect-active',
                    classCursor: 'cursor-region'
                },
                ellipse: {
                    type: 'ellipse',
                    classRest: 'btn-marktools-ellipse',
                    classActive: 'btn-marktools-ellipse-active',
                    classCursor: 'cursor-ellipse'
                },
                line: {
                    type: 'line',
                    classRest: 'btn-marktools-line',
                    classActive: 'btn-marktools-line-active',
                    classCursor: 'cursor-line'
                },
                none: {
                    classRest: 'btn-marktools-color',
                    classActive: 'btn-marktools-color'
                }
            },
            toolButtonContainer,
            $markDialogTemplate;


        function init() {
            //$this为调用插件的jQuery对象，对应组件中的$callObject
            var $this = $callObject = $(this),
                options = $.markTools.options;
            $.markTools.$callObject = $this;

            toolButtonContainer = new ToolButtonContainer($this);
            //初始化Pin按钮
            if (options.showPin) {
                var btnPin = new ToolButton(toolsMap['pin'], $this);
                btnPin.onPress = function() {
                    $callObject.bind('click', function(e) {
                        //获取鼠标偏移量
                        var offset = getMouseOffset($(this), e);
                        //创建静态图钉
                        var $staticPin = $.markTools.createPin(offset, {
                            id: 'hehe'
                        });
                        $.markTools.$callObject.append($staticPin);
                        $.markTools.$callObject.append(showMarkDialog(offset));

                        //弹起所有按钮
                        btnPin.popup();
                    });
                };
                toolButtonContainer.add(btnPin);
            }

            //初始化Region按钮
            if (options.showRegion) {
                var btnRegion = new ToolButton(toolsMap['region'], $this),
                    stylePicker = new StylePicker($this);

                btnRegion.onPress = function() {
                    var onDraw = function(context, selection) {
                        context.strokeRect(selection.x1, selection.y1,
                            selection.x2 - selection.x1, selection.y2 - selection.y1);
                    },
                        onFinishDraw = function(drawingCanvas, e, drawData) {
                            //获取鼠标偏移量，显示并定位对话框
                            var offset = getMouseOffset($callObject, e),
                                $canvas = drawingCanvas.$dom,
                                margin = drawingCanvas.margin;
                            offset.left = offset.left + 0 - (drawData.selection.x2 - drawData.selection.x1) / 2;
                            offset.top = offset.top + (drawData.selection.y2 > drawData.selection.y1 ? 0 :
                                drawData.selection.y1 - drawData.selection.y2);

                            $markObject = $.markTools.createCanvas($canvas, offset, drawData);
                            $.markTools.$callObject.append($markObject);
                            $.markTools.$callObject.append(showMarkDialog(offset));

                            //弹起按钮
                            btnRegion.popup();

                            $canvas.unbind();
                            //将canvas转换为静态canvas（绘画canvas拥有相对最高的z-index）
                            $canvas.removeClass('draw-canvas');
                            $canvas.addClass('static-canvas');
                        };

                    drawingCanvas = new DrawingCanvas($callObject, onDraw, onFinishDraw);
                    $callObject.append(drawingCanvas.$dom);
                };
                toolButtonContainer.add(btnRegion);
            }

            if (options.showEllipse) {
                var btnEllipse = new ToolButton(toolsMap['ellipse'], $this),
                    stylePicker = new StylePicker($this);

                btnEllipse.onPress = function() {
                    var onDraw = function(context, selection) {
                        //---------使用三次贝塞尔曲线模拟椭圆---------------
                        //此方法也会产生当lineWidth较宽，椭圆较扁时，
                        //长轴端较尖锐，不平滑的现象
                        function bezierEllipse(context, x, y, a, b) {
                            //关键是bezierCurveTo中两个控制点的设置
                            //0.5和0.6是两个关键系数（在本函数中为试验而得）
                            var ox = 0.5 * a,
                                oy = 0.6 * b;

                            context.save();
                            context.translate(x, y);
                            context.beginPath();
                            //从椭圆纵轴下端开始逆时针方向绘制
                            context.moveTo(0, b);
                            context.bezierCurveTo(ox, b, a, oy, a, 0);
                            context.bezierCurveTo(a, -oy, ox, -b, 0, -b);
                            context.bezierCurveTo(-ox, -b, -a, -oy, -a, 0);
                            context.bezierCurveTo(-a, oy, -ox, b, 0, b);
                            context.closePath();
                            context.stroke();
                            context.restore();
                        }

                        var a = (selection.x2 - selection.x1) / 2,
                            b = (selection.y2 - selection.y1) / 2,
                            x = selection.x1 + a,
                            y = selection.y1 + b;
                        bezierEllipse(context, x, y, a, b);
                    },
                        onFinishDraw = function(drawingCanvas, e, drawData) {
                            //获取鼠标偏移量，显示并定位对话框
                            var offset = getMouseOffset($callObject, e),
                                $canvas = drawingCanvas.$dom,
                                margin = drawingCanvas.margin;
                            offset.left = offset.left + 0 - (drawData.selection.x2 - drawData.selection.x1) / 2;
                            offset.top = offset.top + (drawData.selection.y2 > drawData.selection.y1 ? 0 :
                                drawData.selection.y1 - drawData.selection.y2);

                            $markObject = $.markTools.createCanvas($canvas, offset, drawData);
                            $.markTools.$callObject.append($markObject);
                            $.markTools.$callObject.append(showMarkDialog(offset));

                            //弹起按钮
                            btnEllipse.popup();

                            $canvas.unbind();
                            //将canvas转换为静态canvas（绘画canvas拥有相对最高的z-index）
                            $canvas.removeClass('draw-canvas');
                            $canvas.addClass('static-canvas');
                        };
                    drawingCanvas = new DrawingCanvas($callObject, onDraw, onFinishDraw);
                    $callObject.append(drawingCanvas.$dom);
                };
                toolButtonContainer.add(btnEllipse);
            }

            if (options.showLine) {
                var btnLine = new ToolButton(toolsMap['line'], $this),
                    stylePicker = new StylePicker($this);

                btnLine.onPress = function() {
                    var onDraw = function(context, selection) {
                        context.beginPath();
                        context.moveTo(selection.x1, selection.y1);
                        context.lineTo(selection.x2, selection.y2);
                        context.closePath();
                        context.stroke();
                    },
                        onFinishDraw = function(drawingCanvas, e, drawData) {
                            //获取鼠标偏移量，显示并定位对话框
                            var offset = getMouseOffset($callObject, e),
                                originOffset = getMouseOffset($callObject, e),
                                $canvas = drawingCanvas.$dom,
                                margin = drawingCanvas.margin;
                            offset.left = offset.left + 0 - (drawData.selection.x2 - drawData.selection.x1) / 2;
                            offset.top = offset.top + (drawData.selection.y2 > drawData.selection.y1 ? 0 :
                                drawData.selection.y1 - drawData.selection.y2);

                            $markObject = $.markTools.createCanvas($canvas, offset, drawData, function(selection) {
                                var margin = $.markTools.options.canvasMargin,
                                    flagX = selection.x2 > selection.x1,
                                    flagY = selection.y2 > selection.y1,
                                    width = Math.abs(selection.x2 - selection.x1) + margin,
                                    height = Math.abs(selection.y2 - selection.y1) + margin;
                                selection.x1 = flagX ? margin : width;
                                selection.x2 = flagX ? width : margin;
                                selection.y1 = flagY ? margin : height;
                                selection.y2 = flagY ? height : margin;
                            });
                            $.markTools.$callObject.append($markObject);
                            $.markTools.$callObject.append(showMarkDialog(offset));

                            //弹起按钮
                            btnLine.popup();

                            $canvas.unbind();
                            //将canvas转换为静态canvas（绘画canvas拥有相对最高的z-index）
                            $canvas.removeClass('draw-canvas');
                            $canvas.addClass('static-canvas');
                        };
                    drawingCanvas = new DrawingCanvas($callObject, onDraw, onFinishDraw);
                    $callObject.append(drawingCanvas.$dom);
                };
                toolButtonContainer.add(btnLine);
            }

            if (true) {
                var btnColorPicker = new ToolButton(toolsMap['none'], $this),
                    stylePicker = new StylePicker($this);
                btnColorPicker.$dom.append('<div class="color-show-block"></div>');

                btnColorPicker.onPress = function() {
                    btnColorPicker.addStylePicker(stylePicker);
                    // stylePicker.bind(onDraw, onFinishDraw);
                };
                toolButtonContainer.add(btnColorPicker);
            }

            var $marktoolsTemplate = $('#marktools-template').hide(),
                markDialogTemplateHtml =
                    '<div class="' + options.markDialogClass + '">' +
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
                    '<p class="mark-box-title">${title}</p>' +
                    '<p class="mark-box-description">${description}</p>' +
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

                //options.markDialogClass为用户自定义的对话框DOM模板的class
                if (!$('.' + options.markDialogClass).exists()) {
                    //插件默认的对话框
                    $marktoolsTemplate.append($markDialogTemplate);
                } else {
                    //用户自定义的对话框
                    $markDialogTemplate = $('.' + options.markDialogClass);
                }

                //options.markBoxClass为用户自定义的标记内容框DOM模板的class
                if (!$('.' + options.markBoxClass).exists()) {
                    //插件默认的标记内容框
                    $marktoolsTemplate.append($markBoxTemplate);
                } else {
                    //用户自定义的标记内容框
                    $markBoxTemplate = $('.' + options.markBoxClass);
                }
            }

            //Cancel按钮事件
            $markDialogTemplate.on('click', '.mark-dialog-button-cancel',
                function() {
                    //移除整个mark-container
                    //$(this)为按钮，上2级父节点即mark-container
                    $(this).parent().prev().remove();
                    $(this).parent().remove();
                    //触发保存mark时的自定义方法
                    if (options.onCancelMark) {
                        options.onCancelMark();
                    }
                });
            //Save按钮事件
            $markDialogTemplate.on('click', '.mark-dialog-button-save',
                function() {
                    var $markDialog = $(this).parent(),
                        $title = $markDialog.find('input[name=title]'),
                        $description = $markDialog.find('textarea'),
                        title = $title.val(),
                        description = $description.val(),

                        $markBox,
                        $markObject;
                    if (title.trim() == '' || description.trim() == '') {
                        alert('Title and description cannot be empty.');
                        return;
                    }
                    $markObject = $markDialog.prev();
                    $markDialog.remove();
                    $title.val('');
                    $description.val('');

                    var markType = $markObject.hasClass('static-pin') ? 'pin' : 'region';

                    var markData = {
                        title: title,
                        description: description,
                        type: markType,
                        mouseX: parseInt($markObject.css('left')),
                        mouseY: parseInt($markObject.css('top')),
                        width: markType === 'pin' ? 0 : $markObject.width(),
                        height: markType === 'pin' ? 0 : $markObject.height()
                    };

                    //创建新的markBox
                    $markBox = $.markTools.createMarkBox(markData, $markBoxTemplate);
                    $.markTools.bindMarkAndBox($markObject, $markBox);

                    //触发保存mark时的自定义方法
                    if (options.onSaveMark) {
                        options.onSaveMark($markObject, $markBox, markData);
                    }
                });
        }


        /**
         * 显示标记对话框，对话框由模板创建
         */

        function showMarkDialog(mousePos) {
            var $markDialogTemplate = $('#marktools-template').find('.' + $.markTools.options.markDialogClass),
                $markDialog = $markDialogTemplate.clone(true).show();
            setOffset($markDialog, mousePos);
            return $markDialog;
        }

        $.extend($.markTools.options, options);

        return this.each(init);
    };

    $.markTools = {
        $callObject: null,
        options: {
            showInfo: true,
            showPin: true,
            showRegion: true,
            showEllipse: true,
            showLine: true,
            showRecluster: true,
            showFilter: true,

            color: '#FF0000',
            penWidth: 4,
            canvasMargin: 10,

            //TODO: 考虑引入一个marktools-template的div专门存放模板
            markDialogClass: 'mark-dialog',
            markBoxClass: 'mark-box',
            onSaveMark: function() {},
            onCancelMark: function() {},
            onClickMark: function() {},
            onToolButtonActivated: function() {}
        },
        createMarkBox: function(data, $template) {
            var key,
                $newMarkBox,
                $template = $template || $('.' + $.markTools.options.markBoxClass),
                newMarkBoxHtml;
            $newMarkBox = $template.clone(true).show();
            $newMarkBox.data = {};
            newMarkBoxHtml = $newMarkBox.html();
            for (key in data) {
                newMarkBoxHtml = newMarkBoxHtml.replace('${' + key + '}', data[key]);
                $newMarkBox.data[key] = data[key];
            }
            $newMarkBox.html(newMarkBoxHtml);
            return $newMarkBox;
        },
        fillMarkBox: function($markBox, data) {
            var key,
                markBoxHtml;
            markBoxHtml = $markBox.html();
            for (key in data) {
                markBoxHtml = markBoxHtml.replace('${' + key + '}', data[key]);
            }

            $markBox.html(markBoxHtml);
            return $markBox;
        },
        /**
         * 创建mark容器，该容器包含mark本身和mark-box信息框
         * @param  {String} strId 该容器的id
         * @param  {jQuery} $markObj    [description]
         * @param  {Object} [offset]      [description]
         * @param  {Number} [offset.left]
         * @param  {Number} [offset.top]
         * @param  {[type]} margin      [description]
         * @return {[type]}             创建好的mark容器
         */
        createMarkContainer: function(strId, $markObj, offset, margin) {
            var $newContainer = $('<div class="mark-container"></div>'),
                $callObject = $.markTools.$callObject;
            $newContainer.attr('id', strId);
            if (offset !== undefined) {
                $newContainer.css({
                    'left': offset.left,
                    'top': offset.top
                });
            }
            $newContainer.append($markObj);
            $callObject.append($newContainer);

            $markObj.css({
                'margin-left': -$markObj.width() / 2 + 'px',
                'margin-top': -$markObj.height() + (margin === undefined ? 0 : margin) + 'px'
            });
            return $newContainer;
        },
        createPin: function(offset, data) {
            var $newMark;
            $newMark = divWithClass('static-pin').attr('id', data.id);
            $.markTools.$callObject.append($newMark);
            if (offset) {
                setOffset($newMark, offset);
            }
            $newMark.css({
                'margin-left': -$newMark.width() / 2 + 'px',
                'margin-top': -$newMark.height() + 'px'
            });
            return $newMark;
        },
        createCanvas: function($canvas, offset, data, changeSelection) {
            $canvas = $canvas || $('<canvas class="static-canvas"></canvas>');
            $.markTools.$callObject.append($canvas);
            var context = $canvas[0].getContext('2d'),
                width = Math.abs(data.selection.x2 - data.selection.x1) + $.markTools.options.canvasMargin * 2,
                height = Math.abs(data.selection.y2 - data.selection.y1) + $.markTools.options.canvasMargin * 2,
                onDraw = data.onDraw;
            $canvas.attr('width', width).attr('height', height);

            context.clearRect(0, 0, width, height);
            context.strokeStyle = data.color;
            context.lineWidth = data.penWidth;

            if (changeSelection !== undefined) {
                changeSelection(data.selection);
            } else {
                data.selection.x2 = width - $.markTools.options.canvasMargin;
                data.selection.y2 = height - $.markTools.options.canvasMargin;
                data.selection.x1 = $.markTools.options.canvasMargin;
                data.selection.y1 = $.markTools.options.canvasMargin;
            }
            onDraw(context, data.selection);

            setOffset($canvas, {
                left: offset.left,
                top: offset.top + $.markTools.options.canvasMargin
            });
            $canvas.css({
                'margin-left': -$canvas.width() / 2 + 'px',
                // 'margin-top': -$canvas.height() + (data.margin === undefined ? 0 : data.margin) + 'px'
                'margin-top': -$canvas.height() + 'px'
            });

            return $canvas;
        },
        bindMarkAndBox: function($markObj, $markBox) {
            setOffset($markBox, getOffset($markObj));
            $markObj.after($markBox);
            $markBox.hide();

            $markObj.bind('click', function() {
                $markBox.toggle();
            });
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
        if (offset) {
            obj.css({
                left: offset.left,
                top: offset.top
            });
        }
    }

    function getOffset(obj) {
        return {
            left: obj.css('left'),
            top: obj.css('top')
        };
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