/**
 * @fileoverview Base Loader class definition. Each component shall have
 * a loader class inheriting this class.
 */

'use strict';

/**
 * ViewLoader class is the base class for all components' data loaders.
 * @param {!Object} data Data object to be written.
 * @constructor
 */
genotet.ViewLoader = function(data) {
  if (!data) {
    genotet.error('null data passed to ViewLoader');
    return;
  }
  /** @protected {!Object} */
  this.data = data;

  /**
   * Count of pending loads.
   * Loading screen is only displayed when this value is positive.
   * @protected {number}
   */
  this.loadCounter = 0;
};

/**
 * Initializes the view loader.
 */
genotet.ViewLoader.prototype.init = function() {};

/**
 * Loads the data for the view.
 * @interface
 */
genotet.ViewLoader.prototype.load = function() {};

/**
 * Updates the data for the view.
 * @interface
 */
genotet.ViewLoader.prototype.update = function() {};

/**
 * Triggers a jQuery event to the data loader.
 * @param {string} eventType Type of event.
 * @param {*=} opt_data Data to be sent via the event.
 */
genotet.ViewLoader.prototype.signal = function(eventType, opt_data) {
  switch (eventType) {
    case 'loadStart':
      this.loadCounter++;
      this.signal('loading');
      break;
    case 'loadComplete':
    case 'loadFail':
      this.loadCounter--;
      if (this.loadCounter == 0) {
        this.signal('loaded');
        if (eventType == 'loadComplete') {
          this.signal('loadSuccess');
        }
      }
      break;
  }
  $(this).trigger('genotet.' + eventType, [opt_data]);
};

/**
 * Sends a get request to the url with given params and callback.
 * @param {string} url URL to which the get request is sent.
 * @param {!Object} params Query parameters of the get request.
 * @param {Function} callback Callback function when the request is done.
 * @param {string} errorMessage Error message to show when the request failed.
 * @param {boolean=} opt_block Flag indicating whether the request blocks.
 */
genotet.ViewLoader.prototype.get = function(url, params, callback,
                                            errorMessage, opt_block) {
  if (!opt_block) {
    this.signal('loadStart');
    $.get(url, params, function(data) {
        callback(data);
        this.signal('loadComplete');
      }.bind(this), 'jsonp')
      .fail(this.fail.bind(this, errorMessage, params));
  } else {
    $.get(url, params, function(data) {
        callback(data);
      }.bind(this), 'jsonp')
      .fail(this.fail.bind(this, errorMessage, params));
  }
};

/**
 * Triggers a fail event and pushes the error.
 * @param {string} msg Error message.
 * @param {Object} params Query parameter object.
 */
genotet.ViewLoader.prototype.fail = function(msg, params) {
  genotet.error(msg, params == null ? '' : JSON.stringify(params));
  this.signal('loadFail');
};
