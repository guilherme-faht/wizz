(function($) {
    
    var 
        _parent, _steps, _gui, _agent, _pos;
    
    $.fn.wizz = function(options) {
                
         var settings = $.extend({
            // These are the defaults.
            color: "#556b2f",
            backgroundColor: "white"
        }, options ); 
        
        init();
        
        return this;
    };
    
    function init(){
                
        wizz.load('Merlin', function(agent){
           
            _steps  = [];
            _pos    = 0;
            _agent  = agent;
            
            loadSteps();
            loadGUI();
            
            _agent.show();
            _agent.moveTo((window.innerWidth/2)-64, (window.innerHeight/2)-64);
            _agent.speak('Olá! Eu posso ajudar você! Vamos começar?');
            
            var left = $(window).width() * 0.8;
            var top = ($(window).height() + $(document).scrollTop()) * 0.8;
            _agent.moveTo(left, top);
            _agent.speak('Utilize a barra de navegação ao lado para conhecer cada uma das funcionalidades dessa tela.');
        });
    }
    
    function loadSteps(){
        
        $(document).find('[data-wizz-step]').each(function(i,v){
            _steps.push(v);
        });
    }
    
    function loadGUI() {
        
        _gui = new GUI();
        _gui.addClickPreviousHandler(function(){
            previous();
        });
        _gui.addClickNextHandler(function(){
            next();
        });
    }
    
    function hasPrevious(){
        
        for(var i = 0; i < _steps.length; i++){
            if($(_steps[i]).data('wizz-step') == (_pos - 1)) {
                return true;
            }
        }
        
        return false;
    }

    function hasNext(){
        
        for(var i = 0; i < _steps.length; i++){
            if($(_steps[i]).data('wizz-step') == (_pos + 1)) {
                return true;
            }
        }
        
        return false;
    }     

    function previous(){
        
        _pos--;
        
        for(var i = 0; i < _steps.length; i++){
            if($(_steps[i]).data('wizz-step') == _pos) {
                stepFocusIn(_steps[i]);
                stepSpeak(_steps[i]);
            } else {
                stepFocusOut(_steps[i]);  
            }
        }
    }
    
    function next(){
        
        _pos++;
        
        for(var i = 0; i < _steps.length; i++){
            if($(_steps[i]).data('wizz-step') == _pos) {
                stepFocusIn(_steps[i]);
                stepSpeak(_steps[i]);
            } else {
                stepFocusOut(_steps[i]);  
            }
        }
    }
    
    function stepFocusIn(el){
        
        var 
            offset = $(el).offset().top - $(window).scrollTop(),
            rect = el.getBoundingClientRect();
        
        if(offset > window.innerHeight || offset < 0){
            $('html,body').animate({scrollTop: offset}, 1000);
        }
        
        el.style.zIndex = '9998';
        el.style.position = 'relative';
    }
        
    function stepFocusOut(el) {

        el.style.zIndex = 'auto';
        el.style.position = 'relative';
    }
    
    function stepSpeak(el){
        if($(el).data('wizz-speak')){
            _agent.stopCurrent();
            _agent.speak($(el).data('wizz-speak'));
        }
    }
    
    function GUI(){
        
        var 
            bg = document.createElement('div'),
            mb = document.createElement('div'),
            iplay = document.createElement('i'),
            play = document.createElement('a'),
            inext = document.createElement('i'),
            next = document.createElement('a'),
            iprevious = document.createElement('i'),
            previous = document.createElement('a');
      
        // backgroud
        bg.id = 'wizz-background';
        bg.style.position = 'fixed';
        bg.style.left = '0';
        bg.style.top = '0';
        bg.style.width = '100%';
        bg.style.height = '100%';
        bg.style.backgroundColor = 'rgb(0,0,0)';
        bg.style.backgroundColor = 'rgba(0,0,0,0.4)';
        bg.style.zIndex = '9997';
        bg.style.overflow = 'auto';
        document.body.appendChild(bg);
        
        // menubar
        mb.id = 'wizz-bar';
        mb.style.background = 'white';
        mb.style.position = 'fixed';
        mb.style.right = '0';
        mb.style.bottom = '0';
        mb.style.zIndex = '9999';
        document.body.appendChild(mb);
        
        iplay.className = 'fa fa-play';
        play.appendChild(iplay);
        play.className = 'btn btn-default';
        mb.appendChild(play);
        
        iprevious.className = 'fa fa-backward';
        previous.appendChild(iprevious);
        previous.className = 'btn btn-default';
        mb.appendChild(previous);
        
        inext.className = 'fa fa-forward';
        next.appendChild(inext);
        next.className = 'btn btn-default';
        mb.appendChild(next);
        
        this.addClickPreviousHandler = function(callback){
            previous.addEventListener('click', callback);
        };
        
        this.addClickNextHandler = function(callback){
            next.addEventListener('click', callback);
        };
        
        this.disableNext = function(){
            previous.className = 'btn btn-default disabled';
        };
    }
    
    var wizz = {};
    
    /**
     * @constructor
     */
    wizz.Agent = function (path, data, sounds) {
        
        this.path = path;

        this._queue = new wizz.Queue($.proxy(this._onQueueEmpty, this));

        this._el = $('<div class="wizz"></div>').hide();

        $(document.body).append(this._el);

        this._animator = new wizz.Animator(this._el, path, data, sounds);

        this._balloon = new wizz.Balloon(this._el);

        this._setupEvents();
    };

    wizz.Agent.prototype = {

        /**
         * @param {Number} x
         * @param {Number} y
         */
        gestureAt:function (x, y) {
            var d = this._getDirection(x, y);
            var gAnim = 'Gesture' + d;
            var lookAnim = 'Look' + d;

            var animation = this.hasAnimation(gAnim) ? gAnim : lookAnim;
            return this.play(animation);
        },

        /**
         * @param {Boolean=} fast
         */
        hide:function (fast, callback) {
            
            this._addToQueue(function (complete) {
                this._hidden = true;
                var el = this._el;
                this.stop();
                if (fast) {
                    this._el.hide();
                    this.stop();
                    this.pause();
                    if (callback) callback();
                    return;
                }

                return this._playInternal('Hide', function () {
                    el.hide();
                    this.pause();
                    if (callback) callback();
                })
            }, this);
        },

        moveTo:function (x, y, duration) {
                        
            var dir = this._getDirection(x, y);
            var anim = 'Move' + dir;
            if (duration === undefined) duration = 1000;

            this._addToQueue(function (complete) {
                // the simple case
                if (duration === 0) {
                    this._el.css({top:y, left:x});
                    this.reposition();
                    complete();
                    return;
                }

                // no animations
                if (!this.hasAnimation(anim)) {
                    this._el.animate({top:y, left:x}, duration, complete);
                    return;
                }

                var callback = $.proxy(function (name, state) {
                    // when exited, complete
                    if (state === wizz.Animator.States.EXITED) {
                        complete();
                    }
                    // if waiting,
                    if (state === wizz.Animator.States.WAITING) {
                        this._el.animate({top:y, left:x}, duration, $.proxy(function () {
                            // after we're done with the movement, do the exit animation
                            this._animator.exitAnimation();
                        }, this));
                    }

                }, this);

                this._playInternal(anim, callback);
            }, this);
        },

        _playInternal:function (animation, callback) {

            // if we're inside an idle animation,
            if (this._isIdleAnimation() && this._idleDfd && this._idleDfd.state() === 'pending') {
                this._idleDfd.done($.proxy(function () {
                    this._playInternal(animation, callback);
                }, this))
            }

            this._animator.showAnimation(animation, callback);
        },

        play:function (animation, timeout, cb) {
            
            if (!this.hasAnimation(animation)) return false;

            if (timeout === undefined) timeout = 5000;


            this._addToQueue(function (complete) {
                var completed = false;
                // handle callback
                var callback = function (name, state) {
                    if (state === wizz.Animator.States.EXITED) {
                        completed = true;
                        if (cb) cb();
                        complete();
                    }
                };

                // if has timeout, register a timeout function
                if (timeout) {
                    window.setTimeout($.proxy(function () {
                        if (completed) return;
                        // exit after timeout
                        this._animator.exitAnimation();
                    }, this), timeout)
                }

                this._playInternal(animation, callback);
            }, this);

            return true;
        },

        /**
         * @param {Boolean=} fast
         */
        show:function (fast) {
            
            this._hidden = false;
            if (fast) {
                this._el.show();
                this.resume();
                this._onQueueEmpty();
                return;
            }

            if (this._el.css('top') === 'auto' || !this._el.css('left') === 'auto') {
                var left = $(window).width() * 0.8;
                var top = ($(window).height() + $(document).scrollTop()) * 0.8;
                this._el.css({top:top, left:left});
            }

            this.resume();
            return this.play('Show');
        },
        
        /**
         * @param {String} text
         */
        speak:function (text, hold) {
            
            this._addToQueue(function (complete) {
                this._balloon.speak(complete, text, hold);
            }, this);
        },

        /**
         * Close the current balloon
         */
        closeBalloon:function(){
            
            this._balloon.hide();
        },

        delay:function(time){
            
            time = time || 250;

            this._addToQueue(function (complete) {
                this._onQueueEmpty();
                window.setTimeout(complete, time);
            });
        },

        /**
         * Skips the current animation
         */
        stopCurrent:function(){
            
            this._animator.exitAnimation();
            this._balloon.close();
        },

        stop:function(){
            
            // clear the queue
            this._queue.clear();
            this._animator.exitAnimation();
            this._balloon.hide();
        },

        /**
         * @param {String} name
         * @returns {Boolean}
         */
        hasAnimation:function(name){
            
            return this._animator.hasAnimation(name);
        },

        /**
         * Gets a list of animation names
         * @return {Array.<string>}
         */
        animations:function(){
            
            return this._animator.animations();
        },

        /**
         * Play a random animation
         * @return {jQuery.Deferred}
         */
        animate:function(){
            
            var animations = this.animations();
            var anim = animations[Math.floor(Math.random() * animations.length)];
            
            // skip idle animations
            if (anim.indexOf('Idle') === 0) {
                return this.animate();
            }
            
            return this.play(anim);
        },

        /**
         * @param {Number} x
         * @param {Number} y
         * @return {String}
         * @private
         */
        _getDirection:function(x, y){
            
            var offset = this._el.offset();
            var h = this._el.height();
            var w = this._el.width();

            var centerX = (offset.left + w / 2);
            var centerY = (offset.top + h / 2);


            var a = centerY - y;
            var b = centerX - x;

            var r = Math.round((180 * Math.atan2(a, b)) / Math.PI);

            // Left and Right are for the character, not the screen :-/
            if (-45 <= r && r < 45) return 'Right';
            if (45 <= r && r < 135) return 'Up';
            if (135 <= r && r <= 180 || -180 <= r && r < -135) return 'Left';
            if (-135 <= r && r < -45) return 'Down';

            // sanity check
            return 'Top';
        },

        /**
         * Handle empty queue.
         * We need to transition the animation to an idle state
         * @private
         */
        _onQueueEmpty:function(){
            
            if (this._hidden || this._isIdleAnimation()) return;
            var idleAnim = this._getIdleAnimation();
            this._idleDfd = $.Deferred();

            this._animator.showAnimation(idleAnim, $.proxy(this._onIdleComplete, this));
        },

        _onIdleComplete:function(name, state){
            
            if (state === wizz.Animator.States.EXITED) {
                this._idleDfd.resolve();
            }
        },

        /**
         * Is the current animation is Idle?
         * @return {Boolean}
         * @private
         */
        _isIdleAnimation:function(){
            
            var c = this._animator.currentAnimationName;
            return c && c.indexOf('Idle') === 0;
        },

        /**
         * Gets a random Idle animation
         * @return {String}
         * @private
         */
        _getIdleAnimation:function(){
            
            var animations = this.animations();
            var r = [];
            
            for (var i = 0; i < animations.length; i++) {
                var a = animations[i];
                if (a.indexOf('Idle') === 0) {
                    r.push(a);
                }
            }

            // pick one
            var idx = Math.floor(Math.random() * r.length);
            return r[idx];
        },

        _setupEvents:function(){
            
            $(window).on('resize', $.proxy(this.reposition, this));

            this._el.on('mousedown', $.proxy(this._onMouseDown, this));

            this._el.on('dblclick', $.proxy(this._onDoubleClick, this));
        },

        _onDoubleClick:function(){
            
            if (!this.play('ClickedOn')) {
                this.animate();
            }
        },

        reposition:function(){
            
            if (!this._el.is(':visible')) return;
            var o = this._el.offset();
            var bH = this._el.outerHeight();
            var bW = this._el.outerWidth();

            var wW = $(window).width();
            var wH = $(window).height();
            var sT = $(window).scrollTop();
            var sL = $(window).scrollLeft();

            var top = o.top - sT;
            var left = o.left - sL;
            var m = 5;
            if (top - m < 0) {
                top = m;
            } else if ((top + bH + m) > wH) {
                top = wH - bH - m;
            }

            if (left - m < 0) {
                left = m;
            } else if (left + bW + m > wW) {
                left = wW - bW - m;
            }

            this._el.css({left:left, top:top});
            // reposition balloon
            this._balloon.reposition();
        },

        _onMouseDown:function(e){
            
            e.preventDefault();
            this._startDrag(e);
        },

        _startDrag:function(e){
            
            // pause animations
            this.pause();
            this._balloon.hide(true);
            this._offset = this._calculateClickOffset(e);

            this._moveHandle = $.proxy(this._dragMove, this);
            this._upHandle = $.proxy(this._finishDrag, this);

            $(window).on('mousemove', this._moveHandle);
            $(window).on('mouseup', this._upHandle);

            this._dragUpdateLoop = window.setTimeout($.proxy(this._updateLocation, this), 10);
        },

        _calculateClickOffset:function (e) {
            var mouseX = e.pageX;
            var mouseY = e.pageY;
            var o = this._el.offset();
            return {
                top:mouseY - o.top,
                left:mouseX - o.left
            }

        },

        _updateLocation:function () {
            this._el.css({top:this._targetY, left:this._taregtX});
            this._dragUpdateLoop = window.setTimeout($.proxy(this._updateLocation, this), 10);
        },

        _dragMove:function (e) {
            e.preventDefault();
            var x = e.clientX - this._offset.left;
            var y = e.clientY - this._offset.top;
            this._taregtX = x;
            this._targetY = y;
        },

        _finishDrag:function () {
            window.clearTimeout(this._dragUpdateLoop);
            // remove handles
            $(window).off('mousemove', this._moveHandle);
            $(window).off('mouseup', this._upHandle);
            // resume animations
            this._balloon.show();
            this.reposition();
            this.resume();

        },

        _addToQueue:function (func, scope) {
            if (scope) func = $.proxy(func, scope);
            this._queue.queue(func);
        },

        pause:function () {
            this._animator.pause();
            this._balloon.pause();

        },

        resume:function () {
            this._animator.resume();
            this._balloon.resume();
        }

    };

    /**
     * @constructor
     */
    wizz.Animator = function (el, path, data, sounds) {
        
        this._el = el;
        this._data = data;
        this._path = path;
        this._currentFrameIndex = 0;
        this._currentFrame = undefined;
        this._exiting = false;
        this._currentAnimation = undefined;
        this._endCallback = undefined;
        this._started = false;
        this._sounds = {};
        this.currentAnimationName = undefined;
        this.preloadSounds(sounds);
        this._overlays = [this._el];
        var curr = this._el;

        this._setupElement(this._el);
        
        for (var i = 1; i < this._data.overlayCount; i++) {
            var inner = this._setupElement($('<div></div>'));

            curr.append(inner);
            this._overlays.push(inner);
            curr = inner;
        }
    };

    wizz.Animator.prototype = {
        
        _setupElement:function (el) {
            var frameSize = this._data.framesize;
            el.css('display', "none");
            el.css({width:frameSize[0], height:frameSize[1]});
            el.css('background', "url('" + this._path + "/map.png') no-repeat");

            return el;
        },

        animations:function () {
            var r = [];
            var d = this._data.animations;
            for (var n in d) {
                r.push(n);
            }
            return r;
        },

        preloadSounds:function (sounds) {

            for (var i = 0; i < this._data.sounds.length; i++) {
                var snd = this._data.sounds[i];
                var uri = sounds[snd];
                if (!uri) continue;
                this._sounds[snd] = new Audio(uri);

            }
        },
        hasAnimation:function (name) {
            return !!this._data.animations[name];
        },

        exitAnimation:function () {
            this._exiting = true;
        },


        showAnimation:function (animationName, stateChangeCallback) {
            this._exiting = false;

            if (!this.hasAnimation(animationName)) {
                return false;
            }

            this._currentAnimation = this._data.animations[animationName];
            this.currentAnimationName = animationName;


            if (!this._started) {
                this._step();
                this._started = true;
            }

            this._currentFrameIndex = 0;
            this._currentFrame = undefined;
            this._endCallback = stateChangeCallback;

            return true;
        },


        _draw:function () {
            var images = [];
            if (this._currentFrame) images = this._currentFrame.images || [];

            for (var i = 0; i < this._overlays.length; i++) {
                if (i < images.length) {
                    var xy = images[i];
                    var bg = -xy[0] + 'px ' + -xy[1] + 'px';
                    this._overlays[i].css({'background-position':bg, 'display':'block'});
                }
                else {
                    this._overlays[i].css('display', 'none');
                }

            }
        },

        _getNextAnimationFrame:function () {
            if (!this._currentAnimation) return undefined;
            // No current frame. start animation.
            if (!this._currentFrame) return 0;
            var currentFrame = this._currentFrame;
            var branching = this._currentFrame.branching;


            if (this._exiting && currentFrame.exitBranch !== undefined) {
                return currentFrame.exitBranch;
            }
            else if (branching) {
                var rnd = Math.random() * 100;
                for (var i = 0; i < branching.branches.length; i++) {
                    var branch = branching.branches[i];
                    if (rnd <= branch.weight) {
                        return branch.frameIndex;
                    }

                    rnd -= branch.weight;
                }
            }

            return this._currentFrameIndex + 1;
        },

        _playSound:function () {
            var s = this._currentFrame.sound;
            if (!s) return;
            var audio = this._sounds[s];
            if (audio) audio.play();
        },

        _atLastFrame:function () {
            return this._currentFrameIndex >= this._currentAnimation.frames.length - 1;
        },

        _step:function () {
            if (!this._currentAnimation) return;
            var newFrameIndex = Math.min(this._getNextAnimationFrame(), this._currentAnimation.frames.length - 1);
            var frameChanged = !this._currentFrame || this._currentFrameIndex !== newFrameIndex;
            this._currentFrameIndex = newFrameIndex;

            // always switch frame data, unless we're at the last frame of an animation with a useExitBranching flag.
            if (!(this._atLastFrame() && this._currentAnimation.useExitBranching)) {
                this._currentFrame = this._currentAnimation.frames[this._currentFrameIndex];
            }

            this._draw();
            this._playSound();

            this._loop = window.setTimeout($.proxy(this._step, this), this._currentFrame.duration);


            // fire events if the frames changed and we reached an end
            if (this._endCallback && frameChanged && this._atLastFrame()) {
                if (this._currentAnimation.useExitBranching && !this._exiting) {
                    this._endCallback(this.currentAnimationName, wizz.Animator.States.WAITING);
                }
                else {
                    this._endCallback(this.currentAnimationName, wizz.Animator.States.EXITED);
                }
            }
        },

        /**
         * Pause animation execution
         */
        pause:function () {
            window.clearTimeout(this._loop);
        },

        /**
         * Resume animation
         */
        resume:function () {
            this._step();
        }
    };

    wizz.Animator.States = { WAITING:1, EXITED:0 };

    /**
     * @constructor
     */
    wizz.Balloon = function (targetEl) {
        this._targetEl = targetEl;

        this._hidden = true;
        this._setup();
    };

    wizz.Balloon.prototype = {

        WORD_SPEAK_TIME:320,
        CLOSE_BALLOON_DELAY:2000,

        _setup:function () {

            this._balloon = $('<div class="wizz-balloon"><div class="wizz-tip"></div><div class="wizz-content"></div></div> ').hide();
            this._content = this._balloon.find('.wizz-content');

            $(document.body).append(this._balloon);
        },

        reposition:function () {
            var sides = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

            for (var i = 0; i < sides.length; i++) {
                var s = sides[i];
                this._position(s);
                if (!this._isOut()) break;
            }
        },

        _BALLOON_MARGIN:15,

        /***
         *
         * @param side
         * @private
         */
        _position:function (side) {
            var o = this._targetEl.offset();
            var h = this._targetEl.height();
            var w = this._targetEl.width();

            var bH = this._balloon.outerHeight();
            var bW = this._balloon.outerWidth();

            this._balloon.removeClass('wizz-top-left');
            this._balloon.removeClass('wizz-top-right');
            this._balloon.removeClass('wizz-bottom-right');
            this._balloon.removeClass('wizz-bottom-left');

            var left, top;
            switch (side) {
                case 'top-left':
                    // right side of the balloon next to the right side of the agent
                    left = o.left + w - bW;
                    top = o.top - bH - this._BALLOON_MARGIN;
                    break;
                case 'top-right':
                    // left side of the balloon next to the left side of the agent
                    left = o.left;
                    top = o.top - bH - this._BALLOON_MARGIN;
                    break;
                case 'bottom-right':
                    // right side of the balloon next to the right side of the agent
                    left = o.left;
                    top = o.top + h + this._BALLOON_MARGIN;
                    break;
                case 'bottom-left':
                    // left side of the balloon next to the left side of the agent
                    left = o.left + w - bW;
                    top = o.top + h + this._BALLOON_MARGIN;
                    break;
            }

            this._balloon.css({top:top, left:left});
            this._balloon.addClass('wizz-' + side);
        },

        _isOut:function () {
            var o = this._balloon.offset();
            var bH = this._balloon.outerHeight();
            var bW = this._balloon.outerWidth();

            var wW = $(window).width();
            var wH = $(window).height();
            var sT = $(document).scrollTop();
            var sL = $(document).scrollLeft();

            var top = o.top - sT;
            var left = o.left - sL;
            var m = 5;
            if (top - m < 0 || left - m < 0) return true;
            if ((top + bH + m) > wH || (left + bW + m) > wW) return true;

            return false;
        },

        speak:function (complete, text, hold) {
            this._hidden = false;
            this.show();
            var c = this._content;
            // set height to auto
            c.height('auto');
            c.width('auto');
            // add the text
            c.text(text);
            // set height
            c.height(c.height());
            c.width(c.width());
            c.text('');
            this.reposition();

            this._complete = complete;
            this._sayWords(text, hold, complete);
        },

        show:function () {
            if (this._hidden) return;
            this._balloon.show();
        },

        hide:function (fast) {
            if (fast) {
                this._balloon.hide();
                return;
            }

            this._hiding = window.setTimeout($.proxy(this._finishHideBalloon, this), this.CLOSE_BALLOON_DELAY);
        },

        _finishHideBalloon:function () {
            if (this._active) return;
            this._balloon.hide();
            this._hidden = true;
            this._hiding = null;
        },

        _sayWords:function (text, hold, complete) {
            this._active = true;
            this._hold = hold;
            var words = text.split(/[^\S-]/);
            var time = this.WORD_SPEAK_TIME;
            var el = this._content;
            var idx = 1;


            this._addWord = $.proxy(function () {
                if (!this._active) return;
                if (idx > words.length) {
                    this._active = false;
                    if (!this._hold) {
                        complete();
                        this.hide();
                    }
                } else {
                    el.text(words.slice(0, idx).join(' '));
                    idx++;
                    this._loop = window.setTimeout($.proxy(this._addWord, this), time);
                }
            }, this);

            this._addWord();

        },

        close:function () {
            if (this._active) {
                this._hold = false;
            } else if (this._hold) {
                this._complete();
            }
        },

        pause:function () {
            window.clearTimeout(this._loop);
            if (this._hiding) {
                window.clearTimeout(this._hiding);
                this._hiding = null;
            }
        },

        resume:function () {
            if (this._addWord)  this._addWord();
            this._hiding = window.setTimeout($.proxy(this._finishHideBalloon, this), this.CLOSE_BALLOON_DELAY);
        }
    };

    wizz.BASE_PATH = 'http://127.0.0.1/projetos/wizz/src/agents/';

    wizz.load = function (name, successCb, failCb) {
        
        var path = wizz.BASE_PATH + name;

        var mapDfd = wizz.load._loadMap(path);
        var agentDfd = wizz.load._loadAgent(name, path);
        var soundsDfd = wizz.load._loadSounds(name, path);

        var data;
        agentDfd.done(function (d) {
            data = d;
        });

        var sounds;

        soundsDfd.done(function (d) {
            sounds = d;
        });

        // wrapper to the success callback
        var cb = function () {
            var a = new wizz.Agent(path, data,sounds);
            successCb(a);
        };

        $.when(mapDfd, agentDfd, soundsDfd).done(cb).fail(failCb);
    };

    wizz.load._maps = {};
    wizz.load._loadMap = function (path) {
        var dfd = wizz.load._maps[path];
        if (dfd) return dfd;

        // set dfd if not defined
        dfd = wizz.load._maps[path] = $.Deferred();

        var src = path + '/map.png';
        var img = new Image();

        img.onload = dfd.resolve;
        img.onerror = dfd.reject;

        // start loading the map;
        img.setAttribute('src', src);

        return dfd.promise();
    };

    wizz.load._sounds = {};

    wizz.load._loadSounds = function (name, path) {
        var dfd = wizz.load._sounds[name];
        if (dfd) return dfd;

        // set dfd if not defined
        dfd = wizz.load._sounds[name] = $.Deferred();

        var audio = document.createElement('audio');
        var canPlayMp3 = !!audio.canPlayType && "" != audio.canPlayType('audio/mpeg');
        var canPlayOgg = !!audio.canPlayType && "" != audio.canPlayType('audio/ogg; codecs="vorbis"');

        if (!canPlayMp3 && !canPlayOgg) {
            dfd.resolve({});
        } else {
            var src = path + (canPlayMp3 ? '/sounds-mp3.js' : '/sounds-ogg.js');
            // load
            wizz.load._loadScript(src);
        }

        return dfd.promise()
    };


    wizz.load._data = {};
    wizz.load._loadAgent = function (name, path) {
        var dfd = wizz.load._data[name];
        if (dfd) return dfd;

        dfd = wizz.load._getAgentDfd(name);

        var src = path + '/agent.js';

        wizz.load._loadScript(src);

        return dfd.promise();
    };

    wizz.load._loadScript = function (src) {
        var script = document.createElement('script');
        script.setAttribute('src', src);
        script.setAttribute('async', 'async');
        script.setAttribute('type', 'text/javascript');

        document.head.appendChild(script);
    };

    wizz.load._getAgentDfd = function (name) {
        var dfd = wizz.load._data[name];
        if (!dfd) {
            dfd = wizz.load._data[name] = $.Deferred();
        }
        return dfd;
    };

    $.fn.ready = function (name, data) {
        var dfd = wizz.load._getAgentDfd(name);
        dfd.resolve(data);
    };

    $.fn.soundsReady = function (name, data) {
        var dfd = wizz.load._sounds[name];
        if (!dfd) {
            dfd = wizz.load._sounds[name] = $.Deferred();
        }

        dfd.resolve(data);
    };

    /**
     * @constructor
     */
    wizz.Queue = function (onEmptyCallback) {
        this._queue = [];
        this._onEmptyCallback = onEmptyCallback;
    };

    wizz.Queue.prototype = {
        /***
         *
         * @param {function(Function)} func
         * @returns {jQuery.Deferred}
         */
        queue:function (func) {
            this._queue.push(func);

            if (this._queue.length === 1 && !this._active) {
                this._progressQueue();
            }
        },

        _progressQueue:function () {

            // stop if nothing left in queue
            if (!this._queue.length) {
                this._onEmptyCallback();
                return;
            }

            var f = this._queue.shift();
            this._active = true;

            // execute function
            var completeFunction = $.proxy(this.next, this);
            f(completeFunction);
        },

        clear:function () {
            this._queue = [];
        },

        next:function () {
            this._active = false;
            this._progressQueue();
        }
    };
    
}(jQuery));