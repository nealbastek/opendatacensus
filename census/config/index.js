var path = require('path')
  , _ = require('underscore')
  , nconf = require('nconf')
  , fs = require('fs')
  , marked = require('marked')
  ;

function getContent(filepath) {
  return marked(fs.readFileSync(filepath, 'utf8'));
}

nconf.file({
  file: path.join(path.dirname(path.dirname(__dirname)), '/settings.json')
});

 // this is the object that you want to override in your own local config
nconf.defaults({
  "configUrl": process.env.CONFIG_URL || 'http://config.url',
  censusid: process.env.CENSUS_ID || 'noid',
  title_short: 'Census',
  display_year: 2014,
  submit_year: 2014,
  site_url: process.env.SITE_URL || 'http://localhost:5000',
  approve_first_submission: 'FALSE',
  reviewers: '',
  locales: ['en'],
  disqus_shortname: 'opendatacensus',
  about_page: '<h1>To set content for this page update your configuration file</h1>',
  contribute_page: '<h1>To set content for this page update your configuration file</h1>',
  faq_page: '<h1>To set content for this page update your configuration file</h1>',
  missing_place_html: '',
  submit_page: getContent('census/content/submit.md'),
  review_page: getContent('census/content/review.md'),
  // default user db
  user_database_key: '0AqR8dXc6Ji4JdGJXallkcjNOaFlmN1N5MXZkM1ZSbUE',
  questions: process.env.QUESTIONS_URL || 'https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdFI0QkpGUEZyS0wxYWtLdG1nTk9zU3c#gid=0',
  banner_text: undefined, // set in config sheet to activate
  share_submission_template: undefined, // set in config sheet to activate
  share_page_template: undefined, // set in config sheet to activate
  post_submission_info: undefined, // set in config sheet to activate
  debug: process.env.DEBUG || false,

  "database": {
    "username": process.env.DB_USER || 'opendatacensus',
    "password": process.env.DB_PASS || '',
    "database": process.env.DB_NAME || 'opendatacensus',
    "host": process.env.DB_HOST || 'localhost',
    "port": process.env.DB_PORT || 5432,
    "dialect": process.env.DB_DIALECT || 'postgres'
  },

  "appconfig": {
    "port": process.env.PORT || 5000,
    "auth_on": process.env.AUTH_ON !== undefined || false,
    "auth_user": process.env.AUTH_USER,
    "auth_passhash": process.env.AUTH_PASSHASH,
    "review_passhash": process.env.REVIEW_PASSHASH || "c2NyeXB0AAwAAAAIAAAAAcuoRdsxvRZfPTTCD6H8wkZFi1LTuf11n47ODWm44e85eoYUyMlDOgmEbZTyxs99k3vYi0KSb542L5kn0YavUPiOltwF++lWVB1jjzDvFwlo",
    "readonly": process.env.READONLY !== undefined || false
  },

  "google": {
    "user": process.env.GOOGLE_USER || "unknown",
    "password": process.env.GOOGLE_PASSWORD || "no-password",
    app_id: process.env.GOOGLE_APP_ID || 'unknown',
    app_secret: process.env.GOOGLE_APP_SECRET || 'unknown'
  },

  facebook: {
    app_id: process.env.FACEBOOK_APP_ID || 'unknown',
    app_secret: process.env.FACEBOOK_APP_SECRET || 'unknown'
  },

  // config for testing mode
  "test": {
    "testing": process.env.TEST !== undefined || false,
    "user": {
      userid: 'tester',
      provider_id: 'xxx',
      provider: 'facebook',
      username: 'tester',
      name: 'Tester',
      email: 'test@okfn.org',
      gravatar: 'https://www.gravatar.com/avatar/'
    }
  }
});

module.exports = {
  get: function(key, lang) {
    if (lang) {
      var defaultLocale = _.first(module.exports.get('locales'));

      return nconf.get.call(nconf, key + '@' + lang) ||
        nconf.get.call(nconf, key + '@' + defaultLocale) ||
        nconf.get.call(nconf, key);
    } else {
      return nconf.get.call(nconf, key);
    }
  },
  set: nconf.set.bind(nconf),
  reset: nconf.reset.bind(nconf)
};