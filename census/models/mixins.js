'use strict';

var _ = require('underscore');


var translated = function(locale) {

  var localized;

  if (this.translations && this.translations[locale]) {

    localized = this.translations[locale];

    _.each(localized, function(value, key, list) {
      if (this.hasOwnProperty(key)) {
        this[key] = value;
      }
    });

  }

  return this;

};


module.exports = {
  translated: translated
};
