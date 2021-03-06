'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var config = require('../config');
var utils = require('./utils');
var controllerUtils = require('../controllers/utils');


var loadConfig = function (siteId, models) {

  return new Promise(function(RS, RJ) {
    models.Registry.findById(siteId).then(function(R) {
      utils.spreadsheetParse(R.settings.configurl).spread(function (E, C) {
        if (E)
          RJ(E);

        var settings = {}, raw;
        raw = _.object(_.zip(_.pluck(C, 'key'), _.pluck(C, 'value')));
        _.each(raw, function(v, k) {
          if (v && v.toLowerCase() === 'true') {
            settings[k] = true;
          } else if (v && v.toLowerCase() === 'false') {
            settings[k] = false;
          } else if (v && v.toLowerCase() === 'null') {
            settings[k] = null;
          } else if (v && k === 'reviewers') {
            settings[k] = _.each(v.split(controllerUtils.FIELD_SPLITTER), function(r) { r.trim(); });
          } else {
            settings[k] = v;
          }
        });
        // Insert single record — config for required site
        models.Site.upsert({
          id: siteId,
          settings: settings
        })
          .then(function() { RS(false); })
          .catch(function(E) { RJ(E); });
      });
    });
  });
};


var loadRegistry = function (models) {

  var registryUrl = config.get('registryUrl') || false;

  return utils.spreadsheetParse(registryUrl)
    .spread(function (err, registry) {
      if (err)
        return [err, false];

      if (!registry)
        return ['could not reload registry', false];

      return models.Registry.count().then(function(C) {

        // Make each upsert (can't do a bulk with upsert, but that is ok for our needs here)
        return Promise.all(_.map(registry, function(R) { return new Promise(function(RS, RJ) {

          // Normalize data before upsert
          if (R.adminemail) {
            R.adminemail = _.each(R.adminemail.split(controllerUtils.FIELD_SPLITTER), function(r) { r.trim(); });
          }
          models.Registry.upsert(_.extend(R, {
            id: R.censusid,
            settings: _.omit(R, 'censusid')
          })).then(function() { RS(false); });

        }); }));
      });
    });
};


var loadData = function (options, models) {

  return new Promise(function(RS, RJ) {
    models.Site.findById(options.site).then(function(S) {
      utils.spreadsheetParse(S.settings[options.setting]).spread(function (E, D) {
        if (E)
          RJ(E);

        Promise.all(_.map(D, function(DS) { return new Promise(function(RSD, RJD) {

          // Allow custom data maping
          options.Model.upsert(
            _.chain(_.isFunction(options.mapper) ? options.mapper(DS) : DS)

            // All records belongs to certain domain
              .extend({site: options.site})

              .pairs()

            // User may mix up lower cased and upper cased field names
              .map(function(P) { return [P[0].toLowerCase(), P[1]]; })

              .object()
              .value()
          ).then(RSD).catch(RJD);

        }); })).then(RS).catch(RJ);
      });
    });
  });

};

// There may be translated fields. Map field name <name>@<language>
// into translation: {<language>: {<name>: ..., <another name>: ..., ...}}.
var  loadTranslatedData = function(options, models) {

  // Avoid recursive call
  var mapper = options.mapper;

  return loadData(_.extend(options, {
    mapper: function(D) {
      // Don't forget to call user defined mapper function
      var mapped = _.isFunction(mapper) ? mapper(D) : D;

      return _.extend(mapped, {
        translations: _.chain(mapped)
          .pairs()

          .reduce(function(R, P) {
            var fieldLang;

            if(!(P[0].indexOf('@') + 1))
              return R;

            fieldLang = P[0].split('@');

            // Default empty dict
            R[fieldLang[1]] = R[fieldLang[1]] || {};

            R[fieldLang[1]][fieldLang[0]] = P[1];

            return R;
          }, {})

          .value()
      });
    }
  }), models);

};


module.exports = {
  loadData: loadData,
  loadTranslatedData: loadTranslatedData,
  loadRegistry: loadRegistry,
  loadConfig: loadConfig
};
