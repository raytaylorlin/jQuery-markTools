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
            this.$callObject.on('mousemove', function(e) {
                var offset = {
                    left: e.clientX,
                    top: e.clientY
                };
                $cursor.css(offset);
            });

            //判断当前是否有画布存在，不允许存在多个画布
            if(!this.$callObject.find('.draw-canvas').exists()) {
                //清空缓存
                $.markTools.cache.userStartDraw = false;
                //触发按钮按下的事件
                this.onPress();
                $.markTools.options.onToolButtonActivated();
            } else {
                console.log(this.type);
                //画布存在则直接弹起按钮
                this.popup();
            }
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

            //若用户没有开始绘画，则在切换按钮的时候删除所有现存canvas
            if (!$.markTools.cache.userStartDraw) {
                $('.draw-canvas').remove();
            }

            this.container.activeType = 'none';
        }

        /**
         * 添加（绑定）样式选取器
         * @param {StylePicker} stylePicker 样式选取器对象
         */
        ToolButton.prototype.addStylePicker = function(stylePicker) {
            var _this = this;
            //若没有绑定则绑定
            if (this.stylePicker === null) {
                this.stylePicker = stylePicker;
                //添加在按钮之后
                this.$dom.after(stylePicker.$dom);
                //颜色选取器的色块点击事件
                $('.color-block').on('click', function() {
                    var color = $(this).css('background-color');
                    $.markTools.options.color = color;
                    //改变显示色块的颜色
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
        var DrawingCanvas = function($callObject, onDraw, onFinishDraw, type) {
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
            this.type = type;
            this.$callObject = $callObject;

            //初始化canvas并添加到调用插件的主容器
            this.$dom = canvas = $('<canvas></canvas>')
                .attr('class', 'draw-canvas')
                .attr('width', this.width)
                .attr('height', this.height);
            $callObject.append(this.$dom);

            this.context = canvas.get(0).getContext("2d");

            this.selection = {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            }
            var _this = this;

            this.clear();
            //绑定canvas的鼠标事件
            canvas.on('mousedown',
                function(e) {
                    if (!_this.startDrag) {
                        //开始拖动
                        _this.startDrag = true;
                        $.markTools.cache.userStartDraw = true;
                        _this.selection.x1 = e.offsetX || (e.clientX - $(e.target).offset().left);
                        _this.selection.y1 = e.offsetY || (e.clientY - $(e.target).offset().top);
                    }
                }).on('mousemove',
                function(e) {
                    if (_this.startDrag) {
                        _this.selection.x2 = e.offsetX || (e.clientX - $(e.target).offset().left);
                        _this.selection.y2 = e.offsetY || (e.clientY - $(e.target).offset().top);

                        _this.clear();
                        _this.refreshStyle();
                        _this.onDraw(_this.context, _this.selection);
                    }
                }).on('mouseup',
                function(e) {
                    if (_this.startDrag) {
                        var drawData = {
                            selection: _this.selection,
                            onDraw: _this.onDraw,
                            color: $.markTools.options.color,
                            penWidth: $.markTools.options.penWidth,
                            type: _this.type
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

        /**
         * 开启图形的编辑
         */
        DrawingCanvas.prototype.activeEdit = function(type) {
            var canvas = this.$dom,
                _this = this,
                startDragPoint = {},
                startResizePoint = -1,
                originSelection = {
                    x1: this.selection.x1,
                    x2: this.selection.x2,
                    y1: this.selection.y1,
                    y2: this.selection.y2
                },
                resizeHandlerGroup = new ResizeHandlerGroup(this.context, this.selection, type);
            //禁用canvas之前绑定的事件
            canvas.off();
            this.startDrag = false;
            this.startResize = false;

            resizeHandlerGroup.draw(this.selection);

            canvas.on('mousedown',
                function(e) {
                    if(!_this.startResize){
                        startResizePoint = resizeHandlerGroup.checkMouseOn(e);
                        if(startResizePoint >= 0) {
                            _this.startResize = true;
                            //拖动时隐藏对话框
                            canvas.next('.mark-dialog').hide();
                            return;
                        }
                    }
                    if(!_this.startDrag && _this.checkMouseOn(e)) {
                        //开始拖动
                        _this.startDrag = true;
                        //记录拖动的起点
                        startDragPoint.x1 = e.offsetX || (e.clientX - $(e.target).offset().left);
                        startDragPoint.y1 = e.offsetY || (e.clientY - $(e.target).offset().top);
                        //拖动时隐藏对话框
                        canvas.next('.mark-dialog').hide();
                    } 
                }).on('mousemove',
                function(e) {
                    var mouseX = e.offsetX || (e.clientX - $(e.target).offset().left),
                        mouseY = e.offsetY || (e.clientY - $(e.target).offset().top);
                    if (_this.startDrag) {
                        //记录拖动终点
                        startDragPoint.x2 = mouseX;
                        startDragPoint.y2 = mouseY;
                        //计算本次拖动的偏移量
                        var offsetX = startDragPoint.x2 - startDragPoint.x1,
                            offsetY = startDragPoint.y2 - startDragPoint.y1;
                        //重新计算绘制位置
                        _this.selection.x1 = originSelection.x1 + offsetX;
                        _this.selection.x2 = originSelection.x2 + offsetX;
                        _this.selection.y1 = originSelection.y1 + offsetY;
                        _this.selection.y2 = originSelection.y2 + offsetY;

                        _this.clear();
                        _this.refreshStyle();
                        _this.onDraw(_this.context, _this.selection);
                        resizeHandlerGroup.draw(_this.selection);
                    } else if(_this.startResize) {
                        switch(startResizePoint) {
                            case 0:
                                _this.selection.x1 = mouseX;
                                _this.selection.y1 = mouseY;
                                break;
                            case 1:
                                _this.selection.x2 = mouseX;
                                _this.selection.y1 = mouseY;
                                break;
                            case 2:
                                _this.selection.x1 = mouseX;
                                _this.selection.y2 = mouseY;
                                break;
                            case 3:
                                _this.selection.x2 = mouseX;
                                _this.selection.y2 = mouseY;
                                break;
                        }
                        _this.clear();
                        _this.refreshStyle();
                        _this.onDraw(_this.context, _this.selection);
                        resizeHandlerGroup.draw(_this.selection);
                    }
                }).on('mouseup',
                function(e) {
                    if (_this.startDrag || _this.startResize) {
                        var drawData = {
                            selection: _this.selection,
                            onDraw: _this.onDraw,
                            color: $.markTools.options.color,
                            penWidth: $.markTools.options.penWidth,
                            type: _this.type
                        };
                        _this.startDrag = false;

                        //结束拖动后显示对话框
                        canvas.next('.mark-dialog').show();
                        if (_this.onFinishDraw) {
                            _this.onFinishDraw(_this, e, drawData);
                        }
                    }
                });
        };

        DrawingCanvas.prototype.checkMouseOn = function(e) {
            var mouseX = e.offsetX || (e.clientX - $(e.target).offset().left),
                mouseY = e.offsetY || (e.clientY - $(e.target).offset().top),
                x1 = this.selection.x1 < this.selection.x2 ? this.selection.x1 : this.selection.x2,
                y1 = this.selection.y1 < this.selection.y2 ? this.selection.y1 : this.selection.y2,
                w = Math.abs(this.selection.x1 - this.selection.x2),
                h = Math.abs(this.selection.y1 - this.selection.y2);
            return (mouseX >= x1 && mouseX <= x1 + w && mouseY >= y1 && mouseY <= y1 + h);
        };

        var ResizeHandlerGroup = function(context, selection, type) {
            this.context = context;
            this.selection = selection;
            this.type = type;
            this.handlerList = [
                new ResizeHandler(),
                new ResizeHandler(),
                new ResizeHandler(),
                new ResizeHandler()
            ];
            if (type === 'line') {
                this.handlerList[1].canDraw = false;
                this.handlerList[2].canDraw = false;
            }
        };

        ResizeHandlerGroup.prototype.draw = function(selection) {
            var i;
            this.handlerList[0].setPosition(selection.x1, selection.y1);
            this.handlerList[1].setPosition(selection.x2, selection.y1);
            this.handlerList[2].setPosition(selection.x1, selection.y2);
            this.handlerList[3].setPosition(selection.x2, selection.y2);
            for (i = 0; i < this.handlerList.length; i++) {
                this.handlerList[i].draw(this.context);
            }
        };

        ResizeHandlerGroup.prototype.checkMouseOn = function(e) {
            var i;
            for (i = 0; i < this.handlerList.length; i++) {
                if(this.handlerList[i].checkMouseOn(e, this.context)) {
                    return i;
                }
            }
            return -1;
        };

        var ResizeHandler = function() {
            this.canDraw = true;
        };

        ResizeHandler.prototype.setPosition = function(x, y) {
            this.x = x;
            this.y = y;
            this.r = 4;
        };

        ResizeHandler.prototype.draw = function(context) {
            if (this.canDraw) {
                context.beginPath();
                context.strokeStyle = '#fff';
                context.fillStyle = '#1977FF';
                context.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
                context.stroke();
                context.fill();
                context.closePath();
            }
        };

        ResizeHandler.prototype.checkMouseOn = function(e) {
            var mouseX = e.offsetX || (e.clientX - $(e.target).offset().left),
                mouseY = e.offsetY || (e.clientY - $(e.target).offset().top),
                rOffset = 4;
            return (mouseX >= this.x - (this.r + rOffset) && mouseX <= this.x + (this.r + rOffset) && 
                mouseY >= this.y - (this.r + rOffset) && mouseY <= this.y + (this.r + rOffset));
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
                'color-picker': {
                    type: 'color-picker',
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
                    $callObject.on('click', function(e) {
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
                var btnRect = new ToolButton(toolsMap['region'], $this),
                    stylePicker = new StylePicker($this);

                btnRect.onPress = function() {
                    var onDraw = options.onDrawFuncMap['rect'],
                        onFinishDraw = function(drawingCanvas, e, drawData) {
                            //获取鼠标偏移量，显示并定位对话框
                            var offset = getMouseOffset($callObject, e),
                                $canvas = drawingCanvas.$dom,
                                margin = drawingCanvas.margin;
                            offset.left = drawData.selection.x2 - (drawData.selection.x2 - drawData.selection.x1) / 2;
                            offset.top = drawData.selection.y2 + (drawData.selection.y2 > drawData.selection.y1 ? 0 :
                                drawData.selection.y1 - drawData.selection.y2);

                            $.markTools.cache.drawData = drawData;
                            $.markTools.cache.offset = offset;
                            drawingCanvas.activeEdit('rect');
                            if (!drawingCanvas.$dom.next('.mark-dialog').exists()) {
                                $.markTools.$callObject.append(showMarkDialog(offset));
                            } else {
                                setOffset(drawingCanvas.$dom.next('.mark-dialog'), offset);
                            }

                            //弹起按钮
                            btnRect.popup();
                        };

                    drawingCanvas = new DrawingCanvas($callObject, onDraw, onFinishDraw, 'rect');
                    $callObject.append(drawingCanvas.$dom);
                };
                toolButtonContainer.add(btnRect);
            }

            if (options.showEllipse) {
                var btnEllipse = new ToolButton(toolsMap['ellipse'], $this),
                    stylePicker = new StylePicker($this);

                btnEllipse.onPress = function() {
                    var onDraw = options.onDrawFuncMap['ellipse'],
                        onFinishDraw = function(drawingCanvas, e, drawData) {
                            //获取鼠标偏移量，显示并定位对话框
                            var offset = getMouseOffset($callObject, e),
                                $canvas = drawingCanvas.$dom,
                                margin = drawingCanvas.margin;
                            offset.left = drawData.selection.x2 - (drawData.selection.x2 - drawData.selection.x1) / 2;
                            offset.top = drawData.selection.y2 + (drawData.selection.y2 > drawData.selection.y1 ? 0 :
                                drawData.selection.y1 - drawData.selection.y2);

                            $.markTools.cache.drawData = drawData;
                            $.markTools.cache.offset = offset;
                            drawingCanvas.activeEdit('ellipse');
                            if (!drawingCanvas.$dom.next('.mark-dialog').exists()) {
                                $.markTools.$callObject.append(showMarkDialog(offset));
                            } else {
                                setOffset(drawingCanvas.$dom.next('.mark-dialog'), offset);
                            }

                            //弹起按钮
                            btnEllipse.popup();
                        };
                    drawingCanvas = new DrawingCanvas($callObject, onDraw, onFinishDraw, 'ellipse');
                    $callObject.append(drawingCanvas.$dom);
                };
                toolButtonContainer.add(btnEllipse);
            }

            if (options.showLine) {
                var btnLine = new ToolButton(toolsMap['line'], $this),
                    stylePicker = new StylePicker($this);

                btnLine.onPress = function() {
                    var onDraw = options.onDrawFuncMap['line'],
                        onFinishDraw = function(drawingCanvas, e, drawData) {
                            //获取鼠标偏移量，显示并定位对话框
                            var offset = getMouseOffset($callObject, e),
                                originOffset = getMouseOffset($callObject, e),
                                $canvas = drawingCanvas.$dom,
                                margin = drawingCanvas.margin;
                            offset.left = drawData.selection.x2 - (drawData.selection.x2 - drawData.selection.x1) / 2;
                            offset.top = drawData.selection.y2 + (drawData.selection.y2 > drawData.selection.y1 ? 0 :
                                drawData.selection.y1 - drawData.selection.y2);

                            $.markTools.cache.drawData = drawData;
                            $.markTools.cache.offset = offset;
                            $.markTools.cache.changeSelection = function(selection) {
                                var margin = $.markTools.options.canvasMargin,
                                    flagX = selection.x2 > selection.x1,
                                    flagY = selection.y2 > selection.y1,
                                    width = Math.abs(selection.x2 - selection.x1) + margin,
                                    height = Math.abs(selection.y2 - selection.y1) + margin;
                                selection.x1 = flagX ? margin : width;
                                selection.x2 = flagX ? width : margin;
                                selection.y1 = flagY ? margin : height;
                                selection.y2 = flagY ? height : margin;
                            };
                            drawingCanvas.activeEdit('line');
                            if (!drawingCanvas.$dom.next('.mark-dialog').exists()) {
                                $.markTools.$callObject.append(showMarkDialog(offset));
                            } else {
                                setOffset(drawingCanvas.$dom.next('.mark-dialog'), offset);
                            }

                            //弹起按钮
                            btnLine.popup();
                        };
                    drawingCanvas = new DrawingCanvas($callObject, onDraw, onFinishDraw, 'line');
                    $callObject.append(drawingCanvas.$dom);
                };
                toolButtonContainer.add(btnLine);
            }

            if (true) {
                var btnColorPicker = new ToolButton(toolsMap['color-picker'], $this),
                    stylePicker = new StylePicker($this);
                btnColorPicker.$dom.append('<div class="color-show-block"></div>');

                btnColorPicker.onPress = function() {
                    btnColorPicker.addStylePicker(stylePicker);
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
                    //$(this)为按钮，上1级父节点的前一节点即mark-container
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
                        $markObject,
                        offset, drawData, changeSelection;
                    if (title.trim() == '' || description.trim() == '') {
                        // alert('Title and description cannot be empty.');
                        // return;
                    }

                    offset = $.markTools.cache.offset;
                    drawData = $.markTools.cache.drawData;
                    changeSelection = $.markTools.cache.changeSelection;
                    $markObject = $markDialog.prev();

                    if (drawData !== undefined) {
                        $markObject = $.markTools.createCanvas($markObject, offset, drawData, changeSelection);
                        //将canvas转换为静态canvas（绘画canvas拥有相对最高的z-index）
                        $markObject.removeClass('draw-canvas').addClass('static-canvas');
                        $markObject.off();
                    }

                    $markDialog.remove();
                    $title.val('');
                    $description.val('');

                    var markType = $markObject.hasClass('static-pin') ?
                        'pin' : $markObject.attr('mark-type');

                    var markData = {
                        title: title,
                        description: description,
                        type: markType,
                        color: $.markTools.options.color,
                        mouseX: parseInt($markObject.css('left')),
                        mouseY: parseInt($markObject.css('top')),
                        width: markType === 'pin' ? 0 : $markObject.width(),
                        height: markType === 'pin' ? 0 : $markObject.height()
                    };

                    //触发保存mark时的自定义方法
                    if (options.onSaveMark) {
                        options.onSaveMark($markObject, $markBox, markData);
                    } else {
                        //创建新的markBox
                        $markBox = $.markTools.createMarkBox(markData, $markBoxTemplate);
                        $.markTools.bindMarkAndBox($markObject, $markBox);
                    }

                    $.markTools.cache.drawData = undefined;
                    $.markTools.cache.offset = undefined;
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
            onSaveMark: null,
            onCancelMark: null,
            onClickMark: null,
            onToolButtonActivated: function() {},

            onDrawFuncMap: {
                rect: function(context, selection) {
                    context.strokeRect(selection.x1, selection.y1,
                        selection.x2 - selection.x1, selection.y2 - selection.y1);
                },
                ellipse: function(context, selection) {
                    //使用三次贝塞尔曲线模拟椭圆
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
                line: function(context, selection) {
                    context.beginPath();
                    context.moveTo(selection.x1, selection.y1);
                    context.lineTo(selection.x2, selection.y2);
                    context.closePath();
                    context.stroke();
                }
            }
        },
        cache: {
            userStartDraw: false
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
            $newMark = divWithClass('static-pin');
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
                options = $.markTools.options,
                width = Math.abs(data.selection.x2 - data.selection.x1) + options.canvasMargin * 2,
                height = Math.abs(data.selection.y2 - data.selection.y1) + options.canvasMargin * 2,
                onDraw = options.onDrawFuncMap[data.type] || data.onDraw;
            $canvas.attr('width', width).attr('height', height);
            $canvas.attr('mark-type', data.type);

            context.clearRect(0, 0, width, height);
            context.strokeStyle = data.color;
            context.lineWidth = options.penWidth;

            if (changeSelection !== undefined) {
                changeSelection(data.selection);
            } else {
                data.selection.x2 = width - options.canvasMargin;
                data.selection.y2 = height - options.canvasMargin;
                data.selection.x1 = options.canvasMargin;
                data.selection.y1 = options.canvasMargin;
            }

            onDraw(context, data.selection);

            if ($canvas && offset) {
                setOffset($canvas, {
                    left: offset.left,
                    top: offset.top + options.canvasMargin
                });
            }
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

            $markObj.on('click', function() {
                $markBox.fadeToggle();
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