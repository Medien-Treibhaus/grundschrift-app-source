enyo.kind({
    name:'Grundschrift.Views.LevelMenu',
    kind:'Grundschrift.Views.BaseView',

    classes:'levelMenu',

    published:{
        /**
         * All levels
         */
        levels:[],
        /**
         * The current childs sessions
         */
        sessions:[],
        /**
         * The current child
         */
        child:'',
        /**
         * All level categories
         */
        categories:[],
        /**
         * The current level category
         */
        category:-1,


        selectedLevel:-1,

        sessionCountMax:5
    },

    events:{
        /**
         * Is triggered when a level is selected
         */
        onLevelSelected:'',
        /**
         * Is triggered when the back button is tapped
         */
        onBack:'',

        onRememberMeTap:''
    },

    handlers:{
        onLevelsLoaded:'levelsLoaded',
        onSessionsLoaded:'sessionsLoaded',
        onSettingsLoaded:'settingsLoaded'
    },

    components:[
        {kind:'FittableColumns', fit:true, components:[

            {kind:"FittableRows", style:"width:25%;", components:[
                {kind:'onyx.Toolbar', classes:'sideBarHeader', components:[
                    {kind:'ImageButton', type:'Exit', ontap:'doBack'},
                    {kind:'ImageButton', name:'rememberMeButton', showing:false, type:'rememberMe', ontap:'rememberMeTap'}
                ]},
                {classes:'sideBarContent', fit:true, kind:'FittableRows', components:[
                    {
                        name:'categoryMenu',
                        onItemTap:'categoryTap',
                        rows:0,
                        noGrid:true,
                        fit:true,
                        kind:'Grundschrift.Views.GridList',
                        onSetupItem:'categorySetupItem',
                        classes:'categoryMenu',
                        components:[
                            {name:'categoryMenuItem', components:[
                                {kind:'Image', name:'categoryImage'}
                            ]}
                        ]
                    }
                ]}
            ]},

            {
                name:'levelGrid',
                kind:'Grundschrift.Views.GridList',
                onSetupItem:'levelSetupItem',
                classes:'levelGrid',
                onItemTap:'levelTap',
                rows:0,
                style:"width:75%",
                minItemWidth:200,
                components:[
                    {kind:'Grundschrift.Views.LevelMenuItem'}
                ]
            }
        ]}
    ],

    sessionCount:{},

    setChild:function (inChild) {
        this.set("child", inChild, "childChanged");
    },

    /**
     * Sets the Hand orientation and loads the currents childs sessions
     * @protected
     * @returns void
     */
    childChanged:function () {
        this.selectedLevel = -1;
        this.setHandOrientation(this.child.leftHand === true ? 'left' : 'right');
        this.setCategory(0);
        this.bubble('onSessionsChanged');
    },

    levelsLoaded:function (inSender, inLevels) {
        this.setLevels(inLevels);
        this.setCategories(Grundschrift.Models.Level.getCategories(inLevels));
    },

    sessionsLoaded:function (inSender, inSessions) {
        this.setSessions(inSessions);
    },

    getLevelBy:function (comparator) {
        var level = null;
        enyo.forEach(this.levels, function (l) {
            var match = true;
            for (var p in comparator) {
                if (l[p] != comparator[p]) {
                    match = false;
                }
            }
            if (match) {
                level = l;
            }
        }, this);
        return level;
    },


    /**
     * Returns the levels unlock state
     * @param level The level to check
     * @protected
     * @returns {Boolean} The unlock state of the level
     */
    isLevelUnlocked:function (level) {
        var unlocked = true, i;
        switch (level.unlockCondition) {
            case 'upperCaseUnlocked':
                for (i = 0; i < level.name.length; i++) {
                    var uppercase = this.getLevelBy({category:'GROSSBUCHSTABEN', name:level.name[i].toUpperCase()});
                    if (uppercase && this.sessionCount[uppercase.id] < this.sessionCountMax) {
                        unlocked = false;
                        break;
                    }
                }
                return unlocked;
            case 'lowerCaseUnlocked':
                for (i = 0; i < level.name.length; i++) {
                    var lowercase = this.getLevelBy({category:'kleinbuchstaben', name:level.name[i].toLowerCase()});
                    if (lowercase && this.sessionCount[lowercase.id] < this.sessionCountMax) {
                        unlocked = false;
                        break;
                    }
                }
                return unlocked;
            case 'inChildName':
                return this.child.name.indexOf(level.name) !== -1;
            default:
                return true;
        }
    },

    /**
     * Returns the next level which is not completed
     * @param currentLevel The current level
     * @public
     * @returns {Object} An object containing a level the child and the session count of the level
     */
    getNextLevel:function (currentLevel) {
        var levels = [];
        enyo.forEach(this.levels, function (level) {
            if (level != currentLevel &&
                level.category == currentLevel.category &&
                this.isLevelUnlocked(level) &&
                this.sessionCount[level.id] < this.sessionCountMax) {
                levels.push(level);
            }

        }, this);

        levels.sort(enyo.bind(this, function (a, b) {
            if (this.sessionCount[a.id] < this.sessionCountMax &&
                this.sessionCount[b.id] < this.sessionCountMax) {
                var ca = Grundschrift.Models.Level[Grundschrift.Models.Level.sortMode](a, currentLevel);
                var cb = Grundschrift.Models.Level[Grundschrift.Models.Level.sortMode](b, currentLevel);

                if (ca < cb) {
                    return 1;
                } else if (ca > cb) {
                    return -1;
                } else {
                    return Grundschrift.Models.Level[Grundschrift.Models.Level.sortMode](a, b);
                }

            } else if (this.sessionCount[a.id] < this.sessionCountMax) {
                return -1;
            } else if (this.sessionCount[b.id] < this.sessionCountMax) {
                return 1;
            } else {
                return 0;
            }
        }));

        var level = levels.shift();

        if (level) {
            return level;
        } else {
            return null
        }

    },

    getSessionCount: function(level) {
        return this.sessionCount[level.id];
    },

    /**
     * Updates the Level grid when the category is changed
     * @protected
     * @returns void
     */
    categoryChanged:function () {
        this.$.levelGrid.update();
        this.$.levelGrid.scrollToTop();
        this.setRememberMeShowing();
    },


    setRememberMeShowing:function () {
        var showRememberMe = true;
        enyo.forEach(this.levels, function (level) {

            if (level.category == this.categories[this.category] &&
                this.sessionCount[level.id] < this.sessionCountMax) {
                showRememberMe = false;
            }
        }, this);

        this.$.rememberMeButton.setShowing(showRememberMe);
    },


    rememberMeTap:function () {
        this.bubble('onRememberMeTap', {category:this.categories[this.category]});
    },

    /**
     * Refreshes the level grid when the levels are changed
     * @protected
     * @returns void
     */
    levelsChanged:function () {
        this.bubble('onAsyncOperationStarted');
        enyo.asyncMethod(this, function () {
            this.category = 0;
            this.$.categoryMenu.refresh(this.categories.length);
            this.$.levelGrid.refresh(this.levels.length);
            this.bubble('onAsyncOperationFinished');
        });

    },

    /**
     * Computes the session count for each level
     * @protected
     * @returns void
     */
    sessionsChanged:function () {
        this.bubble('onAsyncOperationStart');
        enyo.asyncMethod(this, function () {
            var nameMap = {};

            enyo.forEach(this.levels, function (l) {
                this.sessionCount[l.id] = 0;
            }, this);

            enyo.forEach(this.sessions, function (s) {
                if (this.sessionCount[s.level.id] !== undefined && s.success) {
                    this.sessionCount[s.level.id]++;
                }
            }, this);
            this.setRememberMeShowing();
            this.$.levelGrid.update();
            this.bubble('onAsyncOperationFinished');
        });
    },

    settingsLoaded:function (inSender, inEvent) {
        if (this.sessionCountMax !== inEvent.settings.maxSessions) {
            this.sessionCountMax = inEvent.settings.maxSessions;
            this.setRememberMeShowing();
            this.$.levelGrid.update();
        }
    },

    /**
     * Setups a row for the category menu
     * @param inSender
     * @param inEvent
     * @protected
     * @returns void
     */
    categorySetupItem:function (inSender, inEvent) {
        var i = inEvent.index, row = inEvent.item;
        row.$.categoryImage.setSrc('assets/levels/' + this.categories[i] + '/category.png');
    },

    /**
     * Setups an item for the level grid
     * @protected
     * @param inSender
     * @param inEvent
     * @returns void
     */
    levelSetupItem:function (inSender, inEvent) {
        var i = inEvent.index, item = inEvent.item, level = this.levels[i];
        if (inEvent.updated !== true) {
            var image = enyo.macroize('assets/levels/{$category}/{$name}/thumbnail.png', level);
            item.$.levelMenuItem.setImage(image);
        }
        item.$.levelMenuItem.setSessionCount(this.sessionCount[level.id]);
        item.$.levelMenuItem.setSessionCountMax(this.sessionCountMax);
        item.$.levelMenuItem.setIsEnabled(this.isLevelUnlocked(level));
        item.$.levelMenuItem.setIsActive(i == this.selectedLevel);
        item.$.levelMenuItem.isEnabledChanged();
        item.$.container.setShowing(level.category === this.categories[this.category]);
        enyo.forEach(Grundschrift.Models.Level.classNames, function (levelClass) {
            item.$.levelMenuItem.addRemoveClass(levelClass, level.className == levelClass);
        }, this);

    },

    setCategory:function (inCategory) {
        this.set("category", inCategory, "categoryChanged");
    },

    /**
     * Sets the current category
     * @param inSender
     * @param inEvent
     * @returns void
     */
    categoryTap:function (inSender, inEvent) {
        this.setCategory(inEvent.item.index);
    },


    selectAndLoadLevel:function(inSender, inEvent) {
        var index = -1;
        enyo.forEach(this.levels, function (level, i) {
            if (level === inEvent.level) {
                index = i;
            }
        }, this);
        if (index > -1) {
            this.selectedLevel = index
            this.levelTap(inSender, {item:{index:index}});
        }
    },

    selectedLevelChanged: function(old) {
        if (old > -1) {
            this.$.levelGrid.update(old);
        }
        if (this.selectedLevel > -1) {
            this.$.levelGrid.update(this.selectedLevel);
        }

    },

    /**
     * Triggers the onLevelSelected event when a level is tapped
     * @param inSender
     * @param inEvent
     * @protected
     * @returns void
     */
    levelTap:function (inSender, inEvent) {
        var level = this.levels[inEvent.item.index];

        if (this.isLevelUnlocked(level)) {
            // Find variants of the level
            var variants = [];
            enyo.forEach(this.levels, function (l) {
                if (level != l && this.isLevelUnlocked(l)) {
                    var l1Chars = l.name.toString().split("_").shift().toLowerCase().split(""),
                        l2Chars = level.name.toString().split("_").shift().toLowerCase().split("");

                    for (var i = 0; i < l1Chars.length; i++) {
                        if ((l1Chars.length < 2 || l2Chars.length < 2) && enyo.indexOf(l1Chars[i], l2Chars) > -1) {
                            variants.push(l);
                            return;
                        }
                    }
                }
            }, this);
            variants.sort(Grundschrift.Models.Level.sortByName);

            if (inEvent.item.index == this.selectedLevel) {
                this.bubble('onLevelSelected', {
                    level:level,
                    sessionCount:this.sessionCount[level.id],
                    child:this.child,
                    variants:variants
                });
            } else {

                console.log('Now playing the sound for level ' + level.name);
                Grundschrift.Models.SoundManager.play(level.name.toString().toLowerCase());

                // Update the grid
                var oldIndex = this.selectedLevel;
                this.setSelectedLevel(inEvent.item.index);
                if (oldIndex > -1) {
                    this.$.levelGrid.update(oldIndex);
                }
            }
        }
    }
});