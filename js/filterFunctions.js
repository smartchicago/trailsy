'use strict'
var L = require('leaflet')
var $ = require('jquery')
var Config = require('./config.js')
var trailExcludes = require('./trailExcludes.js')
var locationsZipCode = require('./locationsZipCode.js')
var locationsMuni = require('./locationsMuni.js')

var filterFunctions = function (map) {
  var that = {}
  var currentUserLocation = null
  that.current = {
    lengthFilter: [],
    activityFilter: [],
    search: [],
    poi: null,
    trail: null,
    hasAlerts: null,
    filter: [],
    userLocation: null,
    searchLocation: null,
    zipMuniFilter: '',
    trailInList: true,
    trailOnMap: true,
    fromURL: false,
    showDistances: true
  }
  that.previous = {}

  window.onload = function () {
    // that.setHeights()
    // $('.closeDetail').click(readdSearchURL)
    $('#fpccMobileCheckbox').on(Config.listenType, my.panel.showfpccMainContainer)
  }

  that.setCurrentUserLocation = function (userLocation) {
    currentUserLocation = userLocation
  }

  that.addressChange = function () {
    that.current.poi = null
    that.current.trail = null
    that.current.hasAlerts = false
    that.current.fromURL = false
    var search = decodeURIComponent($.address.parameter('search')).replace(/\+/g, ' ');
    var filter = decodeURIComponent($.address.parameter('filter')).replace(/\+/g, ' ');
    var poi = decodeURIComponent($.address.parameter('poi'))
    var trail = decodeURIComponent($.address.parameter('trail'))
    // var hasAlerts = decodeURIComponent($.address.parameter('hasAlerts'))
    console.log("[address.change] searchFilter = " + search)
    console.log("[address.change] filter = " + filter)
    console.log("[address.change] poi = " + poi)
    console.log("[address.change] trail = " + trail)
    // console.log("[address.change] hasAlerts = " + hasAlerts)
    if (search == 'undefined' || search == 'null') {
      search = ''
    }
    if (filter == 'undefined' || filter == 'null') {
      filter = ''
    }
    if (poi == 'undefined' || poi == 'null') {
      poi = ''
    }
    if (trail == 'undefined' || trail == 'null') {
      trail = ''
    }
    // if (hasAlerts == 'undefined' || hasAlerts == 'null') {
    //   that.current.hasAlerts = false
    // } else {
    //   that.current.hasAlerts = true
    // }
    console.log("[address.Change] searchFilter = " + search)
    var poiID = null

    if (search) {
      that.current.fromURL = true
      console.log("[addressChange] IF searchFilter = " + that.current.search)
      var $select = $('.js-example-basic-multiple')
      var selectize = $select[0].selectize
      selectize.clear(true)
      var filterItems = search.split(',')
      $.each(filterItems, function (key, value) {
        selectize.createItem(value, false)
      })
    }
    if (poi) {
      poi = poi.split('-')[0]
      that.current.poi = poi
    } else if (trail) {
      that.current.trail = trail
      // trail_split = trail.split('-')
      // if (trail_split.length > 1) {
      //   that.current.trail = trail[0]
      // }
      
    }
    console.log('[address.change] searchFilter = ' + search)
    console.log('[address.change] poi = ' + that.current.poi)
    console.log('[address.change] trail = ' + that.current.trail)
    // that.setCurrent()
    return search
  }

  that.setCurrent = function (searchBoxValue) {
    console.log('[setCurrent] start searchBoxValue= ' + searchBoxValue)
    that.previous = $.extend(true, {}, that.current)
    that.resetCurrent()
    var searchBoxValueArray = String(searchBoxValue).split(',')
    searchBoxValueArray = searchBoxValueArray.filter(Boolean)
    var removeIndexs = []
    that.current.trailInList = true
    that.current.trailOnMap = true
    $.each(searchBoxValueArray, function (key, value) {
      var normalizedValue = value.toLowerCase()
      console.log('setCurrent normalizedValue= ' + normalizedValue)
      if (normalizedValue == "hasalerts") {
        that.current.hasAlerts = true
        removeIndexs.push(key)
      }
      if (!(locationsZipCode[normalizedValue] === undefined)) {
        that.current.searchLocation = new L.LatLng(locationsZipCode[normalizedValue]['latitude'], locationsZipCode[normalizedValue]['longitude'])
        that.current.zipMuniFilter = normalizedValue
        removeIndexs.push(key)
      } else if (!(locationsMuni[normalizedValue] === undefined)) {
        that.current.searchLocation = new L.LatLng(locationsMuni[normalizedValue]['latitude'], locationsMuni[normalizedValue]['longitude'])
        that.current.zipMuniFilter = normalizedValue
        removeIndexs.push(key)
      } else {
        searchBoxValueArray[key] = value.replace('-popular', '')
        normalizedValue = normalizedValue.replace('-popular', '')
        if (trailExcludes.list.indexOf(normalizedValue) > -1) {
          // console.log('trailExcludes list')
          that.current.trailInList = false
        }
        if (trailExcludes.map.indexOf(normalizedValue) > -1) {
          // console.log('trailExcludes map')
          that.current.trailOnMap = false
        }
      }
    })
    console.log('setCurrent removeIndexs = ' + removeIndexs)
    console.log('setCurrent removeIndexs = ' + removeIndexs)
    removeIndexs.sort( function (a, b) {
      return b - a
    })
    $.each(removeIndexs, function (key, value) {
      console.log('setCurrent searchBoxValueArray = ' + searchBoxValueArray)
      searchBoxValueArray.splice(value, 1)
    })
    searchBoxValueArray = searchBoxValueArray.filter(Boolean)
    console.log('setCurrent searchBoxValueArray = ' + searchBoxValueArray)
    // console.log('trailInList = ' + that.current.trailInList)
    // console.log('trailonmap = ' + that.current.trailOnMap)
    that.current.search = searchBoxValueArray
    console.log('[setCurrent that.current.search = ' + that.current.search)
  }

  that.resetCurrent = function () {
    that.current.search = []
    that.current.poi = null
    that.current.trail = null
    that.current.hasAlerts = false
    that.current.searchLocation = null
    that.current.trailInList = true
    that.current.trailOnMap = true
    that.current.zipMuniFilter = ''
  }
  return that
}

module.exports = filterFunctions
